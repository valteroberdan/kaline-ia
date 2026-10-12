"""
PyTorch 1D-CNN Waveform + Clinical Multimodal Deep Learning Model for Kaline AI
Processes 3000-sample high-resolution arterial line curves fused with clinical embeddings.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Dict, Any, Tuple, Optional
from pathlib import Path
from kaline_core.config import MODELS_DIR, WINDOW_SAMPLES, PREDICTION_HORIZONS


class ResBlock1D(nn.Module):
    def __init__(self, in_channels: int, out_channels: int, stride: int = 1):
        super().__init__()
        self.conv1 = nn.Conv1d(
            in_channels, out_channels, kernel_size=7, stride=stride, padding=3, bias=False
        )
        self.bn1 = nn.BatchNorm1d(out_channels)
        self.conv2 = nn.Conv1d(
            out_channels, out_channels, kernel_size=7, stride=1, padding=3, bias=False
        )
        self.bn2 = nn.BatchNorm1d(out_channels)

        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv1d(in_channels, out_channels, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm1d(out_channels),
            )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        res = self.shortcut(x)
        out = F.leaky_relu(self.bn1(self.conv1(x)), negative_slope=0.1)
        out = self.bn2(self.conv2(out))
        out += res
        return F.leaky_relu(out, negative_slope=0.1)


class KalineResNet1D(nn.Module):
    def __init__(self, num_clinical_features: int = 14):
        super().__init__()
        # Waveform branch: (B, 1, 3000)
        self.stem = nn.Sequential(
            nn.Conv1d(1, 32, kernel_size=15, stride=2, padding=7, bias=False),  # (B, 32, 1500)
            nn.BatchNorm1d(32),
            nn.LeakyReLU(0.1),
            nn.MaxPool1d(kernel_size=3, stride=2, padding=1),  # (B, 32, 750)
        )

        self.layer1 = ResBlock1D(32, 64, stride=2)  # (B, 64, 375)
        self.layer2 = ResBlock1D(64, 128, stride=2)  # (B, 128, 188)
        self.layer3 = ResBlock1D(128, 128, stride=2)  # (B, 128, 94)
        self.global_pool = nn.AdaptiveAvgPool1d(1)  # (B, 128, 1)

        # Tabular clinical branch
        self.clinical_net = nn.Sequential(
            nn.Linear(num_clinical_features, 32),
            nn.BatchNorm1d(32),
            nn.LeakyReLU(0.1),
            nn.Dropout(0.2),
            nn.Linear(32, 32),
            nn.LeakyReLU(0.1),
        )

        # Multimodal fusion
        fusion_dim = 128 + 32
        self.fusion = nn.Sequential(
            nn.Linear(fusion_dim, 64),
            nn.BatchNorm1d(64),
            nn.LeakyReLU(0.1),
            nn.Dropout(0.25),
        )

        # Multi-horizon heads (5, 10, 15 min)
        self.cls_head_5 = nn.Linear(64, 1)
        self.cls_head_10 = nn.Linear(64, 1)
        self.cls_head_15 = nn.Linear(64, 1)

        self.reg_head_5 = nn.Linear(64, 1)
        self.reg_head_10 = nn.Linear(64, 1)
        self.reg_head_15 = nn.Linear(64, 1)

    def forward(
        self, waveform: torch.Tensor, clinical: torch.Tensor
    ) -> Tuple[Dict[int, torch.Tensor], Dict[int, torch.Tensor]]:
        """
        waveform: (B, 1, 3000)
        clinical: (B, num_clinical_features)
        """
        # Waveform branch
        x = self.stem(waveform)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        wf_latent = self.global_pool(x).flatten(1)  # (B, 128)

        # Clinical branch
        clin_latent = self.clinical_net(clinical)  # (B, 32)

        # Fusion
        fused = torch.cat([wf_latent, clin_latent], dim=1)  # (B, 160)
        feat = self.fusion(fused)  # (B, 64)

        # Classification logits
        cls_preds = {
            5: torch.sigmoid(self.cls_head_5(feat)).squeeze(-1),
            10: torch.sigmoid(self.cls_head_10(feat)).squeeze(-1),
            15: torch.sigmoid(self.cls_head_15(feat)).squeeze(-1),
        }

        # Regression MAP predictions
        reg_preds = {
            5: self.reg_head_5(feat).squeeze(-1),
            10: self.reg_head_10(feat).squeeze(-1),
            15: self.reg_head_15(feat).squeeze(-1),
        }

        return cls_preds, reg_preds
