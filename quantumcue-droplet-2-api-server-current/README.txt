QML Server ver. 0.0.3, works on droplet 2.

Pushed to GitHub from Digital Ocean droplet 2 on Mar. 3, 2026

Directory on Digital Ocean: /opt/api-server-2026-03-03-current/

Check health:
 curl https://api.quantumcue.app/health

Get results v0 (synthetic):
 curl -s -X POST https://api.quantumcue.app/external/api/v0/results  -H "Content-Type: application/json"  -H "X-API-Key-External: YGBfqslkXrZTURuuNgNup9fqGNt04Myj"  -H "X-Client-Id: German123"  -d '{"job_id": "test-job-001", "num_classes": 4}'

