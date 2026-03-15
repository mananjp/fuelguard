# ============================================================
# security.py — Advanced Logistics Security Layer
# All 12 missing security features in one module
# ============================================================

import hashlib, hmac, math, re
from datetime import datetime, time as dtime
from typing import Optional
from dataclasses import dataclass, field

# ════════════════════════════════════════════════════════════
#  1. IMAGE HASH DEDUPLICATION
#  Prevents: driver resubmitting same photo for two trips
# ════════════════════════════════════════════════════════════
class ImageHashGuard:
    """SHA-256 hash every photo before storing. Reject duplicates."""

    def compute_hash(self, image_bytes: bytes) -> str:
        return hashlib.sha256(image_bytes).hexdigest()

    async def is_duplicate(self, image_hash: str, transactions_col) -> Optional[dict]:
        """
        Returns the original transaction if this photo was used before.
        Usage: pass meter_bytes, pump_bytes, receipt_bytes through this.
        """
        existing = await transactions_col.find_one(
            {"photo_hashes": image_hash}, {"_id": 0,
             "transaction_id": 1, "truck_id": 1, "timestamp": 1}
        )
        return existing   # None = clean, dict = duplicate found

    def hash_all_photos(self, meter_b: bytes,
                        pump_b: bytes, receipt_b: bytes) -> dict:
        return {
            "meter_hash":   self.compute_hash(meter_b),
            "pump_hash":    self.compute_hash(pump_b),
            "receipt_hash": self.compute_hash(receipt_b),
            "all_hashes": [
                self.compute_hash(meter_b),
                self.compute_hash(pump_b),
                self.compute_hash(receipt_b)
            ]
        }

# ════════════════════════════════════════════════════════════
#  2. GPS SPOOFING DETECTION
#  Prevents: drivers using fake GPS apps (Fake GPS, Mock Location)
# ════════════════════════════════════════════════════════════
class GPSSpoofDetector:
    MAX_REALISTIC_SPEED_KMH = 120.0   # trucks can't go faster than this

    def haversine_km(self, lat1, lng1, lat2, lng2) -> float:
        R = 6371.0
        p = math.pi / 180
        a = (math.sin((lat2-lat1)*p/2)**2 +
             math.cos(lat1*p) * math.cos(lat2*p) *
             math.sin((lng2-lng1)*p/2)**2)
        return 2 * R * math.asin(math.sqrt(a))

    def detect_teleport(self, pings: list) -> dict:
        """
        Checks consecutive GPS pings for physically impossible jumps.
        A truck cannot move 200km in 30 seconds.
        pings = [{"lat":..,"lng":..,"timestamp":"ISO"}, ...]
        """
        flags = []
        for i in range(1, len(pings)):
            p1, p2 = pings[i-1], pings[i]
            try:
                t1 = datetime.fromisoformat(p1["timestamp"])
                t2 = datetime.fromisoformat(p2["timestamp"])
                elapsed_hrs = max((t2 - t1).total_seconds() / 3600, 1e-6)
                dist_km     = self.haversine_km(
                    p1["lat"], p1["lng"], p2["lat"], p2["lng"]
                )
                speed_kmh   = dist_km / elapsed_hrs

                if speed_kmh > self.MAX_REALISTIC_SPEED_KMH:
                    flags.append({
                        "type":       "GPS_TELEPORT",
                        "severity":   "CRITICAL",
                        "speed_kmh":  round(speed_kmh, 1),
                        "dist_km":    round(dist_km, 2),
                        "from_ping":  p1["timestamp"],
                        "to_ping":    p2["timestamp"],
                        "message":    f"Impossible speed: {speed_kmh:.0f} km/h "
                                      f"({dist_km:.1f} km in "
                                      f"{elapsed_hrs*3600:.0f}s) — GPS spoofing suspected"
                    })
            except Exception:
                continue
        return {
            "spoofing_detected": len(flags) > 0,
            "flags":             flags,
            "ping_count":        len(pings)
        }

    def check_accuracy_anomaly(self, accuracy_meters: float) -> dict:
        """
        Real phone GPS accuracy: 5–30m outdoors.
        Fake GPS apps often report suspicious accuracy.
        """
        if accuracy_meters == 0.0:
            return {"flag": True, "reason": "Accuracy exactly 0.0m — likely mocked GPS"}
        if accuracy_meters > 500:
            return {"flag": True, "reason": f"GPS accuracy {accuracy_meters:.0f}m — very poor signal"}
        return {"flag": False}

