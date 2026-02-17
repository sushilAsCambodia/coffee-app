import pytest
import requests
import os

# Get backend URL from environment
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL environment variable is not set")

@pytest.fixture(scope="session")
def api_client():
    """Shared requests session for all tests"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="session")
def demo_token(api_client):
    """Login as demo user and return token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "demo@cafeempire.com",
        "password": "demo123"
    })
    if response.status_code != 200:
        pytest.skip("Demo login failed - skipping authenticated tests")
    return response.json()["token"]

@pytest.fixture(scope="session")
def admin_token(api_client):
    """Login as admin user and return token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@cafeempire.com",
        "password": "admin123"
    })
    if response.status_code != 200:
        pytest.skip("Admin login failed - skipping admin tests")
    return response.json()["token"]

@pytest.fixture
def auth_headers(demo_token):
    """Headers with demo user authentication"""
    return {"Authorization": f"Bearer {demo_token}"}

@pytest.fixture
def admin_headers(admin_token):
    """Headers with admin authentication"""
    return {"Authorization": f"Bearer {admin_token}"}
