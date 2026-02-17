import pytest
from conftest import BASE_URL

class TestPayment:
    """Payment endpoints - mock ABA PayWay integration"""

    def test_initiate_payment_for_order(self, api_client, auth_headers):
        """Test POST /payment/initiate returns payment details"""
        # Create order first
        api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        api_client.post(f"{BASE_URL}/api/cart", json={
            "product_id": "prod_latte", "quantity": 1, "size": "Medium", "sugar_level": "Normal", "add_ons": []
        }, headers=auth_headers)
        order = api_client.post(f"{BASE_URL}/api/orders", json={
            "delivery_address": "TEST Payment Test", "payment_method": "aba_payway"
        }, headers=auth_headers).json()
        
        # Initiate payment
        payment_data = {"order_id": order["order_id"], "method": "qr"}
        response = api_client.post(f"{BASE_URL}/api/payment/initiate", json=payment_data, headers=auth_headers)
        
        assert response.status_code == 200, f"Payment initiation failed: {response.text}"
        
        payment = response.json()
        assert "payment_id" in payment
        assert "aba_tran_id" in payment
        assert "qr_code_data" in payment
        assert payment["status"] == "processing"
        assert payment["amount"] == order["total"]
        
        return payment["payment_id"], order["order_id"]

    def test_confirm_payment_and_verify_order_status(self, api_client, auth_headers):
        """Test POST /payment/confirm/{id} updates payment and order status"""
        # Create order and initiate payment
        api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        api_client.post(f"{BASE_URL}/api/cart", json={
            "product_id": "prod_americano", "quantity": 1, "size": "Small", "sugar_level": "Normal", "add_ons": []
        }, headers=auth_headers)
        order = api_client.post(f"{BASE_URL}/api/orders", json={
            "delivery_address": "TEST Confirm Payment", "payment_method": "aba_payway"
        }, headers=auth_headers).json()
        
        payment = api_client.post(f"{BASE_URL}/api/payment/initiate", json={
            "order_id": order["order_id"], "method": "qr"
        }, headers=auth_headers).json()
        
        # Confirm payment
        confirm_response = api_client.post(
            f"{BASE_URL}/api/payment/confirm/{payment['payment_id']}",
            headers=auth_headers
        )
        
        assert confirm_response.status_code == 200
        confirm_data = confirm_response.json()
        assert confirm_data["status"] == "completed"
        assert confirm_data["order_id"] == order["order_id"]
        
        # Verify order status updated
        order_check = api_client.get(f"{BASE_URL}/api/orders/{order['order_id']}", headers=auth_headers).json()
        assert order_check["payment_status"] == "paid"
        assert order_check["status"] == "confirmed"

class TestTracking:
    """Tracking endpoint - live order tracking data"""

    def test_get_tracking_for_order(self, api_client, auth_headers):
        """Test GET /tracking/{order_id} returns tracking data"""
        # Create and confirm order
        api_client.delete(f"{BASE_URL}/api/cart", headers=auth_headers)
        api_client.post(f"{BASE_URL}/api/cart", json={
            "product_id": "prod_mocha", "quantity": 1, "size": "Small", "sugar_level": "Normal", "add_ons": []
        }, headers=auth_headers)
        order = api_client.post(f"{BASE_URL}/api/orders", json={
            "delivery_address": "TEST Tracking Test", "payment_method": "aba_payway"
        }, headers=auth_headers).json()
        
        payment = api_client.post(f"{BASE_URL}/api/payment/initiate", json={
            "order_id": order["order_id"]
        }, headers=auth_headers).json()
        api_client.post(f"{BASE_URL}/api/payment/confirm/{payment['payment_id']}", headers=auth_headers)
        
        # Get tracking
        tracking_response = api_client.get(f"{BASE_URL}/api/tracking/{order['order_id']}", headers=auth_headers)
        
        assert tracking_response.status_code == 200, f"Tracking failed: {tracking_response.text}"
        
        tracking = tracking_response.json()
        assert tracking["order_id"] == order["order_id"]
        assert "status" in tracking
        assert "steps" in tracking
        assert len(tracking["steps"]) == 4  # confirmed, preparing, out_for_delivery, delivered
        assert "delivery_address" in tracking
        assert "total" in tracking

    def test_tracking_nonexistent_order(self, api_client, auth_headers):
        """Test tracking with invalid order_id returns 404"""
        response = api_client.get(f"{BASE_URL}/api/tracking/INVALID_ORDER", headers=auth_headers)
        assert response.status_code == 404
