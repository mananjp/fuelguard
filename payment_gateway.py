# ============================================================
# payment_gateway.py — UPI Payment Gateway (Razorpay)
# ============================================================
# HOW IT WORKS:
#   - Fleet owner has ONE Razorpay account linked to their bank
#   - Each fuel transaction generates a unique UPI payment link
#   - Driver pays via any UPI app (GPay, PhonePe, Paytm, BHIM)
#   - Payment lands in owner's bank account
#   - Razorpay webhook fires → FastAPI logs it → MongoDB updated
#   - Every payment is tagged with driver_id + truck_id + route_id
#   - All transactions are fully differentiable in dashboard
# ============================================================

import razorpay
import hmac, hashlib, json
from datetime import datetime, timedelta

# ── Razorpay Client Setup ────────────────────────────────
# Get these from https://dashboard.razorpay.com → Settings → API Keys
RAZORPAY_KEY_ID     = "rzp_test_XXXXXXXXXXXX"   # Replace with your key
RAZORPAY_KEY_SECRET = "XXXXXXXXXXXXXXXXXXXXXXXX" # Replace with your secret
WEBHOOK_SECRET      = "your_webhook_secret"       # Set in Razorpay Dashboard → Webhooks

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class UPIPaymentGateway:
    """
    Manages the full UPI payment lifecycle for FuelGuard.

    Flow:
      create_fuel_payment_link()
        → Driver scans QR / taps link → pays via UPI app
        → Razorpay sends webhook to /payments/webhook
        → confirm_payment_webhook() verifies + logs to MongoDB
    """

    def create_fuel_payment_link(
        self,
        transaction_id: str,
        driver_id: str,
        driver_name: str,
        driver_phone: str,
        truck_id: str,
        route_id: str,
        amount_inr: float,
        fuel_liters: float,
        station_name: str,
        expires_in_minutes: int = 30     # Link expires in 30 min
    ) -> dict:
        """
        Creates a Razorpay UPI Payment Link for a single fuel transaction.
        Amount goes directly to fleet owner's bank account.
        Tags include driver_id, truck_id for differentiation.
        """
        expiry_unix = int(
            (datetime.utcnow() + timedelta(minutes=expires_in_minutes)).timestamp()
        )
        amount_paise = int(amount_inr * 100)  # Razorpay needs paise (1 INR = 100 paise)

        payload = {
            "upi_link": True,                # ← Makes it a UPI-specific link
            "amount": amount_paise,
            "currency": "INR",
            "accept_partial": False,         # Must pay full amount
            "description": f"Fuel @ {station_name} | {fuel_liters}L | Truck {truck_id}",
            "expire_by": expiry_unix,

            # ── Customer (Driver) Info ────────────────────
            "customer": {
                "name":    driver_name,
                "contact": driver_phone,       # Driver's phone number
            },

            # ── Critical: Tags for differentiability ─────
            # These notes appear in Razorpay Dashboard + webhook payload
            # This is how ONE account tracks ALL drivers separately
            "notes": {
                "transaction_id": transaction_id,
                "driver_id":      driver_id,
                "truck_id":       truck_id,
                "route_id":       route_id,
                "station_name":   station_name,
                "fuel_liters":    str(fuel_liters),
                "platform":       "FuelGuard"
            },

            # ── Reference ID (your internal ID) ──────────
            "reference_id": transaction_id,   # Unique per transaction

            # ── Callback after payment ───────────────────
            "callback_url":    "https://yourdomain.com/payments/success",
            "callback_method": "get",

            # ── Reminder notifications ───────────────────
            "reminder_enable": False,          # No reminders for fuel payments
            "notify": {
                "sms":   True,    # Send payment link via SMS to driver
                "email": False
            }
        }

        response = client.payment_link.create(payload)

        return {
            "payment_link_id": response["id"],
            "short_url":       response["short_url"],  # e.g. https://rzp.io/i/aBcDeF
            "upi_link":        response["short_url"],  # Same URL — opens UPI apps on mobile
            "amount_inr":      amount_inr,
            "expires_at":      datetime.fromtimestamp(expiry_unix).isoformat(),
            "status":          "PENDING",
            "razorpay_raw":    response
        }

    def verify_webhook_signature(self, payload_body: bytes, signature: str) -> bool:
        """
        Validates that the webhook actually came from Razorpay (not a fake request).
        ALWAYS verify this before processing any payment confirmation.
        """
        expected = hmac.new(
            WEBHOOK_SECRET.encode("utf-8"),
            payload_body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    def parse_webhook_payment(self, webhook_data: dict) -> dict:
        """
        Parses Razorpay webhook payload and extracts all FuelGuard-relevant fields.
        Called by FastAPI /payments/webhook endpoint.
        """
        event = webhook_data.get("event", "")

        if event not in ("payment_link.paid", "payment.captured"):
            return {"status": "IGNORED", "event": event}

        # Extract payment details
        if event == "payment_link.paid":
            pl       = webhook_data["payload"]["payment_link"]["entity"]
            payment  = webhook_data["payload"]["payment"]["entity"]
            notes    = pl.get("notes", {})
            amount   = pl.get("amount_paid", 0) / 100   # Convert paise → INR
        else:
            payment  = webhook_data["payload"]["payment"]["entity"]
            notes    = payment.get("notes", {})
            amount   = payment.get("amount", 0) / 100

        return {
            "event":             event,
            "razorpay_payment_id": payment.get("id"),
            "razorpay_order_id":   payment.get("order_id"),
            "amount_inr":          amount,
            "currency":            payment.get("currency", "INR"),
            "method":              payment.get("method"),    # "upi"
            "upi_transaction_id":  payment.get("acquirer_data", {}).get("rrn"),
            "status":              payment.get("status"),    # "captured"
            "paid_at":             datetime.fromtimestamp(
                                     payment.get("created_at", 0)
                                   ).isoformat(),

            # ── FuelGuard tags from notes ─────────────────
            "transaction_id": notes.get("transaction_id"),
            "driver_id":      notes.get("driver_id"),
            "truck_id":       notes.get("truck_id"),
            "route_id":       notes.get("route_id"),
            "station_name":   notes.get("station_name"),
            "fuel_liters":    notes.get("fuel_liters"),
        }

    def get_payment_status(self, payment_link_id: str) -> dict:
        """Polls current status of a payment link (PENDING / PAID / EXPIRED)."""
        response = client.payment_link.fetch(payment_link_id)
        return {
            "payment_link_id": payment_link_id,
            "status":          response.get("status"),  # created/paid/expired
            "amount_paid":     response.get("amount_paid", 0) / 100,
            "payments":        response.get("payments", [])
        }

    def fetch_all_driver_payments(self, driver_phone: str,
                                   from_date: datetime,
                                   to_date: datetime) -> list:
        """
        Fetches all payment links for a specific driver within a date range.
        Used for per-driver expense reports in the dashboard.
        """
        from_unix = int(from_date.timestamp())
        to_unix   = int(to_date.timestamp())

        # Fetch all payment links and filter by driver phone
        # In production, use Razorpay's filter by reference_id or notes
        response = client.payment_link.all({
            "from":  from_unix,
            "to":    to_unix,
            "count": 100
        })
        items = response.get("items", [])
        return [
            item for item in items
            if item.get("customer", {}).get("contact") == driver_phone
        ]