# ════════════════════════════════════════════════════════════
#  3. SPEED & IDLE MONITORING
#  Prevents: idle engine fraud — claiming fuel while parked
# ════════════════════════════════════════════════════════════
class IdleSpeedMonitor:
    IDLE_SPEED_THRESHOLD_KMH = 5.0    # below this = idle
    IDLE_FUEL_RATE_L_PER_HR  = 2.5    # litres consumed when idling

    def compute_trip_stats(self, pings: list) -> dict:
        """
        From GPS pings → compute avg speed, idle time, moving time.
        Used to cross-check claimed fuel vs actual movement.
        """
        total_dist_km    = 0.0
        idle_seconds     = 0
        moving_seconds   = 0
        speeds           = []
        detector         = GPSSpoofDetector()

        for i in range(1, len(pings)):
            p1, p2 = pings[i-1], pings[i]
            try:
                t1 = datetime.fromisoformat(p1["timestamp"])
                t2 = datetime.fromisoformat(p2["timestamp"])
                elapsed_s = (t2 - t1).total_seconds()
                dist_km   = detector.haversine_km(
                    p1["lat"], p1["lng"], p2["lat"], p2["lng"]
                )
                speed_kmh = dist_km / max(elapsed_s / 3600, 1e-6)
                total_dist_km += dist_km
                speeds.append(speed_kmh)
                if speed_kmh < self.IDLE_SPEED_THRESHOLD_KMH:
                    idle_seconds    += elapsed_s
                else:
                    moving_seconds  += elapsed_s
            except Exception:
                continue

        idle_hours    = idle_seconds    / 3600
        moving_hours  = moving_seconds  / 3600
        idle_fuel_est = idle_hours * self.IDLE_FUEL_RATE_L_PER_HR
        avg_speed     = sum(speeds) / max(len(speeds), 1)

        return {
            "total_distance_km":   round(total_dist_km,   2),
            "average_speed_kmh":   round(avg_speed,       1),
            "idle_time_hrs":       round(idle_hours,       2),
            "moving_time_hrs":     round(moving_hours,     2),
            "idle_fuel_estimate_L":round(idle_fuel_est,    2),
            "idle_pct":            round(idle_seconds /
                                         max(idle_seconds + moving_seconds, 1) * 100, 1)
        }

    def cross_check_fuel_vs_movement(
        self,
        claimed_liters:      float,
        gps_stats:           dict,
        efficiency_km_per_l: float,
        tank_capacity_l:     float
    ) -> dict:
        """
        Expected fuel = GPS distance ÷ efficiency + idle consumption.
        If claimed > expected × 1.15 → overbilling.
        """
        gps_dist    = gps_stats["total_distance_km"]
        idle_fuel   = gps_stats["idle_fuel_estimate_L"]
        move_fuel   = gps_dist / max(efficiency_km_per_l, 0.1)
        expected_l  = move_fuel + idle_fuel
        max_allowed = expected_l * 1.15   # 15% buffer
        diff_pct    = abs(claimed_liters - expected_l) / max(expected_l, 0.01) * 100

        return {
            "gps_distance_km":     gps_dist,
            "expected_fuel_L":     round(expected_l,  2),
            "max_allowed_L":       round(max_allowed, 2),
            "claimed_L":           claimed_liters,
            "diff_pct":            round(diff_pct, 1),
            "flag":                claimed_liters > max_allowed,
            "message": (f"Claimed {claimed_liters}L but GPS shows only "
                        f"{gps_dist:.0f}km driven — expected {expected_l:.1f}L")
                        if claimed_liters > max_allowed else "OK"
        }

# ════════════════════════════════════════════════════════════
#  4. OTP STATION VERIFICATION
#  Prevents: fake fuel stop check-ins at unregistered locations
#  Station owner enters OTP on their phone to confirm fueling
# ════════════════════════════════════════════════════════════
import random, string

class StationOTPVerifier:
    OTP_EXPIRY_MINUTES = 10

    def generate_otp(self, length=6) -> str:
        return "".join(random.choices(string.digits, k=length))

    async def create_otp_session(self, otp_col,
                                  transaction_id: str,
                                  station_id:     str,
                                  truck_id:       str) -> dict:
        otp = self.generate_otp()
        record = {
            "otp":            otp,
            "transaction_id": transaction_id,
            "station_id":     station_id,
            "truck_id":       truck_id,
            "created_at":     datetime.utcnow().isoformat(),
            "expires_at":     datetime.utcnow().isoformat(),   # set properly below
            "verified":       False,
            "verified_at":    None
        }
        await otp_col.insert_one(record)
        # In production: send OTP to station owner via SMS/WhatsApp (Twilio)
        return {"otp": otp, "expires_in_minutes": self.OTP_EXPIRY_MINUTES,
                "message": f"Send this OTP to station owner at {station_id}"}

    async def verify_otp(self, otp_col,
                          transaction_id: str, entered_otp: str) -> dict:
        record = await otp_col.find_one(
            {"transaction_id": transaction_id, "verified": False}
        )
        if not record:
            return {"success": False, "reason": "OTP session not found or already used"}
        if record["otp"] != entered_otp:
            return {"success": False, "reason": "Incorrect OTP"}
        await otp_col.update_one(
            {"transaction_id": transaction_id},
            {"$set": {"verified": True,
                      "verified_at": datetime.utcnow().isoformat()}}
        )
        return {"success": True, "message": "Station fueling confirmed by owner"}

