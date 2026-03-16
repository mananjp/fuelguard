# ============================================================
# wallet.py — FuelGuard Trip Wallet System
# ============================================================
#
#  FLOW:
#  1. Owner loads funds into FuelGuard platform account (Razorpay)
#  2. Owner allocates ₹X to driver for a specific trip
#  3. Driver pays fuel/food → deducted from wallet balance
#  4. Trip ends → unused balance auto-returned to owner account
#
#  MongoDB Collections used:
#  - owner_accounts   : owner's platform balance
#  - trip_wallets     : per-driver per-trip virtual wallet
#  - wallet_expenses  : every spend event
#
# ============================================================

import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from dataclasses import dataclass

# ── Expense categories the driver can pay for ─────────────
class ExpenseCategory(str, Enum):
    FUEL    = "FUEL"
    FOOD    = "FOOD"
    TOLL    = "TOLL"
    REPAIR  = "REPAIR"
    OTHER   = "OTHER"

# ── Wallet status ─────────────────────────────────────────
class WalletStatus(str, Enum):
    PENDING   = "PENDING"    # created, owner not yet funded
    ACTIVE    = "ACTIVE"     # funded, driver can spend
    EXHAUSTED = "EXHAUSTED"  # balance = 0
    CLOSED    = "CLOSED"     # trip ended, remainder returned

# ════════════════════════════════════════════════════════════
#  OWNER ACCOUNT
#  The owner deposits money here first — like a master wallet
#  All driver allocations come from this balance
# ════════════════════════════════════════════════════════════
class OwnerAccountManager:

    async def get_or_create(self, accounts_col, owner_id: str) -> dict:
        acc = await accounts_col.find_one({"owner_id": owner_id}, {"_id": 0})
        if not acc:
            acc = {
                "owner_id":         owner_id,
                "platform_balance": 0.0,   # money loaded into FuelGuard
                "total_loaded":     0.0,
                "total_allocated":  0.0,
                "total_returned":   0.0,
                "total_spent":      0.0,
                "created_at":       datetime.utcnow().isoformat()
            }
            await accounts_col.insert_one(acc)
        return acc

    async def load_funds(self, accounts_col, owner_id: str,
                          amount_inr: float,
                          razorpay_payment_id: str = None) -> dict:
        """
        Called by Razorpay webhook after owner pays into platform.
        Credits owner's platform_balance.
        """
        await accounts_col.update_one(
            {"owner_id": owner_id},
            {"$inc": {
                "platform_balance": amount_inr,
                "total_loaded":     amount_inr
            }},
            upsert=True
        )
        acc = await accounts_col.find_one({"owner_id": owner_id}, {"_id": 0})
        return {
            "owner_id":        owner_id,
            "loaded":          amount_inr,
            "new_balance":     acc["platform_balance"],
            "payment_id":      razorpay_payment_id,
            "message":         f"₹{amount_inr:.0f} loaded to platform account"
        }

    async def get_balance(self, accounts_col, owner_id: str) -> dict:
        acc = await accounts_col.find_one({"owner_id": owner_id}, {"_id": 0})
        if not acc:
            return {"owner_id": owner_id, "platform_balance": 0.0}
        return acc

    async def deduct_for_allocation(self, accounts_col, owner_id: str,
                                     amount_inr: float) -> bool:
        """Deduct from owner balance when allocating to a driver."""
        acc = await accounts_col.find_one({"owner_id": owner_id})
        if not acc or acc.get("platform_balance", 0) < amount_inr:
            return False   # insufficient balance
        await accounts_col.update_one(
            {"owner_id": owner_id},
            {"$inc": {
                "platform_balance": -amount_inr,
                "total_allocated":   amount_inr
            }}
        )
        return True

    async def return_unused_funds(self, accounts_col, owner_id: str,
                                   amount_inr: float) -> dict:
        """Credit back unused trip budget to owner account."""
        if amount_inr <= 0:
            return {"returned": 0, "message": "Nothing to return"}
        await accounts_col.update_one(
            {"owner_id": owner_id},
            {"$inc": {
                "platform_balance": amount_inr,
                "total_returned":   amount_inr
            }}
        )
        acc = await accounts_col.find_one({"owner_id": owner_id}, {"_id": 0})
        return {
            "returned":    amount_inr,
            "new_balance": acc["platform_balance"],
            "message":     f"₹{amount_inr:.0f} returned to owner account"
        }

