from fastapi import FastAPI 

app = FastAPI()

@app.post("/upload")
async def calculate():
    return {"test": "test"}