"""
Master Training and Self-Correction Pipeline for IA Kaline
Orchestrates data preparation from VitalDB, multi-parametric arterial extraction,
exhaustive self-correcting training, and benchmark generation.
"""

import sys
import json
import logging
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
from sklearn.model_selection import GroupShuffleSplit
from pathlib import Path

from kaline_core.config import (
    MODELS_DIR,
    SAMPLE_DATA_DIR,
    PREDICTION_HORIZONS,
    ALL_TABULAR_FEATURES,
    SAMPLING_RATE_HZ,
)
from kaline_core.dataset.vitaldb_client import VitalDBClient
from kaline_core.dataset.dataset_builder import DatasetBuilder
from kaline_core.models.cnn_waveform import KalineResNet1D
from kaline_core.training.self_correcting_engine import KalineSelfCorrectionEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("kaline.train")


def train_kaline_pipeline(num_cases: int = 150):
    logger.info("=" * 65)
    logger.info("  TREINAMENTO EXAUSTIVO & AUTO-CORREÇÃO DA IA KALINE  ")
    logger.info("  Análise Multi-Paramétrica da Curva Arterial VitalDB ")
    logger.info("=" * 65)

    client = VitalDBClient()
    builder = DatasetBuilder(client)

    # 1. Fetch eligible case list from VitalDB
    try:
        eligible_cases = client.filter_eligible_arterial_cases(max_cases=num_cases)
        logger.info(f"Casos cirúrgicos elegíveis identificados na VitalDB: {len(eligible_cases)}")
    except Exception as e:
        logger.warning(f"Acesso à API do VitalDB offline: {e}. Utilizando gerador fisiológico multi-paramétrico.")
        eligible_cases = []

    # 2. Build dataset with 61 multi-parametric arterial biomarkers
    df, arrays = builder.build_dataset_from_cases(eligible_cases)
    waveforms = arrays["waveforms"]
    logger.info(f"Total de amostras geradas com morfometria completa: {len(df)}")

    # 3. Stratified Train / Val / Test Split by horizon and class label
    from sklearn.model_selection import StratifiedShuffleSplit

    strat_key = df["horizon_min"].astype(str) + "_" + df["label_hypotension"].astype(str)
    sss_train = StratifiedShuffleSplit(n_splits=1, test_size=0.30, random_state=42)
    train_idx, temp_idx = next(sss_train.split(df, strat_key))

    train_df = df.iloc[train_idx].reset_index(drop=True)
    temp_df = df.iloc[temp_idx].reset_index(drop=True)

    temp_strat = temp_df["horizon_min"].astype(str) + "_" + temp_df["label_hypotension"].astype(str)
    sss_val = StratifiedShuffleSplit(n_splits=1, test_size=0.50, random_state=42)
    val_rel_idx, test_rel_idx = next(sss_val.split(temp_df, temp_strat))

    val_df = temp_df.iloc[val_rel_idx].reset_index(drop=True)
    test_df = temp_df.iloc[test_rel_idx].reset_index(drop=True)

    logger.info(f"Divisão estratificada: Treino={len(train_df)} | Validação={len(val_df)} | Teste={len(test_df)}")

    # 4. Execute Exhaustive Self-Correction Engine
    engine = KalineSelfCorrectionEngine(MODELS_DIR)
    self_correction_report = engine.run_exhaustive_self_correction(train_df, val_df, test_df)

    # 5. Train PyTorch 1D-CNN Waveform Network (Deep Residual Feature Extractor)
    logger.info("Treinando rede neural profunda 1D-CNN ResNet para a forma de onda contínua 100 Hz...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    num_clin_feats = len(ALL_TABULAR_FEATURES)
    cnn_model = KalineResNet1D(num_clinical_features=num_clin_feats).to(device)

    # Prepare PyTorch Tensors
    X_train_clin = torch.tensor(engine.pipeline.prepare_features(train_df), dtype=torch.float32)
    X_train_wf = torch.tensor(waveforms[train_idx], dtype=torch.float32).unsqueeze(1)
    y_train_5 = torch.tensor(train_df["label_hypotension"].values, dtype=torch.float32)
    y_train_map = torch.tensor(train_df["target_future_map"].values, dtype=torch.float32)

    dataset = TensorDataset(X_train_wf, X_train_clin, y_train_5, y_train_map)
    loader = DataLoader(dataset, batch_size=32, shuffle=True)

    optimizer = torch.optim.AdamW(cnn_model.parameters(), lr=1e-3, weight_decay=1e-4)
    bce_loss = nn.BCELoss()
    mse_loss = nn.MSELoss()

    cnn_model.train()
    for epoch in range(1, 11):
        total_loss = 0.0
        for b_wf, b_clin, b_y_cls, b_y_reg in loader:
            b_wf, b_clin = b_wf.to(device), b_clin.to(device)
            b_y_cls, b_y_reg = b_y_cls.to(device), b_y_reg.to(device)

            optimizer.zero_grad()
            cls_out, reg_out = cnn_model(b_wf, b_clin)

            loss_c = bce_loss(cls_out[5], b_y_cls) + bce_loss(cls_out[10], b_y_cls) + bce_loss(cls_out[15], b_y_cls)
            loss_r = (mse_loss(reg_out[5], b_y_reg) + mse_loss(reg_out[10], b_y_reg) + mse_loss(reg_out[15], b_y_reg)) / 100.0
            loss = loss_c + 0.5 * loss_r

            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        if epoch % 3 == 0 or epoch == 10:
            logger.info(f"1D-CNN Epoch [{epoch}/10] - Loss Total: {total_loss / len(loader):.4f}")

    # Save PyTorch CNN weights
    torch.save(cnn_model.state_dict(), MODELS_DIR / "kaline_cnn_weights.pth")
    logger.info("Pesos da 1D-CNN ResNet salvos com sucesso.")

    logger.info("=" * 65)
    logger.info("  TREINAMENTO E AUTO-CORREÇÃO CONCLUÍDOS COM SUCESSO!  ")
    logger.info("=" * 65)
    return self_correction_report


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Treinamento com Auto-Correção da IA Kaline")
    parser.add_argument("--num-cases", type=int, default=15, help="Número de casos a processar")
    args = parser.parse_args()

    train_kaline_pipeline(num_cases=args.num_cases)
