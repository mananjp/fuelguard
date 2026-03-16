# FuelGuard - AI-Powered Fuel Theft Prevention Platform

> **Prevent fuel theft in transport fleets using LLM-powered photo verification, GPS intelligence, and real-time fraud scoring.**

FuelGuard is a complete backend platform that uses Google Gemini (with Ollama LLaVA fallback) to verify fuel receipts and pump meter readings, cross-validate claims, detect GPS spoofing, and process UPI payments — all through a single FastAPI backend.

---

## Features

### Core Verification Pipeline
- **LLM Vision Analysis** — Gemini Flash reads fuel receipts and pump meter displays (no Tesseract/OCR needed)
- **3-Way Cross Validation** — Meter reading vs receipt vs driver's claim with automatic mismatch detection
- **EXIF Metadata Extraction** — Timestamp, device model, and GPS from photo metadata

### Fraud Detection Engine (12 Rules)
| Rule | What It Catches |
|------|----------------|
| Excess Fuel Claimed | Claims exceeding tank capacity |
| Station Not On Route | Fueling at unauthorized stations |
| Timestamp Mismatch | Pre-captured/fake photos (EXIF vs upload time) |
| Refuel Too Frequent | Multiple fill-ups within 4 hours |
| No EXIF GPS | Camera GPS disabled (possible fake photo) |
| Impossible Price | Price per liter outside market range |
| OCR Amount Mismatch | Receipt amount != claimed amount |
| Route Deviation | Truck is off planned route |
| GPS Signal Lost | No GPS during fueling event |
| Night Fueling Off-Route | Late-night fueling at unregistered station |
| Early Refuel by Distance | Refueling with plenty of fuel remaining |
| Meter Photo Mismatch | Meter display doesn't match claim |

### Security Layer (11 Features)
- **Image Hash Deduplication** — SHA-256 prevents reusing photos across trips
- **GPS Spoofing Detection** — Detects impossible speed/teleportation
- **Idle & Speed Monitoring** — Cross-checks fuel vs actual movement
- **Station OTP Verification** — Station owner confirms fueling via OTP
- **Restricted Zone Geofencing** — Alerts when trucks enter competitor zones
- **Trip Integrity Seal** — HMAC-SHA256 tamper-proof transaction records
- **GST Invoice Validation** — Validates Indian GST number format
- **Driver Blacklist System** — Block known fraudsters across fleets
- **Cargo Load Factor** — Adjusts expected fuel based on cargo weight
- **Night Curfew Enforcement** — Flags high-risk late-night fueling
- **Emergency SOS** — Driver safety alerts with Google Maps link

### Payment & Wallet Infrastructure
- **Trip Wallet System** — Digital wallet for drivers to manage trip expenses
- **GPay-style Merchant Payouts** — Drivers can pay any UPI merchant directly from their wallet using RazorpayX Payouts
- **RazorpayUPI Integration** — Create payment links for owners to load funds, process webhooks
- **Per-Driver/Truck/Route Analytics** — All payments tagged and differentiable
- **Real-time Balance Returns** — Unused allocated funds are automatically returned to the owner when a trip closes

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI + Uvicorn |
| Database | MongoDB (Motor async driver) |
| AI/Vision | Google Gemini Flash (free tier) / Ollama LLaVA (local fallback) |
| Payments | Razorpay UPI |
| Dashboard | Streamlit |
| Language | Python 3.10+ |

## Quick Start (Docker - Recommended)

The easiest way to run FuelGuard is using Docker. This spins up both the FastAPI backend and a MongoDB instance automatically.

### 1. Clone and Configure
```bash
git clone https://github.com/mananjp/fuelguard.git
cd fuelguard

# Copy the example environment file
cp .env.example .env
```
*(Edit `.env` to add your Gemini and Razorpay API keys)*

### 2. Start Services
```bash
docker compose up -d
```
The API is now live at: **[http://localhost:8000/docs](http://localhost:8000/docs)**


## Manual Setup (Without Docker)

If you prefer to run the app directly on your host machine:

### 1. Install Dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file with your `MONGO_URI` (e.g., `mongodb://localhost:27017`), `DB_NAME`, `GEMINI_API_KEY`, and `RAZORPAY_KEY` values.

### 3. Run the Backend
Ensure MongoDB is running locally, then:
```bash
uvicorn main:app --reload --port 8000
```

### 4. Run the Dashboards (Optional)
```bash
# Driver Upload UI
streamlit run driver_upload_app.py --server.port 8503

# Fleet Manager Dashboard
streamlit run dashboard.py --server.port 8502
```

---

## API Overview

### 34 Endpoints across 8 categories:

| Category | Key Endpoints |
|----------|--------------|
| **Fuel** | `POST /fuel/checkin/v2` — Full verification pipeline |
| **Trucks** | `GET /trucks`, `GET /trucks/{id}` |
| **Drivers** | `GET /drivers`, `GET /drivers/{id}` |
| **Trips** | `POST /trip/start`, `POST /trip/{id}/end` |
| **GPS** | `POST /gps/update` — Real-time tracking + deviation alerts |
| **Wallet & Payments**| `POST /wallet/allocate`, `POST /wallet/pay-merchant`, `POST /wallet/owner/create-load-link` |
| **Security** | `GET /security/gps-spoof/{id}`, `POST /security/sos`, `POST /security/otp/create`, etc. |
| **Dashboard** | `GET /dashboard/fleet`, `GET /dashboard/analytics/{id}` |

Full interactive docs at `/docs` (Swagger UI).

---

## Project Structure

```
fuelguard/
├── main.py                 # FastAPI app — core endpoints
├── database.py             # MongoDB connection (Motor async)
├── llm_vision.py           # Gemini/Ollama receipt & meter reader
├── fraud_detection.py      # 12-rule fraud scoring engine
├── fuel_intelligence.py    # Route distance & consumption calculator
├── security.py             # 11 security features
├── wallet.py               # Core wallet business logic
├── wallet_routes.py        # Wallet API endpoints router
├── gpay_payment.py         # RazorpayX Payouts integration
├── Dockerfile              # Container definition
├── docker-compose.yml      # Service orchestration (app + database)
├── requirements.txt        # Python dependencies
└── .env.example            # Environment variables template
```

---

## How It Works

```
Driver takes photos (meter, pump, receipt)
        │
        ▼
┌─────────────────────────────┐
│  Blacklist Check            │ → 403 if blocked
│  Image Hash Dedup           │ → 409 if photo reused
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  Gemini Flash LLM Vision    │
│  • Read receipt → liters,   │
│    amount, station, date    │
│  • Read meter display       │
│  • Extract EXIF metadata    │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  3-Way Cross Validation     │
│  Meter vs Receipt vs Claim  │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  12-Rule Fraud Engine       │
│  Score 0-100                │
│  • <40  → APPROVED          │
│  • 40-70 → REVIEW           │
│  • >70  → FLAGGED           │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  Save to MongoDB            │
│  Fire alerts if flagged     │
│  Update driver trust score  │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│  Razorpay UPI Payment Link  │
│  Webhook → confirm payment  │
└─────────────────────────────┘
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Author

**Manan Panchal** — [@mananjp](https://github.com/mananjp)