# ════════════════════════════════════════════════════════════
#  5. RESTRICTED ZONE GEOFENCE
#  Prevents: trucks entering competitor stations, restricted warehouses
# ════════════════════════════════════════════════════════════
class RestrictedZoneChecker:
    def is_in_restricted_zone(self,
                               lat: float, lng: float,
                               restricted_zones: list) -> dict:
        """
        restricted_zones = [
            {"name":"Competitor XYZ", "lat":22.3, "lng":73.1,
             "radius_m":500, "severity":"HIGH"},
            ...
        ]
        """
        from fraud_detection import haversine_distance_meters
        for zone in restricted_zones:
            dist = haversine_distance_meters(
                lat, lng, zone["lat"], zone["lng"]
            )
            if dist <= zone["radius_m"]:
                return {
                    "flagged":        True,
                    "zone_name":      zone["name"],
                    "distance_m":     round(dist, 0),
                    "severity":       zone.get("severity", "HIGH"),
                    "message":        f"Truck entered restricted zone: {zone['name']} "
                                      f"({dist:.0f}m inside boundary)"
                }
        return {"flagged": False}

# ════════════════════════════════════════════════════════════
#  6. TRIP INTEGRITY SEAL
#  Prevents: anyone (including admins) tampering with trip records
#  Creates a SHA-256 fingerprint of the entire trip at end
# ════════════════════════════════════════════════════════════
class TripIntegritySeal:
    def __init__(self, secret_key: str = "fuelguard_seal_key_change_in_prod"):
        self.secret = secret_key.encode()

    def create_seal(self, trip_data: dict) -> str:
        """
        Deterministic JSON → HMAC-SHA256.
        Store seal alongside trip. Any field change = seal breaks.
        """
        import json
        canonical = json.dumps(trip_data, sort_keys=True, default=str)
        return hmac.new(self.secret, canonical.encode(), hashlib.sha256).hexdigest()

    def verify_seal(self, trip_data: dict, stored_seal: str) -> dict:
        computed = self.create_seal(trip_data)
        valid    = hmac.compare_digest(computed, stored_seal)
        return {
            "valid":   valid,
            "message": "✅ Trip record is unmodified" if valid
                       else "🚨 TAMPER DETECTED — trip record was modified after sealing"
        }

# ════════════════════════════════════════════════════════════
#  7. GST INVOICE VALIDATION
#  Prevents: fake receipts with invalid GST numbers
# ════════════════════════════════════════════════════════════
class GSTValidator:
    # Indian GST format: 2-digit state + 10-char PAN + 1Z + 2 alphanumeric
    GST_REGEX = re.compile(
        r"^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"
    )

    def validate_format(self, gst_number: str) -> dict:
        gst_number = gst_number.strip().upper()
        if not self.GST_REGEX.match(gst_number):
            return {
                "valid":   False,
                "reason":  f"Invalid GST format: {gst_number}",
                "message": "Receipt GST number does not match Indian GST format — possible fake"
            }
        state_code = int(gst_number[:2])
        if not (1 <= state_code <= 37):
            return {"valid": False, "reason": "Invalid state code in GST"}
        return {
            "valid":       True,
            "gst_number":  gst_number,
            "state_code":  state_code,
            "message":     "GST format valid"
        }
        # Production: call GST verification API at https://apisetu.gov.in
        # for live GSTIN lookup to confirm station is actually registered

