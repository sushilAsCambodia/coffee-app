import pytest
from conftest import BASE_URL

class TestProducts:
    """Products endpoints - browse menu items"""

    def test_get_all_products_returns_14_items(self, api_client):
        """Test GET /products returns all 14 seeded products"""
        response = api_client.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        
        products = response.json()
        assert isinstance(products, list)
        assert len(products) == 14, f"Expected 14 products, got {len(products)}"

    def test_get_products_by_category(self, api_client):
        """Test filtering products by category_id"""
        response = api_client.get(f"{BASE_URL}/api/products?category_id=cat_hot")
        assert response.status_code == 200
        
        products = response.json()
        assert len(products) >= 4, "Should have hot coffee products"
        
        # All products should be from cat_hot
        for product in products:
            assert product["category_id"] == "cat_hot"

    def test_get_popular_products(self, api_client):
        """Test filtering products by popular flag"""
        response = api_client.get(f"{BASE_URL}/api/products?popular=true")
        assert response.status_code == 200
        
        products = response.json()
        assert len(products) > 0, "Should have popular products"
        
        # All should have is_popular=True
        for product in products:
            assert product.get("is_popular") == True

    def test_get_product_by_id(self, api_client):
        """Test GET /products/{id} returns product details"""
        response = api_client.get(f"{BASE_URL}/api/products/prod_latte")
        assert response.status_code == 200
        
        product = response.json()
        assert product["product_id"] == "prod_latte"
        assert product["name"] == "Classic Latte"
        assert "sizes" in product
        assert "sugar_levels" in product
        assert "add_ons" in product
        assert "base_price" in product
        assert product["category_id"] == "cat_hot"

    def test_get_nonexistent_product(self, api_client):
        """Test GET /products/{id} with invalid id returns 404"""
        response = api_client.get(f"{BASE_URL}/api/products/invalid_product")
        assert response.status_code == 404

    def test_product_structure_has_required_fields(self, api_client):
        """Test product object has all required fields for UI"""
        response = api_client.get(f"{BASE_URL}/api/products")
        products = response.json()
        
        required_fields = ["product_id", "name", "description", "base_price", 
                          "category_id", "sizes", "sugar_levels", "add_ons", "rating"]
        
        for product in products:
            for field in required_fields:
                assert field in product, f"Product missing field: {field}"
