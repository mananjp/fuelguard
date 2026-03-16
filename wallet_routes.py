# ============================================================
# wallet_routes.py — All wallet API endpoints
# Paste into main.py, or include via APIRouter
# ============================================================
from fastapi import APIRouter, HTTPException
from wallet import TripWalletManager, OwnerAccountManager, ExpenseCategory
from database import mongodb

wallet_router = APIRouter(prefix="/wallet", tags=["Wallet"])
wallet_mgr    = TripWalletManager()
owner_mgr     = OwnerAccountManager()

def wallets_col():   return mongodb.db["trip_wallets"]
def expenses_col():  return mongodb.db["wallet_expenses"]
def accounts_col():  return mongodb.db["owner_accounts"]

# ════════════════════════════════════════════════════════════
#  OWNER ACCOUNT
# ════════════════════════════════════════════════════════════

@wallet_router.get("/owner/{owner_id}/balance")
async def owner_balance(owner_id: str):
    """
    Shows owner's platform balance + how much is allocated to active trips.
    """
    acc      = await owner_mgr.get_balance(accounts_col(), owner_id)
    wallets  = await wallets_col().find(
        {"owner_id": owner_id, "status": "ACTIVE"}, {"_id": 0}
    ).to_list(100)
    live_allocated = sum(w["remaining_inr"] for w in wallets)
    return {
        **acc,
        "live_allocated_to_drivers": round(live_allocated, 2),
        "free_balance":              round(acc.get("platform_balance", 0) - live_allocated, 2),
        "active_wallets":            len(wallets)
    }

@wallet_router.post("/owner/load-funds")
async def load_owner_funds(payload: dict):
    """
    Owner loads money into FuelGuard platform.
    In production: triggered by Razorpay webhook after owner pays.
    For testing: call manually with amount_inr.
    """
    return await owner_mgr.load_funds(
        accounts_col(),
        payload["owner_id"],
        float(payload["amount_inr"]),
        payload.get("razorpay_payment_id")
    )

# ════════════════════════════════════════════════════════════
#  TRIP WALLET MANAGEMENT
# ════════════════════════════════════════════════════════════

@wallet_router.post("/allocate")
async def allocate_wallet(payload: dict):
    """
    Owner allocates a travel budget to a driver for one trip.
    Deducted from owner's platform balance immediately.

    Body:
    {
      "owner_id":   "OWN001",
      "driver_id":  "DRV001",
      "truck_id":   "TRK001",
      "route_id":   "ROUTE_001",
      "trip_id":    "TRIP_001",
      "amount_inr": 10000,
      "note":       "Delhi to Mumbai roundtrip including food"
    }
    """
    result = await wallet_mgr.allocate(
        wallets_col(), accounts_col(),
        owner_id   = payload["owner_id"],
        driver_id  = payload["driver_id"],
        truck_id   = payload["truck_id"],
        route_id   = payload["route_id"],
        trip_id    = payload["trip_id"],
        amount_inr = float(payload["amount_inr"]),
        note       = payload.get("note", "")
    )
    if not result["success"]:
        raise HTTPException(400, result["message"])
    return result

@wallet_router.post("/set-limit")
async def set_category_limit(payload: dict):
    """
    Owner sets per-category spending limits inside the wallet.
    E.g. max ₹7000 fuel, ₹2000 food, ₹1000 toll out of ₹10000 total.

    Body: { "wallet_id": "...", "category": "FUEL", "limit_inr": 7000 }
    """
    return await wallet_mgr.set_category_limit(
        wallets_col(),
        payload["wallet_id"],
        payload["category"].upper(),
        float(payload["limit_inr"])
    )

@wallet_router.get("/{wallet_id}")
async def get_wallet(wallet_id: str):
    """Full wallet details — balance, spent, category breakdown."""
    wallet = await wallet_mgr.get_wallet(wallets_col(), wallet_id)
    if not wallet:
        raise HTTPException(404, "Wallet not found")

    # Attach full expense history
    expenses = await expenses_col().find(
        {"wallet_id": wallet_id}, {"_id": 0}
    ).sort("timestamp", -1).to_list(200)
    wallet["expenses"] = expenses
    return wallet

