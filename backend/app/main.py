from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
import os
import shutil
import tempfile
import zipfile

from backend.app.models.schemas import FindingSchema, ScanSummarySchema
from backend.app.scanners.entropy import calculate_shannon_entropy, mask_secret_value

app = FastAPI(
    title="CredSense AI Backend",
    description="AI-Powered Secret Detection & Git History Security Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check() -> Dict[str, Any]:
    return {
        "status": "ok",
        "engine": "CredSense AI Core (FastAPI / GitPython)",
        "privacy": "Secrets masked before analysis and persistence."
    }

@app.post("/api/scan/upload")
async def upload_repository(repositoryZip: UploadFile = File(...)) -> Dict[str, Any]:
    if not repositoryZip.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP archives are supported.")
    
    scan_id = f"fastapi-scan-{os.urandom(4).hex()}"
    return {
        "scan_id": scan_id,
        "repo_name": repositoryZip.filename.replace(".zip", ""),
        "status": "ready"
    }
