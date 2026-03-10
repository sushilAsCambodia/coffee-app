# Cafe Empire — API Documentation

Base URL: `http://localhost:8000/api`

All authenticated endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <token>
```

Tokens are valid for **7 days (168 hours)**. Obtained from login, register, or Google OAuth.

---

## Table of Contents

- [Authentication](#authentication)
- [Categories](#categories)
- [Products](#products)
- [Cart](#cart)
- [Orders](#orders)
- [Payment](#payment)
- [Tracking](#tracking)
- [Admin](#admin)
- [Driver](#driver)
- [WebSocket](#websocket)
- [Error Codes](#error-codes)
- [Seed / Demo Accounts](#seed--demo-accounts)

---

## Authentication

### POST `/auth/register`

Register a new customer or driver account.

**Auth required:** No

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "mypassword",
  "name": "Sophea Keo",
  "phone": "+855 12 345 678",
  "role": "customer"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | Plain text — hashed with bcrypt |
| `name` | string | Yes | Display name |
| `phone` | string | No | Defaults to `""` |
| `role` | string | No | `"customer"` or `"driver"`. Defaults to `"customer"` |

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "user_4f2a1b3c9d8e",
    "email": "user@example.com",
    "name": "Sophea Keo",
    "phone": "+855 12 345 678",
    "role": "customer",
    "picture": "",
    "addresses": [],
    "is_available": false,
    "current_lat": 11.5564,
    "current_lng": 104.9282,
    "created_at": "2026-03-10T08:00:00+00:00"
  }
}
```

**Error `400`:** Email already registered

---

### POST `/auth/login`

Login with email and password.

