from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from schemas import UploadResponse
import random, string
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware( CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"], )

valid_signatures = {
    b"\xff\xd8\xff": "jpeg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"RIFF": "webp",
}
# save to /static/uploads/ with a uuid
# fix bug with it not finding when non images are sent
@app.post("/upload", response_model=UploadResponse)
async def take_image(image: UploadFile = File()):
    content = await image.read()
    for type in valid_signatures.keys():
        if content.startswith(type): #then image is valid
            uuid = generate_UUID(20)
            path = f"static/uploads/{uuid}_org.{valid_signatures.get(type)}"
            with open(path, "wb") as f:
                f.write(content)
            return UploadResponse(status="success", confidence_score=67, mask_url="idk", org_url=path, coords={"idk": 2})
    raise HTTPException (
        status_code=404,
        detail="Inavlid file type."
    )
    
def generate_UUID(k: int):
    str = ''.join(random.choices(string.ascii_letters + string.digits, k=k))
    return str

