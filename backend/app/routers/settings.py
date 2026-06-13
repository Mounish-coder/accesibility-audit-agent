from fastapi import APIRouter
from app.schemas import SettingsUpdate

router = APIRouter()

_settings_store = {
    "groqApiKey": "",
    "groqModel": "llama-3.1-70b-versatile",
    "wcagLevel": "AA",
    "maxPages": 10,
    "timeout": 30,
    "emailNotifications": True,
    "webhookUrl": "",
    "autoReport": False,
    "includePassedChecks": True,
}


@router.get("")
async def get_settings():
    """Get current settings (API key masked)."""
    data = {**_settings_store}
    if data.get("groqApiKey"):
        key = data["groqApiKey"]
        data["groqApiKey"] = key[:8] + "..." + key[-4:] if len(key) > 12 else "****"
    return data


@router.put("")
async def update_settings(update: SettingsUpdate):
    """Update application settings."""
    update_data = update.model_dump(exclude_none=True)
    _settings_store.update(update_data)
    
    # Update runtime settings
    if "groqApiKey" in update_data:
        from app.config import settings
        settings.GROQ_API_KEY = update_data["groqApiKey"]
    if "wcagLevel" in update_data:
        from app.config import settings
        settings.WCAG_LEVEL = update_data["wcagLevel"]
    
    return {"message": "Settings updated successfully", "settings": _settings_store}
