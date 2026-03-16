# =============================================================================
# Stage 1: Builder
# =============================================================================
FROM python:3.13-alpine AS builder

WORKDIR /app

RUN apk add --no-cache \
    build-base \
    gfortran \
    openblas-dev \
    lapack-dev \
    libffi-dev \
    && pip install --no-cache-dir --upgrade pip setuptools wheel

# Copy requirements first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# =============================================================================
# Stage 2: Runtime (PRODUCTION READY)
# =============================================================================
FROM python:3.13-alpine

# Runtime deps only
RUN apk add --no-cache curl

# Create non-root user/group
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

WORKDIR /app

# Copy Python packages (correct ownership)
COPY --from=builder --chown=appuser:appgroup /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder --chown=appuser:appgroup /usr/local/bin /usr/local/bin

# Copy source code + FIX PERMISSIONS (SOLVES PermissionError)
COPY --chown=appuser:appgroup . .
RUN chown -R appuser:appgroup /app && \
    chmod -R u+rwX,go+rX /app && \
    chmod +x healthcheck.sh || true

RUN mkdir -p /app/cache_quantum /tmp && \
    chown -R appuser:appgroup /app/cache_quantum /tmp && \
    chmod 775 /app/cache_quantum /tmp

# Non-root runtime
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD ["/app/healthcheck.sh"]

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--log-level", "warning", "--access-log", "--no-server-header"]

