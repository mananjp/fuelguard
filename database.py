# ============================================================
# database.py — Local MongoDB Connection (MongoDB Compass)
# ============================================================
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────
MONGO_URI = "mongodb://localhost:27017"   # Default MongoDB Compass URI
DB_NAME   = "fuelguard"                   # Database name (auto-created)

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

mongodb = Database()

# ── Startup / Shutdown lifecycle ──────────────────────────
async def connect_db():
    """Called on FastAPI startup — opens connection to local MongoDB."""
    mongodb.client = AsyncIOMotorClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000,   # 5 sec timeout (fail fast if MongoDB not running)
        connectTimeoutMS=10000,
        maxPoolSize=50,
        minPoolSize=5
    )
    mongodb.db = mongodb.client[DB_NAME]
    try:
        await mongodb.client.admin.command("ping")
        print(f"Connected to MongoDB at {MONGO_URI} | DB: {DB_NAME}")
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        raise RuntimeError(
            "Cannot connect to MongoDB. "
            "Make sure MongoDB service is running on localhost:27017. "
            "Open MongoDB Compass and click Connect."
        )

async def close_db():
    """Called on FastAPI shutdown — closes connection gracefully."""
    if mongodb.client:
        mongodb.client.close()
        logger.info("MongoDB connection closed.")

def get_db() -> AsyncIOMotorDatabase:
    """FastAPI Dependency — inject DB into route handlers."""
    return mongodb.db

# ── Collection helpers (typed shortcuts) ──────────────────
def trucks_col():        return mongodb.db["trucks"]
def drivers_col():       return mongodb.db["drivers"]
def routes_col():        return mongodb.db["routes"]
def stations_col():      return mongodb.db["fuel_stations"]
def transactions_col():  return mongodb.db["fuel_transactions"]
def alerts_col():        return mongodb.db["alerts"]