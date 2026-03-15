# ============================================================
# fraud_detection.py — Rule-Based + ML Fraud Scoring Engine
# ============================================================
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class FraudCheckResult:
    rule_name: str
    triggered: bool
    severity: str        # LOW / MEDIUM / HIGH / CRITICAL
    message: str
    score_contribution: float  # 0-100

def haversine_distance_meters(lat1, lon1, lat2, lon2) -> float:
    """Returns distance between two GPS coordinates in meters."""
    R = 6371000  # Earth radius in meters
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi/2)**2 + cos(phi1)*cos(phi2)*sin(dlambda/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1-a))

class FraudDetectionEngine:
    """
    Applies 10 fraud detection rules and returns a composite fraud score (0-100).
    Score > 70 = AUTO-FLAG, Score 40-70 = REVIEW, Score < 40 = APPROVE
    """
    TANK_TOLERANCE = 1.05       # Allow 5% over tank capacity for rounding
    MAX_REFUEL_FREQUENCY_HRS = 4  # Minimum hours between refuels
    STATION_PROXIMITY_METERS = 150
    ROUTE_DEVIATION_METERS = 500
    MAX_PRICE_PER_LITER_INR = 120.0
    MIN_PRICE_PER_LITER_INR = 85.0

    def check_all(self, transaction: dict, truck: dict, route: dict,
                  previous_transactions: List[dict],
                  fuel_stations: List[dict]) -> dict:

        checks = [
            self._rule_excess_fuel(transaction, truck),
            self._rule_station_not_on_route(transaction, route, fuel_stations),
            self._rule_timestamp_mismatch(transaction),
            self._rule_refuel_too_frequent(transaction, previous_transactions),
            self._rule_no_exif_data(transaction),
            self._rule_impossible_price(transaction),
            self._rule_ocr_mismatch(transaction),
            self._rule_route_deviation(transaction, route),
            self._rule_no_gps_during_fueling(transaction),
            self._rule_night_fueling_offroute(transaction, route),
            self._rule_early_refuel_by_distance(transaction, truck, previous_transactions),
        ]

        total_score = sum(c.score_contribution for c in checks if c.triggered)
        total_score = min(total_score, 100.0)
        triggered_rules = [c for c in checks if c.triggered]

        status = "APPROVED"
        if total_score >= 70:
            status = "FLAGGED"
        elif total_score >= 40:
            status = "REVIEW"

        return {
            "fraud_score": round(total_score, 2),
            "status": status,
            "triggered_rules": [
                {"rule": c.rule_name, "severity": c.severity,
                 "message": c.message, "score": c.score_contribution}
                for c in triggered_rules
            ]
        }

    def _rule_excess_fuel(self, tx, truck) -> FraudCheckResult:
        name = "EXCESS_FUEL_CLAIMED"
        capacity = truck["tank_capacity_liters"] * self.TANK_TOLERANCE
        claimed = tx["fuel_liters_claimed"]
        if claimed > capacity:
            return FraudCheckResult(name, True, "CRITICAL",
                f"Claimed {claimed}L exceeds tank capacity {truck['tank_capacity_liters']}L",
                score_contribution=40.0)
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_station_not_on_route(self, tx, route, stations) -> FraudCheckResult:
        name = "STATION_NOT_ON_ROUTE"
        allowed_ids = route.get("assigned_fuel_stations", [])
        if tx.get("station_id") not in allowed_ids:
            return FraudCheckResult(name, True, "HIGH",
                "Fueling occurred at a station not assigned to this route",
                score_contribution=30.0)
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_timestamp_mismatch(self, tx) -> FraudCheckResult:
        name = "TIMESTAMP_MISMATCH"
        exif_ts = tx.get("exif_timestamp")
        system_ts = tx.get("timestamp")
        if not exif_ts:
            return FraudCheckResult(name, True, "MEDIUM",
                "Photo has no EXIF timestamp — possible pre-captured/fake photo",
                score_contribution=25.0)
        # Check if EXIF time differs from upload time by more than 10 minutes
        try:
            exif_dt = datetime.strptime(exif_ts, "%Y:%m:%d %H:%M:%S")
            system_dt = datetime.fromisoformat(system_ts)
            diff = abs((exif_dt - system_dt).total_seconds())
            if diff > 600:
                return FraudCheckResult(name, True, "HIGH",
                    f"EXIF time differs from upload time by {diff/60:.1f} min",
                    score_contribution=35.0)
        except Exception:
            return FraudCheckResult(name, True, "MEDIUM",
                "Could not parse timestamps for comparison", score_contribution=15.0)
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_refuel_too_frequent(self, tx, prev_txns) -> FraudCheckResult:
        name = "REFUEL_TOO_FREQUENT"
        if not prev_txns:
            return FraudCheckResult(name, False, "NONE", "", 0)
        last_tx_time = datetime.fromisoformat(prev_txns[-1]["timestamp"])
        current_time = datetime.fromisoformat(tx["timestamp"])
        hours_since_last = (current_time - last_tx_time).total_seconds() / 3600
        if hours_since_last < self.MAX_REFUEL_FREQUENCY_HRS:
            return FraudCheckResult(name, True, "HIGH",
                f"Refueled only {hours_since_last:.1f}h after previous fill-up",
                score_contribution=30.0)
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_no_exif_data(self, tx) -> FraudCheckResult:
        name = "NO_EXIF_GPS"
        if not tx.get("photo_gps_lat") or not tx.get("photo_gps_lng"):
            return FraudCheckResult(name, True, "MEDIUM",
                "Photo GPS metadata missing — camera GPS may be disabled",
                score_contribution=20.0)
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_impossible_price(self, tx) -> FraudCheckResult:
        name = "IMPOSSIBLE_PRICE_PER_LITER"
        liters = tx.get("fuel_liters_claimed", 0)
        amount = tx.get("fuel_amount_inr", 0)
        if liters > 0:
            ppl = amount / liters
            if ppl > self.MAX_PRICE_PER_LITER_INR or ppl < self.MIN_PRICE_PER_LITER_INR:
                return FraudCheckResult(name, True, "HIGH",
                    f"Price per liter ₹{ppl:.2f} is outside market range (₹85-₹120)",
                    score_contribution=25.0)
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_ocr_mismatch(self, tx) -> FraudCheckResult:
        name = "OCR_AMOUNT_MISMATCH"
        claimed = tx.get("fuel_liters_claimed")
        ocr_liters = tx.get("ocr_extracted_liters")
        if claimed and ocr_liters:
            diff_pct = abs(claimed - ocr_liters) / max(claimed, 0.001) * 100
            if diff_pct > 10:  # >10% mismatch between claim and OCR
                return FraudCheckResult(name, True, "CRITICAL",
                    f"Claimed {claimed}L but OCR reads {ocr_liters}L ({diff_pct:.1f}% mismatch)",
                    score_contribution=45.0)
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_route_deviation(self, tx, route) -> FraudCheckResult:
        name = "ROUTE_DEVIATION"
        gps_lat = tx.get("gps_lat")
        gps_lng = tx.get("gps_lng")
        if not gps_lat or not route.get("waypoints"):
            return FraudCheckResult(name, False, "NONE", "", 0)
        min_dist = min(
            haversine_distance_meters(gps_lat, gps_lng, wp["lat"], wp["lng"])
            for wp in route["waypoints"]
        )
        if min_dist > self.ROUTE_DEVIATION_METERS:
            return FraudCheckResult(name, True, "HIGH",
                f"Truck is {min_dist:.0f}m off-route (max allowed: {self.ROUTE_DEVIATION_METERS}m)",
                score_contribution=35.0)
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_no_gps_during_fueling(self, tx) -> FraudCheckResult:
        name = "GPS_SIGNAL_LOST_DURING_FUELING"
        if not tx.get("gps_lat") or not tx.get("gps_lng"):
            return FraudCheckResult(name, True, "HIGH",
                "No GPS signal recorded during fueling event",
                score_contribution=30.0)
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_night_fueling_offroute(self, tx, route) -> FraudCheckResult:
        name = "NIGHT_FUELING_OFF_SCHEDULE"
        try:
            ts = datetime.fromisoformat(tx["timestamp"])
            is_night = ts.hour < 5 or ts.hour >= 23
            if is_night and tx.get("station_id") not in route.get("assigned_fuel_stations", []):
                return FraudCheckResult(name, True, "MEDIUM",
                    f"Fueling at {ts.strftime('%H:%M')} at unregistered station",
                    score_contribution=20.0)
        except Exception:
            pass
        return FraudCheckResult(name, False, "NONE", "", 0)

    def _rule_early_refuel_by_distance(self, tx, truck, prev_txns) -> FraudCheckResult:
        """
        Flags when a driver refuels after traveling far less distance than
        the truck's fuel efficiency would require.

        Example: Truck does 3.5 km/L with 400L tank -> ~1400 km range.
                 If the driver claimed 200L last refuel but only traveled
                 100 km since then, they should still have ~600 km of fuel
                 left -> suspicious early refuel.

        Logic:
          1. Get last refuel GPS (lat/lng) from previous transactions.
          2. Calculate haversine distance from last refuel to current position.
          3. Compute how many liters the truck SHOULD have used for that distance.
          4. Compare against last refuel amount -- if distance-based consumption
             is <= 50% of last fill, the refuel is suspiciously early.
        """
        name = "EARLY_REFUEL_DISTANCE"

        # Need current GPS, truck efficiency, and at least one prior transaction
        current_lat = tx.get("gps_lat")
        current_lng = tx.get("gps_lng")
        efficiency  = truck.get("fuel_efficiency_km_per_liter")

        if not current_lat or not current_lng or not efficiency or not prev_txns:
            return FraudCheckResult(name, False, "NONE", "", 0)

        # Find the most recent previous transaction with GPS data
        last_tx = None
        for ptx in prev_txns:
            if ptx.get("gps_lat") and ptx.get("gps_lng"):
                last_tx = ptx
                break

        if not last_tx:
            return FraudCheckResult(name, False, "NONE", "", 0)

        # Distance traveled since last refuel (km)
        distance_km = haversine_distance_meters(
            last_tx["gps_lat"], last_tx["gps_lng"],
            current_lat, current_lng
        ) / 1000.0

        # How many liters the truck should have burned over that distance
        expected_consumption = distance_km / efficiency

        # How much fuel was loaded in the last refuel
        last_fill_liters = last_tx.get("fuel_liters_claimed", 0)

        if last_fill_liters <= 0:
            return FraudCheckResult(name, False, "NONE", "", 0)

        # If the truck consumed <= 50% of its last fill, it's refueling
        # while still having plenty of fuel -- suspicious
        consumption_ratio = expected_consumption / last_fill_liters

        if consumption_ratio <= 0.50:
            return FraudCheckResult(
                name, True, "HIGH",
                f"Driver refueled after only {distance_km:.0f} km "
                f"(~{expected_consumption:.1f}L used of {last_fill_liters:.0f}L filled). "
                f"Truck should still have ~{last_fill_liters - expected_consumption:.0f}L remaining.",
                score_contribution=30.0
            )

        return FraudCheckResult(name, False, "NONE", "", 0)