@wallet_router.get("/driver/{driver_id}/active")
async def get_driver_active_wallet(driver_id: str, trip_id: str):
    """Driver calls this on trip start to get their wallet_id and balance."""
    wallet = await wallet_mgr.get_active_wallet(
        wallets_col(), driver_id, trip_id
    )
    if not wallet:
        raise HTTPException(404,
            f"No active wallet for driver {driver_id} on trip {trip_id}")
    return {
        "wallet_id":     wallet["wallet_id"],
        "remaining_inr": wallet["remaining_inr"],
        "allocated_inr": wallet["allocated_inr"],
        "spent_inr":     wallet["spent_inr"],
        "category_limits":wallet["category_limits"],
        "category_spent": wallet["category_spent"],
        "status":         wallet["status"]
    }

# ════════════════════════════════════════════════════════════
#  DRIVER PAYMENT — the core action
# ════════════════════════════════════════════════════════════

@wallet_router.post("/pay")
async def wallet_pay(payload: dict):
    """
    Driver pays for fuel / food / toll using wallet balance.
    This is what the mobile app calls when driver taps "Pay".

    Body:
    {
      "wallet_id":   "...",
      "amount_inr":  2200,
      "category":    "FUEL",       ← FUEL | FOOD | TOLL | REPAIR | OTHER
      "description": "HPCL Vadodara 23.5L",
      "vendor_name": "HPCL Petrol Station",
      "reference_id": "TXN123"      ← optional Razorpay payment ID
    }
    """
    result = await wallet_mgr.pay(
        wallets_col(), expenses_col(),
        wallet_id    = payload["wallet_id"],
        amount_inr   = float(payload["amount_inr"]),
        category     = payload.get("category", "OTHER").upper(),
        description  = payload.get("description", ""),
        vendor_name  = payload.get("vendor_name", ""),
        reference_id = payload.get("reference_id", "")
    )
    if not result["success"]:
        raise HTTPException(400, result.get("message", result.get("error")))
    return result

@wallet_router.get("/{wallet_id}/expenses")
async def wallet_expenses(wallet_id: str):
    """Full spend history for this wallet — fleet owner's expense report."""
    expenses = await expenses_col().find(
        {"wallet_id": wallet_id}, {"_id": 0}
    ).sort("timestamp", -1).to_list(500)
    total = sum(e["amount_inr"] for e in expenses)
    by_cat = {}
    for e in expenses:
        c = e["category"]
        by_cat.setdefault(c, {"count": 0, "total": 0.0})
        by_cat[c]["count"] += 1
        by_cat[c]["total"] += e["amount_inr"]
    return {
        "wallet_id":       wallet_id,
        "total_spent":     round(total, 2),
        "by_category":     by_cat,
        "expense_count":   len(expenses),
        "expenses":        expenses
    }

# ════════════════════════════════════════════════════════════
#  TRIP END — return unused funds
# ════════════════════════════════════════════════════════════

@wallet_router.post("/{wallet_id}/close")
async def close_wallet(wallet_id: str):
    """
    Driver or system calls this when trip ends.
    Unused balance auto-returns to owner's platform account.
    Returns full trip expense summary.
    """
    result = await wallet_mgr.close_and_return(
        wallets_col(), accounts_col(), expenses_col(), wallet_id
    )
    if not result.get("success"):
        raise HTTPException(400, result.get("error", "Could not close wallet"))
    return result

# ════════════════════════════════════════════════════════════
#  OWNER ANALYTICS
# ════════════════════════════════════════════════════════════

@wallet_router.get("/owner/{owner_id}/all-trips")
async def owner_all_trips(owner_id: str, status: str = None):
    """
    All wallets for an owner — complete spend visibility across all drivers.
    Filter by status: ACTIVE | CLOSED | EXHAUSTED
    """
    query = {"owner_id": owner_id}
    if status: query["status"] = status.upper()
    wallets = await wallets_col().find(
        query, {"_id": 0}
    ).sort("created_at", -1).to_list(500)

    total_allocated = sum(w["allocated_inr"] for w in wallets)
    total_spent     = sum(w["spent_inr"]     for w in wallets)
    total_returned  = sum(w.get("returned_inr", 0) for w in wallets)

    return {
        "owner_id":       owner_id,
        "summary": {
            "total_trips":     len(wallets),
            "total_allocated": round(total_allocated, 2),
            "total_spent":     round(total_spent,     2),
            "total_returned":  round(total_returned,  2),
            "savings_pct":     round(total_returned /
                                     max(total_allocated, 1) * 100, 1)
        },
        "wallets": wallets
    }

