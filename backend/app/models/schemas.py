from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class VerificationResultSchema(BaseModel):
    classification: str = Field(..., description="REAL, TEST, EXAMPLE, FALSE_POSITIVE, UNKNOWN")
    confidence: float
    reason: str
    mode: str = "local"

class FindingSchema(BaseModel):
    id: str
    scan_id: str
    secret_type: str
    detector: str
    file_path: str
    line_number: int
    commit_id: str
    short_commit_id: str
    commit_message: str
    author: str
    detected_at: str
    exposure_start: str
    exposure_duration: str
    entropy_score: float
    confidence: float
    verification_status: str
    verification_reason: str
    verification_confidence: float
    verification_mode: str
    risk_score: int
    severity: str
    risk_explanation: List[str]
    recommended_action: str
    remediation_steps: List[str]
    masked_secret: str
    is_historical_only: bool
    surrounding_context: str

class ScanSummarySchema(BaseModel):
    id: str
    repo_name: str
    is_git_repo: bool
    total_commits_scanned: int
    total_files_scanned: int
    scanned_at: str
    status: str
    findings_count: Dict[str, int]
