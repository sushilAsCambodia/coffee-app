#!/usr/bin/env python3
"""
Coffee Ordering App Backend API Tests
Testing focus: Order tracking and driver flows
"""

import requests
import json
import time
import sys
from typing import Dict, Any, Optional

class CoffeeAppAPITester:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.api_url = f"{self.base_url}/api"
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        # Test data storage
        self.tokens = {}
        self.test_data = {}
        self.test_results = []
        
        # Test credentials
        self.credentials = {
            'customer': {'email': 'demo@cafeempire.com', 'password': 'demo123'},
            'admin': {'email': 'admin@cafeempire.com', 'password': 'admin123'},
            'driver': {'email': 'driver1@cafeempire.com', 'password': 'driver123'}
        }

    def log_test(self, test_name: str, success: bool, details: str = "", data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        if data and not success:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details,
            'data': data if not success else None
        })

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    auth_token: Optional[str] = None) -> Dict[str, Any]:
        """Make API request with error handling"""
        url = f"{self.api_url}{endpoint}"
        headers = {}
        
        if auth_token:
            headers['Authorization'] = f"Bearer {auth_token}"
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            
            return {
                'status_code': response.status_code,
                'data': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
                'success': response.status_code < 400
            }
        except requests.exceptions.RequestException as e:
            return {
                'status_code': 0,
                'data': {'error': str(e)},
                'success': False
            }
        except json.JSONDecodeError:
            return {
                'status_code': response.status_code,
                'data': {'error': 'Invalid JSON response', 'text': response.text},
                'success': False
            }

    def test_authentication(self) -> bool:
        """Test 1: Authentication for all roles"""
        print("\n🔐 Testing Authentication...")
        all_auth_passed = True
        
        for role, creds in self.credentials.items():
            result = self.make_request('POST', '/auth/login', creds)
            
            if result['success'] and 'token' in result['data']:
                token = result['data']['token']
                user_role = result['data']['user']['role']
                self.tokens[role] = token
                
                # Verify the role is correct
                if user_role == role or (role == 'admin' and user_role == 'admin'):
                    self.log_test(f"Login as {role}", True, f"Role: {user_role}")
                else:
                    self.log_test(f"Login as {role}", False, f"Expected role '{role}', got '{user_role}'")
                    all_auth_passed = False
            else:
                self.log_test(f"Login as {role}", False, f"Status: {result['status_code']}", result['data'])
                all_auth_passed = False
        
        return all_auth_passed

    def test_products_api(self) -> bool:
        """Test 2: Products API"""
        print("\n☕ Testing Products API...")
        
        # Get products
        result = self.make_request('GET', '/products')
        
        if result['success'] and isinstance(result['data'], list) and len(result['data']) > 0:
            products = result['data']
            # Store first product for cart testing
            self.test_data['product'] = products[0]
            self.log_test("Get products", True, f"Found {len(products)} products")
            
            # Check if latte product exists (needed for testing)
            latte = next((p for p in products if p['product_id'] == 'prod_latte'), None)
            if latte:
                self.test_data['latte'] = latte
                self.log_test("Find latte product", True, "prod_latte found")
                return True
            else:
                self.log_test("Find latte product", False, "prod_latte not found")
                return False
        else:
            self.log_test("Get products", False, f"Status: {result['status_code']}", result['data'])
            return False

    def test_order_flow(self) -> bool:
        """Test 3: Complete order flow (customer perspective)"""
        print("\n📋 Testing Order Flow...")
        
        if 'customer' not in self.tokens:
            self.log_test("Order flow", False, "Customer not logged in")
            return False
        
        customer_token = self.tokens['customer']
        
        # Step 1: Add item to cart
        cart_data = {
            "product_id": "prod_latte",
            "quantity": 1,
            "size": "Medium",
            "sugar_level": "Normal",
            "add_ons": []
        }
        
        result = self.make_request('POST', '/cart', cart_data, customer_token)
        if not result['success']:
            self.log_test("Add to cart", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        self.log_test("Add to cart", True, "Latte added to cart")
        
        # Step 2: Create order
        order_data = {
            "delivery_address": "123 Test Street, Phnom Penh",
            "delivery_lat": 11.5564,
            "delivery_lng": 104.9282,
            "payment_method": "aba_payway",
            "note": "Test order"
        }
        
        result = self.make_request('POST', '/orders', order_data, customer_token)
        if not result['success']:
            self.log_test("Create order", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        order = result['data']
        self.test_data['order'] = order
        order_id = order['order_id']
        self.log_test("Create order", True, f"Order ID: {order_id}")
        
        # Step 3: Initiate payment
        payment_data = {"order_id": order_id}
        result = self.make_request('POST', '/payment/initiate', payment_data, customer_token)
        if not result['success']:
            self.log_test("Initiate payment", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        payment = result['data']
        payment_id = payment['payment_id']
        self.log_test("Initiate payment", True, f"Payment ID: {payment_id}")
        
        # Step 4: Confirm payment
        result = self.make_request('POST', f'/payment/confirm/{payment_id}', {}, customer_token)
        if not result['success']:
            self.log_test("Confirm payment", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        self.log_test("Confirm payment", True, "Payment confirmed")
        
        # Step 5: Verify order status changed to confirmed
        result = self.make_request('GET', f'/orders/{order_id}', None, customer_token)
        if result['success'] and result['data'].get('status') == 'confirmed':
            self.log_test("Order status after payment", True, "Status: confirmed")
            return True
        else:
            self.log_test("Order status after payment", False, f"Expected 'confirmed', got '{result['data'].get('status') if result['success'] else 'error'}'")
            return False

    def test_tracking_api(self) -> bool:
        """Test 4: Order tracking API"""
        print("\n📍 Testing Order Tracking API...")
        
        if 'order' not in self.test_data:
            self.log_test("Tracking API", False, "No test order available")
            return False
        
        order_id = self.test_data['order']['order_id']
        customer_token = self.tokens['customer']
        
        result = self.make_request('GET', f'/tracking/{order_id}', None, customer_token)
        
        if result['success']:
            tracking_data = result['data']
            required_fields = ['order_id', 'status', 'steps', 'shop_lat', 'shop_lng', 'delivery_lat', 'delivery_lng']
            
            missing_fields = [field for field in required_fields if field not in tracking_data]
            
            if not missing_fields:
                self.log_test("Tracking API structure", True, f"All required fields present")
                
                # Verify steps structure
                steps = tracking_data.get('steps', [])
                if isinstance(steps, list) and len(steps) >= 4:
                    step_keys = [step.get('key') for step in steps]
                    expected_steps = ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered']
                    
                    if all(key in step_keys for key in expected_steps[:4]):  # At least first 4 steps
                        self.log_test("Tracking steps", True, f"Steps: {step_keys}")
                        return True
                    else:
                        self.log_test("Tracking steps", False, f"Missing steps. Got: {step_keys}")
                        return False
                else:
                    self.log_test("Tracking steps", False, f"Invalid steps structure: {steps}")
                    return False
            else:
                self.log_test("Tracking API structure", False, f"Missing fields: {missing_fields}")
                return False
        else:
            self.log_test("Tracking API", False, f"Status: {result['status_code']}", result['data'])
            return False

    def test_admin_order_management(self) -> bool:
        """Test 5: Admin order status updates"""
        print("\n👨‍💼 Testing Admin Order Management...")
        
        if 'admin' not in self.tokens or 'order' not in self.test_data:
            self.log_test("Admin order management", False, "Admin not logged in or no test order")
            return False
        
        admin_token = self.tokens['admin']
        order_id = self.test_data['order']['order_id']
        
        # Update to preparing
        result = self.make_request('PUT', f'/orders/{order_id}/status', 
                                 {"status": "preparing"}, admin_token)
        
        if not result['success']:
            self.log_test("Update to preparing", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        self.log_test("Update to preparing", True, "Status updated")
        
        # Update to ready
        result = self.make_request('PUT', f'/orders/{order_id}/status', 
                                 {"status": "ready"}, admin_token)
        
        if result['success']:
            self.log_test("Update to ready", True, "Status updated")
            return True
        else:
            self.log_test("Update to ready", False, f"Status: {result['status_code']}", result['data'])
            return False

    def test_driver_flow(self) -> bool:
        """Test 6: Complete driver flow"""
        print("\n🚗 Testing Driver Flow...")
        
        if 'driver' not in self.tokens or 'order' not in self.test_data:
            self.log_test("Driver flow", False, "Driver not logged in or no test order")
            return False
        
        driver_token = self.tokens['driver']
        order_id = self.test_data['order']['order_id']
        
        # Step 1: Get available orders
        result = self.make_request('GET', '/driver/available-orders', None, driver_token)
        if not result['success']:
            self.log_test("Get available orders", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        available_orders = result['data']
        # Check if our test order is in the list
        test_order = next((order for order in available_orders if order['order_id'] == order_id), None)
        
        if not test_order:
            self.log_test("Get available orders", False, f"Test order {order_id} not in available orders")
            return False
        
        self.log_test("Get available orders", True, f"Found {len(available_orders)} orders, including test order")
        
        # Step 2: Accept the order
        result = self.make_request('POST', f'/driver/accept/{order_id}', {}, driver_token)
        if not result['success']:
            self.log_test("Accept order", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        accepted_order = result['data']
        if accepted_order.get('status') != 'out_for_delivery':
            self.log_test("Accept order", False, f"Expected status 'out_for_delivery', got '{accepted_order.get('status')}'")
            return False
        
        self.log_test("Accept order", True, "Order accepted and status updated to out_for_delivery")
        
        # Step 3: Get active delivery
        result = self.make_request('GET', '/driver/active-delivery', None, driver_token)
        if not result['success']:
            self.log_test("Get active delivery", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        active_order = result['data']
        if not active_order or active_order.get('order_id') != order_id:
            self.log_test("Get active delivery", False, "Active delivery doesn't match accepted order")
            return False
        
        self.log_test("Get active delivery", True, f"Active delivery: {order_id}")
        
        # Step 4: Update driver location
        location_data = {"lat": 11.56, "lng": 104.92}
        result = self.make_request('PUT', '/driver/location', location_data, driver_token)
        if not result['success']:
            self.log_test("Update driver location", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        self.log_test("Update driver location", True, "Location updated")
        
        # Step 5: Complete delivery
        result = self.make_request('POST', f'/driver/complete/{order_id}', {}, driver_token)
        if not result['success']:
            self.log_test("Complete delivery", False, f"Status: {result['status_code']}", result['data'])
            return False
        
        self.log_test("Complete delivery", True, "Delivery completed")
        
        # Step 6: Verify order status is now delivered
        customer_token = self.tokens['customer']
        result = self.make_request('GET', f'/orders/{order_id}', None, customer_token)
        if result['success'] and result['data'].get('status') == 'delivered':
            self.log_test("Verify delivery status", True, "Order status is delivered")
            return True
        else:
            self.log_test("Verify delivery status", False, f"Expected 'delivered', got '{result['data'].get('status') if result['success'] else 'error'}'")
            return False

    def test_tracking_with_driver(self) -> bool:
        """Test 7: Tracking API after driver assignment"""
        print("\n📱 Testing Tracking with Driver Info...")
        
        if 'order' not in self.test_data:
            self.log_test("Tracking with driver", False, "No test order available")
            return False
        
        order_id = self.test_data['order']['order_id']
        customer_token = self.tokens['customer']
        
        result = self.make_request('GET', f'/tracking/{order_id}', None, customer_token)
        
        if result['success']:
            tracking_data = result['data']
            
            # Should now have driver info
            driver_info = tracking_data.get('driver')
            if driver_info and isinstance(driver_info, dict):
                driver_fields = ['name', 'phone', 'vehicle', 'lat', 'lng']
                missing_driver_fields = [field for field in driver_fields if field not in driver_info]
                
                if not missing_driver_fields:
                    self.log_test("Tracking driver info", True, f"Driver: {driver_info['name']}")
                    
                    # Check if status is delivered
                    if tracking_data.get('status') == 'delivered':
                        self.log_test("Final tracking status", True, "Status: delivered")
                        return True
                    else:
                        self.log_test("Final tracking status", False, f"Expected 'delivered', got '{tracking_data.get('status')}'")
                        return False
                else:
                    self.log_test("Tracking driver info", False, f"Missing driver fields: {missing_driver_fields}")
                    return False
            else:
                self.log_test("Tracking driver info", False, "Driver info not found or invalid")
                return False
        else:
            self.log_test("Tracking with driver", False, f"Status: {result['status_code']}", result['data'])
            return False

    def run_all_tests(self) -> bool:
        """Run all tests in sequence"""
        print(f"🚀 Starting Coffee App API Tests")
        print(f"📡 Backend URL: {self.base_url}")
        
        test_functions = [
            self.test_authentication,
            self.test_products_api,
            self.test_order_flow,
            self.test_tracking_api,
            self.test_admin_order_management,
            self.test_driver_flow,
            self.test_tracking_with_driver
        ]
        
        all_passed = True
        for test_func in test_functions:
            try:
                result = test_func()
                if not result:
                    all_passed = False
            except Exception as e:
                self.log_test(f"{test_func.__name__}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

    def print_summary(self):
        """Print test summary"""
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        print(f"\n{'='*60}")
        print(f"📊 TEST SUMMARY")
        print(f"{'='*60}")
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}: {result['details']}")
        
        print(f"{'='*60}")


def main():
    # Use the provided backend URL
    backend_url = "https://grab-style-delivery.preview.emergentagent.com"
    
    tester = CoffeeAppAPITester(backend_url)
    
    try:
        success = tester.run_all_tests()
        tester.print_summary()
        
        if success:
            print("🎉 All tests passed!")
            return 0
        else:
            print("💥 Some tests failed!")
            return 1
            
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Fatal error: {str(e)}")
        return 1


if __name__ == "__main__":
    sys.exit(main())