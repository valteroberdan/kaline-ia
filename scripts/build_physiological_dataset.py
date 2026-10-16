"""
Script para geração dos casos clínicos do VitalDB com morfologia arterial fisiológica autêntica.
Inclui:
- Incisura dícrota nítida (fechamento aórtico) e onda dícrota de reflexão
- VPP modulada pelo ciclo ventilatório respiratório
- Marcadores de eventos clínicos reais do VitalDB (anestart, opstart, intraop_ebl, hemotransfusão, drogas vasoativas)
"""

import json
import numpy as np
from pathlib import Path

SAMPLE_DATA_DIR = Path("sample_data")
SAMPLE_DATA_DIR.mkdir(parents=True, exist_ok=True)

def build_physiological_beat(sbp, dbp, hr=75.0, fs=100):
    beat_dur = 60.0 / max(35.0, min(180.0, hr))
    n_beat = int(round(beat_dur * fs))
    t = np.linspace(0, beat_dur, n_beat, endpoint=False)
    
    rr_norm = np.sqrt(beat_dur / 0.8)
    t_sys = 0.10 * rr_norm
    t_notch = 0.30 * rr_norm
    t_rebound = 0.38 * rr_norm
    
    pp = max(10.0, sbp - dbp)
    p_notch = dbp + 0.40 * pp
    p_rebound = dbp + 0.54 * pp
    
    beat = np.zeros(n_beat, dtype=np.float32)
    for i, ti in enumerate(t):
        if ti < t_sys:
            u = ti / t_sys
            beat[i] = dbp + pp * (0.5 - 0.5 * np.cos(np.pi * u))
        elif ti < t_notch:
            u = (ti - t_sys) / (t_notch - t_sys)
            beat[i] = sbp - (sbp - p_notch) * (0.5 - 0.5 * np.cos(np.pi * u))
        elif ti < t_rebound:
            u = (ti - t_notch) / (t_rebound - t_notch)
            beat[i] = p_notch + (p_rebound - p_notch) * np.sin(np.pi * u / 2.0)
        else:
            u = (ti - t_rebound) / (beat_dur - t_rebound)
            beat[i] = dbp + (p_rebound - dbp) * np.exp(-3.5 * u)
            
    beat += np.random.normal(0, 0.08, n_beat).astype(np.float32)
    return beat

def generate_wave(total_sec, map_fn, hr_fn, vpp_fn, fs=100):
    total_samples = int(total_sec * fs)
    wave = np.zeros(total_samples, dtype=np.float32)
    cur = 0
    while cur < total_samples:
        t_sec = cur / fs
        hr = hr_fn(t_sec)
        target_map = map_fn(t_sec)
        vpp = vpp_fn(t_sec)
        
        # Oscilação respiratória em ventilação mecânica (frequência de 12 irpm = período 5.0 s)
        resp = np.sin(2 * np.pi * t_sec / 5.0)
        base_pp = 0.54 * target_map
        pp = base_pp * (1.0 + 0.5 * vpp * resp)
        
        dbp = target_map - (1.0 / 3.0) * pp
        sbp = dbp + pp
        
        dbp = max(35.0, dbp)
        sbp = max(dbp + 15.0, sbp)
        
        beat = build_physiological_beat(sbp, dbp, hr=hr, fs=fs)
        n = min(len(beat), total_samples - cur)
        wave[cur:cur+n] = beat[:n]
        cur += n
    return wave

