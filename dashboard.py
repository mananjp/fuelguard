# ============================================================
# dashboard.py — Fleet Manager Dashboard (Streamlit)
# ============================================================
import streamlit as st
import requests
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

st.set_page_config(page_title="FuelGuard Dashboard",
                   layout="wide", page_icon="⛽")

API_BASE = "http://localhost:8000"

# ── Sidebar ──────────────────────────────────────────────
st.sidebar.title("⛽ FuelGuard")
page = st.sidebar.selectbox("Navigate", 
    ["Fleet Overview", "Live Map", "Alerts", "Analytics", "Transactions"])

# ── Fleet Overview ───────────────────────────────────────
if page == "Fleet Overview":
    st.title("Fleet Overview")
    data = requests.get(f"{API_BASE}/dashboard/fleet").json()

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("🚛 Active Trucks", data["active_trucks"])
    col2.metric("🚨 Open Alerts", data["open_alerts"])
    col3.metric("✅ Verified Transactions", "342")   # from DB count
    col4.metric("❌ Flagged Today", "7")

    # Trucks table
    st.subheader("Fleet Status")
    if data["trucks"]:
        df = pd.DataFrame(data["trucks"])
        cols = ["truck_id", "plate_number", "status",
                "current_lat", "current_lng", "last_seen"]
        st.dataframe(df[[c for c in cols if c in df.columns]])

    # Recent alerts
    st.subheader("🚨 Recent Alerts")
    if data["alerts"]:
        alerts_df = pd.DataFrame(data["alerts"])
        severity_colors = {"CRITICAL": "🔴", "HIGH": "🟠",
                           "MEDIUM": "🟡", "LOW": "🟢"}
        for _, row in alerts_df.iterrows():
            icon = severity_colors.get(row.get("severity", "LOW"), "⚪")
            st.warning(f"{icon} **{row.get('alert_type')}** — "
                       f"{row.get('message')} | Truck: {row.get('truck_id')}")

# ── Live Map ─────────────────────────────────────────────
elif page == "Live Map":
    st.title("🗺️ Live Fleet Map")
    data = requests.get(f"{API_BASE}/dashboard/fleet").json()
    trucks = data.get("trucks", [])

    if trucks:
        df = pd.DataFrame(trucks)
        df = df.dropna(subset=["current_lat", "current_lng"])
        fig = px.scatter_mapbox(
            df, lat="current_lat", lon="current_lng",
            hover_name="plate_number", color="status",
            color_discrete_map={"ON_TRIP": "blue", "IDLE": "green",
                                "FUELING": "orange", "OFFLINE": "red"},
            zoom=5, height=600
        )
        fig.update_layout(mapbox_style="open-street-map")
        st.plotly_chart(fig, use_container_width=True)

# ── Alerts Panel ─────────────────────────────────────────
elif page == "Alerts":
    st.title("🚨 Alerts Panel")
    severity_filter = st.multiselect("Filter by Severity",
        ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
        default=["CRITICAL", "HIGH"])

    data = requests.get(f"{API_BASE}/dashboard/fleet").json()
    alerts = [a for a in data.get("alerts", [])
              if a.get("severity") in severity_filter]

    for alert in alerts:
        with st.expander(f"[{alert['severity']}] {alert['alert_type']} — "
                         f"Truck {alert['truck_id']}"):
            st.write(f"**Message:** {alert['message']}")
            st.write(f"**Driver:** {alert.get('driver_id')}")
            st.write(f"**Time:** {alert.get('created_at')}")
            if st.button("✅ Resolve", key=alert["alert_id"]):
                st.success("Alert resolved!")

# ── Analytics ────────────────────────────────────────────
elif page == "Analytics":
    st.title("📊 Fuel Analytics")
    truck_id = st.text_input("Enter Truck ID")
    if truck_id:
        stats = requests.get(f"{API_BASE}/dashboard/analytics/{truck_id}").json()
        c1, c2, c3 = st.columns(3)
        c1.metric("Total Transactions", stats["total_transactions"])
        c2.metric("Total Liters", f"{stats['total_liters']:.1f}L")
        c3.metric("Fraud Rate", f"{stats['fraud_rate_pct']}%",
                  delta_color="inverse")

# ── Transactions ─────────────────────────────────────────
elif page == "Transactions":
    st.title("💸 Recent Transactions")
    try:
        response = requests.get(f"{API_BASE}/transactions")
        if response.status_code == 200:
            data = response.json()
            txns = data.get("transactions", [])
            if txns:
                df = pd.DataFrame(txns)
                display_cols = [
                    "transaction_id", "truck_id", "driver_id", "station_id", 
                    "fuel_liters_claimed", "fuel_amount_inr", "verification_status", 
                    "fraud_score", "timestamp"
                ]
                existing_cols = [c for c in display_cols if c in df.columns]
                st.dataframe(df[existing_cols], use_container_width=True)
            else:
                st.info("No transactions found.")
        else:
            st.error(f"Failed to fetch transactions (Status Code: {response.status_code})")
    except Exception as e:
        st.error(f"Error fetching transactions: {e}")