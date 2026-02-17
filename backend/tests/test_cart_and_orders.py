import pytest
from conftest import BASE_URL
import uuid

class TestCart:
    """Cart endpoints - add items, update quantities, checkout"""

    def test_get_empty_cart(self, api_client, auth_headers):
        """Test GET /cart returns empty cart initially"""
        # Clear cart first
        api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        
        response = api_client.get(f"{BASE_URL}/api/cart", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "count" in data

    def test_add_to_cart_and_verify(self, api_client, auth_headers):
        """Test adding product to cart and verifying it persists"""
        # Clear cart
        api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        
        # Add item
        cart_item = {
            "product_id": "prod_latte",
            "quantity": 2,
            "size": "Medium",
            "sugar_level": "Normal",
            "add_ons": ["Extra Shot"]
        }
        
        add_response = api_client.post(
            f"{BASE_URL}/api/cart",
            json=cart_item,
            headers=auth_headers
        )
        assert add_response.status_code == 200, f"Add to cart failed: {add_response.text}"
        
        added_item = add_response.json()
        assert added_item["product_id"] == "prod_latte"
        assert added_item["quantity"] == 2
        assert added_item["size"] == "Medium"
        cart_id = added_item["cart_id"]
        
        # Verify by getting cart
        get_response = api_client.get(f"{BASE_URL}/api/cart", headers=auth_headers)
        assert get_response.status_code == 200
        
        cart = get_response.json()
        assert cart["count"] >= 1
        assert any(item["cart_id"] == cart_id for item in cart["items"])

    def test_add_to_cart_without_auth(self, api_client):
        """Test adding to cart without authentication returns 401"""
        response = api_client.post(f"{BASE_URL}/api/cart", json={
            "product_id": "prod_latte",
            "quantity": 1,
            "size": "Small",
            "sugar_level": "Normal",
            "add_ons": []
        })
        assert response.status_code == 401

    def test_update_cart_item_quantity(self, api_client, auth_headers):
        """Test updating cart item quantity"""
        # Clear and add item
        api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        add_response = api_client.post(
            f"{BASE_URL}/api/cart",
            json={"product_id": "prod_americano", "quantity": 1, "size": "Small", "sugar_level": "Normal", "add_ons": []},
            headers=auth_headers
        )
        cart_id = add_response.json()["cart_id"]
        
        # Update quantity
        update_response = api_client.put(
            f"{BASE_URL}/api/cart/{cart_id}",
            json={"quantity": 3},
            headers=auth_headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["quantity"] == 3

    def test_delete_cart_item(self, api_client, auth_headers):
        """Test deleting a cart item"""
        # Add item
        add_response = api_client.post(
            f"{BASE_URL}/api/cart",
            json={"product_id": "prod_mocha", "quantity": 1, "size": "Medium", "sugar_level": "Normal", "add_ons": []},
            headers=auth_headers
        )
        cart_id = add_response.json()["cart_id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/cart/{cart_id}", headers=auth_headers)
        assert delete_response.status_code == 200
        
        # Verify deleted
        cart = api_client.get(f"{BASE_URL}/api/cart", headers=auth_headers).json()
        assert not any(item["cart_id"] == cart_id for item in cart["items"])

    def test_clear_cart(self, api_client, auth_headers):
        """Test clearing entire cart"""
        # Add items
        api_client.post(f"{BASE_URL}/api/cart", json={
            "product_id": "prod_latte", "quantity": 1, "size": "Small", "sugar_level": "Normal", "add_ons": []
        }, headers=auth_headers)
        
        # Clear
        clear_response = api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        assert clear_response.status_code == 200
        
        # Verify empty
        cart = api_client.get(f"{BASE_URL}/api/cart", headers=auth_headers).json()
        assert cart["count"] == 0

class TestOrders:
    """Order endpoints - create orders, view history"""

    def test_create_order_from_cart(self, api_client, auth_headers):
        """Test creating order from cart items"""
        # Clear cart and add item
        api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        api_client.post(f"{BASE_URL}/api/cart", json={
            "product_id": "prod_cold_brew",
            "quantity": 1,
            "size": "Large",
            "sugar_level": "Normal",
            "add_ons": []
        }, headers=auth_headers)
        
        # Create order
        order_data = {
            "delivery_address": "TEST #123, Street 240, Phnom Penh",
            "delivery_lat": 11.5564,
            "delivery_lng": 104.9282,
            "payment_method": "aba_payway",
            "note": "Test order - please ignore"
        }
        
        response = api_client.post(f"{BASE_URL}/api/orders", json=order_data, headers=auth_headers)
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        order = response.json()
        assert "order_id" in order
        assert order["status"] == "pending_payment"
        assert order["payment_status"] == "pending"
        assert order["delivery_address"] == order_data["delivery_address"]
        assert len(order["items"]) == 1
        assert "total" in order
        
        return order["order_id"]

    def test_create_order_with_empty_cart(self, api_client, auth_headers):
        """Test creating order with empty cart returns 400"""
        api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        
        response = api_client.post(f"{BASE_URL}/api/orders", json={
            "delivery_address": "Test Address",
            "payment_method": "aba_payway"
        }, headers=auth_headers)
        
        assert response.status_code == 400

    def test_get_orders_history(self, api_client, auth_headers):
        """Test GET /orders returns order history"""
        response = api_client.get(f"{BASE_URL}/api/orders", headers=auth_headers)
        assert response.status_code == 200
        
        orders = response.json()
        assert isinstance(orders, list)

    def test_get_order_by_id(self, api_client, auth_headers):
        """Test GET /orders/{id} returns specific order"""
        # Create order first
        api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        api_client.post(f"{BASE_URL}/api/cart", json={
            "product_id": "prod_latte", "quantity": 1, "size": "Small", "sugar_level": "Normal", "add_ons": []
        }, headers=auth_headers)
        order_response = api_client.post(f"{BASE_URL}/api/orders", json={
            "delivery_address": "TEST order", "payment_method": "aba_payway"
        }, headers=auth_headers)
        order_id = order_response.json()["order_id"]
        
        # Get by ID
        get_response = api_client.get(f"{BASE_URL}/api/orders/{order_id}", headers=auth_headers)
        assert get_response.status_code == 200
        assert get_response.json()["order_id"] == order_id
