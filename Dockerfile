FROM python:3.11-slim AS base
WORKDIR /app
EXPOSE 8700

# Install system dependencies:
# - curl: health check
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source (includes the .docx template)
COPY . .

# Create writable temp directory for generated reports
RUN mkdir -p /tmp/reports

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser \
    && chown -R appuser:appuser /app /tmp/reports

USER appuser

# Environment variables
ENV PORT=8700
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Container metadata
LABEL description="DREEF PUE Report Generation AI Service"
LABEL version="1.0"
LABEL maintainer="DREEF Team"

# Health check — hits FastAPI's auto-generated docs endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8700/docs || exit 1

ENTRYPOINT ["gunicorn", "index:app", \
            "--workers", "2", \
            "--worker-class", "uvicorn.workers.UvicornWorker", \
            "--bind", "0.0.0.0:8700", \
            "--timeout", "120", \
            "--keep-alive", "5"]
