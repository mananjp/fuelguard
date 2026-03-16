# ============================================================
# FuelGuard Backend — Docker Image
# Build:  docker compose build
# Run:    docker compose up -d
# Docs:   http://localhost:8000/docs
# ============================================================

FROM python:3.10-slim

# System deps for opencv + tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# FastAPI on port 8000
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
