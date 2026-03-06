from pydantic import BaseModel

class UploadResponse(BaseModel):
    status: str
    confidence_score: float
    mask_url: str
    org_url: str
    coords: list

