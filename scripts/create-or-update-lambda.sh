#!/bin/bash
set -x

# Shared environment variables, add additional with commas
SHARED_ENV='DATABASE_URL=postgresql://postgres:KtcowvSZFUYxciLjrMwNPKVmGEPEfNxn@junction.proxy.rlwy.net:42852/railway,NODE_PATH=/opt/nodejs/node_modules,PRISMA_QUERY_ENGINE_LIBRARY=/opt/nodejs/node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node'

# Prisma layer ARN
PRISMA_LAYER_ARN='arn:aws:lambda:us-west-2:369547265320:layer:prisma-engine:2'

# Function to update the lambda code after a config update
update_function_code() {
    local max_attempts=5
    local wait_time=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if aws lambda update-function-code \
            --function-name $FUNCTION_NAME \
            --zip-file fileb://$ZIP_FILE; then
            echo "Successfully updated code for function $FUNCTION_NAME"
            return 0
        else
            echo "Attempt $attempt: Failed to update code for function $FUNCTION_NAME. Waiting ${wait_time}s before retrying..."
            sleep $wait_time
            attempt=$((attempt + 1))
        fi
    done

    echo "Failed to update code for function $FUNCTION_NAME after $max_attempts attempts"
    return 1
}

# Function to create or update a Lambda function
create_or_update_function() {
    local FUNCTION_NAME=$1
    local HANDLER=$2
    local SPECIFIC_ENV=$3
    local ZIP_FILE=$4

    # Combine shared and specific environment variables
    local FULL_ENV="Variables={$SHARED_ENV,$SPECIFIC_ENV}"

    # Check if function exists
    if aws lambda get-function --function-name $FUNCTION_NAME >/dev/null 2>&1; then
        # Update existing function
        if aws lambda update-function-configuration \
            --function-name $FUNCTION_NAME \
            --environment "$FULL_ENV" \
            --layers $PRISMA_LAYER_ARN \
            --timeout 10 \
            --memory-size 256; then
            echo "Successfully updated configuration for function $FUNCTION_NAME"
        
            # Wait a bit before attempting to update the code
            sleep 5
        
            # Call the function to update code with retries
            if update_function_code; then
                echo "Function $FUNCTION_NAME updated successfully"
            else
                echo "Failed to update function $FUNCTION_NAME"
                return 1
            fi
        else
            echo "Failed to update configuration for function $FUNCTION_NAME"
            return 1
        fi
    else
        # Create new function
        if aws lambda create-function \
            --function-name $FUNCTION_NAME \
            --runtime nodejs20.x \
            --role arn:aws:iam::369547265320:role/LambdaCRUDRole \
            --handler $HANDLER \
            --zip-file fileb://$ZIP_FILE \
            --environment "$FULL_ENV" \
            --layers $PRISMA_LAYER_ARN \
            --timeout 10 \
            --memory-size 256; ; then
            echo "Successfully created function $FUNCTION_NAME"
        else
            echo "Failed to create function $FUNCTION_NAME"
            return 1
        fi
    fi
}

# Check if the script is being run with arguments
if [ "$#" -ne 4 ]; then
    echo "Usage: $0 <FUNCTION_NAME> <HANDLER> <SPECIFIC_ENV> <ZIP_FILE>"
    echo "Example: $0 MyLambdaFunction index.handler SPECIFIC_VAR=value path/to/my-lambda-function.zip"
    exit 1
fi

# Call the function with command-line arguments
create_or_update_function "$1" "$2" "$3" "$4"