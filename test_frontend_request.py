import asyncio
import httpx

async def test():
    async with httpx.AsyncClient() as client:
        payload = {
            "url": "https://example.com",
            "max_pages": 5,
            "scan_depth": "Standard Scan",
            "wcag_level": "AA"
        }
        res = await client.post("http://localhost:8000/api/audit/start", json=payload)
        print("Status:", res.status_code)
        print("Headers:", res.headers)
        print("Body:", res.text)

if __name__ == "__main__":
    asyncio.run(test())
