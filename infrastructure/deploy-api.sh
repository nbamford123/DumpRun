#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "WARNING: .env file not found"
fi

# Add environment variable validation
required_vars=("GATEWAY_API_ID")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

API_ID=$GATEWAY_API_ID
OPENAPI_SPEC_FILE="../api/dumprun-openapi.json"

# Update the API with the new OpenAPI spec
aws apigateway put-rest-api --rest-api-id $API_ID --mode overwrite --body file://$OPENAPI_SPEC_FILE

# Create a deployment
aws apigateway create-deployment --rest-api-id $API_ID --stage-name dev

# Optional: Update stage settings
aws apigateway update-stage --rest-api-id $API_ID --stage-name dev \
    --patch-operations '[
        {"op": "replace", "path": "/tracingEnabled", "value": "true"},
        {"op": "replace", "path": "/*/*/logging/loglevel", "value": "INFO"}
    ]'

# Get your API URL
API_URL=$(aws apigateway get-stage --rest-api-id $API_ID --stage-name dev --query 'invokeUrl' --output text)
echo "Your dev API URL is: $API_URL"