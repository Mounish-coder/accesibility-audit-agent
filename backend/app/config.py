from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./accessai.db"

    # Groq AI
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-70b-8192"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # Scan settings
    MAX_PAGES: int = 10
    SCAN_TIMEOUT: int = 30
    WCAG_LEVEL: str = "AA"

    # Reports
    REPORTS_DIR: str = "./reports"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
