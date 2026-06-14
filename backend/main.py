from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging

from app.database import init_db
from app.routers import audit, dashboard, reports, settings
from app.config import settings as app_settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AccessAI API...")
    await init_db()
    logger.info("Database initialized.")
    yield
    logger.info("Shutting down AccessAI API.")


app = FastAPI(
    title="AccessAI - Accessibility Audit Agent API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount with /api prefix so the frontend's baseURL '/api' works both:
# - Through the nginx proxy (nginx strips /api/ before forwarding)
# - Directly against the backend on Render (no proxy needed)
app.include_router(audit.router,      prefix="/api/audit",      tags=["Audit"])
app.include_router(dashboard.router,  prefix="/api/dashboard",  tags=["Dashboard"])
app.include_router(reports.router,    prefix="/api/reports",    tags=["Reports"])
app.include_router(settings.router,   prefix="/api/settings",   tags=["Settings"])




@app.get("/", tags=["Health"])
async def root():
    return {"status": "running", "service": "AccessAI"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "AccessAI API", "version": "1.0.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