**Auth required:** No

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "mypassword"
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "user_4f2a1b3c9d8e",
    "email": "user@example.com",
    "name": "Sophea Keo",
    "phone": "+855 12 345 678",
    "role": "customer",
    "picture": "",
    "addresses": []
  }
}
```

**Error `401`:** Invalid email or password

---

### GET `/auth/me`

Get the currently authenticated user's profile.

**Auth required:** Yes (any role)

**Request body:** None

**Response `200`:**
```json
{
  "user_id": "user_4f2a1b3c9d8e",
  "email": "user@example.com",
  "name": "Sophea Keo",
  "phone": "+855 12 345 678",
  "role": "customer",
  "picture": "",
  "addresses": ["#123, Street 240, Phnom Penh"],
  "created_at": "2026-03-10T08:00:00+00:00"
}
```

---

### POST `/auth/google-session`

Exchange a Google OAuth session ID (from EmergentAgent OAuth flow) for a JWT token.

**Auth required:** No

**Request body:**
```json
{
  "session_id": "abc123sessionid"
}
```

**Response `200`:** Same as `/auth/login` response — `token` + `user`

**Error `401`:** Invalid session ID

---

### POST `/auth/logout`

Logout (client-side — just clears local token). Stateless endpoint.

**Auth required:** No

**Response `200`:**
```json
{
  "message": "Logged out successfully"
}
```

---

## Categories

### GET `/categories`

Get all product categories.

**Auth required:** No

**Response `200`:**
```json
[
  {
    "category_id": "cat_hot",
    "name": "Hot Coffee",
    "icon": "cafe",
    "description": "Freshly brewed hot coffee",
    "order": 1
  },
  {
    "category_id": "cat_iced",
    "name": "Iced Coffee",
    "icon": "snow",
    "description": "Refreshing iced beverages",
    "order": 2
  },
  {
    "category_id": "cat_tea",
    "name": "Tea & More",
    "icon": "leaf",
    "description": "Premium teas and specialty drinks",
    "order": 3
  },
  {
    "category_id": "cat_dessert",
    "name": "Desserts",
    "icon": "ice-cream",
    "description": "Sweet treats and pastries",
    "order": 4
  }
]
```

---

## Products

### GET `/products`

Get all products. Supports optional query filters.

**Auth required:** No

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `category_id` | string | Filter by category e.g. `cat_hot` |
| `search` | string | Case-insensitive name search |
| `popular` | boolean | `true` to return popular items only |

**Examples:**
```
GET /api/products
GET /api/products?category_id=cat_iced
GET /api/products?search=latte
GET /api/products?popular=true
```

**Response `200`:**
```json
[
  {
    "product_id": "prod_latte",
    "category_id": "cat_hot",
    "name": "Classic Latte",
    "description": "Smooth espresso with steamed milk and a light foam top.",
    "base_price": 3.50,
    "image": "latte",
    "sizes": [
      { "name": "Small",  "price": 3.50, "label": "S" },
      { "name": "Medium", "price": 4.25, "label": "M" },
      { "name": "Large",  "price": 5.00, "label": "L" }
    ],
    "sugar_levels": ["No Sugar", "Less Sugar", "Normal", "Extra Sweet"],
    "add_ons": [
      { "name": "Extra Shot",     "price": 0.75 },
      { "name": "Whipped Cream",  "price": 0.50 },
      { "name": "Oat Milk",       "price": 0.75 },
      { "name": "Vanilla Syrup",  "price": 0.50 },
      { "name": "Caramel Drizzle","price": 0.50 },
      { "name": "Chocolate Sauce","price": 0.50 }
    ],
    "rating": 4.8,
    "reviews": 234,
    "is_popular": true,
    "prep_time": "5-7 min",
    "created_at": "2026-03-10T08:00:00+00:00"
  }
]
```

---

### GET `/products/{product_id}`

Get a single product by ID.

**Auth required:** No

**Path params:** `product_id` — e.g. `prod_latte`

**Response `200`:** Single product object (same shape as above)

**Error `404`:** Product not found

---

## Cart

### GET `/cart`

Get the current user's cart with enriched product info and calculated totals.

**Auth required:** Yes (customer)

**Response `200`:**
```json
{
  "items": [
    {
      "cart_id": "cart_a1b2c3d4e5f6",
      "user_id": "user_4f2a1b3c9d8e",
      "product_id": "prod_latte",
      "quantity": 2,
      "size": "Medium",
      "sugar_level": "Normal",
      "add_ons": ["Extra Shot"],
      "unit_price": 5.00,
      "total_price": 10.00,
      "created_at": "2026-03-10T08:00:00+00:00",
      "product": { ...full product object... }
    }
  ],
  "total": 10.00,
  "count": 1
}
```

---

### POST `/cart`

Add an item to the cart. Price is computed server-side based on size and add-ons.

**Auth required:** Yes (customer)

**Request body:**
```json
{
  "product_id": "prod_latte",
  "quantity": 2,
  "size": "Medium",
  "sugar_level": "Normal",
  "add_ons": ["Extra Shot", "Oat Milk"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | string | Yes | Must exist in products collection |
| `quantity` | int | No | Defaults to `1` |
| `size` | string | No | Must match a size in product's `sizes`. Defaults to `"Medium"` |
| `sugar_level` | string | No | Defaults to `"Normal"` |
| `add_ons` | array of strings | No | Add-on names from product's `add_ons`. Defaults to `[]` |

**Response `200`:**
```json
{
  "cart_id": "cart_a1b2c3d4e5f6",
  "user_id": "user_4f2a1b3c9d8e",
  "product_id": "prod_latte",
  "quantity": 2,
  "size": "Medium",
  "sugar_level": "Normal",
  "add_ons": ["Extra Shot", "Oat Milk"],
  "unit_price": 6.50,
  "total_price": 13.00,
  "created_at": "2026-03-10T08:00:00+00:00"
}
```

> **Price calculation:** `unit_price = size_price + sum(add_on_prices)`, `total_price = unit_price × quantity`

**Error `404`:** Product not found

---

### PUT `/cart/{cart_id}`

Update the quantity of a cart item. Total price is recalculated.

**Auth required:** Yes (owner only)

**Path params:** `cart_id`

**Request body:**
```json
{
  "quantity": 3
}
```

**Response `200`:**
```json
{
  "message": "Updated",
  "quantity": 3,
  "total_price": 19.50
}
```

**Error `404`:** Cart item not found

---

### DELETE `/cart/{cart_id}`

Remove a single item from the cart.

**Auth required:** Yes (owner only)

**Response `200`:**
```json
{
  "message": "Removed from cart"
}
```

---

### DELETE `/cart`

Clear all items from the current user's cart.

**Auth required:** Yes (customer)

**Response `200`:**
```json
{
  "message": "Cart cleared"
}
```

---

## Orders

### POST `/orders`

Place an order from the current cart. Cart is automatically cleared after order is created.

**Auth required:** Yes (customer)

**Request body:**
```json
{
  "delivery_address": "#123, Street 240, Phnom Penh",
  "delivery_lat": 11.5564,
  "delivery_lng": 104.9282,
  "payment_method": "aba_payway",
  "note": "No ice please"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `delivery_address` | string | Yes | Human-readable address |
| `delivery_lat` | float | No | Defaults to `11.5564` (Phnom Penh) |
| `delivery_lng` | float | No | Defaults to `104.9282` |
| `payment_method` | string | No | Defaults to `"aba_payway"` |
| `note` | string | No | Special instructions for the shop |

**Response `200`:**
```json
{
  "order_id": "ORD-A1B2C3D4",
  "user_id": "user_4f2a1b3c9d8e",
  "user_name": "Sophea Keo",
  "user_phone": "+855 12 345 678",
  "items": [
    {
      "product_id": "prod_latte",
      "product_name": "Classic Latte",
      "product_image": "latte",
      "quantity": 2,
      "size": "Medium",
      "sugar_level": "Normal",
      "add_ons": ["Extra Shot"],
      "unit_price": 5.00,
      "total_price": 10.00
    }
  ],
  "subtotal": 10.00,
  "delivery_fee": 1.50,
  "total": 11.50,
  "status": "pending_payment",
  "payment_status": "pending",
  "payment_method": "aba_payway",
  "delivery_address": "#123, Street 240, Phnom Penh",
  "delivery_lat": 11.5564,
  "delivery_lng": 104.9282,
  "note": "No ice please",
  "driver_id": null,
  "driver": null,
  "shop_lat": 11.5684,
  "shop_lng": 104.9210,
  "estimated_delivery": null,
  "created_at": "2026-03-10T08:00:00+00:00",
  "updated_at": "2026-03-10T08:00:00+00:00"
}
```

**Error `400`:** Cart is empty

---

### GET `/orders`

Get orders for the authenticated user. Admins see all orders.

**Auth required:** Yes (customer sees own orders; admin sees all)

**Response `200`:** Array of order objects (sorted newest first)

---

### GET `/orders/{order_id}`

Get a single order by ID.

**Auth required:** Yes
- Customers: can only access their own orders
- Admin / Driver: can access any order

**Response `200`:** Single order object

**Error `404`:** Order not found

---

### PUT `/orders/{order_id}/status`

Update the status of an order.

**Auth required:** Yes (admin or driver only)

**Request body:**
```json
{
  "status": "preparing"
}
```

**Order status flow:**

```
pending_payment → confirmed → preparing → ready → out_for_delivery → delivered
                                                                   → cancelled
```

| Status | Description | Side effects |
|--------|-------------|-------------|
| `pending_payment` | Initial state after order creation | — |
| `confirmed` | Payment received | Payment must be confirmed via `/payment/confirm` |
| `preparing` | Barista preparing | Sets `estimated_delivery` to +30 min |
| `ready` | Ready for pickup by driver | — |
| `out_for_delivery` | Driver en route | Set when driver accepts order |
| `delivered` | Delivered to customer | Sets `delivered_at` timestamp |
| `cancelled` | Order cancelled | — |

**Response `200`:** Updated order object

**Error `403`:** Access denied (customer attempted)

---

## Payment

### POST `/payment/initiate`

Initiate payment for an order. Returns mock ABA PayWay QR data.

**Auth required:** Yes (customer, must be order owner)

**Request body:**
```json
{
  "order_id": "ORD-A1B2C3D4",
  "method": "qr"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order_id` | string | Yes | Must be the user's own order |
| `method` | string | No | Payment method. Defaults to `"qr"` |

**Response `200`:**
```json
{
  "payment_id": "PAY-E5F6G7H8",
  "aba_tran_id": "ABAF3A2B1C4D5E6F7G",
  "amount": 11.50,
  "currency": "USD",
  "qr_code_data": "aba://pay?merchant=CAFE_EMPIRE&amount=11.5&tran_id=ABAF3A2B1C4D5E6F7G",
  "status": "processing"
}
```

> Use `qr_code_data` to generate a QR code for the user to scan.

---

### POST `/payment/confirm/{payment_id}`

Confirm that payment was completed. Sets order status to `confirmed` and payment status to `paid`.

**Auth required:** Yes (customer)

**Path params:** `payment_id` — from `/payment/initiate` response

**Request body:** None

**Response `200`:**
```json
{
  "status": "completed",
  "order_id": "ORD-A1B2C3D4",
  "message": "Payment confirmed!"
}
```

**Error `404`:** Payment not found

---

## Tracking

### GET `/tracking/{order_id}`

Get real-time tracking info for an order. **Public endpoint** — no auth required (order ID acts as the access key).

**Path params:** `order_id`

**Response `200`:**
```json
{
  "order_id": "ORD-A1B2C3D4",
  "status": "out_for_delivery",
  "steps": [
    { "key": "confirmed",        "label": "Order Confirmed",      "completed": true  },
    { "key": "preparing",        "label": "Preparing Your Order", "completed": true  },
    { "key": "ready",            "label": "Ready for Pickup",     "completed": true  },
    { "key": "out_for_delivery", "label": "Out for Delivery",     "completed": true  },
    { "key": "delivered",        "label": "Delivered",            "completed": false }
  ],
  "driver": {
    "name": "Sokha Chhun",
    "phone": "+855 12 111 001",
    "vehicle": "Honda PCX 160",
    "plate": "PP-2847",
    "lat": 11.5570,
    "lng": 104.9285,
    "picture": ""
  },
  "estimated_delivery": "2026-03-10T08:30:00+00:00",
  "delivery_address": "#123, Street 240, Phnom Penh",
  "delivery_lat": 11.5564,
  "delivery_lng": 104.9282,
  "shop_lat": 11.5684,
  "shop_lng": 104.9210,
  "total": 11.50,
  "items": [ ...order items... ]
}
```

> `driver` is `null` if no driver has been assigned yet.

---

## Admin

> All admin endpoints require `role: "admin"`. Returns `403` otherwise.

### GET `/admin/dashboard`

Get high-level stats for the admin dashboard.

**Auth required:** Yes (admin)

**Response `200`:**
```json
{
  "total_orders": 152,
  "total_users": 48,
  "total_products": 14,
  "total_drivers": 3,
  "total_revenue": 1842.75,
  "pending_orders": 5,
  "active_deliveries": 2,
  "recent_orders": [ ...last 20 orders... ],
  "status_counts": {
    "pending_payment": 3,
    "confirmed": 2,
    "preparing": 1,
    "ready": 2,
    "out_for_delivery": 2,
    "delivered": 140,
    "cancelled": 2
  }
}
```

---

### GET `/admin/orders`

Get all orders, optionally filtered by status.

**Auth required:** Yes (admin)

**Query parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by order status (e.g. `preparing`, `out_for_delivery`) |

**Response `200`:** Array of order objects (sorted newest first)

---

### POST `/admin/products`

Create a new product.

**Auth required:** Yes (admin)

**Request body:**
```json
{
  "name": "Espresso",
  "description": "Pure concentrated espresso shot.",
  "category_id": "cat_hot",
  "base_price": 2.50,
  "image": "espresso",
  "sizes": [
    { "name": "Single", "price": 2.50, "label": "S" },
    { "name": "Double", "price": 3.50, "label": "D" }
  ],
  "sugar_levels": ["No Sugar", "Less Sugar", "Normal", "Extra Sweet"],
  "add_ons": [
    { "name": "Extra Shot",    "price": 0.75 },
    { "name": "Vanilla Syrup", "price": 0.50 }
  ],
  "rating": 4.5,
  "reviews": 0,
  "is_popular": false,
  "prep_time": "3-4 min"
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `name` | string | Yes | — |
| `description` | string | Yes | — |
| `category_id` | string | Yes | — |
| `base_price` | float | Yes | — |
| `image` | string | No | `"latte"` |
| `sizes` | array of `{name, price, label}` | No | `[]` |
| `sugar_levels` | array of strings | No | `["No Sugar","Less Sugar","Normal","Extra Sweet"]` |
| `add_ons` | array of `{name, price}` | No | `[]` |
| `rating` | float | No | `4.5` |
| `reviews` | int | No | `0` |
| `is_popular` | bool | No | `false` |
| `prep_time` | string | No | `"5-7 min"` |

**Response `200`:** Created product object including `product_id` and `created_at`

---

### PUT `/admin/products/{product_id}`

Update an existing product. Only include fields you want to change.

**Auth required:** Yes (admin)

**Request body (all fields optional):**
```json
{
  "name": "Espresso Doppio",
  "base_price": 3.00,
  "is_popular": true
}
```

**Response `200`:** Updated product object

**Error `404`:** Product not found
**Error `400`:** No fields to update

---

### DELETE `/admin/products/{product_id}`

Delete a product.

**Auth required:** Yes (admin)

**Response `200`:**
```json
{
  "message": "Product deleted"
}
```

**Error `404`:** Product not found

---

### GET `/admin/drivers`

Get all drivers with their delivery stats.

**Auth required:** Yes (admin)

**Response `200`:**
```json
[
  {
    "user_id": "driver_001",
    "name": "Sokha Chhun",
    "email": "driver1@cafeempire.com",
    "phone": "+855 12 111 001",
    "role": "driver",
    "vehicle": "Honda PCX 160",
    "plate": "PP-2847",
    "is_available": true,
    "current_lat": 11.5570,
    "current_lng": 104.9285,
    "active_orders": 1,
    "total_deliveries": 42,
    "created_at": "2026-03-10T08:00:00+00:00"
  }
]
```

---

### POST `/admin/drivers`

Create a new driver account.

**Auth required:** Yes (admin)

**Request body:**
```json
{
  "name": "Makara Pich",
  "email": "makara@cafeempire.com",
  "password": "driver123",
  "phone": "+855 12 222 333",
  "vehicle": "Honda PCX 160",
  "plate": "PP-9999"
}
```

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `name` | string | Yes | — |
| `email` | string | Yes | Must be unique |
| `password` | string | Yes | — |
| `phone` | string | Yes | — |
| `vehicle` | string | No | `"Honda PCX"` |
| `plate` | string | No | `""` |

**Response `200`:** Created driver object (no `password_hash`)

**Error `400`:** Email already exists

---

### DELETE `/admin/drivers/{driver_id}`

Delete a driver account.

**Auth required:** Yes (admin)

**Response `200`:**
```json
{
  "message": "Driver deleted"
}
```

**Error `404`:** Driver not found

---

## Driver

> All driver endpoints require `role: "driver"`. Returns `403` otherwise.

### GET `/driver/available-orders`

Get orders that are available for a driver to accept (confirmed, preparing, or ready, with no driver assigned).

**Auth required:** Yes (driver)

**Response `200`:** Array of order objects

---

### POST `/driver/accept/{order_id}`

Accept an order for delivery. Sets order status to `out_for_delivery` and marks the driver as unavailable.

**Auth required:** Yes (driver)

**Path params:** `order_id`

**Request body:** None

**Response `200`:** Updated order object with driver info embedded:
```json
{
  "order_id": "ORD-A1B2C3D4",
  "status": "out_for_delivery",
  "driver_id": "driver_001",
  "driver": {
    "name": "Sokha Chhun",
    "phone": "+855 12 111 001",
    "vehicle": "Honda PCX 160",
    "plate": "PP-2847",
    "lat": 11.5570,
    "lng": 104.9285,
    "picture": ""
  },
  "estimated_delivery": "2026-03-10T08:25:00+00:00",
  ...
}
```

**Error `404`:** Order not available (already taken or doesn't exist)

---

### GET `/driver/active-delivery`

Get the driver's currently active delivery (status `out_for_delivery`).

**Auth required:** Yes (driver)

**Response `200`:** Order object or `null` if no active delivery

---

### PUT `/driver/location`

Update the driver's current GPS location. Also updates the embedded driver location on active orders.

**Auth required:** Yes (driver)

**Request body:**
```json
{
  "lat": 11.5570,
  "lng": 104.9291
}
```

**Response `200`:**
```json
{
  "message": "Location updated"
}
```

---

### POST `/driver/complete/{order_id}`

Mark an order as delivered. Sets driver back to available.

**Auth required:** Yes (driver, must own the delivery)

**Path params:** `order_id`

**Request body:** None

**Response `200`:**
```json
{
  "message": "Order delivered!",
  "order_id": "ORD-A1B2C3D4"
}
```

**Error `404`:** Order not found or driver mismatch

---

### GET `/driver/history`

Get the driver's completed delivery history.

**Auth required:** Yes (driver)

**Response `200`:** Array of delivered order objects (sorted by `delivered_at` descending)

---

## WebSocket

### WS `/ws/tracking/{order_id}`

Connect to real-time order tracking updates.

**URL:** `ws://localhost:8000/ws/tracking/{order_id}`

**Auth required:** No

**Usage:**
```javascript
const ws = new WebSocket(`ws://localhost:8000/ws/tracking/ORD-A1B2C3D4`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data contains updated tracking info
};
```

The server broadcasts JSON messages to all clients subscribed to a given `order_id` when relevant updates occur.

---

## Error Codes

| HTTP Status | Meaning |
|-------------|---------|
| `400` | Bad request — missing or invalid input |
| `401` | Unauthorized — missing, invalid, or expired token |
| `403` | Forbidden — insufficient role permissions |
| `404` | Resource not found |
| `422` | Validation error — invalid field types/formats |
| `500` | Internal server error |

**Error response shape:**
```json
{
  "detail": "Human-readable error message"
}
```

---

## Seed / Demo Accounts

The database is automatically seeded on first startup with the following accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@cafeempire.com` | `admin123` |
| Customer | `demo@cafeempire.com` | `demo123` |
| Driver 1 | `driver1@cafeempire.com` | `driver123` |
| Driver 2 | `driver2@cafeempire.com` | `driver123` |
| Driver 3 | `driver3@cafeempire.com` | `driver123` |

**Seeded categories:** Hot Coffee, Iced Coffee, Tea & More, Desserts

**Seeded products (14 total):**

| Product ID | Name | Category | Base Price |
|------------|------|----------|------------|
| `prod_latte` | Classic Latte | Hot Coffee | $3.50 |
| `prod_cappuccino` | Cappuccino | Hot Coffee | $3.50 |
| `prod_americano` | Americano | Hot Coffee | $2.75 |
| `prod_mocha` | Cafe Mocha | Hot Coffee | $4.25 |
| `prod_flatwhite` | Flat White | Hot Coffee | $3.75 |
| `prod_iced_latte` | Iced Latte | Iced Coffee | $4.00 |
| `prod_cold_brew` | Cold Brew | Iced Coffee | $4.50 |
| `prod_frappe` | Caramel Frappe | Iced Coffee | $5.00 |
| `prod_matcha` | Matcha Latte | Tea & More | $4.50 |
| `prod_chai` | Chai Latte | Tea & More | $3.75 |
| `prod_hotchoc` | Hot Chocolate | Tea & More | $3.50 |
| `prod_tiramisu` | Tiramisu | Desserts | $5.50 |
| `prod_croissant` | Butter Croissant | Desserts | $3.25 |
| `prod_cheesecake` | NY Cheesecake | Desserts | $6.00 |

**Delivery fee:** $1.50 flat on all orders

**Shop location:** lat `11.5684`, lng `104.9210` (Phnom Penh)
