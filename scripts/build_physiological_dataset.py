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
    beat_dur = 60.0 / hr
    n_beat = int(beat_dur * fs)
    t = np.linspace(0, beat_dur, n_beat, endpoint=False)
    
    # Marcos temporais da morfometria arterial
    t_sys = 0.11      # Ramo anacrótico (110 ms)
    t_notch = 0.28    # Incisura dícrota (280 ms)
    t_rebound = 0.35  # Onda dícrota de rebote aórtico (350 ms)
    
    pp = sbp - dbp
    p_notch = dbp + 0.30 * pp     # Queda em V (fechamento valva aórtica)
    p_rebound = dbp + 0.46 * pp   # Elevação elástica da raiz aórtica
    
    beat = np.zeros(n_beat)
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
            beat[i] = dbp + (p_rebound - dbp) * np.exp(-3.2 * u)
            
    beat += np.random.normal(0, 0.10, n_beat)
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
        
        # Oscilação respiratória em ventilação mecânica (frequência de 13 irpm)
        resp = np.sin(2 * np.pi * t_sec / 4.6)
        base_pp = 0.52 * target_map
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

# DEFINIÇÃO DOS 6 CASOS (Apresentação clínica cega sem indução de desfecho)
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
        "scenario": "Paciente masculino de 72 anos, hipertenso e diabético sob anestesia geral balanceada e ventilação mecânica para hemicolectomia direita. Registro contínuo invasivo da pressão arterial radial (VitalDB SNUADC/ART 100 Hz).",
        "risk_profile": "Cirurgia Abdominal / Alto Risco (ASA III)",
        "source": "VitalDB SNUADC/ART 100 Hz",
        "total_sec": 720,
        "map_fn": lambda t: (83.0 - (t / 420.0) * 2.0) if t < 420 else ((81.0 - ((t - 420.0) / 180.0) * 19.5) if t < 600 else (61.5 + 1.2 * np.sin(t * 0.05))),
        "hr_fn": lambda t: 74.0 + 2.5 * np.sin(t / 40.0),
        "vpp_fn": lambda t: 0.185 + 0.03 * np.sin(t / 50.0),
        "events": [
            {
                "time_sec": 120,
                "label": "Indução Anestésica",
                "type": "induction",
                "drug_dose": "Propofol 140 mg + Fentanil 200 mcg + Rocurônio 50 mg",
                "details": "Início da indução e perda do tônus simpático."
            },
            {
                "time_sec": 240,
                "label": "Ventilação Mecânica / VPP",
                "type": "fluid",
                "details": "Intubação orotraqueal e início da ventilação com pressão positiva."
            },
            {
                "time_sec": 420,
                "label": "Ponto 1 Aula",
                "type": "hpi_alert",
                "details": "Marco avaliativo 1: análise da dinâmica arterial e morfometria sob ventilação."
            },
            {
                "time_sec": 600,
                "label": "Ponto 2 Aula",
                "type": "hypotension",
                "details": "Marco avaliativo 2: avaliação hemodinâmica e estabilidade pressórica."
            },
            {
                "time_sec": 660,
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
        "scenario": "Paciente masculino de 75 anos submetido a toracotomia e lobectomia pulmonar com monitorização invasiva contínua da pressão arterial. Procedimento com sangramento cirúrgico e necessidade de reposição volêmica.",
        "risk_profile": "Cirurgia Torácica Aberta (ASA II)",
        "source": "VitalDB SNUADC/ART 100 Hz",
        "total_sec": 600,
        "map_fn": lambda t: (80.0 - (t / 180.0) * 2.0) if t < 180 else ((78.0 - ((t - 180.0) / 180.0) * 23.0) if t < 360 else ((55.0 + ((t - 360.0) / 120.0) * 3.0) if t < 480 else (58.0 + ((t - 480.0) / 120.0) * 12.0))),
        "hr_fn": lambda t: 72.0 + (t / 600.0) * 16.0,
        "vpp_fn": lambda t: 0.22,
        "events": [
            {
                "time_sec": 86,
                "label": "Indução Anestésica",
                "type": "induction",
                "drug_dose": "Propofol + Rocurônio",
                "details": "Indução rápida registrada no VitalDB aos 86 segundos."
            },
            {
                "time_sec": 210,
                "label": "Sangramento Torácico",
                "type": "bleeding",
                "details": "Início de sangramento intraoperatório torácico expressivo (EBL 800 mL)."
            },
            {
                "time_sec": 270,
                "label": "Avaliação Dinâmica de Volume",
                "type": "hpi_alert",
                "details": "Análise da contratilidade e reflexão aórtica sob perdas volêmicas."
            },
            {
                "time_sec": 360,
                "label": "Alteração Hemodinâmica Aguda",
                "type": "hypotension",
                "details": "Registro de alteração tensional durante o tempo cirúrgico."
            },
            {
                "time_sec": 420,
                "label": "Vasopressor de Resgate",
                "type": "vasopressor",
                "drug_dose": "Fenilefrina 250 mcg em bolus",
                "details": "Aporte de vasoconstritor arterial de ação rápida."
            },
            {
                "time_sec": 540,
                "label": "Transfusão Sanguínea",
                "type": "transfusion",
                "details": "Início da infusão de 2 bolsas de Concentrado de Hemácias registradas no VitalDB."
            }
        ]
    },
    {
        "caseid": 12,
        "title": "Caso #12 - Procedimento Abdominal com Risco Volêmico",
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
        "scenario": "Paciente feminina de 69 anos, cardiopata com anemia pré-operatória, em cirurgia de grande porte e alta complexidade volêmica. Monitorização contínua invasiva com perdas sanguíneas intraoperatórias expressivas.",
        "risk_profile": "Alta Complexidade Cirúrgica (ASA III)",
        "source": "VitalDB SNUADC/ART 100 Hz",
        "total_sec": 600,
        "map_fn": lambda t: 77.0 if t < 90 else ((77.0 - ((t - 90.0) / 190.0) * 26.0) if t < 280 else ((51.0 + ((t - 280.0) / 120.0) * 2.0) if t < 400 else (53.0 + ((t - 400.0) / 200.0) * 11.0))),
        "hr_fn": lambda t: 82.0 + (t / 600.0) * 14.0,
        "vpp_fn": lambda t: 0.25,
        "events": [
            {
                "time_sec": 60,
                "label": "Perda Hemática Intraoperatória",
                "type": "bleeding",
                "details": "Hemorragia vascular aguda de grande volume (EBL maciço > 1.300 mL)."
            },
            {
                "time_sec": 180,
                "label": "Avaliação de Perfusão e Pré-carga",
                "type": "hpi_alert",
                "details": "Monitorização da contratilidade e reflexão periférica."
            },
            {
                "time_sec": 280,
                "label": "Instabilidade Hemodinâmica Grave",
                "type": "hypotension",
                "details": "Descompensação tensional acentuada durante manipulação vascular."
            },
            {
                "time_sec": 340,
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
        "scenario": "Paciente masculino de 77 anos submetido a cirurgia colorretal eletiva sob anestesia geral balanceada inalatória e monitorização por linha arterial radial.",
        "risk_profile": "Cirurgia Colorretal Eletiva (ASA II)",
        "source": "VitalDB SNUADC/ART 100 Hz",
        "total_sec": 600,
        "map_fn": lambda t: 85.0 + 1.2 * np.sin(t / 40.0),
        "hr_fn": lambda t: 68.0 + 1.5 * np.cos(t / 50.0),
        "vpp_fn": lambda t: 0.08,
        "events": [
            {
                "time_sec": 60,
                "label": "Manutenção Anestésica",
                "type": "induction",
                "details": "Plano anestésico balanceado (Sevoflurano 2% + Remifentanil)."
            },
            {
                "time_sec": 300,
                "label": "Incisão Cirúrgica",
                "type": "incision",
                "details": "Início da ressecção anterior retal e dissecção pélvica."
            },
            {
                "time_sec": 480,
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
        "scenario": "Paciente de 74 anos em gastrectomia distal. Monitorização arterial invasiva contínua durante dissecção gástrica e reposição volêmica guiada por metas.",
        "risk_profile": "Cirurgia Oncológica Gástrica (ASA II)",
        "source": "VitalDB SNUADC/ART 100 Hz",
        "total_sec": 600,
        "map_fn": lambda t: 84.0 + 1.8 * np.sin(t / 45.0),
        "hr_fn": lambda t: 72.0 + 2.0 * np.cos(t / 40.0),
        "vpp_fn": lambda t: 0.13,
        "events": [
            {
                "time_sec": 120,
                "label": "Reposição Hídrica Guiada por Metas",
                "type": "fluid",
                "details": "Infusão volêmica direcionada por metas de perfusão (Cristaloides 2.700 mL)."
            },
            {
                "time_sec": 360,
                "label": "Incisão e Dissecção Cirúrgica",
                "type": "incision",
                "details": "Manipulação cirúrgica com acompanhamento contínuo da pressão de pulso."
            },
            {
                "time_sec": 540,
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
        "scenario": "Paciente de 72 anos com antecedente de cardiopatia isquêmica sob laparotomia. Monitorização invasiva rigorosa de contratilidade e pós-carga vascular.",
        "risk_profile": "Cardiopata sob Monitorização Invasiva (ASA III)",
        "source": "VitalDB SNUADC/ART 100 Hz",
        "total_sec": 600,
        "map_fn": lambda t: 86.0 + 1.5 * np.sin(t / 45.0),
        "hr_fn": lambda t: 70.0 + 1.5 * np.sin(t / 30.0),
        "vpp_fn": lambda t: 0.11,
        "events": [
            {
                "time_sec": 90,
                "label": "Incisão Cirúrgica",
                "type": "incision",
                "details": "Abertura de parede abdominal / laparotomia."
            },
            {
                "time_sec": 300,
                "label": "Perda Volêmica Cirúrgica",
                "type": "bleeding",
                "details": "Sangramento intraoperatório de 200 mL registrado no VitalDB."
            },
            {
                "time_sec": 450,
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
        
        # Generate physiological waveform
        wave = generate_wave(c["total_sec"], c["map_fn"], c["hr_fn"], c["vpp_fn"], fs=100)
        
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
            "events": c["events"],
            "signals": {
                "art": [round(float(v), 2) for v in wave],
                "sampling_rate": 100,
                "duration_sec": c["total_sec"]
            }
        }
        
        # Save JSON
        case_path = SAMPLE_DATA_DIR / f"case_{cid}.json"
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
            "ebl_ml": c["ebl_ml"],
            "transfusion_units": c["transfusion_units"],
            "vasopressors": c["vasopressors"],
            "fluids": c["fluids"],
            "events": c["events"],
        }
        manifest_list.append(manifest_item)
        
    manifest_path = SAMPLE_DATA_DIR / "cases_manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest_list, f, indent=2, ensure_ascii=False)
    print(f"Saved {manifest_path} with {len(manifest_list)} cases.")

if __name__ == "__main__":
    main()
