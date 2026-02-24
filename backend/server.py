from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
import asyncio
import httpx
import random
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET = os.environ.get("JWT_SECRET") or "cafe-empire-secret-key-2026-secure"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 168

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============
class UserRegister(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = ""
    role: Optional[str] = "customer"

class UserLogin(BaseModel):
    email: str
    password: str

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1
    size: str = "Medium"
    sugar_level: str = "Normal"
    add_ons: List[str] = []

class CartItemUpdate(BaseModel):
    quantity: int

class OrderCreate(BaseModel):
    delivery_address: str
    delivery_lat: float = 11.5564
    delivery_lng: float = 104.9282
    payment_method: str = "aba_payway"
    note: Optional[str] = ""

class OrderStatusUpdate(BaseModel):
    status: str

class PaymentInitiate(BaseModel):
    order_id: str
    method: str = "qr"

class GoogleSessionRequest(BaseModel):
    session_id: str

class ProductCreate(BaseModel):
    name: str
    description: str
    category_id: str
    base_price: float
    image: str = "latte"
    sizes: List[dict] = []
    sugar_levels: List[str] = ["No Sugar", "Less Sugar", "Normal", "Extra Sweet"]
    add_ons: List[dict] = []
    rating: float = 4.5
    reviews: int = 0
    is_popular: bool = False
    prep_time: str = "5-7 min"

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None
    base_price: Optional[float] = None
    image: Optional[str] = None
    sizes: Optional[List[dict]] = None
    sugar_levels: Optional[List[str]] = None
    add_ons: Optional[List[dict]] = None
    is_popular: Optional[bool] = None
    prep_time: Optional[str] = None

class DriverLocationUpdate(BaseModel):
    lat: float
    lng: float

class DriverCreate(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    vehicle: str = "Honda PCX"
    plate: str = ""

# ============ AUTH HELPERS ============
def create_token(user_id: str, role: str = "customer") -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRY_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth_header.split(" ")[1]
    payload = verify_token(token)
    user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def require_role(role: str):
    async def check(request: Request):
        user = await get_current_user(request)
        if user.get("role") != role and user.get("role") != "admin":
            raise HTTPException(status_code=403, detail=f"{role} access required")
        return user
    return check

# ============ AUTH ENDPOINTS ============
@api_router.post("/auth/register")
async def register(data: UserRegister):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    role = data.role if data.role in ["customer", "driver"] else "customer"
    user_doc = {
        "user_id": user_id,
        "email": data.email,
        "name": data.name,
        "phone": data.phone or "",
        "password_hash": pwd_context.hash(data.password),
        "role": role,
        "picture": "",
        "addresses": [],
        "vehicle": "",
        "plate": "",
        "is_available": True if role == "driver" else False,
        "current_lat": 11.5564,
        "current_lng": 104.9282,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, role)
    return {"token": token, "user": {k: v for k, v in user_doc.items() if k not in ["password_hash", "_id"]}}

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not pwd_context.verify(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["user_id"], user.get("role", "customer"))
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return {"token": token, "user": safe_user}

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    return safe_user

@api_router.post("/auth/google-session")
async def google_session(data: GoogleSessionRequest):
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    google_data = resp.json()
    existing = await db.users.find_one({"email": google_data["email"]}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"user_id": user_id}, {"$set": {"name": google_data["name"], "picture": google_data.get("picture", "")}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id, "email": google_data["email"], "name": google_data["name"],
            "phone": "", "password_hash": "", "role": "customer", "picture": google_data.get("picture", ""),
            "addresses": [], "created_at": datetime.now(timezone.utc).isoformat()
        })
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    token = create_token(user_id, user.get("role", "customer"))
    return {"token": token, "user": {k: v for k, v in user.items() if k != "password_hash"}}

@api_router.post("/auth/logout")
async def logout():
    return {"message": "Logged out successfully"}

# ============ CATEGORIES ============
@api_router.get("/categories")
async def get_categories():
    return await db.categories.find({}, {"_id": 0}).to_list(100)

# ============ PRODUCTS ============
@api_router.get("/products")
async def get_products(category_id: Optional[str] = None, search: Optional[str] = None, popular: Optional[bool] = None):
    query = {}
    if category_id: query["category_id"] = category_id
    if search: query["name"] = {"$regex": search, "$options": "i"}
    if popular: query["is_popular"] = True
    return await db.products.find(query, {"_id": 0}).to_list(100)

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    return product

# ============ CART ============
@api_router.get("/cart")
async def get_cart(request: Request):
    user = await get_current_user(request)
    items = await db.cart.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    # Batch fetch products to avoid N+1 queries
    product_ids = [item["product_id"] for item in items]
    products = await db.products.find({"product_id": {"$in": product_ids}}, {"_id": 0}).to_list(100)
    product_map = {p["product_id"]: p for p in products}
    enriched = []
    for item in items:
        product = product_map.get(item["product_id"])
        if product: item["product"] = product
        enriched.append(item)
    total = sum(i.get("total_price", 0) for i in enriched)
    return {"items": enriched, "total": round(total, 2), "count": len(enriched)}

@api_router.post("/cart")
async def add_to_cart(data: CartItemAdd, request: Request):
    user = await get_current_user(request)
    product = await db.products.find_one({"product_id": data.product_id}, {"_id": 0})
    if not product: raise HTTPException(status_code=404, detail="Product not found")
    size_prices = {s["name"]: s["price"] for s in product.get("sizes", [])}
    base_price = size_prices.get(data.size, product.get("base_price", 0))
    addon_prices = {a["name"]: a["price"] for a in product.get("add_ons", [])}
    addon_total = sum(addon_prices.get(a, 0) for a in data.add_ons)
    unit_price = round(base_price + addon_total, 2)
    total_price = round(unit_price * data.quantity, 2)
    cart_item = {
        "cart_id": f"cart_{uuid.uuid4().hex[:12]}", "user_id": user["user_id"],
        "product_id": data.product_id, "quantity": data.quantity, "size": data.size,
        "sugar_level": data.sugar_level, "add_ons": data.add_ons,
        "unit_price": unit_price, "total_price": total_price,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.cart.insert_one(cart_item)
    return {k: v for k, v in cart_item.items() if k != "_id"}

@api_router.put("/cart/{cart_id}")
async def update_cart_item(cart_id: str, data: CartItemUpdate, request: Request):
    user = await get_current_user(request)
    item = await db.cart.find_one({"cart_id": cart_id, "user_id": user["user_id"]}, {"_id": 0})
    if not item: raise HTTPException(status_code=404, detail="Cart item not found")
    new_total = round(item["unit_price"] * data.quantity, 2)
    await db.cart.update_one({"cart_id": cart_id}, {"$set": {"quantity": data.quantity, "total_price": new_total}})
    return {"message": "Updated", "quantity": data.quantity, "total_price": new_total}

@api_router.delete("/cart/{cart_id}")
async def delete_cart_item(cart_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.cart.delete_one({"cart_id": cart_id, "user_id": user["user_id"]})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Cart item not found")
    return {"message": "Removed from cart"}

@api_router.delete("/cart")
async def clear_cart(request: Request):
    user = await get_current_user(request)
    await db.cart.delete_many({"user_id": user["user_id"]})
    return {"message": "Cart cleared"}

# ============ ORDERS ============
@api_router.post("/orders")
async def create_order(data: OrderCreate, request: Request):
    user = await get_current_user(request)
    cart_items = await db.cart.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    if not cart_items: raise HTTPException(status_code=400, detail="Cart is empty")
    # Batch fetch products to avoid N+1 queries
    product_ids = [ci["product_id"] for ci in cart_items]
    products = await db.products.find({"product_id": {"$in": product_ids}}, {"_id": 0}).to_list(100)
    product_map = {p["product_id"]: p for p in products}
    order_items = []
    for ci in cart_items:
        product = product_map.get(ci["product_id"])
        order_items.append({
            "product_id": ci["product_id"], "product_name": product["name"] if product else "Unknown",
            "product_image": product.get("image", "") if product else "",
            "quantity": ci["quantity"], "size": ci["size"], "sugar_level": ci["sugar_level"],
            "add_ons": ci["add_ons"], "unit_price": ci["unit_price"], "total_price": ci["total_price"]
        })
    subtotal = round(sum(i["total_price"] for i in order_items), 2)
    delivery_fee = 1.50
    total = round(subtotal + delivery_fee, 2)
    order = {
        "order_id": f"ORD-{uuid.uuid4().hex[:8].upper()}", "user_id": user["user_id"],
        "user_name": user.get("name", ""), "user_phone": user.get("phone", ""),
        "items": order_items, "subtotal": subtotal, "delivery_fee": delivery_fee, "total": total,
        "status": "pending_payment", "payment_status": "pending", "payment_method": data.payment_method,
        "delivery_address": data.delivery_address, "delivery_lat": data.delivery_lat, "delivery_lng": data.delivery_lng,
        "note": data.note or "", "driver_id": None, "driver": None,
        "shop_lat": 11.5684, "shop_lng": 104.9210,
        "estimated_delivery": None, "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order)
    await db.cart.delete_many({"user_id": user["user_id"]})
    return {k: v for k, v in order.items() if k != "_id"}

@api_router.get("/orders")
async def get_orders(request: Request):
    user = await get_current_user(request)
    query = {"user_id": user["user_id"]} if user.get("role") != "admin" else {}
    return await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    query = {"order_id": order_id}
    if user.get("role") not in ["admin", "driver"]: query["user_id"] = user["user_id"]
    order = await db.orders.find_one(query, {"_id": 0})
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, request: Request):
    user = await get_current_user(request)
    if user.get("role") not in ["admin", "driver"]:
        raise HTTPException(status_code=403, detail="Access denied")
    update_data = {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if data.status == "preparing":
        update_data["estimated_delivery"] = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    elif data.status == "delivered":
        update_data["delivered_at"] = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one({"order_id": order_id}, {"$set": update_data})
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    return order

# ============ PAYMENT (MOCK ABA PAYWAY) ============
@api_router.post("/payment/initiate")
async def initiate_payment(data: PaymentInitiate, request: Request):
    user = await get_current_user(request)
    order = await db.orders.find_one({"order_id": data.order_id, "user_id": user["user_id"]}, {"_id": 0})
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    payment = {
        "payment_id": f"PAY-{uuid.uuid4().hex[:8].upper()}", "order_id": data.order_id,
        "user_id": user["user_id"], "amount": order["total"], "currency": "USD",
        "method": data.method, "status": "processing",
        "aba_tran_id": f"ABA{uuid.uuid4().hex[:10].upper()}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment)
    return {
        "payment_id": payment["payment_id"], "aba_tran_id": payment["aba_tran_id"],
        "amount": order["total"], "currency": "USD",
        "qr_code_data": f"aba://pay?merchant=CAFE_EMPIRE&amount={order['total']}&tran_id={payment['aba_tran_id']}",
        "status": "processing"
    }

@api_router.post("/payment/confirm/{payment_id}")
async def confirm_payment(payment_id: str, request: Request):
    user = await get_current_user(request)
    payment = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not payment: raise HTTPException(status_code=404, detail="Payment not found")
    await db.payments.update_one({"payment_id": payment_id}, {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}})
    await db.orders.update_one({"order_id": payment["order_id"]}, {"$set": {"payment_status": "paid", "status": "confirmed", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"status": "completed", "order_id": payment["order_id"], "message": "Payment confirmed!"}

# ============ TRACKING ============
# Public endpoint - order_id acts as auth token (like Grab/Foodpanda tracking links)
@api_router.get("/tracking/{order_id}")
async def get_tracking(order_id: str):
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    if not order: raise HTTPException(status_code=404, detail="Order not found")
    status = order.get("status", "confirmed")
    driver = order.get("driver")
    # If driver assigned, get latest driver location
    if order.get("driver_id"):
        driver_user = await db.users.find_one({"user_id": order["driver_id"]}, {"_id": 0})
        if driver_user:
            driver = {
                "name": driver_user.get("name", "Driver"),
                "phone": driver_user.get("phone", ""),
                "vehicle": driver_user.get("vehicle", "Motorcycle"),
                "plate": driver_user.get("plate", ""),
                "lat": driver_user.get("current_lat", 11.5564),
                "lng": driver_user.get("current_lng", 104.9282),
                "picture": driver_user.get("picture", "")
            }
    steps = [
        {"key": "confirmed", "label": "Order Confirmed", "completed": status in ["confirmed", "preparing", "ready", "out_for_delivery", "delivered"]},
        {"key": "preparing", "label": "Preparing Your Order", "completed": status in ["preparing", "ready", "out_for_delivery", "delivered"]},
        {"key": "ready", "label": "Ready for Pickup", "completed": status in ["ready", "out_for_delivery", "delivered"]},
        {"key": "out_for_delivery", "label": "Out for Delivery", "completed": status in ["out_for_delivery", "delivered"]},
        {"key": "delivered", "label": "Delivered", "completed": status == "delivered"},
    ]
    return {
        "order_id": order_id, "status": status, "steps": steps, "driver": driver,
        "estimated_delivery": order.get("estimated_delivery"),
        "delivery_address": order.get("delivery_address", ""),
        "delivery_lat": order.get("delivery_lat", 11.5564), "delivery_lng": order.get("delivery_lng", 104.9282),
        "shop_lat": order.get("shop_lat", 11.5684), "shop_lng": order.get("shop_lng", 104.9210),
        "total": order.get("total", 0), "items": order.get("items", [])
    }

# ============ ADMIN ENDPOINTS ============
@api_router.get("/admin/dashboard")
async def admin_dashboard(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin only")
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"role": "customer"})
    total_products = await db.products.count_documents({})
    total_drivers = await db.users.count_documents({"role": "driver"})
    pipeline = [{"$match": {"payment_status": "paid"}}, {"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    rev = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = rev[0]["total"] if rev else 0
    pending_orders = await db.orders.count_documents({"status": {"$in": ["confirmed", "preparing", "ready"]}})
    active_deliveries = await db.orders.count_documents({"status": "out_for_delivery"})
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(20)
    status_counts = {}
    for s in ["pending_payment", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]:
        status_counts[s] = await db.orders.count_documents({"status": s})
    return {
        "total_orders": total_orders, "total_users": total_users, "total_products": total_products,
        "total_drivers": total_drivers, "total_revenue": round(total_revenue, 2),
        "pending_orders": pending_orders, "active_deliveries": active_deliveries,
        "recent_orders": recent_orders, "status_counts": status_counts
    }

@api_router.get("/admin/orders")
async def admin_orders(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin only")
    query = {}
    if status: query["status"] = status
    return await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)

@api_router.post("/admin/products")
async def create_product(data: ProductCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin only")
    product_id = f"prod_{uuid.uuid4().hex[:8]}"
    product = {
        "product_id": product_id, **data.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.insert_one(product)
    return {k: v for k, v in product.items() if k != "_id"}

@api_router.put("/admin/products/{product_id}")
async def update_product(product_id: str, data: ProductUpdate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin only")
    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields: raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.products.update_one({"product_id": product_id}, {"$set": update_fields})
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return product

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin only")
    result = await db.products.delete_one({"product_id": product_id})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

@api_router.get("/admin/drivers")
async def get_drivers(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin only")
    drivers = await db.users.find({"role": "driver"}, {"_id": 0, "password_hash": 0}).to_list(100)
    for d in drivers:
        d["active_orders"] = await db.orders.count_documents({"driver_id": d["user_id"], "status": "out_for_delivery"})
        d["total_deliveries"] = await db.orders.count_documents({"driver_id": d["user_id"], "status": "delivered"})
    return drivers

@api_router.post("/admin/drivers")
async def create_driver(data: DriverCreate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin only")
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing: raise HTTPException(status_code=400, detail="Email already exists")
    driver_id = f"driver_{uuid.uuid4().hex[:8]}"
    driver_doc = {
        "user_id": driver_id, "email": data.email, "name": data.name, "phone": data.phone,
        "password_hash": pwd_context.hash(data.password), "role": "driver",
        "picture": "", "vehicle": data.vehicle, "plate": data.plate,
        "is_available": True, "current_lat": 11.5564, "current_lng": 104.9282,
        "addresses": [], "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(driver_doc)
    return {k: v for k, v in driver_doc.items() if k not in ["password_hash", "_id"]}

@api_router.delete("/admin/drivers/{driver_id}")
async def delete_driver(driver_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin only")
    result = await db.users.delete_one({"user_id": driver_id, "role": "driver"})
    if result.deleted_count == 0: raise HTTPException(status_code=404, detail="Driver not found")
    return {"message": "Driver deleted"}

# ============ DRIVER ENDPOINTS ============
@api_router.get("/driver/available-orders")
async def driver_available_orders(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "driver": raise HTTPException(status_code=403, detail="Driver only")
    orders = await db.orders.find(
        {"status": {"$in": ["confirmed", "preparing", "ready"]}, "driver_id": None}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return orders

@api_router.post("/driver/accept/{order_id}")
async def driver_accept_order(order_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "driver": raise HTTPException(status_code=403, detail="Driver only")
    order = await db.orders.find_one({"order_id": order_id, "driver_id": None}, {"_id": 0})
    if not order: raise HTTPException(status_code=404, detail="Order not available")
    driver_info = {
        "name": user.get("name", "Driver"), "phone": user.get("phone", ""),
        "vehicle": user.get("vehicle", "Motorcycle"), "plate": user.get("plate", ""),
        "lat": user.get("current_lat", 11.5564), "lng": user.get("current_lng", 104.9282),
        "picture": user.get("picture", "")
    }
    await db.orders.update_one({"order_id": order_id}, {"$set": {
        "driver_id": user["user_id"], "driver": driver_info, "status": "out_for_delivery",
        "estimated_delivery": (datetime.now(timezone.utc) + timedelta(minutes=25)).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }})
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_available": False}})
    order = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    return order

@api_router.get("/driver/active-delivery")
async def driver_active_delivery(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "driver": raise HTTPException(status_code=403, detail="Driver only")
    order = await db.orders.find_one(
        {"driver_id": user["user_id"], "status": "out_for_delivery"}, {"_id": 0}
    )
    return order

@api_router.put("/driver/location")
async def update_driver_location(data: DriverLocationUpdate, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "driver": raise HTTPException(status_code=403, detail="Driver only")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"current_lat": data.lat, "current_lng": data.lng}})
    # Also update driver location in active orders
    await db.orders.update_many(
        {"driver_id": user["user_id"], "status": "out_for_delivery"},
        {"$set": {"driver.lat": data.lat, "driver.lng": data.lng}}
    )
    return {"message": "Location updated"}

@api_router.post("/driver/complete/{order_id}")
async def driver_complete_order(order_id: str, request: Request):
    user = await get_current_user(request)
    if user.get("role") != "driver": raise HTTPException(status_code=403, detail="Driver only")
    result = await db.orders.update_one(
        {"order_id": order_id, "driver_id": user["user_id"]},
        {"$set": {"status": "delivered", "delivered_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0: raise HTTPException(status_code=404, detail="Order not found")
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"is_available": True}})
    return {"message": "Order delivered!", "order_id": order_id}

@api_router.get("/driver/history")
async def driver_history(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "driver": raise HTTPException(status_code=403, detail="Driver only")
    return await db.orders.find(
        {"driver_id": user["user_id"], "status": "delivered"}, {"_id": 0}
    ).sort("delivered_at", -1).to_list(100)

# ============ SEED DATA ============
async def seed_data():
    cat_count = await db.categories.count_documents({})
    if cat_count > 0:
        logger.info("Data already seeded")
        return
    logger.info("Seeding database...")
    categories = [
        {"category_id": "cat_hot", "name": "Hot Coffee", "icon": "cafe", "description": "Freshly brewed hot coffee", "order": 1},
        {"category_id": "cat_iced", "name": "Iced Coffee", "icon": "snow", "description": "Refreshing iced beverages", "order": 2},
        {"category_id": "cat_tea", "name": "Tea & More", "icon": "leaf", "description": "Premium teas and specialty drinks", "order": 3},
        {"category_id": "cat_dessert", "name": "Desserts", "icon": "ice-cream", "description": "Sweet treats and pastries", "order": 4},
    ]
    sugar_levels = ["No Sugar", "Less Sugar", "Normal", "Extra Sweet"]
    add_ons = [
        {"name": "Extra Shot", "price": 0.75}, {"name": "Whipped Cream", "price": 0.50},
        {"name": "Oat Milk", "price": 0.75}, {"name": "Vanilla Syrup", "price": 0.50},
        {"name": "Caramel Drizzle", "price": 0.50}, {"name": "Chocolate Sauce", "price": 0.50},
    ]
    products = [
        {"product_id": "prod_latte", "category_id": "cat_hot", "name": "Classic Latte", "description": "Smooth espresso with steamed milk and a light foam top.", "base_price": 3.50, "image": "latte", "sizes": [{"name": "Small", "price": 3.50, "label": "S"}, {"name": "Medium", "price": 4.25, "label": "M"}, {"name": "Large", "price": 5.00, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.8, "reviews": 234, "is_popular": True, "prep_time": "5-7 min"},
        {"product_id": "prod_cappuccino", "category_id": "cat_hot", "name": "Cappuccino", "description": "Equal parts espresso, steamed milk, and thick foam.", "base_price": 3.50, "image": "cappuccino", "sizes": [{"name": "Small", "price": 3.50, "label": "S"}, {"name": "Medium", "price": 4.25, "label": "M"}, {"name": "Large", "price": 5.00, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.7, "reviews": 189, "is_popular": True, "prep_time": "5-7 min"},
        {"product_id": "prod_americano", "category_id": "cat_hot", "name": "Americano", "description": "Bold espresso shots with hot water. Simple and strong.", "base_price": 2.75, "image": "americano", "sizes": [{"name": "Small", "price": 2.75, "label": "S"}, {"name": "Medium", "price": 3.50, "label": "M"}, {"name": "Large", "price": 4.25, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.6, "reviews": 156, "is_popular": False, "prep_time": "3-5 min"},
        {"product_id": "prod_mocha", "category_id": "cat_hot", "name": "Cafe Mocha", "description": "Rich chocolate meets bold espresso, topped with cream.", "base_price": 4.25, "image": "mocha", "sizes": [{"name": "Small", "price": 4.25, "label": "S"}, {"name": "Medium", "price": 5.00, "label": "M"}, {"name": "Large", "price": 5.75, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.9, "reviews": 312, "is_popular": True, "prep_time": "5-8 min"},
        {"product_id": "prod_flatwhite", "category_id": "cat_hot", "name": "Flat White", "description": "Velvety microfoam over a double ristretto.", "base_price": 3.75, "image": "flatwhite", "sizes": [{"name": "Small", "price": 3.75, "label": "S"}, {"name": "Medium", "price": 4.50, "label": "M"}, {"name": "Large", "price": 5.25, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.7, "reviews": 98, "is_popular": False, "prep_time": "4-6 min"},
        {"product_id": "prod_iced_latte", "category_id": "cat_iced", "name": "Iced Latte", "description": "Chilled espresso with cold milk over ice.", "base_price": 4.00, "image": "iced_latte", "sizes": [{"name": "Small", "price": 4.00, "label": "S"}, {"name": "Medium", "price": 4.75, "label": "M"}, {"name": "Large", "price": 5.50, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.8, "reviews": 267, "is_popular": True, "prep_time": "3-5 min"},
        {"product_id": "prod_cold_brew", "category_id": "cat_iced", "name": "Cold Brew", "description": "Slow-steeped for 20 hours. Smooth and refreshing.", "base_price": 4.50, "image": "cold_brew", "sizes": [{"name": "Small", "price": 4.50, "label": "S"}, {"name": "Medium", "price": 5.25, "label": "M"}, {"name": "Large", "price": 6.00, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.9, "reviews": 198, "is_popular": True, "prep_time": "2-3 min"},
        {"product_id": "prod_frappe", "category_id": "cat_iced", "name": "Caramel Frappe", "description": "Blended ice, espresso, milk, and caramel.", "base_price": 5.00, "image": "frappe", "sizes": [{"name": "Small", "price": 5.00, "label": "S"}, {"name": "Medium", "price": 5.75, "label": "M"}, {"name": "Large", "price": 6.50, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.7, "reviews": 145, "is_popular": False, "prep_time": "5-7 min"},
        {"product_id": "prod_matcha", "category_id": "cat_tea", "name": "Matcha Latte", "description": "Ceremonial grade matcha whisked with steamed milk.", "base_price": 4.50, "image": "matcha", "sizes": [{"name": "Small", "price": 4.50, "label": "S"}, {"name": "Medium", "price": 5.25, "label": "M"}, {"name": "Large", "price": 6.00, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.6, "reviews": 134, "is_popular": True, "prep_time": "4-6 min"},
        {"product_id": "prod_chai", "category_id": "cat_tea", "name": "Chai Latte", "description": "Spiced black tea with steamed milk.", "base_price": 3.75, "image": "chai", "sizes": [{"name": "Small", "price": 3.75, "label": "S"}, {"name": "Medium", "price": 4.50, "label": "M"}, {"name": "Large", "price": 5.25, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.5, "reviews": 87, "is_popular": False, "prep_time": "5-7 min"},
        {"product_id": "prod_hotchoc", "category_id": "cat_tea", "name": "Hot Chocolate", "description": "Rich Belgian chocolate melted into steamed milk.", "base_price": 3.50, "image": "hotchoc", "sizes": [{"name": "Small", "price": 3.50, "label": "S"}, {"name": "Medium", "price": 4.25, "label": "M"}, {"name": "Large", "price": 5.00, "label": "L"}], "sugar_levels": sugar_levels, "add_ons": add_ons, "rating": 4.8, "reviews": 201, "is_popular": False, "prep_time": "4-6 min"},
        {"product_id": "prod_tiramisu", "category_id": "cat_dessert", "name": "Tiramisu", "description": "Layers of espresso-soaked ladyfingers with mascarpone.", "base_price": 5.50, "image": "tiramisu", "sizes": [{"name": "Regular", "price": 5.50, "label": "Reg"}, {"name": "Large", "price": 8.00, "label": "L"}], "sugar_levels": ["Normal"], "add_ons": [], "rating": 4.9, "reviews": 167, "is_popular": True, "prep_time": "2 min"},
        {"product_id": "prod_croissant", "category_id": "cat_dessert", "name": "Butter Croissant", "description": "Flaky, buttery layers baked golden.", "base_price": 3.25, "image": "croissant", "sizes": [{"name": "Regular", "price": 3.25, "label": "Reg"}], "sugar_levels": ["Normal"], "add_ons": [{"name": "Nutella Fill", "price": 1.00}, {"name": "Almond Cream", "price": 1.00}], "rating": 4.7, "reviews": 123, "is_popular": False, "prep_time": "3 min"},
        {"product_id": "prod_cheesecake", "category_id": "cat_dessert", "name": "NY Cheesecake", "description": "Creamy New York style cheesecake with berry compote.", "base_price": 6.00, "image": "cheesecake", "sizes": [{"name": "Slice", "price": 6.00, "label": "Slice"}, {"name": "Whole", "price": 28.00, "label": "Whole"}], "sugar_levels": ["Normal"], "add_ons": [], "rating": 4.8, "reviews": 89, "is_popular": False, "prep_time": "2 min"},
    ]
    await db.categories.insert_many(categories)
    await db.products.insert_many(products)
    # Admin
    await db.users.insert_one({
        "user_id": "admin_001", "email": "admin@cafeempire.com", "name": "Admin",
        "phone": "+855 12 000 000", "password_hash": pwd_context.hash("admin123"),
        "role": "admin", "picture": "", "addresses": [], "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Demo customer
    await db.users.insert_one({
        "user_id": "demo_001", "email": "demo@cafeempire.com", "name": "Demo User",
        "phone": "+855 12 345 678", "password_hash": pwd_context.hash("demo123"),
        "role": "customer", "picture": "", "addresses": ["#123, Street 240, Phnom Penh"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Drivers
    driver_names = [("Sokha Chhun", "+855 12 111 001", "Honda PCX 160", "PP-2847"),
                    ("Dara Meas", "+855 12 111 002", "Yamaha NMAX", "PP-1563"),
                    ("Vicheka Ros", "+855 12 111 003", "Honda Click 160i", "PP-3921")]
    for i, (name, phone, vehicle, plate) in enumerate(driver_names):
        await db.users.insert_one({
            "user_id": f"driver_{i+1:03d}", "email": f"driver{i+1}@cafeempire.com",
            "name": name, "phone": phone, "password_hash": pwd_context.hash("driver123"),
            "role": "driver", "picture": "", "vehicle": vehicle, "plate": plate,
            "is_available": True, "current_lat": 11.5564 + random.uniform(-0.01, 0.01),
            "current_lng": 104.9282 + random.uniform(-0.01, 0.01),
            "addresses": [], "created_at": datetime.now(timezone.utc).isoformat()
        })
    logger.info("Database seeded with admin, demo user, and 3 drivers!")

# ============ WEBSOCKET ============
class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}
    async def connect(self, ws: WebSocket, key: str):
        await ws.accept()
        self.active.setdefault(key, []).append(ws)
    def disconnect(self, ws: WebSocket, key: str):
        if key in self.active:
            self.active[key] = [c for c in self.active[key] if c != ws]
    async def broadcast(self, key: str, msg: dict):
        for c in self.active.get(key, []):
            try: await c.send_json(msg)
            except: pass

manager = ConnectionManager()

@app.websocket("/ws/tracking/{order_id}")
async def ws_tracking(ws: WebSocket, order_id: str):
    await manager.connect(ws, order_id)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws, order_id)

# ============ APP SETUP ============
app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
async def startup():
    await seed_data()

@app.on_event("shutdown")
async def shutdown():
    client.close()
