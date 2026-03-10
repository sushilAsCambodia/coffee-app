# Cafe Empire — Mobile App

A full-stack coffee ordering mobile app built with **React Native (Expo)** and **Laravel 12**. Supports customer ordering with real-time tracking, and driver delivery workflows.

---

## Architecture

```
coffee-app/
└── frontend/       # React Native app (Expo Router + TypeScript)

Backend (separate repo):
cafe-system-printer/  # Laravel 12 POS system — provides the API
```

**Stack:**

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81, Expo 54, Expo Router, TypeScript |
| Backend | Laravel 12, PHP 8.4, MySQL |
| Auth | Laravel Sanctum (Bearer token) — separate `coffee_app_users` table |
| Maps | Leaflet.js in WebView (driver delivery screen) |
| Payments | Cash / KHQR (static QR) — auto-processed on order creation |

---

## Project Structure

```
frontend/app/
├── (tabs)/             # Customer flow
│   ├── home.tsx        # Menu browsing by category
│   ├── cart.tsx        # Cart with variants & add-ons
│   ├── orders.tsx      # Order history
│   └── profile.tsx     # Account & logout
├── (driver)/           # Driver flow
│   ├── dashboard.tsx   # Available orders list
│   ├── delivery.tsx    # Active delivery + live map
│   ├── history.tsx     # Completed deliveries
│   └── profile.tsx     # Driver profile
├── product/[id].tsx    # Product detail + add to cart
├── tracking/[id].tsx   # Real-time order status tracking
├── checkout.tsx        # Order summary + payment method
└── index.tsx           # Login / register (routes by role)
```

---

## User Roles

Login with `email / password`. The app automatically routes based on the user's `role` field returned from the API.

| Role | Credentials (demo) | Landing screen |
|------|-------------------|----------------|
| `customer` | `demo@coffeeapp.com` / `password` | Home menu |
| `driver` | `sokha.driver@cafeempire.com` / `driver123` | Driver dashboard |

New accounts registered through the app default to `customer` role. Driver accounts are created/promoted via the backend.

---

## API

The mobile app talks to the Laravel backend at:

```
Base URL: {EXPO_PUBLIC_BACKEND_URL}/app-api/v1
```

Every request must include:

```
X-Outlet-ID: 1          # which outlet/branch
X-Locale: en            # language (en | km)
Authorization: Bearer {token}   # for authenticated endpoints
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register new customer |
| POST | `/auth/login` | — | Login (returns Bearer token + role) |
| POST | `/auth/logout` | ✓ | Revoke token |
| GET | `/auth/me` | ✓ | Current user profile |
| GET | `/categories` | — | Menu categories |
| GET | `/menus/{categoryId}` | — | Menu items with variants & add-ons |
| POST | `/orders` | ✓ | Place order |
| GET | `/orders` | ✓ | Customer's order history |
| GET | `/orders/{id}` | ✓ | Single order (used for tracking) |
| GET | `/driver/available-orders` | ✓ | Ready orders for pickup |
| GET | `/driver/active-delivery` | ✓ | Driver's current delivery |
| POST | `/driver/orders/{id}/accept` | ✓ | Accept an order |
| POST | `/driver/location` | ✓ | Update driver GPS `{lat, lng}` |
| POST | `/driver/orders/{id}/complete` | ✓ | Mark delivered |
| GET | `/driver/history` | ✓ | Driver's completed deliveries |

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

Create `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
EXPO_PUBLIC_OUTLET_ID=1
```

> On a physical device, replace `127.0.0.1` with your machine's local IP (e.g., `192.168.1.100`).

### 3. Run the app

```bash
cd frontend
npx expo start
```

- Press `i` → iOS simulator
- Press `a` → Android emulator
- Scan QR code → Expo Go on device

---

## Backend Setup (cafe-system-printer)

The API is part of the `cafe-system-printer` Laravel project.

### 1. Start the Laravel server

```bash
cd /path/to/cafe-system-printer
php artisan serve --host=0.0.0.0 --port=8000
```

### 2. Run migrations

```bash
php artisan migrate
```

### 3. Create a driver account

Register via the API then update the role in the database, or use tinker:

```bash
php artisan tinker
> App\CoffeeApp\Models\CoffeeAppUser::where('email','driver@example.com')->update(['role'=>'driver']);
```

---

## Build for Production

### Android APK / AAB

```bash
cd frontend
npx eas build --platform android
```

### iOS IPA

```bash
npx eas build --platform ios
```

### Web

```bash
npx expo export --platform web
```

> EAS Build requires an [Expo account](https://expo.dev). iOS requires an Apple Developer account.

Before building, update `frontend/.env` with the production API URL:

```env
EXPO_PUBLIC_BACKEND_URL=https://api.yourapp.com
```
