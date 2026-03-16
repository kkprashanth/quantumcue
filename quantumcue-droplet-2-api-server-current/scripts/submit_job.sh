#!/bin/sh

curl -X POST https://localhost/external/api/v1/process \
  -H "X-API-Key-External: YGBfqslkXrZTURuuNgNup9fqGNt04Myj" \
  -H "X-Client-Id: German123" \
  -F "data_type=logical_AND" \
  -F "arch=AXB" \
  -F "data=@../example_data/patient_record.zip;type=application/zip" --insecure
