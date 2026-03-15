# ============================================================
# llm_vision.py — LLM-Based Image Understanding
# Replaces ocr_engine.py + meter_verification.py entirely
# ============================================================
# PRIMARY:  Google Gemini Flash (FREE — 1,500 req/day, no card)
#           Get key: https://aistudio.google.com/apikey
# FALLBACK: Ollama + LLaVA (100% local, no internet, no key)
#           Install: https://ollama.com → ollama pull llava
# ============================================================

import google.generativeai as genai
import base64, json, re, os
from PIL import Image
from PIL.ExifTags import TAGS
import io
from dataclasses import dataclass, field
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ── Configure Gemini if key is available ─────────────────
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ════════════════════════════════════════════════════════
#  RESULT DATACLASSES
# ════════════════════════════════════════════════════════
@dataclass
class ReceiptReadResult:
    liters:          Optional[float] = None
    amount_inr:      Optional[float] = None
    date:            Optional[str]   = None
    time:            Optional[str]   = None
    station_name:    Optional[str]   = None
    fuel_type:       Optional[str]   = None
    price_per_liter: Optional[float] = None
    confidence:      str             = "LOW"   # LOW / MEDIUM / HIGH
    raw_response:    str             = ""
    backend_used:    str             = ""
    error:           Optional[str]   = None

@dataclass
class MeterReadResult:
    liters:         Optional[float] = None
    display_type:   str             = "unknown"
    confidence:     str             = "LOW"
    raw_response:   str             = ""
    backend_used:   str             = ""
    fraud_flag:     bool            = False
    fraud_reason:   str             = ""

@dataclass
class CrossValidation:
    meter_liters:           Optional[float] = None
    receipt_liters:         Optional[float] = None
    claimed_liters:         float           = 0.0
    meter_vs_claimed_pct:   Optional[float] = None
    receipt_vs_claimed_pct: Optional[float] = None
    meter_vs_receipt_pct:   Optional[float] = None
    all_match:              bool            = False
    verdict:                str             = ""

