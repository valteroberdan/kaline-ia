"""
Clinical Explainability & Physiological Driver Analysis for Kaline AI
Translates model predictions and hemodynamic parameters into actionable clinical insights.
"""

from typing import Dict, Any, List


class KalineExplainabilityEngine:
    @staticmethod
    def analyze_hemodynamic_etiology(
        features: Dict[str, Any], predictions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Decomposes the underlying physiological contributors of hypotension risk:
        1. Preload / Volume Responsiveness (PPV, SV surrogate)
        2. Inotropy / Myocardial Contractility (dP/dt_max, pulse pressure)
        3. Vasomotor Tone / Systemic Vascular Resistance (DBP, Tau decay)
        4. Patient Baseline Vulnerability (ASA, Age, Comorbidities)
        """
        ppv = float(features.get("ppv", 10.0))
        dp_dt = float(features.get("dp_dt_max", 850.0))
        mean_map = float(features.get("mean_map", 75.0))
        mean_dbp = float(features.get("mean_dbp", 60.0))
        tau = float(features.get("decay_constant_tau", 0.40))
        asa = int(features.get("asa", 2))
        age = float(features.get("age", 55.0))
        preop_htn = int(features.get("preop_htn", 0))

        risk_score = float(predictions.get("kaline_hpi_score", 50.0))

        # 1. Preload Component (0 to 100)
        # PPV > 13% in mechanically ventilated patients strongly suggests fluid responsiveness
        preload_score = min(100.0, max(0.0, (ppv - 8.0) * 8.0))

        # 2. Contractility Component (0 to 100)
        # Normal dP/dt_max > 1000 mmHg/s; depressed < 700 mmHg/s
        if dp_dt < 1100.0:
            contractility_deficit = min(100.0, max(0.0, (1100.0 - dp_dt) / 6.0))
        else:
            contractility_deficit = 10.0

        # 3. Vasomotor Tone / Afterload Deficit (0 to 100)
        # Low DBP (< 50) and rapid diastolic decay (Tau > 0.42) indicates vasodilation
        vaso_score = 0.0
        if mean_dbp < 65.0:
            vaso_score += (65.0 - mean_dbp) * 2.5
        if tau > 0.38:
            vaso_score += (tau - 0.38) * 350.0
        vaso_score = min(100.0, max(0.0, vaso_score))

        # 4. Patient Vulnerability (0 to 100)
        vulnerability = (asa * 18.0) + (max(0.0, age - 50.0) * 0.8) + (preop_htn * 15.0)
        vulnerability = min(100.0, max(0.0, vulnerability))

        # Feature Attribution Weights (SHAP-style contribution breakdown)
        feature_importance_list = [
            {
                "feature": "Variação de Pressão de Pulso (VPP / PPV)",
                "value": f"{ppv:.1f}%",
                "impact": "Alto" if ppv > 13.0 else "Normal",
                "contribution_pct": round(preload_score * 0.35, 1),
                "interpretation": (
                    "VPP elevada (> 13%): Sugere hipovolemia relativa / responsividade a volume."
                    if ppv > 13.0
                    else "VPP dentro da faixa fisiológica esperada."
                ),
            },
            {
                "feature": "Contratilidade Miocárdica (dP/dt max)",
                "value": f"{dp_dt:.0f} mmHg/s",
                "impact": "Reduzido" if dp_dt < 750 else "Preservado",
                "contribution_pct": round(contractility_deficit * 0.30, 1),
                "interpretation": (
                    "dP/dt_max reduzido: Alerta de depressão inotrópica ou ejeção ventricular amortecida."
                    if dp_dt < 750
                    else "Velocidade de ejeção sistólica adequada."
                ),
            },
            {
                "feature": "Pressão Diastólica & Decaimento Vascular",
                "value": f"{mean_dbp:.0f} mmHg",
                "impact": "Vasodilatado" if mean_dbp < 55 else "Estável",
                "contribution_pct": round(vaso_score * 0.20, 1),
                "interpretation": (
                    "PAD baixa e decaimento rápido: Perda de tônus vasomotor arteriolar periférico."
                    if mean_dbp < 55
                    else "Tônus vascular periférico dentro dos limites normais."
                ),
            },
            {
                "feature": "Perfil Clínico e Estado Físico ASA",
                "value": f"ASA {asa} | {age:.0f} anos",
                "impact": "Moderado/Alto" if asa >= 3 or age > 65 else "Baixo",
                "contribution_pct": round(vulnerability * 0.15, 1),
                "interpretation": (
                    "Paciente com reserva funcional reduzida / risco basal aumentado."
                    if asa >= 3 or age > 65
                    else "Reserva hemodinâmica basal preservada."
                ),
            },
        ]

        # Clinical Recommendation Logic
        clinical_actions = []
        if risk_score >= 50.0:
            if ppv > 13.0:
                clinical_actions.append(
                    "💧 **Otimização de Pré-Carga**: Paciente responsivo a volume (VPP > 13%). Avaliar prova volêmica com cristalóide antes de vasopressores."
                )
            if vaso_score > 40.0 or mean_dbp < 55.0:
                clinical_actions.append(
                    "💉 **Tônus Vasomotor**: Avaliar infusão precoce de vasopressor (ex: Noradrenalina ou Fenilefrina) para restaurar a resistência vascular sistêmica."
                )
            if dp_dt < 700.0:
                clinical_actions.append(
                    "⚡ **Suporte Inotrópico / Redução de Hipnótico**: Inotropismo ventricular deprimido. Avaliar profundidade anestésica ou suporte inotrópico."
                )
            if not clinical_actions:
                clinical_actions.append(
                    "⚠️ **Vigilância Hemodinâmica**: Alerta preventivo ativo. Monitorar tendência e preparar drogas vasoativas de resgate."
                )
        else:
            clinical_actions.append("✅ **Estabilidade**: Parâmetros hemodinâmicos e predição dentro da faixa de segurança clínica.")

        return {
            "physiological_axes": {
                "preload_responsiveness": round(preload_score, 1),
                "contractility_deficit": round(contractility_deficit, 1),
                "vasodilation_index": round(vaso_score, 1),
                "baseline_vulnerability": round(vulnerability, 1),
            },
            "feature_attributions": feature_importance_list,
            "clinical_recommendations": clinical_actions,
        }
