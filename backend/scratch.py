import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        res = await client.post('http://127.0.0.1:8000/api/audit/start', json={
            "url": "example.com",
            "wcag_level": "AA",
            "max_pages": 1,
            "scan_depth": "single"
        })
        print(res.status_code)
        print(res.headers)
        print(res.text)

asyncio.run(main())