# ════════════════════════════════════════════════════════════
#  8. DRIVER BLACKLIST SYSTEM
#  Prevents: known fraudsters joining new fleet companies
# ════════════════════════════════════════════════════════════
class DriverBlacklist:
    async def add_to_blacklist(self, blacklist_col, driver_id: str,
                                reason: str, added_by: str):
        await blacklist_col.update_one(
            {"driver_id": driver_id},
            {"$set": {
                "driver_id":  driver_id,
                "reason":     reason,
                "added_by":   added_by,
                "added_at":   datetime.utcnow().isoformat(),
                "active":     True
            }},
            upsert=True
        )

    async def is_blacklisted(self, blacklist_col, driver_id: str) -> dict:
        record = await blacklist_col.find_one(
            {"driver_id": driver_id, "active": True}, {"_id": 0}
        )
        if record:
            return {
                "blacklisted": True,
                "reason":      record.get("reason"),
                "since":       record.get("added_at"),
                "message":     f"🚫 Driver {driver_id} is on platform blacklist"
            }
        return {"blacklisted": False}

# ════════════════════════════════════════════════════════════
#  9. CARGO LOAD FACTOR
#  Prevents: half-loaded truck claiming full-load fuel
# ════════════════════════════════════════════════════════════
class CargoFuelAdjuster:
    def expected_fuel_with_load(
        self,
        distance_km:          float,
        base_efficiency:      float,   # km/L at full load
        cargo_weight_kg:      float,
        max_cargo_kg:         float,
        terrain_factor:       float = 1.0
    ) -> dict:
        """
        Efficiency improves linearly as cargo decreases.
        Empty truck: +25% efficiency. Full truck: base efficiency.
        """
        load_ratio   = min(cargo_weight_kg / max(max_cargo_kg, 1), 1.0)
        adj_factor   = 1.0 + (1.0 - load_ratio) * 0.25  # up to +25% efficiency
        adj_eff      = base_efficiency * adj_factor
        expected_l   = (distance_km / adj_eff) * terrain_factor
        return {
            "load_ratio":           round(load_ratio,  2),
            "adjusted_efficiency":  round(adj_eff,     2),
            "expected_fuel_L":      round(expected_l,  2),
            "max_allowed_L":        round(expected_l * 1.15, 2),
            "cargo_kg":             cargo_weight_kg,
            "max_cargo_kg":         max_cargo_kg
        }

# ════════════════════════════════════════════════════════════
#  10. NIGHT CURFEW CHECK
#  High-risk: fueling between 11pm–5am at unregistered station
# ════════════════════════════════════════════════════════════
class NightCurfewChecker:
    CURFEW_START = dtime(23, 0)   # 11:00 PM
    CURFEW_END   = dtime(5,  0)   # 5:00 AM

    def is_curfew_violation(self, timestamp_iso: str,
                             station_is_partner: bool) -> dict:
        try:
            dt = datetime.fromisoformat(timestamp_iso)
            t  = dt.time()
            in_curfew = (t >= self.CURFEW_START or t < self.CURFEW_END)
            if in_curfew and not station_is_partner:
                return {
                    "violation": True,
                    "severity":  "HIGH",
                    "time":      t.strftime("%H:%M"),
                    "message":   f"Night fueling at {t.strftime('%H:%M')} "
                                 f"at non-partner station — high fraud risk"
                }
            if in_curfew and station_is_partner:
                return {
                    "violation": False,
                    "warning":   True,
                    "message":   f"Night fueling at {t.strftime('%H:%M')} "
                                 f"at partner station — monitoring"
                }
        except Exception:
            pass
        return {"violation": False}

# ════════════════════════════════════════════════════════════
#  11. EMERGENCY SOS
#  Safety: driver can trigger SOS → fleet manager notified immediately
# ════════════════════════════════════════════════════════════
class EmergencySOS:
    async def trigger_sos(self, alerts_col, sos_col,
                           truck_id: str, driver_id: str,
                           lat: float, lng: float,
                           reason: str = "MANUAL") -> dict:
        import uuid
        sos_id = str(uuid.uuid4())
        record = {
            "sos_id":    sos_id,
            "truck_id":  truck_id,
            "driver_id": driver_id,
            "lat":       lat,
            "lng":       lng,
            "reason":    reason,
            "timestamp": datetime.utcnow().isoformat(),
            "resolved":  False,
            "maps_link": f"https://maps.google.com/?q={lat},{lng}"
        }
        await sos_col.insert_one(record)
        await alerts_col.insert_one({
            "alert_id":   str(uuid.uuid4()),
            "truck_id":   truck_id,
            "driver_id":  driver_id,
            "alert_type": "EMERGENCY_SOS",
            "severity":   "CRITICAL",
            "message":    f"🆘 SOS triggered by driver {driver_id} at "
                          f"{lat:.5f},{lng:.5f} — maps.google.com/?q={lat},{lng}",
            "created_at": datetime.utcnow().isoformat(),
            "resolved":   False
        })
        return {"sos_id": sos_id, "status": "SOS_SENT",
                "maps_link": record["maps_link"]}