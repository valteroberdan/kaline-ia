"""
FastAPI Engine for Kaline IA Protótipo
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from saas_backend.routes.predict import router as predict_router
from saas_backend.routes.cases import router as cases_router
from saas_backend.routes.metrics import router as metrics_router
from saas_backend.routes.monitor import router as monitor_router

app = FastAPI(
    title="Kaline IA Protótipo - Sistema de Predição de Hipotensão",
    description="Sistema Inteligente de Predição Precoce de Hipotensão Arterial Intraoperatória baseado no VitalDB.",
    version="1.0.0",
)

# Enable CORS for local React/Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(predict_router)
app.include_router(cases_router)
app.include_router(metrics_router)
app.include_router(monitor_router)


@app.get("/api/self-correction")
async def get_self_correction_alias():
    from saas_backend.routes.metrics import get_self_correction_report
    return await get_self_correction_report()


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Kaline IA Engine",
        "version": "1.0.0",
        "backend": "FastAPI + PyTorch + LightGBM",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("saas_backend.main:app", host="0.0.0.0", port=8090, reload=True)
