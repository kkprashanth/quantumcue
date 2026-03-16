#!/usr/bin/env python3

# Get results from QuantumCue API server.
# To run the script from a terminal:
# python get_results.py
#
# The respective CURL call on a terminal is:
# curl -s -X POST https://api.quantumcue.app/external/api/v0/results  -H "Content-Type: application/json"  -H "X-API-Key-External: YGBfqslkXrZTURuuNgNup9fqGNt04Myj"  -H "X-Client-Id: German123" -d '{"job_id": "test-job-001", "num_classes": 4}'

import json
import requests

# Endpoint
URL = "https://api.quantumcue.app/external/api/v0/results"

# Headers, including key and clinet id.
HEADERS = {
    "Content-Type": "application/json",
    "X-API-Key-External": "YGBfqslkXrZTURuuNgNup9fqGNt04Myj",   # use API Key
    "X-Client-Id": "German123",                                 # use Clinet ID
}

# Payload: job id and number of classes
PAYLOAD = {
    "job_id": "test-job-001",                                   # Use job id
    "num_classes": 4,
}

def main():
    """ Get responce from the API server. """
    resp = requests.post(URL, headers=HEADERS, json=PAYLOAD, timeout=30)
    resp.raise_for_status()

    # Try JSON response first; fall back to raw text.
    try:
        # Get JSON from response
        response = resp.json()
        data = json.dumps(response)
        
        # Print JSON if needed
        print(json.dumps(response, indent=2))
        
        # Job is done
        if "metrics" in response:
            # Show accuracy:
            accuracy_list = response["metrics"]["accuracy"]
            print(f"Accuracy = {accuracy_list}")
        
        if "curves" in response:
            # f1 curve, class 1
            this_class = 1
            x_list = response["curves"]["f1"]["thresholds"]
            y_list = response["curves"]["f1"]["scores"][this_class]
            
            print(f"\nF1 curve, class = {this_class}")
            print(f"\nx = {x_list}")
            print(f"y = {y_list}")
        
    except ValueError:
        print(resp.text)

if __name__ == "__main__":
    main()

