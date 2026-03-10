from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from schemas import UploadResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ml_models.inference import run_opencv, run_pytorch
import asyncio
import os
import time
from contextlib import asynccontextmanager
import uuid

from concurrent.futures import ThreadPoolExecutor 

DIR = "static/uploads"
CLEANUP_INTERVAL = 600
MAX_AGE = 600

async def cleanup_uploads():
    while True:
        await asyncio.sleep(CLEANUP_INTERVAL)
        now = time.time()
        for filename in os.listdir(DIR):
            filepath = os.path.join(DIR, filename)
            file_age = now-os.path.getmtime(filepath)
            if file_age > MAX_AGE:
                os.remove(filepath)

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(cleanup_uploads())
    yield
    task.cancel()

app = FastAPI(lifespan=lifespan)
app.add_middleware( CORSMiddleware, allow_origins=["https://forgefind.netlify.app"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"], )
# mounts the static directory so canvas.js can actually access the image from there
os.makedirs("static/uploads", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

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
            img_uuid = uuid.uuid1()
            org_path = f"static/uploads/{img_uuid}_org.{valid_signatures.get(type)}"
            mask_path = f"static/uploads/{img_uuid}_mask.{valid_signatures.get(type)}"
            org_url = f"https://idident-forgefind.hf.space/static/uploads/{img_uuid}_org.{valid_signatures.get(type)}"
            mask_url = f"https://idident-forgefind.hf.space/static/uploads/{img_uuid}_mask.{valid_signatures.get(type)}"
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
        status_code=404,
        detail="Inavlid file type."
    )


