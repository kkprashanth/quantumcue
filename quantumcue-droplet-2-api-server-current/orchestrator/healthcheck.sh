#!/bin/sh
# Healthcheck script: Curl /health with external API key from env
curl -f http://localhost:8000/health \
     -H "X-API-Key-External: ${API_KEY_EXTERNAL}"