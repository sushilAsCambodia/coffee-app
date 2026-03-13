# Cafe Empire — Mobile App

A full-stack coffee ordering mobile app built with **React Native (Expo)** and **Laravel 12**. Supports customer ordering with real-time order tracking, and a full driver delivery workflow.

---

## Architecture

```
cafe-empire/     # React Native app (this repo)
cafe-system/     # Laravel 12 backend (separate repo)
```

**Stack:**

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.81, Expo 54, Expo Router, TypeScript |
| Backend | Laravel 12, PHP 8.4, MySQL |
| Auth | Laravel Sanctum — Bearer token, `coffee_app_users` table |
| Maps | Leaflet.js in WebView (driver delivery screen) |
| Payments | Cash / KHQR static QR — processed on order creation |

---

## Project Structure

```
.
├── app/
│   ├── (tabs)/             # Customer flow
│   │   ├── home.tsx        # Menu browsing by category
│   │   ├── cart.tsx        # Cart with variants & add-ons
│   │   ├── orders.tsx      # Order history
│   │   └── profile.tsx     # Account & logout
│   ├── (driver)/           # Driver flow
│   │   ├── dashboard.tsx   # Available orders list
│   │   ├── delivery.tsx    # Active delivery + live map
│   │   ├── history.tsx     # Completed deliveries
│   │   └── profile.tsx     # Driver profile
│   ├── product/[id].tsx    # Product detail + add to cart
│   ├── tracking/[id].tsx   # Real-time order status tracking
│   ├── checkout.tsx        # Order summary + payment method
│   ├── index.tsx           # Login / register (routes by role)
│   └── _layout.tsx         # Root layout (AuthProvider, CartProvider)
├── src/
│   ├── components/         # Shared UI components (GrabStyleMap, etc.)
│   ├── constants/          # Theme tokens (colors, typography, spacing)
│   ├── context/            # AuthContext, CartContext
│   ├── services/           # api.ts — all backend calls
│   └── utils/              # Helper utilities
├── assets/images/          # App logo and icons
├── app.json                # Expo config (bundle IDs, EAS project)
├── eas.json                # EAS Build profiles
└── .env                    # Environment variables (not committed)
```

---

## User Roles

Login with `email / password`. The app routes automatically based on the `role` returned by the API.

| Role | Landing screen |
|------|----------------|
| `customer` | Home (menu) |
| `driver` | Driver dashboard |

New accounts registered in the app default to `customer`. Driver accounts are promoted via the database or Laravel tinker:

```bash
php artisan tinker
> App\CoffeeApp\Models\CoffeeAppUser::where('email','someone@example.com')->update(['role'=>'driver']);
```

---

## API

Base URL: `{EXPO_PUBLIC_BACKEND_URL}/app-api/v1`

Every request must include:

```
X-Outlet-ID: 1                    # outlet / branch
X-Locale: en                      # language (en | km)
Authorization: Bearer {token}     # authenticated endpoints only
```

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register new customer |
| POST | `/auth/login` | — | Login — returns Bearer token + role |
| POST | `/auth/logout` | ✓ | Revoke token |
| GET | `/auth/me` | ✓ | Current user profile |
| GET | `/categories` | — | Menu categories |
| GET | `/menus/{categoryId}` | — | Items with variants & add-ons |
| POST | `/orders` | ✓ | Place order |
| GET | `/orders` | ✓ | Customer order history |
| GET | `/orders/{id}` | ✓ | Single order (used for tracking) |
| GET | `/driver/available-orders` | ✓ | Ready orders with no driver |
| GET | `/driver/active-delivery` | ✓ | Driver's current delivery |
| POST | `/driver/orders/{id}/accept` | ✓ | Accept an order |
| POST | `/driver/location` | ✓ | Update driver GPS `{lat, lng}` |
| POST | `/driver/orders/{id}/complete` | ✓ | Mark order as delivered |
| GET | `/driver/history` | ✓ | Driver's completed deliveries |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
EXPO_PUBLIC_OUTLET_ID=1
```

> On a physical device replace `127.0.0.1` with your machine's local IP (e.g. `192.168.1.100`).

### 3. Run

```bash
npx expo start
```

- `i` → iOS simulator
- `a` → Android emulator
- Scan QR → Expo Go on device

---

## Backend (cafe-system)

### Start the server

```bash
cd /path/to/cafe-system
php artisan serve --host=0.0.0.0 --port=8000
```

### Run migrations

```bash
php artisan migrate
```

---

## EAS Build

EAS project: `@khmer-empire/cafe-empire`
Bundle ID (iOS): `com.khmerempire.cafeempire`
Package (Android): `com.khmerempire.cafeempire`

### Testing APK (Android)

```bash
eas build --profile preview --platform android
```

Produces a `.apk` you can install directly on any Android device — no Play Store needed.

### Production builds

```bash
# Android (.aab for Play Store)
eas build --profile production --platform android

# iOS (.ipa for App Store)
eas build --profile production --platform ios
```

### Simulator build (iOS)

```bash
npx expo run:ios
```

Builds a native dev client with your real splash screen and app icon.

Update `.env` with the production API URL before building:

```env
EXPO_PUBLIC_BACKEND_URL=https://api.yourapp.com
EXPO_PUBLIC_OUTLET_ID=1
```

> EAS Build requires an [Expo account](https://expo.dev). iOS production builds require an Apple Developer account ($99/year).
