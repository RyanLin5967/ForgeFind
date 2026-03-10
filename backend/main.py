from fastapi import FastAPI, UploadFile, File, HTTPException
from schemas import UploadResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ml_models.inference import run_opencv, run_pytorch
import uuid
from concurrent.futures import ThreadPoolExecutor 
#use background task to delete images after x minutes
app = FastAPI()
subapi = FastAPI()
# mounts the static directory so canvas.js can actually access the image from there
app.mount("/static", StaticFiles(directory="C:/Users/idide/imgmanipfind/ForgeFind/backend/static"), name="static")
app.add_middleware( CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"], )

valid_signatures = {
    b"\xff\xd8\xff": "jpeg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"RIFF": "webp",
}

@app.post("/upload", response_model=UploadResponse)
async def take_image(image: UploadFile = File()):
    content = await image.read()
    for type in valid_signatures.keys():
        if content.startswith(type):
            img_uuid = uuid.uuid4()
            org_path = f"static/uploads/{img_uuid}_org.{valid_signatures.get(type)}"
            mask_path = f"static/uploads/{img_uuid}_mask.{valid_signatures.get(type)}"
            org_url = f"http://localhost:8000/static/uploads/{img_uuid}_org.{valid_signatures.get(type)}"
            mask_url = f"http://localhost:8000/static/uploads/{img_uuid}_mask.{valid_signatures.get(type)}"
            with open(org_path, "wb") as f:
                f.write(content)
            with ThreadPoolExecutor(max_workers=2) as executor: # run tasks in parallel
                future_opencv = executor.submit(run_opencv, org_path)
                future_pytorch = executor.submit(run_pytorch, org_path, mask_path)
            return UploadResponse(
                status="success", 
                confidence_score=future_pytorch.result(), 
                mask_url=mask_url, org_url=org_url, # pass in urls cuz web page can't access files stored in disk
                coords=future_opencv.result())
    raise HTTPException (
        status_code=415,
        detail="Invalid file type."
    )