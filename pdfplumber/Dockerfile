# Use a lightweight Python image
FROM python:3.11-slim

# Set work directory
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code
COPY backend/ ./backend/

# Expose FastAPI port
EXPOSE 8000

# Run the FastAPI app
CMD ["uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8000"]
