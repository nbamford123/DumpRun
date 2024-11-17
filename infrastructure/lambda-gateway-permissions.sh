#!/bin/bash

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "WARNING: .env file not found"
fi

# Add environment variable validation
required_vars=("AWS_REGION" "GATEWAY_API_ID" "AWS_ACCOUNT_ID")
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
STAGE="v1"  # or 'prod', etc.

# Array of Lambda functions and their corresponding API paths and methods
declare -A LAMBDA_CONFIGS=(
  ["get-postgres-health"]="/health/postgres GET"
  ["get-dynamodb-health"]="/health/dynamodb GET"
  # ["get-users"]="/v1/users GET"
  # ["create-user"]="/v1/users POST"
  # ["get-user"]="/v1/users/{userId} GET"
  # ["update-user"]="/v1/users/{userId} PUT"
  # ["delete-user"]="/v1/users/{userId} DELETE"
  # ["get-drivers"]="/v1/drivers GET"
  # ["create-driver"]="/v1/drivers POST"
  # ["get-driver"]="/v1/drivers/{driverId} GET"
  # ["update-driver"]="/v1/drivers/{driverId} PUT"
  # ["delete-driver"]="/v1/drivers/{driverId} DELETE"
  # ["get-pickups"]="/v1/pickups GET"
  # ["create-pickup"]="/v1/pickups POST"
  # ["get-pickup"]="/v1/pickups/{pickupId} GET"
  # ["update-pickup"]="/v1/pickups/{pickupId} PUT"
  # ["delete-pickup"]="/v1/pickups/{pickupId} DELETE"
  # ["available-pickups"]="/v1/pickups/available GET"
  # ["accept-pickup"]="/v1/pickups/{pickupId}/accept POST"
  # ["cancel-accepted-pickup"]="/v1/pickups/{pickupId}/cancel-acceptance POST"
  # Add more functions as needed
)

# Function to check if permission exists
check_permission() {
  local FUNCTION_NAME=$1
  local STATEMENT_ID=$2
  
  aws lambda get-policy --function-name $FUNCTION_NAME --region $REGION 2>/dev/null | \
    grep -q "\"Sid\": \"$STATEMENT_ID\""
  return $?
}

# Function to remove existing permission
remove_permission() {
  local FUNCTION_NAME=$1
  local STATEMENT_ID=$2
  
  echo "Removing existing permission for $FUNCTION_NAME with ID $STATEMENT_ID..."
  aws lambda remove-permission \
    --function-name $FUNCTION_NAME \
    --statement-id $STATEMENT_ID \
    --region $REGION 2>/dev/null
  return $?
}

# Function to add permission
add_permission() {
  local FUNCTION_NAME=$1
  local STATEMENT_ID=$2
  local HTTP_METHOD=$3
  local RESOURCE_PATH=$4
  
  echo "Adding permission for $FUNCTION_NAME..."
  # Try to remove any existing permission first
  remove_permission "$FUNCTION_NAME" "$STATEMENT_ID" 2>/dev/null
  
  aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id $STATEMENT_ID \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$ACCOUNT_ID:$API_ID/$STAGE/$HTTP_METHOD$RESOURCE_PATH" \
    --region $REGION
  return $?
}

# Process each Lambda function
for FUNCTION_NAME in "${!LAMBDA_CONFIGS[@]}"; do
  IFS=' ' read -r RESOURCE_PATH HTTP_METHOD <<< "${LAMBDA_CONFIGS[$FUNCTION_NAME]}"
  STATEMENT_ID="apigateway-$STAGE-$HTTP_METHOD"
  
  echo "Processing $FUNCTION_NAME..."
  
  # Check if Lambda function exists
  if ! aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "Warning: Lambda function $FUNCTION_NAME does not exist. Skipping..."
    continue
  fi
  
  # Always try to remove first, then add
  if add_permission "$FUNCTION_NAME" "$STATEMENT_ID" "$HTTP_METHOD" "$RESOURCE_PATH"; then
    echo "Successfully processed permissions for $FUNCTION_NAME"
  else
    echo "Failed to process permissions for $FUNCTION_NAME"
    exit 1
  fi
done