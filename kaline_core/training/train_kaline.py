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


def train_kaline_pipeline(num_cases: int = 150, allow_synthetic_cohort: bool = False):
    logger.info("=" * 65)
    logger.info("  TREINAMENTO EXAUSTIVO & AUTO-CORREÇÃO DA IA KALINE  ")
    logger.info("  Análise Multi-Paramétrica da Curva Arterial VitalDB ")
    logger.info("=" * 65)

    client = VitalDBClient()
    builder = DatasetBuilder(client)

    # 1. Fetch eligible case list from VitalDB
    eligible_cases = []
    try:
        eligible_cases = client.filter_eligible_arterial_cases(max_cases=num_cases)
        logger.info(f"Casos cirúrgicos elegíveis identificados na VitalDB: {len(eligible_cases)}")
    except Exception as e:
        logger.warning(f"Acesso à API da VitalDB offline: {e}.")

    # 2. Build dataset (Strictly real VitalDB data or explicit synthetic test cohort)
    if eligible_cases:
        try:
            df, arrays = builder.build_dataset_from_cases(eligible_cases)
            dataset_source = "VitalDB Base Hospitalar Real"
        except Exception as e:
            if not allow_synthetic_cohort:
                logger.error(f"Falha na extração de dados reais: {e}")
                raise
            logger.warning(f"Modo de contingência ativado com flag explícita (--allow-synthetic-cohort): {e}")
            df, arrays = builder.generate_synthetic_test_cohort(num_samples=750)
            dataset_source = "Coorte Sintética Didática Parametrizada (VitalDB Test Bench)"
    else:
        if not allow_synthetic_cohort:
            raise RuntimeError(
                "Nenhum caso da VitalDB disponível e --allow-synthetic-cohort não foi especificado. "
                "Conforme auditoria técnica, a injeção sintética silenciosa em pipelines de produção é proibida."
            )
        logger.info("Gerando coorte sintética para teste/calibração com flag explícita...")
        df, arrays = builder.generate_synthetic_test_cohort(num_samples=750)
        dataset_source = "Coorte Sintética Didática Parametrizada (VitalDB Test Bench)"

    waveforms = arrays["waveforms"]
    logger.info(f"Fonte dos dados: {dataset_source}. Amostras: {len(df)}")

    # 3. Patient-Level Group Split (Zero patient / case leakage across train, val, and test)
    group_col = "subjectid" if ("subjectid" in df.columns and df["subjectid"].nunique() > 3) else "caseid"
    groups = df[group_col].values
    logger.info(f"Executando divisão agrupada por paciente usando '{group_col}' ({df[group_col].nunique()} pacientes únicos)...")

    gss_train = GroupShuffleSplit(n_splits=1, test_size=0.30, random_state=42)
    train_idx, temp_idx = next(gss_train.split(df, groups=groups))

    train_df = df.iloc[train_idx].reset_index(drop=True)
    temp_df = df.iloc[temp_idx].reset_index(drop=True)

    temp_groups = temp_df[group_col].values
    gss_val = GroupShuffleSplit(n_splits=1, test_size=0.50, random_state=42)
    val_rel_idx, test_rel_idx = next(gss_val.split(temp_df, groups=temp_groups))

    val_df = temp_df.iloc[val_rel_idx].reset_index(drop=True)
    test_df = temp_df.iloc[test_rel_idx].reset_index(drop=True)

    val_idx = temp_idx[val_rel_idx]
    test_idx = temp_idx[test_rel_idx]

    # AUDIT VERIFICATION: Assert zero patient leakage
    train_patients = set(train_df[group_col].unique())
    val_patients = set(val_df[group_col].unique())
    test_patients = set(test_df[group_col].unique())

    assert len(train_patients.intersection(val_patients)) == 0, "Vazamento crítico: paciente compartilhado entre Treino e Validação!"
    assert len(train_patients.intersection(test_patients)) == 0, "Vazamento crítico: paciente compartilhado entre Treino e Teste!"
    assert len(val_patients.intersection(test_patients)) == 0, "Vazamento crítico: paciente compartilhado entre Validação e Teste!"

    # Freeze split provenance before model fitting
    split_provenance = {
        "dataset_source": dataset_source,
        "group_key": group_col,
        "train_patients": sorted([int(p) for p in train_patients]),
        "val_patients": sorted([int(p) for p in val_patients]),
        "test_patients": sorted([int(p) for p in test_patients]),
        "train_samples": len(train_df),
        "val_samples": len(val_df),
        "test_samples": len(test_df),
    }
    provenance_path = MODELS_DIR / "split_provenance.json"
    with open(provenance_path, "w") as f:
        json.dump(split_provenance, f, indent=2)
    logger.info(f"Divisão por paciente congelada com sucesso em {provenance_path}")
    logger.info(f"Divisão: Treino={len(train_df)} ({len(train_patients)} pac.) | Val={len(val_df)} ({len(val_patients)} pac.) | Teste={len(test_df)} ({len(test_patients)} pac.)")

    # 4. Execute Exhaustive Self-Correction Engine on Tabular Features
    engine = KalineSelfCorrectionEngine(MODELS_DIR)
    self_correction_report = engine.run_exhaustive_self_correction(train_df, val_df, test_df)

    # 5. Train PyTorch 1D-CNN Waveform Network with Specific Horizon Supervision
    logger.info("Treinando rede profunda 1D-CNN ResNet com perdas e alvos específicos por horizonte (5, 10, 15m)...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    num_clin_feats = len(ALL_TABULAR_FEATURES)
    cnn_model = KalineResNet1D(num_clinical_features=num_clin_feats).to(device)

    # Prepare PyTorch Tensors
    X_train_clin = torch.tensor(engine.pipeline.prepare_features(train_df), dtype=torch.float32)
    X_train_wf = torch.tensor(waveforms[train_idx], dtype=torch.float32).unsqueeze(1)
    y_train_cls = torch.tensor(train_df["label_hypotension"].values, dtype=torch.float32)
    y_train_map = torch.tensor(train_df["target_future_map"].values, dtype=torch.float32)
    h_train = torch.tensor(train_df["horizon_min"].values, dtype=torch.long)

    dataset = TensorDataset(X_train_wf, X_train_clin, y_train_cls, y_train_map, h_train)
    loader = DataLoader(dataset, batch_size=32, shuffle=True)

    optimizer = torch.optim.AdamW(cnn_model.parameters(), lr=1e-3, weight_decay=1e-4)
    bce_loss = nn.BCELoss()
    mse_loss = nn.MSELoss()

    cnn_model.train()
    for epoch in range(1, 11):
        total_loss = 0.0
        for b_wf, b_clin, b_y_cls, b_y_reg, b_horiz in loader:
            b_wf, b_clin = b_wf.to(device), b_clin.to(device)
            b_y_cls, b_y_reg, b_horiz = b_y_cls.to(device), b_y_reg.to(device), b_horiz.to(device)

            optimizer.zero_grad()
            cls_out, reg_out = cnn_model(b_wf, b_clin)

            # Supervise each head ONLY with samples corresponding to its own horizon
            loss_c = torch.tensor(0.0, device=device)
            loss_r = torch.tensor(0.0, device=device)
            for h in PREDICTION_HORIZONS:
                mask_h = (b_horiz == h)
                if mask_h.any():
                    loss_c = loss_c + bce_loss(cls_out[h][mask_h], b_y_cls[mask_h])
                    loss_r = loss_r + (mse_loss(reg_out[h][mask_h], b_y_reg[mask_h]) / 100.0)

            loss = loss_c + 0.5 * loss_r
            loss.backward()
            optimizer.step()
            total_loss += loss.item()

        if epoch % 3 == 0 or epoch == 10:
            logger.info(f"1D-CNN Epoch [{epoch}/10] - Loss Total: {total_loss / len(loader):.4f}")

    # Save PyTorch CNN weights
    torch.save(cnn_model.state_dict(), MODELS_DIR / "kaline_cnn_weights.pth")
    logger.info("Pesos da 1D-CNN ResNet salvos com sucesso.")

    # 6. Separate Evaluation of CNN on Test Set
    from kaline_core.training.evaluate_metrics import compute_comprehensive_metrics
    logger.info("Avaliando 1D-CNN ResNet separadamente no conjunto de teste independente...")
    cnn_model.eval()
    with torch.no_grad():
        X_test_clin = torch.tensor(engine.pipeline.prepare_features(test_df), dtype=torch.float32).to(device)
        X_test_wf = torch.tensor(waveforms[test_idx], dtype=torch.float32).unsqueeze(1).to(device)
        cls_test_out, reg_test_out = cnn_model(X_test_wf, X_test_clin)

        cnn_report = {
            "model_architecture": "KalineResNet1D_Waveform_DeepNeuralNetwork",
            "evaluated_independently": True,
            "horizons": {},
        }
        for h in PREDICTION_HORIZONS:
            mask_h = (test_df["horizon_min"] == h).values
            if not np.any(mask_h):
                continue
            y_cls_h = test_df.loc[mask_h, "label_hypotension"].values
            y_reg_h = test_df.loc[mask_h, "target_future_map"].values
            p_cls_h = cls_test_out[h][mask_h].cpu().numpy()
            p_reg_h = reg_test_out[h][mask_h].cpu().numpy()
            patient_ids_h = test_df.loc[mask_h, group_col].values

            m_h = compute_comprehensive_metrics(
                y_cls_h, p_cls_h, y_reg_h, p_reg_h, threshold=0.50, patient_ids=patient_ids_h
            )
            cnn_report["horizons"][f"{h}min"] = m_h

        with open(MODELS_DIR / "cnn_evaluation_report.json", "w") as f:
            json.dump(cnn_report, f, indent=2)
        logger.info(f"Relatório de avaliação independente da 1D-CNN salvo em {MODELS_DIR / 'cnn_evaluation_report.json'}")

    logger.info("=" * 65)
    logger.info("  TREINAMENTO E AUTO-CORREÇÃO CONCLUÍDOS COM SUCESSO!  ")
    logger.info("=" * 65)
    return self_correction_report


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Treinamento com Auto-Correção da IA Kaline")
    parser.add_argument("--num-cases", type=int, default=15, help="Número de casos a processar")
    parser.add_argument("--allow-synthetic-cohort", action="store_true", help="Permite coorte sintética para calibração/testes se VitalDB estiver offline")
    args = parser.parse_args()

    train_kaline_pipeline(num_cases=args.num_cases, allow_synthetic_cohort=args.allow_synthetic_cohort)
