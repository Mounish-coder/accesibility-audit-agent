import asyncio
import uuid
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import httpx
import threading
import time

app = FastAPI()

class AuditRequest(BaseModel):
    url: str
    wcag_level: str
    max_pages: int
    scan_depth: str

def perform_audit(*args):
    pass

@app.post("/start")
async def start_audit(
    request: AuditRequest,
    background_tasks: BackgroundTasks,
):
    audit_id = str(uuid.uuid4())
    background_tasks.add_task(perform_audit, audit_id, request.url, request.wcag_level, request.max_pages)

    return JSONResponse(
        status_code=200,
        content={
            "auditId": audit_id,
            "status": "running",
            "message": "Audit started successfully",
        },
    )

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8005, log_level="critical")

t = threading.Thread(target=run_server)
t.daemon = True
t.start()
time.sleep(1)

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.post("http://127.0.0.1:8005/start", json={
            "url": "example.com",
            "wcag_level": "AA",
            "max_pages": 1,
            "scan_depth": "single"
        })
        print(f"Status: {res.status_code}")
        print(f"Content-Length: {res.headers.get('content-length')}")
        print(f"Body: {res.text}")

asyncio.run(test())
