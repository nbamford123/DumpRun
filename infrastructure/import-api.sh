#!/bin/bash

# Configuration
API_NAME="DumpRunAPI"
SPEC_FILE="api/dumprun-openapi.json"
REGION="us-west-2"

# Set AWS CLI region
export AWS_DEFAULT_REGION=$REGION

# Function to check if API exists and get its ID
get_api_id() {
    aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text
}

# Get API ID if it exists
API_ID=$(get_api_id)

if [ -z "$API_ID" ]; then
    echo "API does not exist. Creating new API in $REGION..."
    API_ID=$(aws apigateway import-rest-api --body file://$SPEC_FILE --query 'id' --output text)
    
    # Set the API name after creation
    aws apigateway update-rest-api --rest-api-id $API_ID --patch-operations op=replace,path=/name,value="$API_NAME"
    
    echo "New API '$API_NAME' created with ID: $API_ID"
else
    echo "API '$API_NAME' already exists. Updating existing API in $REGION..."
    aws apigateway put-rest-api --rest-api-id $API_ID --body file://$SPEC_FILE --mode overwrite
    echo "API updated successfully."
fi

# Create a deployment
echo "Creating a new deployment..."
DEPLOYMENT_ID=$(aws apigateway create-deployment --rest-api-id $API_ID --stage-name dev --query 'id' --output text)

echo "Deployment created with ID: $DEPLOYMENT_ID"
echo "API Gateway creation/update complete in $REGION."
echo "API Gateway ID: $API_ID"
echo "API Gateway URL: https://$API_ID.execute-api.$REGION.amazonaws.com/dev"