# ============================================================
# main.py — FuelGuard Complete Backend (Full Updated Version)
# All modules integrated including payment_gateway.py
# ============================================================
# Run: uvicorn main:app --reload --port 8000
# Docs: http://localhost:8000/docs
# ============================================================

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import uuid

from database import (
    connect_db, close_db, mongodb,
    trucks_col, drivers_col, routes_col,
    stations_col, transactions_col, alerts_col
)
from llm_vision import FuelVisionLLM
from fraud_detection import FraudDetectionEngine
from fuel_intelligence import FuelIntelligence
from payment_gateway import UPIPaymentGateway
from security import (
    ImageHashGuard, GPSSpoofDetector, IdleSpeedMonitor,
    StationOTPVerifier, RestrictedZoneChecker, TripIntegritySeal,
    GSTValidator, DriverBlacklist, CargoFuelAdjuster,
    NightCurfewChecker, EmergencySOS
)
from wallet_routes import wallet_router

vision        = FuelVisionLLM()
fraud         = FraudDetectionEngine()
intel         = FuelIntelligence()
gateway       = UPIPaymentGateway()
image_guard   = ImageHashGuard()
spoof_detect  = GPSSpoofDetector()
idle_monitor  = IdleSpeedMonitor()
otp_verifier  = StationOTPVerifier()
zone_checker  = RestrictedZoneChecker()
trip_seal     = TripIntegritySeal()
gst_validator = GSTValidator()
blacklist_mgr = DriverBlacklist()
cargo_adj     = CargoFuelAdjuster()
curfew        = NightCurfewChecker()
sos           = EmergencySOS()

# ════════════════════════════════════════════════════════════
#  APP LIFESPAN
# ════════════════════════════════════════════════════════════
@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await seed_sample_data()
    yield
    await close_db()

