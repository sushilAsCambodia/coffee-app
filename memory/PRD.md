# Cafe Empire - Coffee Ordering & Live Delivery App

## Product Overview
Cafe Empire is a premium coffee ordering and live delivery application for Cambodia, featuring real-time order tracking, mock ABA PayWay payment integration, and a beautiful mobile-first UI.

## Architecture
- **Frontend**: React Native Expo (SDK 54) with Expo Router
- **Backend**: FastAPI (Python) with REST API
- **Database**: MongoDB
- **Auth**: JWT + Emergent Google OAuth

## Features

### Customer Features
- [x] User registration & login (JWT + Google OAuth)
- [x] Browse 4 categories (Hot Coffee, Iced Coffee, Tea & More, Desserts)
- [x] 14 products with variants (size, sugar level, add-ons)
- [x] Add to cart with customization
- [x] Cart management (add, update quantity, remove, clear)
- [x] Checkout with delivery address and payment selection
- [x] Mock ABA PayWay payment (QR + Card)
- [x] Order history with status badges
- [x] Live order tracking (Grab-like map simulation)
- [x] Driver assignment with contact info
- [x] Profile management

### Admin Features
- [x] Admin dashboard API (total orders, revenue, users)
- [x] Order status management API (confirmed → preparing → out_for_delivery → delivered)
- [x] Product & category management via seed data

### Payment (MOCKED)
- ABA PayWay integration is simulated
- Supports QR and Card payment method selection
- Auto-confirms after payment initiation

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/register | POST | Register new user |
| /api/auth/login | POST | Login with email/password |
| /api/auth/me | GET | Get current user |
| /api/auth/google-session | POST | Google OAuth session exchange |
| /api/categories | GET | List categories |
| /api/products | GET | List/filter products |
| /api/products/:id | GET | Product detail |
| /api/cart | GET/POST/DELETE | Cart operations |
| /api/cart/:id | PUT/DELETE | Update/remove cart item |
| /api/orders | GET/POST | List/create orders |
| /api/orders/:id | GET | Order detail |
| /api/orders/:id/status | PUT | Update order status (admin) |
| /api/payment/initiate | POST | Initiate payment |
| /api/payment/confirm/:id | POST | Confirm payment |
| /api/tracking/:id | GET | Get tracking data |
| /api/admin/dashboard | GET | Admin stats |

## Test Accounts
- **Demo**: demo@cafeempire.com / demo123
- **Admin**: admin@cafeempire.com / admin123

## Tech Stack
- Expo Router (file-based routing)
- AsyncStorage (auth token)
- Ionicons (icons)
- expo-linear-gradient
- react-native-safe-area-context
- Motor (async MongoDB driver)
- PyJWT, passlib[bcrypt]
