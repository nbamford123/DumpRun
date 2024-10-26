#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "WARNING: .env file not found"
fi

# Add environment variable validation
required_vars=("AWS_REGION","GATEWAY_API_ID","AWS_ACCOUNT_ID")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

# Configuration
API_ID=$GATEWAY_API_ID
REGION=$AWS_REGION
ACCOUNT_ID=$AWS_ACCOUNT_ID
STAGE="dev"  # or 'prod', etc.

# Array of Lambda functions and their corresponding API paths and methods
declare -A LAMBDA_CONFIGS=(
  ["get-postgres-health"]="/v1/health/postgres GET"
  ["get-dynamodb-health"]="/v1/health/dynamodb GET"
  ["get-users"]="/v1/users GET"
  ["create-user"]="/v1/users POST"
  ["get-user"]="/v1/users/{userId} GET"
  ["update-user"]="/v1/users/{userId} PUT"
  ["delete-user"]="/v1/users/{userId} DELETE"
  ["get-drivers"]="/v1/drivers GET"
  ["create-driver"]="/v1/drivers POST"
  ["get-driver"]="/v1/drivers/{driverId} GET"
  ["update-driver"]="/v1/drivers/{driverId} PUT"
  ["delete-driver"]="/v1/drivers/{driverId} DELETE"
  ["get-pickups"]="/v1/pickups GET"
  ["create-pickup"]="/v1/pickups POST"
  ["get-pickup"]="/v1/pickups/{pickupId} GET"
  ["update-pickup"]="/v1/pickups/{pickupId} PUT"
  ["delete-pickup"]="/v1/pickups/{pickupId} DELETE"
  ["available-pickups"]="/v1/pickups/available GET"
  ["accept-pickup"]="/v1/pickups/{pickupId}/accept POST"
  ["cancel-accepted-pickup"]="/v1/pickups/{pickupId}/cancel-acceptance POST"
  # Add more functions as needed
)

for FUNCTION_NAME in "${!LAMBDA_CONFIGS[@]}"; do
  IFS=' ' read -r RESOURCE_PATH HTTP_METHOD <<< "${LAMBDA_CONFIGS[$FUNCTION_NAME]}"
  
  echo "Setting up permissions for $FUNCTION_NAME..."
  aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-$STAGE-$HTTP_METHOD \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/$STAGE/$HTTP_METHOD$RESOURCE_PATH" \
    --region $REGION

  if [ $? -eq 0 ]; then
    echo "Successfully set permissions for $FUNCTION_NAME"
  else
    echo "Failed to set permissions for $FUNCTION_NAME"
  fi
done

echo "All Lambda permissions have been set up."