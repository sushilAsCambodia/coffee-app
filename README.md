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

## Prerequisites (Fresh Machine Setup)

Before working on this project, install the following tools in order.

### 1. Node.js

Download and install **Node.js 20 LTS** from https://nodejs.org

Verify:
```bash
node -v   # should be v20.x or higher
npm -v
```

### 2. Git

Download from https://git-scm.com or install via Homebrew (macOS):
```bash
brew install git
```

Verify:
```bash
git --version
```

### 3. Expo CLI & EAS CLI

```bash
npm install -g expo-cli eas-cli
```

Verify:
```bash
expo --version
eas --version
```

### 4. iOS Simulator (macOS only)

Install **Xcode** from the Mac App Store (free, ~10 GB).

After installing, open Xcode once to accept the license, then install command-line tools:
```bash
xcode-select --install
```

Open a simulator:
```bash
open -a Simulator
```

### 5. Android Emulator

Install **Android Studio** from https://developer.android.com/studio

After installing:
1. Open Android Studio → **More Actions** → **Virtual Device Manager**
2. Click **Create Device** → choose a phone (e.g. Pixel 8) → select a system image (API 34+)
3. Click **Finish** — the emulator will appear in the list
4. Click the play button to start it

Also add these to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Then reload:
```bash
source ~/.zshrc
```

Verify:
```bash
adb --version
```

### 6. PHP 8.4 & Composer (for backend)

**macOS:**
```bash
brew install php@8.4
brew install composer
```

**Windows:** Download PHP from https://windows.php.net and Composer from https://getcomposer.org

Verify:
```bash
php -v       # should be 8.4.x
composer -V
```

### 7. MySQL

**macOS:**
```bash
brew install mysql
brew services start mysql
```

**Windows:** Download MySQL Installer from https://dev.mysql.com/downloads/installer

### 8. Laravel (via Composer — no separate install needed)

Laravel is installed per-project via Composer. No global install required.

---

## App Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd cafe-empire
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
EXPO_PUBLIC_OUTLET_ID=1
```

> On a physical device replace `127.0.0.1` with your machine's local IP (e.g. `192.168.1.100`).

### 3. Run the app

```bash
npx expo start
```

- Press `i` → opens iOS Simulator
- Press `a` → opens Android Emulator
- Scan QR code → opens in Expo Go on your phone

---

## Backend Setup (cafe-system)

### 1. Install dependencies

```bash
cd /path/to/cafe-system
composer install
```

### 2. Configure environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` with your database credentials:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cafe_system
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Create database and run migrations

```bash
mysql -u root -e "CREATE DATABASE cafe_system;"
php artisan migrate
```

### 4. Start the server

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

---

## User Roles

Login with `email / password`. The app routes automatically based on the `role` returned by the API.

| Role | Landing screen |
|------|----------------|
| `customer` | Home (menu) |
| `driver` | Driver dashboard |

New accounts default to `customer`. Promote to driver via tinker:

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

## EAS Build (Cloud Builds)

EAS project: `@khmer-empire/cafe-empire`
Bundle ID (iOS): `com.khmerempire.cafeempire`
Package (Android): `com.khmerempire.cafeempire`

Requires an [Expo account](https://expo.dev). Log in first:
```bash
eas login
```

### Testing APK (Android — no Play Store needed)

```bash
eas build --profile preview --platform android
```

Downloads as a `.apk` — install directly on any Android device.

### Production builds

```bash
# Android (.aab for Play Store)
eas build --profile production --platform android

# iOS (.ipa for App Store)
eas build --profile production --platform ios
```

> iOS production builds require an Apple Developer account ($99/year).

### Native dev build with real splash + icon

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

Update `.env` before production builds:
```env
EXPO_PUBLIC_BACKEND_URL=https://api.yourapp.com
EXPO_PUBLIC_OUTLET_ID=1
```
