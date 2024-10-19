#!/bin/bash
set -e

# Configuration file
CONFIG_FILE="lambda-config-pickups.json"

# Function to read JSON config
parse_json() {
    echo $(jq -r "$1" $CONFIG_FILE)
}

wait_for_function_update() {
    local func_name="$1"
    echo "Waiting for function $func_name to finish updating..."
    aws lambda wait function-updated --function-name "$func_name"
    echo "Function $func_name update completed."
}

# Function to create IAM role
create_or_update_role() {
    local role_name="$1"
    local managed_policies="$2"
    local inline_policies="$3"
    
    # Check if role exists
    if aws iam get-role --role-name "$role_name" &>/dev/null; then
         echo "Role $role_name already exists. Updating policies..." >&2
    else
         echo "Creating new role $role_name..." >&2
        aws iam create-role \
            --role-name "$role_name" \
            --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
    fi

    # Update managed policies
    for policy_arn in $managed_policies; do
        aws iam attach-role-policy \
            --role-name "$role_name" \
            --policy-arn "$policy_arn" >&2
    done

    # Update inline policies
    if [ "$inline_policies" != "null" ]; then
        echo "Putting inline policies" >&2
        while IFS= read -r policy_name; do
            local policy_document
            policy_document=$(echo "$inline_policies" | jq -r ".[\"$policy_name\"]")
            aws iam put-role-policy \
                --role-name "$role_name" \
                --policy-name "$policy_name" \
                --policy-document "$policy_document" >&2
        done < <(echo "$inline_policies" | jq -r 'keys[]')
    fi

    # Return the role ARN
    aws iam get-role --role-name "$role_name" --query 'Role.Arn' --output text
}

# Function to create or update Lambda function
deploy_lambda() {
    local func_name="$1"
    local handler="$2"
    local role_name="$3"
    local zip_file="$4"

    local managed_policies
    managed_policies=$(parse_json ".\"$func_name\".managed_policies[]")
    
    local inline_policies
    inline_policies=$(parse_json ".\"$func_name\".inline_policies")

    # Create or update role and get its ARN
    local role_arn
    role_arn=$(create_or_update_role "$role_name" "$managed_policies" "$inline_policies")
    echo $role_arn
    
    # Create or update Lambda function
 # Prepare base parameters
    local parameters=(
        --function-name "$func_name"
        --handler "$handler"
        --role "$role_arn"
        --timeout 10
        --memory-size 256
    )

   # Add environment variables if they exist
    if [[ -n "$environment" ]]; then
        echo "Environment variables: $environment"
        local env_json
        env_json=$(echo "$environment" | jq -R -s '
            split(",") | 
            map(split("=") | {key: .[0], value: (.[1:]|join("=")|rtrimstr("\n"))}) | 
            from_entries
        ')
        echo "Formatted environment JSON: $env_json"
        # Use jq to create the correct JSON structure
        env_json_formatted=$(echo "$env_json" | jq -c '{Variables: .}')
        parameters+=(--environment "$env_json_formatted")
    fi
    # Add layer if it exists and is not null
    if [[ -n "$layer" && "$layer" != "null" ]]; then
        echo "Adding layer: $layer"
        parameters+=(--layers "$layer")
    else
        echo "No layer specified or layer is null. Skipping layer configuration."
    fi

    echo "PARAMETERS: ${parameters[@]}"
    
    if aws lambda get-function --function-name "$func_name" &>/dev/null; then
        echo "Updating existing Lambda function $func_name..."
        aws lambda update-function-configuration "${parameters[@]}"
        wait_for_function_update "$func_name"
        aws lambda update-function-code \
            --function-name "$func_name" \
            --zip-file "fileb://$zip_file"
        wait_for_function_update "$func_name"
    else
        echo "Creating new Lambda function $func_name..."
        aws lambda create-function "${parameters[@]}" \
            --runtime nodejs20.x \
            --zip-file "fileb://$zip_file"
        wait_for_function_update "$func_name"
    fi

    # Add Cognito permission if necessary
    local inline_policies
    inline_policies=$(parse_json ".\"$func_name\".inline_policies")
    # if echo "$managed_policies $inline_policies" | grep -q "Cognito"; then
    #     echo "Adding Cognito invocation permission to $func_name..."
    #     aws lambda add-permission \
    #         --function-name "$func_name" \
    #         --statement-id "${func_name}-CognitoInvoke" \
    #         --action "lambda:InvokeFunction" \
    #         --principal "cognito-idp.amazonaws.com" \
    #         --source-arn "arn:aws:cognito-idp:us-east-2:369547265320:userpool/*"
    # fi
}


# Main execution
lambda_functions=$(parse_json "keys[]" | tr ' ' '\n')
while IFS= read -r func; do
    handler=$(parse_json ".\"$func\".handler")
    role_name=$(parse_json ".\"$func\".role_name")
    zip_file=$(parse_json ".\"$func\".zip_file")
    layer=$(parse_json ".\"$func\".layer")
    environment=$(parse_json ".\"$func\".environment")
    deploy_lambda "$func" "$handler" "$role_name" "$zip_file" "$environment" "$layer"
done < <(echo "$lambda_functions")

echo "Lambda functions deployed successfully!"