# ════════════════════════════════════════════════════════
#  MAIN VISION CLIENT
# ════════════════════════════════════════════════════════
class FuelVisionLLM:
    """
    Reads fuel receipts and pump meter displays using LLM vision.
    Tries Gemini first (free tier), falls back to Ollama LLaVA locally.
    Returns clean structured data — no regex, no preprocessing, no thresholding.
    """

    MISMATCH_THRESHOLD_PCT = 10.0   # >10% diff = flag

    # ── Receipt Reading ───────────────────────────────────
    def read_receipt(self, image_bytes: bytes) -> ReceiptReadResult:
        """
        Sends receipt photo to LLM with a strict JSON extraction prompt.
        Handles handwritten, printed, digital, blurry receipts — all formats.
        """
        prompt = """You are a fuel receipt data extractor for an anti-fraud system.
Carefully read this fuel/petrol/diesel pump receipt image and extract ALL of the following.
Respond ONLY with a valid JSON object — no explanation, no markdown, no extra text.

{
  "liters": <number or null>,
  "amount_inr": <number or null>,
  "date": "<DD/MM/YYYY or null>",
  "time": "<HH:MM or null>",
  "station_name": "<string or null>",
  "fuel_type": "<diesel|petrol|cng or null>",
  "price_per_liter": <number or null>,
  "confidence": "<HIGH|MEDIUM|LOW>"
}

Rules:
- liters = total quantity dispensed (look for L, Ltr, Litre, Volume, Qty)
- amount_inr = total amount paid in Indian Rupees (look for Rs, INR, ₹, Total)
- If a field is not visible or unclear, use null
- confidence = HIGH if you can clearly read most fields, LOW if image is blurry"""

        # Try Gemini first
        if GEMINI_API_KEY:
            try:
                result = self._call_gemini(image_bytes, prompt)
                data   = self._parse_json_response(result)
                return ReceiptReadResult(
                    liters          = self._safe_float(data.get("liters")),
                    amount_inr      = self._safe_float(data.get("amount_inr")),
                    date            = data.get("date"),
                    time            = data.get("time"),
                    station_name    = data.get("station_name"),
                    fuel_type       = data.get("fuel_type"),
                    price_per_liter = self._safe_float(data.get("price_per_liter")),
                    confidence      = data.get("confidence", "MEDIUM"),
                    raw_response    = result,
                    backend_used    = "gemini-1.5-flash"
                )
            except Exception as e:
                pass   # Fall through to Ollama

        # Fallback: Ollama LLaVA (local)
        try:
            result = self._call_ollama(image_bytes, prompt)
            data   = self._parse_json_response(result)
            return ReceiptReadResult(
                liters          = self._safe_float(data.get("liters")),
                amount_inr      = self._safe_float(data.get("amount_inr")),
                date            = data.get("date"),
                time            = data.get("time"),
                station_name    = data.get("station_name"),
                fuel_type       = data.get("fuel_type"),
                price_per_liter = self._safe_float(data.get("price_per_liter")),
                confidence      = data.get("confidence", "MEDIUM"),
                raw_response    = result,
                backend_used    = "ollama-llava"
            )
        except Exception as e:
            return ReceiptReadResult(
                error        = str(e),
                backend_used = "none",
                confidence   = "LOW"
            )

    # ── Meter Reading ─────────────────────────────────────
    def read_meter(self, image_bytes: bytes) -> MeterReadResult:
        """
        Reads the numeric display on a fuel pump meter.
        LLMs handle digital LED/LCD displays, poor angles, and glare
        far better than traditional Tesseract OCR.
        """
        prompt = """You are analyzing a photo of a fuel pump display/meter taken at a petrol station.
Your task is to read the numeric fuel quantity shown on the pump meter display.
Respond ONLY with a valid JSON object — no explanation, no markdown.

{
  "liters": <number shown on meter display, or null if unreadable>,
  "display_type": "<digital_led|digital_lcd|analog|unclear>",
  "confidence": "<HIGH|MEDIUM|LOW>",
  "notes": "<brief note about what you see, max 20 words>"
}

Rules:
- liters = the dispensed quantity number on the meter (e.g. 23.45)
- Look for the main large number on the display — that is the liters
- Do NOT read the price display — only the quantity/volume in liters
- If the image is of a receipt instead of a meter, set liters to null
- If the display shows 0.00 or is resetting, report what is shown"""

        if GEMINI_API_KEY:
            try:
                result = self._call_gemini(image_bytes, prompt)
                data   = self._parse_json_response(result)
                liters = self._safe_float(data.get("liters"))
                return MeterReadResult(
                    liters       = liters,
                    display_type = data.get("display_type", "unknown"),
                    confidence   = data.get("confidence", "MEDIUM"),
                    raw_response = result,
                    backend_used = "gemini-1.5-flash"
                )
            except Exception:
                pass

        try:
            result = self._call_ollama(image_bytes, prompt)
            data   = self._parse_json_response(result)
            liters = self._safe_float(data.get("liters"))
            return MeterReadResult(
                liters       = liters,
                display_type = data.get("display_type", "unknown"),
                confidence   = data.get("confidence", "MEDIUM"),
                raw_response = result,
                backend_used = "ollama-llava"
            )
        except Exception as e:
            return MeterReadResult(
                fraud_flag   = True,
                fraud_reason = f"LLM vision unavailable: {e}",
                backend_used = "none",
                confidence   = "LOW"
            )

    # ── EXIF Extraction (unchanged — no LLM needed) ───────
    def extract_exif(self, image_bytes: bytes) -> dict:
        try:
            image    = Image.open(io.BytesIO(image_bytes))
            exif_raw = image._getexif()
            if not exif_raw:
                return {"warning": "NO_EXIF_DATA", "timestamp": None,
                        "device_model": "UNKNOWN"}
            meta = {TAGS.get(k, k): v for k, v in exif_raw.items()}
            return {
                "timestamp":    meta.get("DateTimeOriginal"),
                "device_model": meta.get("Model", "UNKNOWN"),
                "gps":          meta.get("GPSInfo"),
                "has_exif":     True
            }
        except Exception:
            return {"warning": "EXIF_PARSE_ERROR", "timestamp": None,
                    "device_model": "UNKNOWN"}

    # ── 3-Way Cross Validation ────────────────────────────
    def cross_validate(
        self,
        meter:   MeterReadResult,
        receipt: ReceiptReadResult,
        claimed: float
    ) -> CrossValidation:
        cv = CrossValidation(
            meter_liters   = meter.liters,
            receipt_liters = receipt.liters,
            claimed_liters = claimed
        )

        if meter.liters is not None:
            cv.meter_vs_claimed_pct = round(
                abs(meter.liters - claimed) / max(claimed, 0.01) * 100, 2
            )
        if receipt.liters is not None:
            cv.receipt_vs_claimed_pct = round(
                abs(receipt.liters - claimed) / max(claimed, 0.01) * 100, 2
            )
        if meter.liters and receipt.liters:
            cv.meter_vs_receipt_pct = round(
                abs(meter.liters - receipt.liters) / max(receipt.liters, 0.01) * 100, 2
            )

        m_ok = cv.meter_vs_claimed_pct is not None and cv.meter_vs_claimed_pct <= self.MISMATCH_THRESHOLD_PCT
        r_ok = cv.receipt_vs_claimed_pct is not None and cv.receipt_vs_claimed_pct <= self.MISMATCH_THRESHOLD_PCT
        cv.all_match = m_ok and r_ok

        if cv.all_match:
            cv.verdict = "✅ VERIFIED — Meter, receipt, and claim all match"
        elif meter.liters is None and receipt.liters is None:
            cv.verdict = "⚠️ UNREADABLE — Neither meter nor receipt could be read"
        elif not m_ok and meter.liters:
            cv.verdict = f"🚨 MISMATCH — Meter shows {meter.liters}L, driver claimed {claimed}L"
        elif not r_ok and receipt.liters:
            cv.verdict = f"🚨 MISMATCH — Receipt shows {receipt.liters}L, driver claimed {claimed}L"
        else:
            cv.verdict = "⚠️ PARTIAL — Some values could not be verified"

        # Add fraud flag to meter result if mismatch
        if not m_ok and meter.liters:
            meter.fraud_flag   = True
            meter.fraud_reason = cv.verdict

        return cv

    # ── Gemini API Call ───────────────────────────────────
    def _call_gemini(self, image_bytes: bytes, prompt: str) -> str:
        model = genai.GenerativeModel("gemini-1.5-flash")
        image_part = {
            "mime_type": "image/jpeg",
            "data":      image_bytes
        }
        response = model.generate_content([prompt, image_part])
        return response.text.strip()

    # ── Ollama LLaVA Call (local fallback) ────────────────
    def _call_ollama(self, image_bytes: bytes, prompt: str) -> str:
        """
        Calls local Ollama server (default: http://localhost:11434).
        Requires: ollama pull llava
        """
        import urllib.request
        b64_image = base64.b64encode(image_bytes).decode("utf-8")
        payload   = json.dumps({
            "model":  "llava",
            "prompt": prompt,
            "images": [b64_image],
            "stream": False
        }).encode("utf-8")
        req = urllib.request.Request(
            "http://localhost:11434/api/generate",
            data    = payload,
            headers = {"Content-Type": "application/json"},
            method  = "POST"
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        return result.get("response", "")

    # ── Helpers ───────────────────────────────────────────
    def _parse_json_response(self, text: str) -> dict:
        """Extracts JSON from LLM response even if wrapped in markdown."""
        # Strip markdown code fences if present
        text = re.sub(r"```(?:json)?", "", text).strip().strip("`").strip()
        # Find first { ... } block
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return json.loads(text)

    def _safe_float(self, value) -> Optional[float]:
        try:
            v = float(str(value).replace(",", "").strip())
            return round(v, 3) if v > 0 else None
        except (TypeError, ValueError):
            return None