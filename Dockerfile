FROM python:3.11-slim

# Install libstdc++ and other required system libraries
RUN apt-get update && apt-get install -y \
    libstdc++6 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the full project
COPY . .

# Expose port
EXPOSE 8000

# Start the application
CMD ["/bin/sh", "-c", "uvicorn backend.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
