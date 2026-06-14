import asyncio
from fastapi import FastAPI
from fastapi.testclient import TestClient
import sys

# Add backend directory to path so we can import app
sys.path.append('backend')
from main import app

def test_routes():
    client = TestClient(app)
    
    # Test dashboard endpoints
    r1 = client.get("/api/dashboard/stats")
    print(f"GET /api/dashboard/stats -> {r1.status_code}")
    if r1.status_code != 200:
        print("Response:", r1.text)

    r2 = client.get("/dashboard/stats")
    print(f"GET /dashboard/stats -> {r2.status_code}")
    
    # Check all registered routes
    print("\nRegistered routes:")
    for route in app.routes:
        if hasattr(route, "methods"):
            print(f"{list(route.methods)} {route.path}")

test_routes()
