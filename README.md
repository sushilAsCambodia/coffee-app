# Cafe Empire

A full-stack coffee ordering mobile app built with **React Native (Expo)** and **FastAPI**. Supports customer ordering, admin management, and driver delivery workflows.

---

## Architecture

```
coffee-app/
├── frontend/   # React Native app (Expo Router)
└── backend/    # FastAPI server + MongoDB
```

**Stack:**
- Frontend: React Native, Expo 54, Expo Router, TypeScript
- Backend: Python, FastAPI, MongoDB (Motor), JWT auth
- Auth: Email/password + Google OAuth
- Payments: ABA PayWay (mock)

---

## Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.10+
- MongoDB instance (local or Atlas)
- Expo Go app on your phone (for dev), or Android/iOS simulator

---

## Backend Setup

### 1. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment

Create a `.env` file in the `backend/` directory:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=cafe_empire
JWT_SECRET=your-secret-key-here
```

### 3. Run the server

```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
# or
yarn install
```

### 2. Configure environment

Create a `.env` file in the `frontend/` directory:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

> **Note:** When testing on a physical device, replace `localhost` with your machine's local IP address (e.g., `http://192.168.1.100:8000`).

### 3. Run the app

```bash
# Start Expo dev server
npm start
# or
yarn start
```

Then:
- Press `i` to open in iOS simulator
- Press `a` to open in Android emulator
- Scan the QR code with **Expo Go** on your phone

---

## User Roles

| Role | Access |
|------|--------|
| `customer` | Browse menu, cart, orders, order tracking |
| `admin` | Dashboard, manage products, manage orders, manage drivers |
| `driver` | Delivery dashboard, active delivery, history |

---

## Deployment

### Backend — Deploy to a VPS / Cloud VM

1. SSH into your server and clone the repo.
2. Install dependencies (see Backend Setup above).
3. Set environment variables in `.env`.
4. Run with a process manager:

```bash
# Using uvicorn directly (simple)
uvicorn server:app --host 0.0.0.0 --port 8000

# Or using gunicorn for production
pip install gunicorn
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

5. (Recommended) Use **nginx** as a reverse proxy with SSL.

### Backend — Deploy to Railway / Render / Fly.io

These platforms auto-detect Python apps. Add environment variables in the platform dashboard and set the start command to:

```
uvicorn server:app --host 0.0.0.0 --port $PORT
```

### Frontend — Build for Production

#### Android APK / AAB

```bash
cd frontend
npx expo build:android
# or with EAS Build (recommended)
npx eas build --platform android
```

#### iOS IPA

```bash
npx eas build --platform ios
```

> EAS Build requires an [Expo account](https://expo.dev) and for iOS, an Apple Developer account.

#### Web

```bash
npx expo export --platform web
```

This outputs a static site to `dist/` that can be hosted on Netlify, Vercel, or any static host.

### Update `EXPO_PUBLIC_BACKEND_URL` for production

Before building, update `frontend/.env` to point to your production backend URL:

```env
EXPO_PUBLIC_BACKEND_URL=https://api.yourapp.com
```

---

## Running Tests

### Backend

```bash
cd backend
pytest tests/
```

### Frontend (lint)

```bash
cd frontend
npm run lint
```

---

## Project Structure

```
frontend/app/
├── (tabs)/         # Customer: home, cart, orders, profile
├── (admin)/        # Admin: dashboard, products, orders, drivers
├── (driver)/       # Driver: dashboard, delivery, history, profile
├── product/        # Product detail screen
├── tracking/       # Order tracking screen
├── checkout.tsx
├── register.tsx
└── index.tsx       # Entry / splash

backend/
├── server.py       # All API routes and business logic
├── requirements.txt
└── .env            # Not committed — create locally
```
