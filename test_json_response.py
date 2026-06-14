import asyncio
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import JSONResponse
import uvicorn
import httpx
import threading
import time

app = FastAPI()

def perform_task(*args):
    pass

@app.post("/test")
async def test_endpoint(bg: BackgroundTasks):
    bg.add_task(perform_task, "arg1")
    return JSONResponse(status_code=200, content={"status": "ok"})

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8006, log_level="error")

t = threading.Thread(target=run_server)
t.daemon = True
t.start()
time.sleep(1)

async def run_test():
    async with httpx.AsyncClient() as client:
        res = await client.post("http://127.0.0.1:8006/test")
        print("Status:", res.status_code)
        print("Content-Length:", res.headers.get("content-length"))
        print("Body:", res.text)

asyncio.run(run_test())
