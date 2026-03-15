# ============================================================
# driver_upload_app.py — Driver Fuel Verification Upload UI
# ============================================================
import streamlit as st
import requests
from PIL import Image

st.set_page_config(page_title="FuelGuard Driver Upload", page_icon="📸", layout="wide")
API_BASE = "http://localhost:8000"

st.title("📸 Driver Fuel Verification")
st.caption("Upload meter, pump, and receipt photos for OCR and fraud validation.")

with st.form("fuel_verification_form"):
    c1, c2, c3 = st.columns(3)
    with c1:
        truck_id = st.text_input("Truck ID", value="TRK001")
        driver_id = st.text_input("Driver ID", value="DRV001")
    with c2:
        route_id = st.text_input("Route ID", value="ROUTE_DEMO_001")
        station_id = st.text_input("Station ID", value="STN002")
    with c3:
        liters_claimed = st.number_input("Claimed liters", min_value=0.0, value=23.5, step=0.1)
        amount_inr = st.number_input("Amount (INR)", min_value=0.0, value=2200.0, step=1.0)

    st.subheader("Upload Required Photos")
    meter_photo = st.file_uploader("1. Meter photo", type=["jpg", "jpeg", "png"])
    pump_photo = st.file_uploader("2. Pump photo", type=["jpg", "jpeg", "png"])
    receipt_photo = st.file_uploader("3. Receipt photo", type=["jpg", "jpeg", "png"])

    submitted = st.form_submit_button("Validate Fueling Event")

if meter_photo or pump_photo or receipt_photo:
    st.subheader("Preview")
    cols = st.columns(3)
    uploads = [(meter_photo, "Meter"), (pump_photo, "Pump"), (receipt_photo, "Receipt")]
    for col, item in zip(cols, uploads):
        file, label = item
        with col:
            if file:
                st.image(Image.open(file), caption=label, use_container_width=True)
            else:
                st.info(f"Upload {label.lower()} photo")

if submitted:
    missing = [name for file, name in [(meter_photo, 'meter'), (pump_photo, 'pump'), (receipt_photo, 'receipt')] if file is None]
    if missing:
        st.error(f"Missing required photos: {', '.join(missing)}")
    else:
        try:
            with st.spinner("Sending photos for OCR + meter verification + fraud scoring..."):
                files = {
                    "meter_photo": (meter_photo.name, meter_photo.getvalue(), meter_photo.type or "image/jpeg"),
                    "pump_photo": (pump_photo.name, pump_photo.getvalue(), pump_photo.type or "image/jpeg"),
                    "receipt_photo": (receipt_photo.name, receipt_photo.getvalue(), receipt_photo.type or "image/jpeg"),
                }
                data = {
                    "truck_id": truck_id,
                    "driver_id": driver_id,
                    "route_id": route_id,
                    "station_id": station_id,
                    "liters_claimed": liters_claimed,
                    "amount_inr": amount_inr,
                }
                response = requests.post(f"{API_BASE}/fuel/checkin/v2", data=data, files=files, timeout=120)

            if response.status_code != 200:
                st.error(f"API error {response.status_code}: {response.text}")
            else:
                result = response.json()
                st.success(f"Validation complete — Status: {result.get('status', 'UNKNOWN')}")

                a, b, c = st.columns(3)
                a.metric("Fraud score", result.get("fraud_score", 0))
                mv = result.get("meter_verification", {})
                a2 = mv.get("confidence", "0%")
                b.metric("Meter confidence", a2)
                c.metric("Meter reading", mv.get("reading_liters") or "N/A")

                st.subheader("Meter verification")
                st.json(result.get("meter_verification", {}))

                st.subheader("Receipt OCR")
                st.json(result.get("receipt_ocr", {}))

                st.subheader("Cross validation")
                st.json(result.get("cross_validation", {}))

                st.subheader("Triggered rules")
                rules = result.get("triggered_rules", [])
                if rules:
                    for rule in rules:
                        st.warning(f"{rule.get('rule')} | {rule.get('severity')} | {rule.get('message')}")
                else:
                    st.info("No fraud rules triggered.")
        except requests.exceptions.ConnectionError:
            st.error("Backend not running. Start FastAPI first: uvicorn main:app --reload --port 8000")
        except Exception as e:
            st.error(f"Unexpected error: {e}")

st.divider()
st.markdown("### Run order")
st.code("""uvicorn main:app --reload --port 8000
streamlit run driver_upload_app.py""")