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

### Payment Gateway
- **Razorpay UPI Integration** — Create payment links, process webhooks
- **Per-Driver/Truck/Route Analytics** — All payments tagged and differentiable
- **Driver Payment History** — Complete expense tracking

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

---

## Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/mananjp/fuelguard.git
cd fuelguard
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file:
```env
# MongoDB
MONGO_URI=mongodb://localhost:27017
DB_NAME=fuelguard

# Google Gemini (FREE — get key at https://aistudio.google.com/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Razorpay (test keys from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
WEBHOOK_SECRET=your_webhook_secret_here
```

### 3. Start MongoDB
Make sure MongoDB is running locally on port 27017. The app will auto-create the `fuelguard` database and seed demo data.

### 4. Run the Backend
```bash
uvicorn main:app --reload --port 8000
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 5. Run the Dashboards (Optional)
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
| **Payments** | `POST /payments/create`, `POST /payments/webhook`, `GET /payments/analytics` |
| **Security** | `GET /security/gps-spoof/{id}`, `POST /security/sos`, `POST /security/otp/create`, etc. |
| **Dashboard** | `GET /dashboard/fleet`, `GET /dashboard/analytics/{id}` |

Full interactive docs at `/docs` (Swagger UI).

---

## Project Structure

```
fuelguard/
├── main.py                 # FastAPI app — all 34 endpoints
├── database.py             # MongoDB connection (Motor async)
├── llm_vision.py           # Gemini/Ollama receipt & meter reader
├── fraud_detection.py      # 12-rule fraud scoring engine
├── fuel_intelligence.py    # Route distance & consumption calculator
├── security.py             # 11 security features
├── payment_gateway.py      # Razorpay UPI integration
├── driver_upload_app.py    # Streamlit driver UI
├── dashboard.py            # Streamlit fleet manager dashboard
├── requirements.txt        # Python dependencies
├── .env                    # API keys (not committed)
└── README.md
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
