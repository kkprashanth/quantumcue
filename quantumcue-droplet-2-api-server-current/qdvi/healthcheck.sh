#!/bin/sh
# Healthcheck script: Curl /internal/health with internal API key from env
curl -f http://localhost:3000/health \
     -H "X-API-Key-Internal: ${API_KEY_INTERNAL}"
