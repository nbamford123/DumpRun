#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "WARNING: .env file not found"
fi

# Add environment variable validation
required_vars=("AWS_ACCOUNT_ID")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "Error: Required environment variable $var is not set"
        exit 1
    fi
done

aws iam create-role --role-name APIGatewayCloudWatchLogsRole --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name APIGatewayCloudWatchLogsRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
aws apigateway update-account --patch-operations op='replace',path='/cloudwatchRoleArn',value='arn:aws:iam::$AWS_ACCOUNT_ID:role/APIGatewayCloudWatchLogsRole'

# test aws apigateway get-stage --rest-api-id $GATEWAY_API_ID --stage-name dev