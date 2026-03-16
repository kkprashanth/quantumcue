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

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# =============================================================================
# Stage 2: Runtime
# =============================================================================
FROM python:3.13-alpine

RUN apk add --no-cache curl

RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder --chown=appuser:appgroup /usr/local/bin /usr/local/bin

# Copy qdvi source with correct ownership, then normalize perms
COPY --chown=appuser:appgroup . .
RUN chmod -R u+rwX,go+rX /app && \
    chmod +x /app/healthcheck.sh || true

RUN mkdir -p /app/cache_quantum /tmp/cache && \
    chown -R appuser:appgroup /app/cache_quantum /tmp/cache && \
    chmod 775 /app/cache_quantum /tmp/cache

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD ["/app/healthcheck.sh"]

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3000", "--workers", "1", "--log-level", "warning", "--access-log", "--no-server-header"]