# ════════════════════════════════════════════════════════════
#  TRIP WALLET
#  One wallet per driver per trip — like a prepaid card
# ════════════════════════════════════════════════════════════
class TripWalletManager:

    async def allocate(self, wallets_col, accounts_col,
                        owner_id:   str,
                        driver_id:  str,
                        truck_id:   str,
                        route_id:   str,
                        trip_id:    str,
                        amount_inr: float,
                        note:       str = "") -> dict:
        """
        Owner allocates budget to driver for a specific trip.
        Money is deducted from owner's platform_balance immediately.
        """
        owner_mgr = OwnerAccountManager()

        # Check & deduct from owner balance
        deducted = await owner_mgr.deduct_for_allocation(
            accounts_col, owner_id, amount_inr
        )
        if not deducted:
            owner_acc = await accounts_col.find_one({"owner_id": owner_id})
            current   = owner_acc.get("platform_balance", 0) if owner_acc else 0
            return {
                "success": False,
                "error":   "INSUFFICIENT_BALANCE",
                "message": f"Owner balance ₹{current:.0f} < ₹{amount_inr:.0f} requested"
            }

        wallet_id = str(uuid.uuid4())
        wallet = {
            "wallet_id":          wallet_id,
            "owner_id":           owner_id,
            "driver_id":          driver_id,
            "truck_id":           truck_id,
            "route_id":           route_id,
            "trip_id":            trip_id,
            "allocated_inr":      amount_inr,
            "spent_inr":          0.0,
            "remaining_inr":      amount_inr,
            "status":             WalletStatus.ACTIVE,
            "note":               note,
            "created_at":         datetime.utcnow().isoformat(),
            "closed_at":          None,
            "returned_inr":       0.0,
            # Spending limits per category (optional — owner can set these)
            "category_limits": {
                "FUEL":   None,   # None = no limit within total
                "FOOD":   None,
                "TOLL":   None,
                "REPAIR": None,
                "OTHER":  None
            },
            "category_spent": {
                "FUEL":   0.0,
                "FOOD":   0.0,
                "TOLL":   0.0,
                "REPAIR": 0.0,
                "OTHER":  0.0
            }
        }
        await wallets_col.insert_one(wallet)
        wallet.pop("_id", None)
        return {
            "success":   True,
            "wallet_id": wallet_id,
            "allocated": amount_inr,
            "driver_id": driver_id,
            "trip_id":   trip_id,
            "message":   f"₹{amount_inr:.0f} allocated to driver {driver_id} for trip {trip_id}"
        }

    async def set_category_limit(self, wallets_col,
                                  wallet_id: str,
                                  category:  str,
                                  limit_inr: float) -> dict:
        """
        Owner can sub-divide the budget.
        E.g. ₹7000 for FUEL, ₹2000 for FOOD, ₹1000 for TOLL.
        """
        await wallets_col.update_one(
            {"wallet_id": wallet_id},
            {"$set": {f"category_limits.{category}": limit_inr}}
        )
        return {"wallet_id": wallet_id, "category": category, "limit": limit_inr}

    async def pay(self, wallets_col, expenses_col,
                   wallet_id:    str,
                   amount_inr:   float,
                   category:     str,
                   description:  str,
                   vendor_name:  str  = "",
                   reference_id: str  = "") -> dict:
        """
        Driver makes a payment — deducts from wallet.
        Checks: wallet active, sufficient balance, category limit.
        """
        wallet = await wallets_col.find_one({"wallet_id": wallet_id}, {"_id": 0})
        if not wallet:
            return {"success": False, "error": "WALLET_NOT_FOUND"}
        if wallet["status"] != WalletStatus.ACTIVE:
            return {"success": False, "error": f"WALLET_{wallet['status']}",
                    "message": f"Wallet is {wallet['status']} — cannot process payment"}
        if wallet["remaining_inr"] < amount_inr:
            return {
                "success":   False,
                "error":     "INSUFFICIENT_BALANCE",
                "remaining": wallet["remaining_inr"],
                "requested": amount_inr,
                "message":   f"Only ₹{wallet['remaining_inr']:.0f} left in wallet"
            }

        # Check category limit if set
        cat_limit = wallet["category_limits"].get(category)
        cat_spent = wallet["category_spent"].get(category, 0.0)
        if cat_limit and (cat_spent + amount_inr) > cat_limit:
            return {
                "success":      False,
                "error":        "CATEGORY_LIMIT_EXCEEDED",
                "category":     category,
                "limit":        cat_limit,
                "already_spent":cat_spent,
                "requested":    amount_inr,
                "message":      f"{category} limit ₹{cat_limit:.0f} exceeded "
                                f"(spent ₹{cat_spent:.0f} + ₹{amount_inr:.0f})"
            }

        # Deduct balance
        new_remaining = wallet["remaining_inr"] - amount_inr
        new_spent     = wallet["spent_inr"]     + amount_inr
        new_status    = WalletStatus.EXHAUSTED if new_remaining == 0 else WalletStatus.ACTIVE

        await wallets_col.update_one(
            {"wallet_id": wallet_id},
            {"$inc": {
                "spent_inr":                     amount_inr,
                "remaining_inr":                -amount_inr,
                f"category_spent.{category}":    amount_inr
            },
             "$set": {"status": new_status}}
        )

        # Record expense
        expense_id = str(uuid.uuid4())
        expense = {
            "expense_id":   expense_id,
            "wallet_id":    wallet_id,
            "driver_id":    wallet["driver_id"],
            "truck_id":     wallet["truck_id"],
            "trip_id":      wallet["trip_id"],
            "owner_id":     wallet["owner_id"],
            "amount_inr":   amount_inr,
            "category":     category,
            "description":  description,
            "vendor_name":  vendor_name,
            "reference_id": reference_id,
            "balance_before": wallet["remaining_inr"],
            "balance_after":  new_remaining,
            "timestamp":    datetime.utcnow().isoformat()
        }
        await expenses_col.insert_one(expense)

        return {
            "success":       True,
            "expense_id":    expense_id,
            "paid":          amount_inr,
            "category":      category,
            "balance_before":wallet["remaining_inr"],
            "balance_after": new_remaining,
            "status":        new_status,
            "message":       f"✅ ₹{amount_inr:.0f} paid for {category} — "
                             f"₹{new_remaining:.0f} remaining"
        }

    async def close_and_return(self, wallets_col, accounts_col,
                                expenses_col, wallet_id: str) -> dict:
        """
        Called when driver ends trip.
        Returns unused balance back to owner's platform account.
        """
        wallet = await wallets_col.find_one({"wallet_id": wallet_id}, {"_id": 0})
        if not wallet:
            return {"success": False, "error": "WALLET_NOT_FOUND"}
        if wallet["status"] == WalletStatus.CLOSED:
            return {"success": False, "error": "WALLET_ALREADY_CLOSED"}

        remaining = wallet["remaining_inr"]
        owner_mgr = OwnerAccountManager()

        if remaining > 0:
            await owner_mgr.return_unused_funds(
                accounts_col, wallet["owner_id"], remaining
            )

        await wallets_col.update_one(
            {"wallet_id": wallet_id},
            {"$set": {
                "status":       WalletStatus.CLOSED,
                "returned_inr": remaining,
                "closed_at":    datetime.utcnow().isoformat()
            }}
        )

        # Build trip expense summary
        expenses = await expenses_col.find(
            {"wallet_id": wallet_id}, {"_id": 0}
        ).to_list(500)
        by_cat = {}
        for exp in expenses:
            c = exp["category"]
            by_cat.setdefault(c, {"count": 0, "total": 0.0})
            by_cat[c]["count"] += 1
            by_cat[c]["total"] += exp["amount_inr"]

        return {
            "success":          True,
            "wallet_id":        wallet_id,
            "allocated":        wallet["allocated_inr"],
            "total_spent":      wallet["spent_inr"],
            "returned_to_owner":remaining,
            "utilization_pct":  round(wallet["spent_inr"] /
                                      max(wallet["allocated_inr"], 1) * 100, 1),
            "breakdown":        by_cat,
            "message":          f"Trip closed — ₹{remaining:.0f} returned to owner"
        }

    async def get_wallet(self, wallets_col, wallet_id: str) -> Optional[dict]:
        w = await wallets_col.find_one({"wallet_id": wallet_id}, {"_id": 0})
        return w

    async def get_active_wallet(self, wallets_col,
                                 driver_id: str, trip_id: str) -> Optional[dict]:
        return await wallets_col.find_one(
            {"driver_id": driver_id,
             "trip_id":   trip_id,
             "status":    WalletStatus.ACTIVE},
            {"_id": 0}
        )