app = FastAPI(
    title="FuelGuard API",
    version="2.0.0",
    description="Fuel Theft Prevention Platform — Full Build",
    lifespan=lifespan
)
app.include_router(wallet_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# ════════════════════════════════════════════════════════════
#  SEED
# ════════════════════════════════════════════════════════════
async def seed_sample_data():
    if await trucks_col().count_documents({}) == 0:
        await trucks_col().insert_many([
            {
                "truck_id": "TRK001", "plate_number": "GJ05AB1234",
                "driver_id": "DRV001", "tank_capacity_liters": 400.0,
                "fuel_efficiency_km_per_liter": 3.5,
                "status": "IDLE",
                "current_lat": 23.0225, "current_lng": 72.5714,
                "last_seen": datetime.utcnow().isoformat()
            },
            {
                "truck_id": "TRK002", "plate_number": "MH12CD5678",
                "driver_id": "DRV002", "tank_capacity_liters": 350.0,
                "fuel_efficiency_km_per_liter": 3.2,
                "status": "ON_TRIP",
                "current_lat": 19.0760, "current_lng": 72.8777,
                "last_seen": datetime.utcnow().isoformat()
            },
        ])

    if await drivers_col().count_documents({}) == 0:
        await drivers_col().insert_many([
            {
                "driver_id": "DRV001", "name": "Ramesh Patel",
                "phone": "+919876543210", "license_number": "GJ0120230012345",
                "trust_score": 100.0, "total_trips": 0, "flagged_trips": 0,
                "total_fuel_spend": 0.0
            },
            {
                "driver_id": "DRV002", "name": "Suresh Kumar",
                "phone": "+919876543211", "license_number": "MH0120220098765",
                "trust_score": 87.5, "total_trips": 12, "flagged_trips": 2,
                "total_fuel_spend": 0.0
            },
        ])

    if await stations_col().count_documents({}) == 0:
        await stations_col().insert_many([
            {
                "station_id": "STN001", "name": "HPCL Ahmedabad Highway",
                "lat": 22.9734, "lng": 72.6849,
                "address": "NH48, Ahmedabad",
                "is_verified": True, "fuel_types": ["diesel"],
                "partner_station": True
            },
            {
                "station_id": "STN002", "name": "IOCL Vadodara",
                "lat": 22.3072, "lng": 73.1812,
                "address": "Ring Road, Vadodara",
                "is_verified": True, "fuel_types": ["diesel"],
                "partner_station": False
            },
            {
                "station_id": "STN003", "name": "BPCL Surat Bypass",
                "lat": 21.1702, "lng": 72.8311,
                "address": "Surat Bypass, NH48",
                "is_verified": True, "fuel_types": ["diesel"],
                "partner_station": True
            },
        ])

    print("MongoDB seeded -- open Compass -> fuelguard to see collections")

# ════════════════════════════════════════════════════════════
#  HEALTH
# ════════════════════════════════════════════════════════════
@app.get("/health", tags=["System"])
async def health():
    try:
        await mongodb.client.admin.command("ping")
        return {
            "status":   "healthy",
            "mongodb":  "connected",
            "uri":      "mongodb://localhost:27017",
            "database": "fuelguard"
        }
    except Exception as e:
        raise HTTPException(503, f"MongoDB unreachable: {e}")

# ════════════════════════════════════════════════════════════
#  TRUCKS
# ════════════════════════════════════════════════════════════
@app.get("/trucks", tags=["Trucks"])
async def list_trucks():
    trucks = await trucks_col().find({}, {"_id": 0}).to_list(500)
    return {"trucks": trucks, "count": len(trucks)}

@app.get("/trucks/{truck_id}", tags=["Trucks"])
async def get_truck(truck_id: str):
    truck = await trucks_col().find_one({"truck_id": truck_id}, {"_id": 0})
    if not truck:
        raise HTTPException(404, "Truck not found")
    return truck

# ════════════════════════════════════════════════════════════
#  DRIVERS
# ════════════════════════════════════════════════════════════
@app.get("/drivers", tags=["Drivers"])
async def list_drivers():
    drivers = await drivers_col().find(
        {}, {"_id": 0}
    ).sort("trust_score", -1).to_list(500)
    return {"drivers": drivers, "count": len(drivers)}

@app.get("/drivers/{driver_id}", tags=["Drivers"])
async def get_driver(driver_id: str):
    driver = await drivers_col().find_one({"driver_id": driver_id}, {"_id": 0})
    if not driver:
        raise HTTPException(404, "Driver not found")
    return driver

# ════════════════════════════════════════════════════════════
#  FUEL STATIONS
# ════════════════════════════════════════════════════════════
@app.get("/fuel-stations", tags=["Stations"])
async def list_stations():
    stations = await stations_col().find({}, {"_id": 0}).to_list(500)
    return {"stations": stations, "count": len(stations)}

# ════════════════════════════════════════════════════════════
#  TRIPS
# ════════════════════════════════════════════════════════════
@app.post("/trip/start", tags=["Trips"])
async def start_trip(payload: dict):
    route_id = str(uuid.uuid4())
    route = {
        **payload,
        "route_id":   route_id,
        "status":     "ACTIVE",
        "start_time": datetime.utcnow().isoformat()
    }
    await routes_col().insert_one(route)
    await trucks_col().update_one(
        {"truck_id": payload.get("truck_id")},
        {"$set": {"status": "ON_TRIP"}}
    )
    return {"route_id": route_id, "status": "TRIP_STARTED"}

@app.get("/trip/{route_id}", tags=["Trips"])
async def get_trip(route_id: str):
    route = await routes_col().find_one({"route_id": route_id}, {"_id": 0})
    if not route:
        raise HTTPException(404, "Route not found")
    return route

@app.post("/trip/{route_id}/end", tags=["Trips"])
async def end_trip(route_id: str):
    await routes_col().update_one(
        {"route_id": route_id},
        {"$set": {"status": "COMPLETED",
                  "end_time": datetime.utcnow().isoformat()}}
    )
    route = await routes_col().find_one({"route_id": route_id}, {"_id": 0})
    if route:
        await trucks_col().update_one(
            {"truck_id": route.get("truck_id")},
            {"$set": {"status": "IDLE"}}
        )
        await drivers_col().update_one(
            {"driver_id": route.get("driver_id")},
            {"$inc": {"total_trips": 1}}
        )
    return {"status": "TRIP_COMPLETED", "route_id": route_id}

# ════════════════════════════════════════════════════════════
#  GPS
# ════════════════════════════════════════════════════════════
@app.post("/gps/update", tags=["GPS"])
async def update_gps(payload: dict):
    truck_id = payload["truck_id"]
    lat      = payload["lat"]
    lng      = payload["lng"]

    await trucks_col().update_one(
        {"truck_id": truck_id},
        {"$set": {
            "current_lat": lat,
            "current_lng": lng,
            "last_seen":   datetime.utcnow().isoformat()
        }}
    )
    await mongodb.db["gps_logs"].insert_one({
        "truck_id":  truck_id,
        "lat":       lat,
        "lng":       lng,
        "timestamp": datetime.utcnow().isoformat()
    })

    # Real-time route deviation check
    route = await routes_col().find_one(
        {"truck_id": truck_id, "status": "ACTIVE"}
    )
    deviation_alert = False
    distance_off    = None

    if route and route.get("waypoints"):
        from fraud_detection import haversine_distance_meters
        min_dist = min(
            haversine_distance_meters(lat, lng, wp["lat"], wp["lng"])
            for wp in route["waypoints"]
        )
        if min_dist > 500:
            deviation_alert = True
            distance_off    = round(min_dist, 0)
            await alerts_col().insert_one({
                "alert_id":   str(uuid.uuid4()),
                "truck_id":   truck_id,
                "driver_id":  route.get("driver_id"),
                "route_id":   route.get("route_id"),
                "alert_type": "ROUTE_DEVIATION",
                "severity":   "HIGH",
                "message":    f"Truck is {min_dist:.0f}m off planned route",
                "created_at": datetime.utcnow().isoformat(),
                "resolved":   False
            })

    return {
        "status":             "GPS_UPDATED",
        "deviation_alert":    deviation_alert,
        "distance_off_route": distance_off
    }

# ════════════════════════════════════════════════════════════
#  FUEL CHECK-IN v2 — meter OCR + 3-way cross validation
# ════════════════════════════════════════════════════════════
@app.post("/fuel/checkin/v2", tags=["Fuel"])
async def fuel_checkin_v2(
    truck_id:       str   = Form(...),
    driver_id:      str   = Form(...),
    route_id:       str   = Form(...),
    station_id:     str   = Form(...),
    liters_claimed: float = Form(...),
    amount_inr:     float = Form(...),
    meter_photo:    UploadFile = File(...),
    pump_photo:     UploadFile = File(...),
    receipt_photo:  UploadFile = File(...)
):
    receipt_bytes = await receipt_photo.read()
    meter_bytes   = await meter_photo.read()
    pump_bytes    = await pump_photo.read()

    # ── 0a. Blacklist check — reject blacklisted drivers ──
    bl_result = await blacklist_mgr.is_blacklisted(
        mongodb.db["blacklist"], driver_id
    )
    if bl_result.get("blacklisted"):
        raise HTTPException(403, f"Driver {driver_id} is blacklisted: {bl_result['reason']}")

    # ── 0b. Image hash deduplication — reject reused photos ──
    photo_hashes = image_guard.hash_all_photos(meter_bytes, pump_bytes, receipt_bytes)
    for h in photo_hashes["all_hashes"]:
        dup = await image_guard.is_duplicate(h, transactions_col())
        if dup:
            raise HTTPException(
                409,
                f"Duplicate photo detected! This image was already used in "
                f"transaction {dup.get('transaction_id')} for truck {dup.get('truck_id')}"
            )

    # ── 1. LLM reads receipt (Gemini → Ollama fallback) ───
    receipt_data = vision.read_receipt(receipt_bytes)
    exif_data    = vision.extract_exif(receipt_bytes)

    # ── 2. LLM reads meter display ────────────────────────
    meter_data   = vision.read_meter(meter_bytes)

    # ── 3. 3-way cross validation ─────────────────────────
    cross        = vision.cross_validate(meter_data, receipt_data, liters_claimed)

    # ── 3. Load context from MongoDB ─────────────────────
    truck        = await trucks_col().find_one({"truck_id": truck_id},  {"_id": 0})
    route        = await routes_col().find_one({"route_id": route_id},  {"_id": 0})
    prev_txns    = await transactions_col().find(
        {"truck_id": truck_id}
    ).sort("timestamp", -1).limit(3).to_list(3)
    for t in prev_txns:
        t.pop("_id", None)
    all_stations = await stations_col().find({}, {"_id": 0}).to_list(1000)

    # ── 4. Fraud detection ────────────────────────────────
    tx_payload = {
        "truck_id":             truck_id,
        "driver_id":            driver_id,
        "route_id":             route_id,
        "station_id":           station_id,
        "timestamp":            datetime.utcnow().isoformat(),
        "gps_lat":              truck.get("current_lat") if truck else None,
        "gps_lng":              truck.get("current_lng") if truck else None,
        "fuel_liters_claimed":  liters_claimed,
        "fuel_amount_inr":      amount_inr,
        "ocr_extracted_liters": receipt_data.liters,
        "ocr_extracted_amount": receipt_data.amount_inr,
        "exif_timestamp":       exif_data.get("timestamp"),
        "photo_gps_lat":        None,
        "photo_gps_lng":        None,
    }
    fraud_result = fraud.check_all(
        tx_payload, truck or {}, route or {}, prev_txns, all_stations
    )

    # ── 5. Meter mismatch → add to fraud score ────────────
    if meter_data.fraud_flag:
        fraud_result["fraud_score"] = min(
            fraud_result["fraud_score"] + 45.0, 100.0
        )
        fraud_result["triggered_rules"].append({
            "rule":     "METER_PHOTO_MISMATCH",
            "severity": "CRITICAL",
            "message":  meter_data.fraud_reason,
            "score":    45.0
        })
        if fraud_result["fraud_score"] >= 70:
            fraud_result["status"] = "FLAGGED"

    # ── 5b. Night curfew check ─────────────────────────────
    station_doc = None
    for s in all_stations:
        if s.get("station_id") == station_id:
            station_doc = s
            break
    curfew_result = curfew.is_curfew_violation(
        tx_payload["timestamp"],
        station_doc.get("partner_station", False) if station_doc else False
    )
    if curfew_result.get("violation"):
        fraud_result["fraud_score"] = min(
            fraud_result["fraud_score"] + 25.0, 100.0
        )
        fraud_result["triggered_rules"].append({
            "rule":     "NIGHT_CURFEW_VIOLATION",
            "severity": "HIGH",
            "message":  curfew_result["message"],
            "score":    25.0
        })
        if fraud_result["fraud_score"] >= 70:
            fraud_result["status"] = "FLAGGED"

    # ── 6. Save transaction ───────────────────────────────
    transaction_id = str(uuid.uuid4())
    transaction = {
        **tx_payload,
        "transaction_id":        transaction_id,
        "fraud_score":           fraud_result["fraud_score"],
        "verification_status":   fraud_result["status"],
        "triggered_rules":       fraud_result["triggered_rules"],
        "meter_reading_liters":  meter_data.liters,
        "meter_read_confidence": meter_data.confidence,
        "meter_display_type":    meter_data.display_type,
        "meter_roi_detected":    True,
        "meter_cross_check":     cross.__dict__,
        "meter_fraud_flag":      meter_data.fraud_flag,
        "meter_fraud_reason":    meter_data.fraud_reason,
        "ocr_raw_text":          receipt_data.raw_response[:500],
        "exif_device":           exif_data.get("device_model", "UNKNOWN"),
        "meter_photo_url":       f"photos/{transaction_id}_meter.jpg",
        "pump_photo_url":        f"photos/{transaction_id}_pump.jpg",
        "receipt_photo_url":     f"photos/{transaction_id}_receipt.jpg",
        "photo_hashes":          photo_hashes["all_hashes"],
        "payment_status":        "PENDING",
        "payment_link":          None
    }
    await transactions_col().insert_one(transaction)

    # ── 7. Fire alerts ────────────────────────────────────
    if fraud_result["status"] in ("FLAGGED", "REVIEW"):
        for rule in fraud_result["triggered_rules"]:
            await alerts_col().insert_one({
                "alert_id":       str(uuid.uuid4()),
                "truck_id":       truck_id,
                "driver_id":      driver_id,
                "route_id":       route_id,
                "transaction_id": transaction_id,
                "alert_type":     rule["rule"],
                "severity":       rule["severity"],
                "message":        rule["message"],
                "created_at":     datetime.utcnow().isoformat(),
                "resolved":       False
            })
        if fraud_result["status"] == "FLAGGED":
            penalty = min(fraud_result["fraud_score"] / 10, 10)
            await drivers_col().update_one(
                {"driver_id": driver_id},
                {"$inc": {"trust_score": -penalty, "flagged_trips": 1}}
            )

    return {
        "transaction_id": transaction_id,
        "meter_verification": {
            "reading_liters": meter_data.liters,
            "confidence":     meter_data.confidence,
            "display_type":   meter_data.display_type,
            "roi_detected":   True,
            "verdict":        cross.__dict__.get("verdict"),
            "fraud_flag":     meter_data.fraud_flag,
            "fraud_reason":   meter_data.fraud_reason,
            "pipeline_used":  meter_data.backend_used,
        },
        "receipt_ocr": {
            "liters":     receipt_data.liters,
            "amount_inr": receipt_data.amount_inr,
            "date":       receipt_data.date,
        },
        "cross_validation":  cross.__dict__,
        "fraud_score":       fraud_result["fraud_score"],
        "status":            fraud_result["status"],
        "triggered_rules":   fraud_result["triggered_rules"],
    }

# ════════════════════════════════════════════════════════════
#  PAYMENTS  — uses payment_gateway.py (UPIPaymentGateway)
# ════════════════════════════════════════════════════════════
@app.post("/payments/create", tags=["Payments"])
async def create_payment(payload: dict):
    """
    Creates a Razorpay UPI payment link for a verified fuel transaction.
    All payments go to fleet owner's single bank account.
    Each payment is tagged with driver_id + truck_id + route_id
    so transactions are fully differentiable in analytics.
    """
    transaction_id = payload.get("transaction_id")
    if not transaction_id:
        raise HTTPException(400, "transaction_id is required")

    # Fetch transaction, driver, station from MongoDB
    txn = await transactions_col().find_one(
        {"transaction_id": transaction_id}, {"_id": 0}
    )
    if not txn:
        raise HTTPException(404, "Transaction not found")

    driver = await drivers_col().find_one(
        {"driver_id": txn["driver_id"]}, {"_id": 0}
    )
    if not driver:
        raise HTTPException(404, "Driver not found")

    station = await stations_col().find_one(
        {"station_id": txn.get("station_id")}, {"_id": 0}
    )
    station_name = station["name"] if station else "Unknown Station"

    # ── Call payment_gateway.py to create Razorpay UPI link ──
    try:
        payment_link = gateway.create_fuel_payment_link(
            transaction_id = transaction_id,
            driver_id      = driver["driver_id"],
            driver_name    = driver["name"],
            driver_phone   = driver["phone"],
            truck_id       = txn["truck_id"],
            route_id       = txn["route_id"],
            amount_inr     = txn["fuel_amount_inr"],
            fuel_liters    = txn["fuel_liters_claimed"],
            station_name   = station_name
        )
    except Exception as e:
        # Razorpay not configured yet — return demo response
        payment_link = {
            "payment_link_id": f"plink_demo_{str(uuid.uuid4())[:8]}",
            "short_url":       "https://rzp.io/demo — add Razorpay keys to payment_gateway.py",
            "expires_at":      datetime.utcnow().isoformat()
        }

    # Save payment record to MongoDB — visible in Compass → payments
    payment_record = {
        "payment_link_id":     payment_link["payment_link_id"],
        "transaction_id":      transaction_id,
        "driver_id":           driver["driver_id"],
        "driver_name":         driver["name"],
        "truck_id":            txn["truck_id"],
        "route_id":            txn["route_id"],
        "amount_inr":          txn["fuel_amount_inr"],
        "fuel_liters":         txn["fuel_liters_claimed"],
        "station_name":        station_name,
        "upi_link":            payment_link["short_url"],
        "status":              "PENDING",
        "created_at":          datetime.utcnow().isoformat(),
        "expires_at":          payment_link.get("expires_at"),
        "razorpay_payment_id": None,
        "upi_transaction_id":  None,
        "paid_at":             None
    }
    await mongodb.db["payments"].insert_one(payment_record)

    # Update transaction with payment link
    await transactions_col().update_one(
        {"transaction_id": transaction_id},
        {"$set": {
            "payment_status": "PENDING",
            "payment_link":   payment_link["short_url"]
        }}
    )

    return {
        "payment_link_id": payment_record["payment_link_id"],
        "upi_link":        payment_record["upi_link"],
        "amount_inr":      txn["fuel_amount_inr"],
        "driver_name":     driver["name"],
        "driver_phone":    driver["phone"],
        "station_name":    station_name,
        "status":          "PENDING",
        "expires_at":      payment_record["expires_at"]
    }

@app.post("/payments/webhook", tags=["Payments"])
async def payment_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None)
):
    """
    Razorpay calls this after driver pays.
    Set URL in Razorpay Dashboard → Settings → Webhooks.
    Subscribe to: payment_link.paid, payment.captured
    """
    body         = await request.body()
    webhook_data = await request.json()

    # Verify webhook came from Razorpay
    if x_razorpay_signature:
        is_valid = gateway.verify_webhook_signature(body, x_razorpay_signature)
        if not is_valid:
            raise HTTPException(400, "Invalid webhook signature")

    # Parse webhook using payment_gateway.py
    parsed = gateway.parse_webhook_payment(webhook_data)

    if parsed.get("status") == "IGNORED":
        return {"status": "IGNORED", "event": parsed.get("event")}

    transaction_id = parsed.get("transaction_id")
    if not transaction_id:
        return {"status": "ERROR", "message": "No transaction_id in webhook notes"}

    # Update payment record in MongoDB
    await mongodb.db["payments"].update_one(
        {"transaction_id": transaction_id},
        {"$set": {
            "status":              "PAID",
            "razorpay_payment_id": parsed.get("razorpay_payment_id"),
            "upi_transaction_id":  parsed.get("upi_transaction_id"),
            "method":              parsed.get("method"),
            "paid_at":             parsed.get("paid_at")
        }}
    )

    # Update fuel transaction payment status
    await transactions_col().update_one(
        {"transaction_id": transaction_id},
        {"$set": {
            "payment_status":      "PAID",
            "razorpay_payment_id": parsed.get("razorpay_payment_id")
        }}
    )

    # Update driver total fuel spend
    await drivers_col().update_one(
        {"driver_id": parsed.get("driver_id")},
        {"$inc": {"total_fuel_spend": parsed.get("amount_inr", 0)}}
    )

    return {
        "status":         "PAYMENT_CONFIRMED",
        "transaction_id": transaction_id,
        "amount_inr":     parsed.get("amount_inr"),
        "driver_id":      parsed.get("driver_id"),
        "truck_id":       parsed.get("truck_id")
    }

