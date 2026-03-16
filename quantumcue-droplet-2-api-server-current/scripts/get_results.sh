#!/bin/sh

curl -s -X POST https://api.quantumcue.app/external/api/v0/results  -H "Content-Type: application/json"  -H "X-API-Key-External: YGBfqslkXrZTURuuNgNup9fqGNt04Myj"  -H "X-Client-Id: German123" -d '{"job_id": "test-job-001", "num_classes": 4}'