# DEFINIÇÃO DOS 6 CASOS (Janela unificada de 25 minutos = 1500 segundos)
CASES_METADATA = [
    {
        "caseid": 7,
        "title": "Caso #07 - Paciente Idoso Hipertenso em Hemicolectomia",
        "op": "Hemicolectomia Direta / Lobectomia",
        "age": 72,
        "gender": "M",
        "asa": 3,
        "bmi": 24.8,
        "preop_htn": 1,
        "preop_dm": 1,
        "preop_hb": 11.4,
        "preop_cr": 1.2,
        "ebl_ml": 100,
        "transfusion_units": 0,
        "vasopressors": "Efedrina 10 mg (resgate)",
        "fluids": "Cristaloides 700 mL",
        "scenario": "Paciente masculino de 72 anos, hipertenso e diabético sob anestesia geral balanceada e ventilação mecânica para hemicolectomia direita. Cenário de simulação fisiológica da pressão arterial radial a 100 Hz parametrizado com base no perfil clínico do VitalDB.",
        "risk_profile": "Cirurgia Abdominal / Alto Risco (ASA III)",
        "source": "Simulação Sintética Didática (Perfil Clínico VitalDB)",
        "is_synthetic_simulation": True,
        "provenance": "Sinal arterial gerado computacionalmente a 100 Hz com morfologia fisiológica paramétrica a partir do perfil cirúrgico do VitalDB. Não constitui traçado bruto hospitalar.",
        "total_sec": 1500,
        "map_fn": lambda t: 83.5 if t < 180 else ((83.5 - ((t - 180.0) / 300.0) * 7.5) if t < 480 else ((76.0 - ((t - 480.0) / 600.0) * 18.0) if t < 1080 else ((58.0 + 0.8 * np.sin(t / 10.0)) if t < 1200 else ((58.0 + ((t - 1200.0) / 150.0) * 22.0) if t < 1350 else (80.0 + 1.2 * np.sin(t / 25.0)))))),
        "hr_fn": lambda t: (74.0 + 1.5 * np.sin(t / 40.0)) if t < 480 else ((74.0 + ((t - 480.0) / 600.0) * 6.0 + 1.5 * np.sin(t / 30.0)) if t < 1080 else ((80.0 + 1.5 * np.sin(t / 20.0)) if t < 1200 else (75.0 + 1.0 * np.sin(t / 40.0)))),
        "vpp_fn": lambda t: 0.08 if t < 180 else ((0.08 + ((t - 180.0) / 300.0) * 0.12) if t < 480 else (0.20 if t < 1200 else ((0.20 - ((t - 1200.0) / 150.0) * 0.10) if t < 1350 else 0.10))),
        "events": [
            {
                "time_sec": 180,
                "label": "Indução Anestésica",
                "type": "induction",
                "drug_dose": "Propofol 140 mg + Fentanil 200 mcg + Rocurônio 50 mg",
                "details": "Início da indução e perda gradual do tônus simpático."
            },
            {
                "time_sec": 300,
                "label": "Ventilação Mecânica / VPP",
                "type": "fluid",
                "details": "Intubação orotraqueal e início da ventilação com pressão positiva."
            },
            {
                "time_sec": 480,
                "label": "Ponto 1 Aula",
                "type": "hpi_alert",
                "details": "Marco avaliativo 1: análise da dinâmica arterial e morfometria sob ventilação."
            },
            {
                "time_sec": 1080,
                "label": "Ponto 2 Aula",
                "type": "hypotension",
                "details": "Marco avaliativo 2: avaliação hemodinâmica e confirmação da hipotensão prevista."
            },
            {
                "time_sec": 1200,
                "label": "Intervenção Hemodinâmica",
                "type": "vasopressor",
                "drug_dose": "Efedrina 10 mg IV + 500 mL Cristaloide",
                "details": "Administração de vasopressor e reposição volêmica para recuperação da PAM."
            }
        ]
    },
    {
        "caseid": 20,
        "title": "Caso #20 - Ressecção Pulmonar sob Toracotomia (Lobectomia)",
        "op": "Lobectomia Pulmonar",
        "age": 75,
        "gender": "M",
        "asa": 2,
        "bmi": 24.7,
        "preop_htn": 1,
        "preop_dm": 1,
        "preop_hb": 11.8,
        "preop_cr": 1.1,
        "ebl_ml": 800,
        "transfusion_units": 2,
        "vasopressors": "Fenilefrina 250 mcg + Efedrina 5 mg",
        "fluids": "Cristaloides 2.300 mL + Coloides 500 mL",
        "scenario": "Paciente masculino de 75 anos submetido a toracotomia e lobectomia pulmonar com monitorização invasiva contínua da pressão arterial. Cenário de simulação fisiológica parametrizado com base no caso do VitalDB.",
        "risk_profile": "Cirurgia Torácica Aberta (ASA II)",
        "source": "Simulação Sintética Didática (Perfil Clínico VitalDB)",
        "is_synthetic_simulation": True,
        "provenance": "Sinal arterial gerado computacionalmente a 100 Hz com morfologia fisiológica paramétrica a partir do perfil cirúrgico do VitalDB. Não constitui traçado bruto hospitalar.",
        "total_sec": 1500,
        "map_fn": lambda t: (82.0 - (t / 480.0) * 4.0) if t < 480 else ((78.0 - ((t - 480.0) / 480.0) * 8.0) if t < 960 else ((70.0 - ((t - 960.0) / 180.0) * 15.0) if t < 1140 else ((55.0 + 1.0 * np.sin(t / 15.0)) if t < 1260 else ((55.0 + ((t - 1260.0) / 140.0) * 21.0) if t < 1400 else (76.0 + 1.0 * np.sin(t / 30.0)))))),
        "hr_fn": lambda t: 72.0 + (t / 1500.0) * 18.0,
        "vpp_fn": lambda t: 0.10 if t < 480 else ((0.10 + ((t - 480.0) / 480.0) * 0.12) if t < 960 else (0.22 if t < 1260 else 0.12)),
        "events": [
            {
                "time_sec": 180,
                "label": "Indução Anestésica",
                "type": "induction",
                "drug_dose": "Propofol + Rocurônio",
                "details": "Indução rápida registrada no VitalDB."
            },
            {
                "time_sec": 480,
                "label": "Toracotomia & Incisão",
                "type": "incision",
                "details": "Abertura de cavidade torácica e dissecção hilar pulmonar."
            },
            {
                "time_sec": 720,
                "label": "Sangramento Torácico",
                "type": "bleeding",
                "details": "Início de sangramento intraoperatório torácico expressivo (EBL 800 mL)."
            },
            {
                "time_sec": 960,
                "label": "Avaliação Dinâmica de Volume",
                "type": "hpi_alert",
                "details": "Análise da contratilidade e reflexão aórtica sob perdas volêmicas."
            },
            {
                "time_sec": 1140,
                "label": "Alteração Hemodinâmica Aguda",
                "type": "hypotension",
                "details": "Registro de alteração tensional durante o tempo cirúrgico."
            },
            {
                "time_sec": 1260,
                "label": "Vasopressor & Transfusão",
                "type": "vasopressor",
                "drug_dose": "Fenilefrina 250 mcg + 2 CH",
                "details": "Aporte de vasoconstritor arterial de ação rápida e transfusão de resgate."
            }
        ]
    },
    {
        "caseid": 12,
        "title": "Caso #12 - Cirurgia Hepato-biliar em Paciente ASA III",
        "op": "Cirurgia Hepato-biliar / Transplante",
        "age": 69,
        "gender": "F",
        "asa": 3,
        "bmi": 22.8,
        "preop_htn": 1,
        "preop_dm": 0,
        "preop_hb": 9.8,
        "preop_cr": 1.4,
        "ebl_ml": 1300,
        "transfusion_units": 0,
        "vasopressors": "Efedrina 20 mg",
        "fluids": "Cristaloides 4.800 mL + Coloides 200 mL",
        "scenario": "Paciente feminina de 69 anos, cardiopata com anemia pré-operatória, submetida a procedimento abdominal de grande porte com monitorização invasiva contínua da pressão arterial. Cenário de simulação fisiológica parametrizado com base no perfil do VitalDB.",
        "risk_profile": "Alta Complexidade Cirúrgica (ASA III)",
        "source": "Simulação Sintética Didática (Perfil Clínico VitalDB)",
        "is_synthetic_simulation": True,
        "provenance": "Sinal arterial gerado computacionalmente a 100 Hz com morfologia fisiológica paramétrica a partir do perfil cirúrgico do VitalDB. Não constitui traçado bruto hospitalar.",
        "total_sec": 1500,
        "map_fn": lambda t: (78.0 - (t / 540.0) * 3.0) if t < 540 else ((75.0 - ((t - 540.0) / 480.0) * 23.0) if t < 1020 else ((52.0 + 0.8 * np.sin(t / 12.0)) if t < 1140 else ((52.0 + ((t - 1140.0) / 210.0) * 18.0) if t < 1350 else (70.0 + 1.2 * np.sin(t / 30.0))))),
        "hr_fn": lambda t: 80.0 + (t / 1500.0) * 16.0,
        "vpp_fn": lambda t: 0.12 if t < 540 else ((0.12 + ((t - 540.0) / 480.0) * 0.13) if t < 1020 else (0.25 if t < 1140 else 0.11)),
        "events": [
            {
                "time_sec": 180,
                "label": "Manipulação Hepato-biliar",
                "type": "incision",
                "details": "Início da dissecção vascular e manipulação do parênquima hepático."
            },
            {
                "time_sec": 540,
                "label": "Perda Hemática Intraoperatória",
                "type": "bleeding",
                "details": "Hemorragia vascular aguda de grande volume (EBL maciço > 1.300 mL)."
            },
            {
                "time_sec": 780,
                "label": "Avaliação de Perfusão e Pré-carga",
                "type": "hpi_alert",
                "details": "Monitorização da contratilidade e reflexão periférica."
            },
            {
                "time_sec": 1020,
                "label": "Instabilidade Hemodinâmica Grave",
                "type": "hypotension",
                "details": "Descompensação tensional acentuada durante manipulação vascular."
            },
            {
                "time_sec": 1140,
                "label": "Ressuscitação & Vasopressor",
                "type": "vasopressor",
                "drug_dose": "Efedrina 20 mg + 4.800 mL Cristaloides",
                "details": "Infusão agressiva de volume e inotrópico para suporte circulatório."
            }
        ]
    },
    {
        "caseid": 1,
        "title": "Caso #01 - Ressecção Colorretal em Paciente Idoso",
        "op": "Ressecção Anterior de Reto",
        "age": 77,
        "gender": "M",
        "asa": 2,
        "bmi": 23.0,
        "preop_htn": 1,
        "preop_dm": 0,
        "preop_hb": 12.5,
        "preop_cr": 1.0,
        "ebl_ml": 50,
        "transfusion_units": 0,
        "vasopressors": "Efedrina 10 mg",
        "fluids": "Cristaloides 350 mL",
        "scenario": "Paciente masculino de 77 anos submetido a cirurgia colorretal eletiva sob anestesia geral balanceada inalatória e monitorização por linha arterial radial. Cenário de simulação fisiológica parametrizado com base no perfil do VitalDB.",
        "risk_profile": "Cirurgia Colorretal Eletiva (ASA II)",
        "source": "Simulação Sintética Didática (Perfil Clínico VitalDB)",
        "is_synthetic_simulation": True,
        "provenance": "Sinal arterial gerado computacionalmente a 100 Hz com morfologia fisiológica paramétrica a partir do perfil cirúrgico do VitalDB. Não constitui traçado bruto hospitalar.",
        "total_sec": 1500,
        "map_fn": lambda t: 85.0 + 1.5 * np.sin(t / 60.0),
        "hr_fn": lambda t: 68.0 + 1.5 * np.cos(t / 70.0),
        "vpp_fn": lambda t: 0.08,
        "events": [
            {
                "time_sec": 180,
                "label": "Manutenção Anestésica",
                "type": "induction",
                "details": "Plano anestésico balanceado (Sevoflurano 2% + Remifentanil)."
            },
            {
                "time_sec": 600,
                "label": "Incisão Cirúrgica",
                "type": "incision",
                "details": "Início da ressecção anterior retal e dissecção pélvica."
            },
            {
                "time_sec": 1080,
                "label": "Monitorização Hemodinâmica",
                "type": "fluid",
                "details": "Acompanhamento contínuo dos parâmetros hemodinâmicos da linha arterial."
            }
        ]
    },
    {
        "caseid": 4,
        "title": "Caso #04 - Gastrectomia Distal em Paciente Oncológico",
        "op": "Gastrectomia Distal",
        "age": 74,
        "gender": "M",
        "asa": 2,
        "bmi": 23.5,
        "preop_htn": 1,
        "preop_dm": 1,
        "preop_hb": 10.9,
        "preop_cr": 1.2,
        "ebl_ml": 100,
        "transfusion_units": 0,
        "vasopressors": "Efedrina 50 mg",
        "fluids": "Cristaloides 2.700 mL",
        "scenario": "Paciente de 74 anos em gastrectomia distal com monitorização arterial invasiva contínua durante dissecção gástrica e reposição volêmica guiada por metas. Cenário de simulação fisiológica parametrizado com base no perfil do VitalDB.",
        "risk_profile": "Cirurgia Oncológica Gástrica (ASA II)",
        "source": "Simulação Sintética Didática (Perfil Clínico VitalDB)",
        "is_synthetic_simulation": True,
        "provenance": "Sinal arterial gerado computacionalmente a 100 Hz com morfologia fisiológica paramétrica a partir do perfil cirúrgico do VitalDB. Não constitui traçado bruto hospitalar.",
        "total_sec": 1500,
        "map_fn": lambda t: 84.0 + 2.0 * np.sin(t / 65.0),
        "hr_fn": lambda t: 72.0 + 1.8 * np.cos(t / 50.0),
        "vpp_fn": lambda t: 0.12,
        "events": [
            {
                "time_sec": 240,
                "label": "Reposição Hídrica Guiada por Metas",
                "type": "fluid",
                "details": "Infusão volêmica direcionada por metas de perfusão (Cristaloides 2.700 mL)."
            },
            {
                "time_sec": 720,
                "label": "Incisão e Dissecção Cirúrgica",
                "type": "incision",
                "details": "Manipulação cirúrgica com acompanhamento contínuo da pressão de pulso."
            },
            {
                "time_sec": 1140,
                "label": "Suporte Farmacológico",
                "type": "vasopressor",
                "drug_dose": "Efedrina 10 mg fracionada",
                "details": "Manutenção do tônus arterial durante dissecção linfonodal."
            }
        ]
    },
    {
        "caseid": 10,
        "title": "Caso #10 - Laparotomia Exploradora em Idoso Cardiopata",
        "op": "Cirurgia Geral / Laparotomia",
        "age": 72,
        "gender": "M",
        "asa": 3,
        "bmi": 23.9,
        "preop_htn": 1,
        "preop_dm": 0,
        "preop_hb": 13.0,
        "preop_cr": 1.1,
        "ebl_ml": 200,
        "transfusion_units": 0,
        "vasopressors": "Fenilefrina 500 mcg + Efedrina 20 mg",
        "fluids": "Cristaloides 1.100 mL",
        "scenario": "Paciente de 72 anos com antecedente de cardiopatia isquêmica sob laparotomia e monitorização invasiva contínua da pressão arterial. Cenário de simulação fisiológica parametrizado com base no perfil do VitalDB.",
        "risk_profile": "Cardiopata sob Monitorização Invasiva (ASA III)",
        "source": "Simulação Sintética Didática (Perfil Clínico VitalDB)",
        "is_synthetic_simulation": True,
        "provenance": "Sinal arterial gerado computacionalmente a 100 Hz com morfologia fisiológica paramétrica a partir do perfil cirúrgico do VitalDB. Não constitui traçado bruto hospitalar.",
        "total_sec": 1500,
        "map_fn": lambda t: 86.0 + 1.6 * np.sin(t / 60.0),
        "hr_fn": lambda t: 70.0 + 1.5 * np.sin(t / 45.0),
        "vpp_fn": lambda t: 0.11,
        "events": [
            {
                "time_sec": 210,
                "label": "Incisão Cirúrgica",
                "type": "incision",
                "details": "Abertura de parede abdominal / laparotomia."
            },
            {
                "time_sec": 720,
                "label": "Perda Volêmica Cirúrgica",
                "type": "bleeding",
                "details": "Sangramento intraoperatório de 200 mL registrado no VitalDB."
            },
            {
                "time_sec": 1140,
                "label": "Titulação de Vasopressor",
                "type": "vasopressor",
                "drug_dose": "Fenilefrina 500 mcg em infusão",
                "details": "Sustentação de pós-carga e estabilidade coronariana em paciente ASA III."
            }
        ]
    }
]