@app.get("/payments/status/{payment_link_id}", tags=["Payments"])
async def get_payment_status(payment_link_id: str):
    """Poll payment status from Razorpay (for real-time status in driver app)."""
    try:
        status = gateway.get_payment_status(payment_link_id)
        return status
    except Exception as e:
        # Fallback: check local MongoDB record
        record = await mongodb.db["payments"].find_one(
            {"payment_link_id": payment_link_id}, {"_id": 0}
        )
        if not record:
            raise HTTPException(404, "Payment link not found")
        return record

@app.get("/payments/analytics", tags=["Payments"])
async def payment_analytics(
    driver_id: str = None,
    truck_id:  str = None,
    route_id:  str = None
):
    """
    Filterable analytics for fleet owner.
    All payments go to ONE account but are differentiable
    by driver_id / truck_id / route_id.
    """
    query = {}
    if driver_id: query["driver_id"] = driver_id
    if truck_id:  query["truck_id"]  = truck_id
    if route_id:  query["route_id"]  = route_id

    payments = await mongodb.db["payments"].find(
        query, {"_id": 0}
    ).sort("created_at", -1).to_list(500)

    paid    = [p for p in payments if p["status"] == "PAID"]
    pending = [p for p in payments if p["status"] == "PENDING"]
    total   = sum(p["amount_inr"] for p in paid)

    # Group by driver — shows per-driver spend
    by_driver = {}
    for p in paid:
        d = p["driver_id"]
        by_driver.setdefault(d, {
            "driver_name":  p.get("driver_name", d),
            "total_inr":    0.0,
            "transactions": 0,
            "liters":       0.0
        })
        by_driver[d]["total_inr"]    += p["amount_inr"]
        by_driver[d]["transactions"] += 1
        by_driver[d]["liters"]       += float(p.get("fuel_liters", 0))

    # Group by truck — shows per-truck spend
    by_truck = {}
    for p in paid:
        t = p["truck_id"]
        by_truck.setdefault(t, {"total_inr": 0.0, "transactions": 0})
        by_truck[t]["total_inr"]    += p["amount_inr"]
        by_truck[t]["transactions"] += 1

    return {
        "filters": {"driver_id": driver_id,
                    "truck_id":  truck_id,
                    "route_id":  route_id},
        "summary": {
            "total_transactions": len(payments),
            "paid":               len(paid),
            "pending":            len(pending),
            "total_spend_inr":    round(total, 2)
        },
        "by_driver":    by_driver,
        "by_truck":     by_truck,
        "transactions": payments
    }

