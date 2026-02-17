#!/usr/bin/env python3
"""
Debug active delivery issue
"""

import requests
import json

# Use the same base URL
base_url = "https://grab-style-delivery.preview.emergentagent.com"
api_url = f"{base_url}/api"

# Login credentials
driver_creds = {'email': 'driver1@cafeempire.com', 'password': 'driver123'}

# Login as driver
print("🔐 Logging in as driver...")
response = requests.post(f"{api_url}/auth/login", json=driver_creds)
if response.status_code == 200:
    data = response.json()
    driver_token = data['token']
    driver_user_id = data['user']['user_id']
    print(f"✅ Driver logged in: {data['user']['name']} (ID: {driver_user_id})")
    
    headers = {'Authorization': f'Bearer {driver_token}'}
    
    # Check active delivery first
    print("\n🚗 Checking current active delivery...")
    response = requests.get(f"{api_url}/driver/active-delivery", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        active_delivery = response.json()
        if active_delivery:
            print(f"📦 Found active delivery: {active_delivery['order_id']}")
            print(f"   Status: {active_delivery['status']}")
            print(f"   Driver ID: {active_delivery.get('driver_id')}")
            
            # Complete it first
            order_id = active_delivery['order_id']
            print(f"\n🏁 Completing active delivery: {order_id}")
            response = requests.post(f"{api_url}/driver/complete/{order_id}", json={}, headers=headers)
            print(f"Complete status: {response.status_code}")
            if response.status_code == 200:
                print("✅ Delivery completed")
            else:
                print(f"❌ Failed to complete: {response.text}")
        else:
            print("ℹ️  No active delivery")
    
    # Now check available orders
    print("\n📋 Checking available orders...")
    response = requests.get(f"{api_url}/driver/available-orders", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        available_orders = response.json()
        print(f"📦 Found {len(available_orders)} available orders")
        
        if available_orders:
            # Pick the first available order
            test_order = available_orders[0]
            order_id = test_order['order_id']
            print(f"\n🎯 Testing with order: {order_id}")
            
            # Accept the order
            print("📋 Accepting order...")
            response = requests.post(f"{api_url}/driver/accept/{order_id}", json={}, headers=headers)
            print(f"Accept status: {response.status_code}")
            
            if response.status_code == 200:
                accepted_order = response.json()
                print(f"✅ Order accepted")
                print(f"   Order ID: {accepted_order.get('order_id')}")
                print(f"   Status: {accepted_order.get('status')}")
                print(f"   Driver ID: {accepted_order.get('driver_id')}")
                
                # Now check active delivery
                print("\n🚚 Checking active delivery after acceptance...")
                response = requests.get(f"{api_url}/driver/active-delivery", headers=headers)
                print(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    active_delivery = response.json()
                    if active_delivery:
                        print(f"📦 Active delivery found:")
                        print(f"   Order ID: {active_delivery.get('order_id')}")
                        print(f"   Status: {active_delivery.get('status')}")
                        print(f"   Driver ID: {active_delivery.get('driver_id')}")
                        
                        # Check if it matches
                        if active_delivery.get('order_id') == order_id:
                            print("✅ Active delivery matches accepted order")
                            
                            # Test location update
                            print("\n📍 Testing location update...")
                            location_data = {"lat": 11.56, "lng": 104.92}
                            response = requests.put(f"{api_url}/driver/location", json=location_data, headers=headers)
                            print(f"Location update status: {response.status_code}")
                            
                            # Complete the delivery
                            print(f"\n🏁 Completing delivery: {order_id}")
                            response = requests.post(f"{api_url}/driver/complete/{order_id}", json={}, headers=headers)
                            print(f"Complete status: {response.status_code}")
                            
                            if response.status_code == 200:
                                print("✅ Delivery completed successfully")
                            else:
                                print(f"❌ Failed to complete: {response.text}")
                        else:
                            print(f"❌ Mismatch: expected {order_id}, got {active_delivery.get('order_id')}")
                    else:
                        print("❌ No active delivery found after acceptance")
                else:
                    print(f"❌ Failed to get active delivery: {response.text}")
            else:
                print(f"❌ Failed to accept order: {response.text}")
        else:
            print("⚠️  No available orders to test with")
    else:
        print(f"❌ Failed to get available orders: {response.text}")
else:
    print(f"❌ Failed to login: {response.status_code}")
    print(response.text)