def main():
    manifest_list = []
    
    for c in CASES_METADATA:
        cid = c["caseid"]
        print(f"Generating Case #{cid} - {c['title']}...")
        
        # Generate physiological waveform by default
        wave = generate_wave(c["total_sec"], c["map_fn"], c["hr_fn"], c["vpp_fn"], fs=100)
        
        # Preserve real VitalDB recordings for Cases 1 and 20 (strict provenance)
        case_path = SAMPLE_DATA_DIR / f"case_{cid}.json"
        if cid in [1, 20] and case_path.exists():
            with open(case_path, "r") as ef:
                existing_data = json.load(ef)
                if existing_data.get("is_synthetic_simulation") is False:
                    # Keep authentic VitalDB file untouched and add to manifest
                    manifest_item = {
                        "caseid": cid,
                        "title": existing_data.get("title", c["title"]),
                        "op": existing_data.get("patient", {}).get("opname", c["op"]),
                        "age": existing_data.get("patient", {}).get("age", c["age"]),
                        "gender": existing_data.get("patient", {}).get("sex", c["gender"]),
                        "asa": existing_data.get("patient", {}).get("asa", c["asa"]),
                        "bmi": existing_data.get("patient", {}).get("bmi", c["bmi"]),
                        "preop_htn": existing_data.get("patient", {}).get("preop_htn", 0),
                        "preop_dm": existing_data.get("patient", {}).get("preop_dm", 0),
                        "preop_hb": existing_data.get("patient", {}).get("preop_hb", 12.0),
                        "preop_cr": existing_data.get("patient", {}).get("preop_cr", 1.0),
                        "scenario": existing_data.get("scenario", c["scenario"]),
                        "risk_profile": existing_data.get("risk_profile", c["risk_profile"]),
                        "source": existing_data.get("source", c["source"]),
                        "is_synthetic_simulation": False,
                        "provenance": existing_data.get("provenance", ""),
                        "ebl_ml": existing_data.get("surgical_details", {}).get("ebl_ml", 0),
                        "transfusion_units": existing_data.get("surgical_details", {}).get("transfusion_units", 0),
                        "vasopressors": existing_data.get("surgical_details", {}).get("vasopressors", ""),
                        "fluids": existing_data.get("surgical_details", {}).get("fluids", ""),
                        "events": existing_data.get("events", c["events"]),
                        "clinical_timeline": existing_data.get("clinical_timeline", c["events"]),
                    }
                    manifest_list.append(manifest_item)
                    print(f"Preserved authentic VitalDB Case #{cid}.")
                    continue

        case_data = {
            "caseid": cid,
            "patient": {
                "name": f"Paciente #{cid:02d}",
                "age": c["age"],
                "sex": c["gender"],
                "weight": round(c["bmi"] * ((1.70)**2), 1),
                "height": 170.0,
                "bmi": c["bmi"],
                "asa": c["asa"],
                "emop": 0,
                "preop_htn": c["preop_htn"],
                "preop_dm": c["preop_dm"],
                "preop_hb": c["preop_hb"],
                "preop_cr": c["preop_cr"],
                "opname": c["op"],
            },
            "surgical_details": {
                "ebl_ml": c["ebl_ml"],
                "transfusion_units": c["transfusion_units"],
                "vasopressors": c["vasopressors"],
                "fluids": c["fluids"],
            },
            "source": c["source"],
            "is_synthetic_simulation": c.get("is_synthetic_simulation", True),
            "provenance": c.get("provenance", ""),
            "events": c["events"],
            "clinical_timeline": c["events"],
            "signals": {
                "art": [round(float(v), 2) for v in wave],
                "sampling_rate": 100,
                "duration_sec": c["total_sec"]
            }
        }
        
        # Save JSON
        with open(case_path, "w") as f:
            json.dump(case_data, f)
        print(f"Saved {case_path} ({len(wave)} samples).")
        
        # Add to manifest
        manifest_item = {
            "caseid": cid,
            "title": c["title"],
            "op": c["op"],
            "age": c["age"],
            "gender": c["gender"],
            "asa": c["asa"],
            "bmi": c["bmi"],
            "preop_htn": c["preop_htn"],
            "preop_dm": c["preop_dm"],
            "preop_hb": c["preop_hb"],
            "preop_cr": c["preop_cr"],
            "scenario": c["scenario"],
            "risk_profile": c["risk_profile"],
            "source": c["source"],
            "is_synthetic_simulation": c.get("is_synthetic_simulation", True),
            "provenance": c.get("provenance", ""),
            "ebl_ml": c["ebl_ml"],
            "transfusion_units": c["transfusion_units"],
            "vasopressors": c["vasopressors"],
            "fluids": c["fluids"],
            "events": c["events"],
            "clinical_timeline": c["events"],
        }
        manifest_list.append(manifest_item)
        
    manifest_path = SAMPLE_DATA_DIR / "cases_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest_list, f, indent=2, ensure_ascii=False)
    print(f"Saved {manifest_path} with {len(manifest_list)} cases.")

if __name__ == "__main__":
    main()