# ════════════════════════════════════════════════════════════
#  GPAY-STYLE UPI PAYOUTS — real money movement
# ════════════════════════════════════════════════════════════

@wallet_router.post("/pay-merchant")
async def pay_merchant_gpay_style(payload: dict):
    """
    GPay-style payment from driver wallet to any UPI merchant.

    Body:
    {
      "wallet_id":    "...",
      "amount_inr":   2200,
      "category":     "FUEL",
      "merchant_upi": "hpcl.vadodara@okaxis",
      "merchant_name":"HPCL Vadodara",
      "description":  "23.5L diesel"
    }

    What happens:
    1. Checks wallet balance
    2. Triggers Razorpay Payout to merchant UPI (real money moves)
    3. Deducts from virtual wallet balance
    4. Returns payment confirmation + UTR number
    """
    from gpay_payment import FuelGuardPayouts
    payouts = FuelGuardPayouts()

    # Step 1: Check wallet balance first (fast — MongoDB check)
    wallet = await wallet_mgr.get_wallet(wallets_col(), payload["wallet_id"])
    if not wallet:
        raise HTTPException(404, "Wallet not found")
    if wallet["status"] != "ACTIVE":
        raise HTTPException(400, f"Wallet is {wallet['status']}")
    if wallet["remaining_inr"] < float(payload["amount_inr"]):
        raise HTTPException(400,
            f"Insufficient balance: ₹{wallet['remaining_inr']:.0f} available, "
            f"₹{payload['amount_inr']} requested")

    # Step 2: Trigger real Razorpay Payout to merchant
    payout_result = payouts.pay_merchant(
        amount_inr    = float(payload["amount_inr"]),
        merchant_upi  = payload["merchant_upi"],
        merchant_name = payload.get("merchant_name", "Merchant"),
        driver_id     = wallet["driver_id"],
        wallet_id     = payload["wallet_id"],
        category      = payload.get("category", "OTHER").upper(),
        description   = payload.get("description", "")
    )

    if not payout_result["success"]:
        raise HTTPException(400, payout_result.get("message", "Payment failed"))

    # Step 3: Deduct from virtual wallet (only after payout succeeds)
    deduct_result = await wallet_mgr.pay(
        wallets_col(), expenses_col(),
        wallet_id    = payload["wallet_id"],
        amount_inr   = float(payload["amount_inr"]),
        category     = payload.get("category", "OTHER").upper(),
        description  = payload.get("description", ""),
        vendor_name  = payload.get("merchant_name", ""),
        reference_id = payout_result.get("payout_id", "")
    )

    return {
        "payment_status":  "SUCCESS",
        "payout_id":       payout_result["payout_id"],
        "utr":             payout_result.get("utr"),       # UPI transaction ref
        "amount_paid":     float(payload["amount_inr"]),
        "merchant":        payload.get("merchant_name"),
        "merchant_upi":    payload.get("merchant_upi"),
        "wallet_balance":  deduct_result["balance_after"],
        "message":         payout_result["message"],
        # What driver shows to pump operator as proof
        "payment_proof":  f"FuelGuard UTR: {payout_result.get('utr', 'pending')}"
    }


@wallet_router.get("/payout-status/{payout_id}")
async def check_payout_status(payout_id: str):
    """
    Mobile app polls this every 2s to show real-time payment status.
    queued → processing → ✅ processed
    """
    from gpay_payment import FuelGuardPayouts
    return FuelGuardPayouts().get_payout_status(payout_id)


@wallet_router.post("/owner/create-load-link")
async def create_owner_load_link(payload: dict):
    """
    Owner wants to add money to platform.
    Returns a Razorpay UPI payment link — owner pays, webhook auto-credits.
    """
    from gpay_payment import FuelGuardPayouts
    return FuelGuardPayouts().create_load_funds_link(
        owner_id    = payload["owner_id"],
        owner_name  = payload["owner_name"],
        owner_phone = payload["owner_phone"],
        amount_inr  = float(payload["amount_inr"])
    )