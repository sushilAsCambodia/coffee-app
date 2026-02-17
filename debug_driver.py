#!/usr/bin/env python3
"""
Debug script for driver flow issues
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
    print(f"✅ Driver logged in: {data['user']['name']}")
    
    # Check active delivery
    print("\n🚗 Checking active delivery...")
    headers = {'Authorization': f'Bearer {driver_token}'}
    response = requests.get(f"{api_url}/driver/active-delivery", headers=headers)
    
    if response.status_code == 200:
        active_delivery = response.json()
        if active_delivery:
            print(f"📦 Active delivery found: {active_delivery['order_id']}")
            print(f"   Status: {active_delivery['status']}")
            print(f"   Driver ID: {active_delivery.get('driver_id')}")
            
            # Complete this delivery first
            order_id = active_delivery['order_id']
            print(f"\n🏁 Completing existing delivery: {order_id}")
            response = requests.post(f"{api_url}/driver/complete/{order_id}", json={}, headers=headers)
            if response.status_code == 200:
                print("✅ Delivery completed")
            else:
                print(f"❌ Failed to complete delivery: {response.status_code}")
                print(response.text)
        else:
            print("ℹ️  No active delivery found")
    else:
        print(f"❌ Failed to get active delivery: {response.status_code}")
        print(response.text)
else:
    print(f"❌ Failed to login: {response.status_code}")
    print(response.text)