@app.get("/payments/driver/{driver_id}", tags=["Payments"])
async def driver_payment_history(driver_id: str):
    """Full payment history for a single driver — for expense reports."""
    payments = await mongodb.db["payments"].find(
        {"driver_id": driver_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    total = sum(p["amount_inr"] for p in payments if p["status"] == "PAID")
    return {
        "driver_id":       driver_id,
        "total_payments":  len(payments),
        "total_spent_inr": round(total, 2),
        "payments":        payments
    }

# ════════════════════════════════════════════════════════════
#  DASHBOARD
# ════════════════════════════════════════════════════════════
@app.get("/dashboard/fleet", tags=["Dashboard"])
async def fleet_overview():
    trucks  = await trucks_col().find({},                  {"_id": 0}).to_list(500)
    alerts  = await alerts_col().find({"resolved": False}, {"_id": 0}).to_list(100)
    drivers = await drivers_col().find({},                 {"_id": 0}).to_list(500)
    return {
        "active_trucks": len(trucks),
        "open_alerts":   len(alerts),
        "trucks":        trucks,
        "alerts":        alerts,
        "drivers":       drivers
    }

@app.get("/dashboard/analytics/{truck_id}", tags=["Dashboard"])
async def truck_analytics(truck_id: str):
    txns = await transactions_col().find(
        {"truck_id": truck_id}, {"_id": 0}
    ).to_list(500)
    total_liters = sum(t.get("fuel_liters_claimed", 0) for t in txns)
    flagged      = [t for t in txns if t.get("verification_status") == "FLAGGED"]
    approved     = [t for t in txns if t.get("verification_status") == "APPROVED"]
    avg_score    = sum(t.get("fraud_score", 0) for t in txns) / max(len(txns), 1)
    return {
        "truck_id":           truck_id,
        "total_transactions": len(txns),
        "total_liters":       round(total_liters, 2),
        "flagged_count":      len(flagged),
        "approved_count":     len(approved),
        "avg_fraud_score":    round(avg_score, 2),
        "fraud_rate_pct":     round(len(flagged) / max(len(txns), 1) * 100, 2)
    }

# ════════════════════════════════════════════════════════════
#  ALERTS
# ════════════════════════════════════════════════════════════
@app.get("/alerts", tags=["Alerts"])
async def get_alerts(resolved: bool = False):
    alerts = await alerts_col().find(
        {"resolved": resolved}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return {"alerts": alerts, "count": len(alerts)}

@app.patch("/alerts/{alert_id}/resolve", tags=["Alerts"])
async def resolve_alert(alert_id: str, resolved_by: str = "fleet_manager"):
    result = await alerts_col().update_one(
        {"alert_id": alert_id},
        {"$set": {
            "resolved":    True,
            "resolved_by": resolved_by,
            "resolved_at": datetime.utcnow().isoformat()
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Alert not found")
    return {"status": "RESOLVED", "alert_id": alert_id}

# ════════════════════════════════════════════════════════════
#  TRANSACTIONS
# ════════════════════════════════════════════════════════════
@app.get("/transactions", tags=["Transactions"])
async def list_transactions(
    truck_id:  str = None,
    driver_id: str = None,
    status:    str = None,
    limit:     int = 50
):
    query = {}
    if truck_id:  query["truck_id"]            = truck_id
    if driver_id: query["driver_id"]           = driver_id
    if status:    query["verification_status"] = status
    txns = await transactions_col().find(
        query, {"_id": 0}
    ).sort("timestamp", -1).limit(limit).to_list(limit)
    return {"transactions": txns, "count": len(txns)}

@app.get("/transactions/{transaction_id}", tags=["Transactions"])
async def get_transaction(transaction_id: str):
    txn = await transactions_col().find_one(
        {"transaction_id": transaction_id}, {"_id": 0}
    )
    if not txn:
        raise HTTPException(404, "Transaction not found")
    return txn

# ════════════════════════════════════════════════════════════
#  SECURITY ENDPOINTS
# ════════════════════════════════════════════════════════════

# ── GPS Spoofing Scan ─────────────────────────────────────
@app.get("/security/gps-spoof/{truck_id}", tags=["Security"])
async def check_gps_spoofing(truck_id: str, last_n: int = 20):
    pings = await mongodb.db["gps_logs"].find(
        {"truck_id": truck_id}, {"_id": 0}
    ).sort("timestamp", -1).limit(last_n).to_list(last_n)
    pings.reverse()
    return spoof_detect.detect_teleport(pings)

# ── Idle / Speed Report ───────────────────────────────────
@app.get("/security/idle-report/{truck_id}", tags=["Security"])
async def idle_report(truck_id: str, route_id: str = None):
    query = {"truck_id": truck_id}
    if route_id:
        query["route_id"] = route_id
    pings = await mongodb.db["gps_logs"].find(
        query, {"_id": 0}
    ).sort("timestamp", 1).to_list(500)
    return idle_monitor.compute_trip_stats(pings)

# ── OTP: Create ───────────────────────────────────────────
@app.post("/security/otp/create", tags=["Security"])
async def create_station_otp(payload: dict):
    return await otp_verifier.create_otp_session(
        mongodb.db["otp_sessions"],
        payload["transaction_id"],
        payload["station_id"],
        payload["truck_id"]
    )

# ── OTP: Verify ───────────────────────────────────────────
@app.post("/security/otp/verify", tags=["Security"])
async def verify_station_otp(payload: dict):
    result = await otp_verifier.verify_otp(
        mongodb.db["otp_sessions"],
        payload["transaction_id"],
        payload["otp"]
    )
    if result["success"]:
        await transactions_col().update_one(
            {"transaction_id": payload["transaction_id"]},
            {"$set": {"station_otp_verified": True,
                      "station_otp_at": datetime.utcnow().isoformat()}}
        )
    return result

# ── GST Validation ────────────────────────────────────────
@app.get("/security/gst/{gst_number}", tags=["Security"])
async def validate_gst(gst_number: str):
    return gst_validator.validate_format(gst_number)

# ── Driver Blacklist ──────────────────────────────────────
@app.post("/security/blacklist/add", tags=["Security"])
async def add_to_blacklist(payload: dict):
    await blacklist_mgr.add_to_blacklist(
        mongodb.db["blacklist"],
        payload["driver_id"],
        payload["reason"],
        payload.get("added_by", "fleet_manager")
    )
    return {"status": "BLACKLISTED", "driver_id": payload["driver_id"]}

@app.get("/security/blacklist/{driver_id}", tags=["Security"])
async def check_blacklist(driver_id: str):
    return await blacklist_mgr.is_blacklisted(
        mongodb.db["blacklist"], driver_id
    )

# ── Emergency SOS ─────────────────────────────────────────
@app.post("/security/sos", tags=["Security"])
async def trigger_sos(payload: dict):
    return await sos.trigger_sos(
        alerts_col(),
        mongodb.db["sos_events"],
        payload["truck_id"],
        payload["driver_id"],
        payload["lat"],
        payload["lng"],
        payload.get("reason", "MANUAL")
    )

@app.get("/security/sos/active", tags=["Security"])
async def get_active_sos():
    events = await mongodb.db["sos_events"].find(
        {"resolved": False}, {"_id": 0}
    ).sort("timestamp", -1).to_list(50)
    return {"active_sos": events, "count": len(events)}

# ── Trip Integrity Seal ───────────────────────────────────
@app.post("/security/seal/create/{transaction_id}", tags=["Security"])
async def create_trip_seal(transaction_id: str):
    txn = await transactions_col().find_one(
        {"transaction_id": transaction_id}, {"_id": 0}
    )
    if not txn:
        raise HTTPException(404, "Transaction not found")
    seal = trip_seal.create_seal(txn)
    await transactions_col().update_one(
        {"transaction_id": transaction_id},
        {"$set": {"integrity_seal": seal,
                  "sealed_at": datetime.utcnow().isoformat()}}
    )
    return {"transaction_id": transaction_id, "seal": seal,
            "message": "Cryptographic seal applied -- any future change will break it"}

@app.get("/security/seal/verify/{transaction_id}", tags=["Security"])
async def verify_trip_seal(transaction_id: str):
    txn = await transactions_col().find_one(
        {"transaction_id": transaction_id}, {"_id": 0}
    )
    if not txn:
        raise HTTPException(404, "Transaction not found")
    stored_seal = txn.pop("integrity_seal", None)
    txn.pop("sealed_at", None)
    if not stored_seal:
        return {"verified": False, "message": "No seal exists for this transaction"}
    return trip_seal.verify_seal(txn, stored_seal)

# ── Restricted Zone Check ─────────────────────────────────
@app.post("/security/restricted-zone", tags=["Security"])
async def check_restricted_zone(payload: dict):
    zones = await mongodb.db["restricted_zones"].find(
        {}, {"_id": 0}
    ).to_list(200)
    return zone_checker.is_in_restricted_zone(
        payload["lat"], payload["lng"], zones
    )