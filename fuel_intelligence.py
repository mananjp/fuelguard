# ============================================================
# fuel_intelligence.py — Route & Fuel Consumption Calculator
# ============================================================
from math import radians, sin, cos, sqrt, atan2
from typing import List, Tuple

class FuelIntelligence:
    """
    Calculates expected fuel consumption, flags anomalies,
    and identifies optimal refueling stops along a route.
    """
    DIESEL_DENSITY_KG_PER_L = 0.832

    def haversine_km(self, lat1, lon1, lat2, lon2) -> float:
        R = 6371.0
        phi1, phi2 = radians(lat1), radians(lat2)
        dphi = radians(lat2 - lat1)
        dlambda = radians(lon2 - lon1)
        a = sin(dphi/2)**2 + cos(phi1)*cos(phi2)*sin(dlambda/2)**2
        return R * 2 * atan2(sqrt(a), sqrt(1-a))

    def calculate_route_distance(self, waypoints: List[dict]) -> float:
        """Returns total route distance in KM from ordered waypoints."""
        total = 0.0
        for i in range(len(waypoints) - 1):
            total += self.haversine_km(
                waypoints[i]["lat"], waypoints[i]["lng"],
                waypoints[i+1]["lat"], waypoints[i+1]["lng"]
            )
        return round(total, 2)

    def expected_fuel_liters(self, distance_km: float,
                              efficiency_km_per_liter: float,
                              load_factor: float = 1.0,
                              terrain_factor: float = 1.0) -> dict:
        """
        Calculates expected fuel consumption with adjustment factors.

        load_factor: 1.0 = full load, 0.8 = empty truck (uses ~15% less fuel)
        terrain_factor: 1.0 = flat, 1.2 = hilly, 1.35 = mountainous

        Example:
          distance=450km, efficiency=3.5km/L, load=full, terrain=flat
          base = 450/3.5 = 128.57L
          adjusted = 128.57 * 1.0 * 1.0 = 128.57L
          buffer (10%) = 141.43L max allowed
        """
        base_liters = distance_km / efficiency_km_per_liter
        adjusted = base_liters * load_factor * terrain_factor
        return {
            "base_liters": round(base_liters, 2),
            "adjusted_liters": round(adjusted, 2),
            "max_allowed_liters": round(adjusted * 1.10, 2),  # 10% buffer
            "distance_km": distance_km
        }

    def find_nearest_stations(self, current_lat: float, current_lng: float,
                               stations: List[dict], top_n: int = 3) -> List[dict]:
        """Returns top N nearest verified fuel stations with distances."""
        with_dist = []
        for station in stations:
            dist = self.haversine_km(current_lat, current_lng,
                                      station["lat"], station["lng"])
            with_dist.append({**station, "distance_km": round(dist, 2)})
        with_dist.sort(key=lambda x: x["distance_km"])
        return with_dist[:top_n]

    def recommended_refuel_points(self, waypoints: List[dict],
                                   tank_capacity_liters: float,
                                   efficiency_km_per_liter: float,
                                   stations: List[dict]) -> List[dict]:
        """
        Determines where along the route the truck MUST refuel
        before running out of fuel, based on usable range.

        Usable range = 80% of tank (safety margin)
        """
        safe_range_km = (tank_capacity_liters * 0.80) * efficiency_km_per_liter
        refuel_points = []
        distance_since_last_refuel = 0.0

        for i in range(len(waypoints) - 1):
            seg_dist = self.haversine_km(
                waypoints[i]["lat"], waypoints[i]["lng"],
                waypoints[i+1]["lat"], waypoints[i+1]["lng"]
            )
            distance_since_last_refuel += seg_dist
            if distance_since_last_refuel >= safe_range_km * 0.75:
                # Find nearest station to current waypoint
                nearest = self.find_nearest_stations(
                    waypoints[i]["lat"], waypoints[i]["lng"], stations, top_n=1
                )
                if nearest:
                    refuel_points.append({
                        "at_waypoint": i,
                        "distance_covered_km": round(distance_since_last_refuel, 2),
                        "recommended_station": nearest[0]
                    })
                    distance_since_last_refuel = 0.0
        return refuel_points

    def detect_consumption_anomaly(self, expected_liters: float,
                                    actual_liters: float) -> dict:
        """
        Flags anomaly if actual consumption deviates from expected.
        >15% over expected → possible overbilling
        >30% under expected → possible fuel siphoning (pre-filled elsewhere)
        """
        pct_diff = ((actual_liters - expected_liters) / expected_liters) * 100
        if pct_diff > 15:
            return {"anomaly": True, "type": "OVERBILLING",
                    "message": f"Consumed {pct_diff:.1f}% more than expected",
                    "pct_diff": round(pct_diff, 2)}
        if pct_diff < -30:
            return {"anomaly": True, "type": "POSSIBLE_SIPHONING",
                    "message": f"Consumed {abs(pct_diff):.1f}% less than expected",
                    "pct_diff": round(pct_diff, 2)}
        return {"anomaly": False, "pct_diff": round(pct_diff, 2)}