# ============================================================
# gpay_payment.py — GPay-style in-app payment via Razorpay Payouts
# Driver pays any UPI merchant directly from their wallet
# Money flows: Owner RazorpayX → Merchant UPI (instant)
# ============================================================

import razorpay
import os, uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID",     "rzp_test_XXXX")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET",  "XXXX")
RAZORPAYХ_ACCOUNT_NUMBER = os.getenv("RAZORPAYX_ACCOUNT_NUMBER", "")
# ↑ RazorpayX current account number — get from razorpay.com/x
# Required for Payouts API — this is your platform's bank account

class FuelGuardPayouts:
    """
    Handles real money movement using Razorpay Payouts API.
    Think of RazorpayX as FuelGuard's bank account.
    Owner loads money → we pay merchants → return unused to owner.
    """

    def __init__(self):
        self.client = razorpay.Client(
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
        )

    # ── PAY MERCHANT (fuel station / dhaba / toll) ─────────
    def pay_merchant(
        self,
        amount_inr:   float,
        merchant_upi: str,       # e.g. "hpcl.vadodara@okaxis"
        merchant_name:str,
        driver_id:    str,
        wallet_id:    str,
        category:     str,       # FUEL | FOOD | TOLL | REPAIR | OTHER
        description:  str = ""
    ) -> dict:
        """
        Sends money from FuelGuard RazorpayX account to merchant UPI.
        Completes in < 3 seconds. Merchant gets standard UPI credit alert.
        """
        amount_paise = int(amount_inr * 100)   # Razorpay uses paise

        try:
            payout = self.client.payout.create({
                "account_number": RAZORPAYХ_ACCOUNT_NUMBER,
                "fund_account": {
                    "account_type": "vpa",          # VPA = UPI ID
                    "vpa": {
                        "address": merchant_upi     # merchant's UPI ID
                    },
                    "contact": {
                        "name":         merchant_name,
                        "type":         "vendor",
                        "reference_id": f"merchant_{merchant_upi}"
                    }
                },
                "amount":      amount_paise,
                "currency":    "INR",
                "mode":        "UPI",               # instant UPI transfer
                "purpose":     "vendor_advance",
                "queue_if_low_balance": False,      # fail fast if insufficient
                "reference_id": str(uuid.uuid4()),
                "narration":    f"FuelGuard {category} {driver_id}",
                "notes": {
                    "wallet_id":  wallet_id,
                    "driver_id":  driver_id,
                    "category":   category,
                    "description":description
                }
            })

            return {
                "success":           True,
                "payout_id":         payout["id"],
                "status":            payout["status"],    # queued/processing/processed
                "amount_inr":        amount_inr,
                "merchant_upi":      merchant_upi,
                "merchant_name":     merchant_name,
                "utr":               payout.get("utr"),   # UPI transaction ID
                "created_at":        payout.get("created_at"),
                "message":           f"₹{amount_inr:.0f} sent to {merchant_name} via UPI"
            }

        except razorpay.errors.BadRequestError as e:
            return {
                "success": False,
                "error":   "PAYOUT_FAILED",
                "reason":  str(e),
                "message": "Payment failed — check merchant UPI ID or account balance"
            }
        except Exception as e:
            return {
                "success": False,
                "error":   "PAYOUT_ERROR",
                "reason":  str(e)
            }

    # ── RETURN UNUSED FUNDS TO OWNER ───────────────────────
    def return_to_owner(
        self,
        amount_inr:  float,
        owner_upi:   str,        # owner's UPI ID to receive refund
        owner_name:  str,
        wallet_id:   str,
        trip_id:     str
    ) -> dict:
        """
        Called when trip ends — sends remaining wallet balance back to owner.
        """
        if amount_inr < 1.0:
            return {"success": True, "returned": 0,
                    "message": "Nothing to return (< ₹1)"}
        amount_paise = int(amount_inr * 100)
        try:
            payout = self.client.payout.create({
                "account_number": RAZORPAYХ_ACCOUNT_NUMBER,
                "fund_account": {
                    "account_type": "vpa",
                    "vpa": {"address": owner_upi},
                    "contact": {
                        "name":         owner_name,
                        "type":         "customer",
                        "reference_id": f"owner_{owner_upi}"
                    }
                },
                "amount":       amount_paise,
                "currency":     "INR",
                "mode":         "UPI",
                "purpose":      "refund",
                "reference_id": str(uuid.uuid4()),
                "narration":    f"FuelGuard trip {trip_id} unused balance",
                "notes": {
                    "wallet_id": wallet_id,
                    "trip_id":   trip_id,
                    "type":      "UNUSED_BALANCE_RETURN"
                }
            })
            return {
                "success":    True,
                "payout_id":  payout["id"],
                "returned":   amount_inr,
                "owner_upi":  owner_upi,
                "utr":        payout.get("utr"),
                "message":    f"₹{amount_inr:.0f} returned to owner via UPI"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ── CHECK PAYOUT STATUS ────────────────────────────────
    def get_payout_status(self, payout_id: str) -> dict:
        """
        Poll payout status — for mobile app to show real-time confirmation.
        Statuses: queued → processing → processed (success) / reversed (failed)
        """
        try:
            payout = self.client.payout.fetch(payout_id)
            status_map = {
                "queued":     "⏳ Processing...",
                "processing": "⏳ Sending to merchant...",
                "processed":  "✅ Paid successfully",
                "reversed":   "❌ Payment reversed — check balance",
                "cancelled":  "❌ Payment cancelled"
            }
            return {
                "payout_id": payout_id,
                "status":    payout["status"],
                "label":     status_map.get(payout["status"], payout["status"]),
                "utr":       payout.get("utr"),
                "amount_inr":payout["amount"] / 100,
            }
        except Exception as e:
            return {"error": str(e)}

    # ── LOAD OWNER FUNDS VIA PAYMENT LINK ─────────────────
    def create_load_funds_link(
        self,
        owner_id:   str,
        owner_name: str,
        owner_phone:str,
        amount_inr: float
    ) -> dict:
        """
        Owner loads money into FuelGuard platform.
        Creates a Razorpay Payment Link — owner pays via any UPI app.
        """
        amount_paise = int(amount_inr * 100)
        try:
            link = self.client.payment_link.create({
                "amount":      amount_paise,
                "currency":    "INR",
                "accept_partial": False,
                "description": f"FuelGuard platform load — {owner_name}",
                "customer": {
                    "name":    owner_name,
                    "contact": owner_phone
                },
                "notify": {"sms": True, "email": False},
                "reminder_enable": False,
                "notes": {
                    "owner_id":  owner_id,
                    "type":      "PLATFORM_LOAD",
                    "auto_credit": "true"    # webhook will credit on payment
                },
                "callback_url":    "https://your-domain.com/wallet/owner/load-webhook",
                "callback_method": "get"
            })
            return {
                "payment_link_id": link["id"],
                "short_url":       link["short_url"],
                "amount_inr":      amount_inr,
                "message":         "Share this link with owner to load funds"
            }
        except Exception as e:
            return {"error": str(e),
                    "fallback": "Add RAZORPAY keys to .env to enable real payments"}