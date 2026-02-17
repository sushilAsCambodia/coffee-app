import pytest
import requests
from conftest import BASE_URL
import uuid

class TestAuth:
    """Authentication endpoints - login, register, get user info"""

    def test_login_with_demo_user_success(self, api_client):
        """Test login with demo credentials returns token and user data"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@cafeempire.com",
            "password": "demo123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Token missing in response"
        assert "user" in data, "User data missing in response"
        assert data["user"]["email"] == "demo@cafeempire.com"
        assert data["user"]["user_id"] == "demo_001"
        assert data["user"]["role"] == "customer"

    def test_login_with_invalid_credentials(self, api_client):
        """Test login with wrong password returns 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo@cafeempire.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    def test_register_new_user_and_verify(self, api_client):
        """Test user registration creates account and can login"""
        unique_email = f"TEST_user_{uuid.uuid4().hex[:8]}@test.com"
        
        # Register
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "name": "Test User",
            "phone": "+855 12 345 678"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == "Test User"
        user_id = data["user"]["user_id"]
        
        # Verify by getting user info
        headers = {"Authorization": f"Bearer {data['token']}"}
        me_response = api_client.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me_response.status_code == 200
        assert me_response.json()["user_id"] == user_id

    def test_register_duplicate_email(self, api_client):
        """Test registering with existing email returns 400"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": "demo@cafeempire.com",
            "password": "anypass",
            "name": "Test"
        })
        assert response.status_code == 400

    def test_get_me_with_valid_token(self, api_client, auth_headers):
        """Test /auth/me returns user info with valid token"""
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == "demo@cafeempire.com"
        assert "password_hash" not in data, "Password hash should not be exposed"

    def test_get_me_without_token(self, api_client):
        """Test /auth/me without token returns 401"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401

class TestCategories:
    """Categories endpoint - browse menu categories"""

    def test_get_categories_returns_4_categories(self, api_client):
        """Test GET /categories returns all 4 seeded categories"""
        response = api_client.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        categories = response.json()
        assert isinstance(categories, list), "Response should be a list"
        assert len(categories) == 4, f"Expected 4 categories, got {len(categories)}"
        
        # Verify category structure
        cat_names = [c["name"] for c in categories]
        assert "Hot Coffee" in cat_names
        assert "Iced Coffee" in cat_names
        assert "Tea & More" in cat_names
        assert "Desserts" in cat_names
        
        # Verify first category has required fields
        first_cat = categories[0]
        assert "category_id" in first_cat
        assert "name" in first_cat
        assert "icon" in first_cat
        assert "description" in first_cat
