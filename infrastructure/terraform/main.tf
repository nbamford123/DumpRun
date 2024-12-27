# API Gateway

locals {
  base_openapi_spec = jsondecode(templatefile("${path.root}/../../api/dumprun-openapi.json", {
    aws_region = var.aws_region
    allowed_origins = var.allowed_origins
    postgres_health_lambda_arn = var.postgres_health_lambda_arn
    dynamodb_health_lambda_arn = var.dynamodb_health_lambda_arn
    cognito_user_pool_arn = var.cognito_user_pool_arn
    create_user_lambda_arn = var.create_user_lambda_arn
    list_users_lambda_arn = var.list_users_lambda_arn
    get_user_lambda_arn = var.get_user_lambda_arn
    update_user_lambda_arn = var.update_user_lambda_arn
    delete_user_lambda_arn = var.delete_user_lambda_arn
    create_driver_lambda_arn = var.create_driver_lambda_arn
    list_drivers_lambda_arn = var.list_drivers_lambda_arn
    get_driver_lambda_arn = var.get_driver_lambda_arn
    update_driver_lambda_arn = var.update_driver_lambda_arn
    delete_driver_lambda_arn = var.delete_driver_lambda_arn
    create_pickup_lambda_arn = var.create_pickup_lambda_arn
    list_pickups_lambda_arn = var.list_pickups_lambda_arn
    get_pickup_lambda_arn = var.get_pickup_lambda_arn
    update_pickup_lambda_arn = var.update_pickup_lambda_arn
    delete_pickup_lambda_arn = var.delete_pickup_lambda_arn
    accept_pickup_lambda_arn = var.accept_pickup_lambda_arn
    available_pickups_lambda_arn = var.available_pickups_lambda_arn
    cancel_pickup_acceptance_lambda_arn = var.cancel_pickup_acceptance_lambda_arn
  }))
  
  # Generate OPTIONS method configuration for each path
  paths_with_options = {
    for path, methods in local.base_openapi_spec.paths : path => merge(
      methods,
      {
        options = {
          summary = "CORS support"
          x-amazon-apigateway-integration = {
            type = "mock"
            requestTemplates = {
              "application/json" = jsonencode({
                statusCode = 200
              })
            }
            responses = {
              default = {
                statusCode = "200"
                responseParameters = {
                  "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
                  "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
                  "method.response.header.Access-Control-Allow-Origin"  = "'${var.allowed_origins}'"
                  "method.response.header.Access-Control-Allow-Credentials" = "'true'"
                }
                responseTemplates = {
                  "application/json" = ""
                }
              }
            }
          }
          responses = {
            "200" = {
              description = "200 response"
              content = {
                "application/json" = {
                  schema = {
                    type = "object"
                  }
                }
              }
              headers = {
                "Access-Control-Allow-Headers" = {
                  schema = {
                    type = "string"
                  }
                }
                "Access-Control-Allow-Methods" = {
                  schema = {
                    type = "string"
                  }
                }
                "Access-Control-Allow-Origin" = {
                  schema = {
                    type = "string"
                  }
                }
                "Access-Control-Allow-Credentials" = {
                  schema = {
                    type = "string"
                  }
                }
              }
            }
          }
        }
      }
    )
  }

  final_openapi_spec = merge(
    local.base_openapi_spec,
    {
      paths = local.paths_with_options
      "x-amazon-apigateway-cors" = {
        allowOrigins = "'${var.allowed_origins}'"  # Note the added quotes
        allowMethods = "GET,POST,PUT,DELETE,OPTIONS"
        allowHeaders = "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent"
        allowCredentials = true
        maxAge = 7200
      }
    }
  )
}

resource "aws_api_gateway_rest_api" "main" {
  name = "dumprun-api"
  body = jsonencode(local.final_openapi_spec)
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  put_rest_api_mode = "overwrite"
  disable_execute_api_endpoint = false
}

# Add CORS headers to all responses, including auth errors
resource "aws_api_gateway_gateway_response" "cors_4xx" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origins}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "gatewayresponse.header.Access-Control-Allow-Credentials" = "'true'"
  }
}

# Specifically handle unauthorized errors (401)
resource "aws_api_gateway_gateway_response" "unauthorized" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  response_type = "UNAUTHORIZED"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origins}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "gatewayresponse.header.Access-Control-Allow-Credentials" = "'true'"
  }
}

resource "aws_api_gateway_gateway_response" "cors_5xx" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  response_type = "DEFAULT_5XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin" = "'${var.allowed_origins}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "gatewayresponse.header.Access-Control-Allow-Credentials" = "'true'"
  }
}

# Add CloudWatch logging
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled    = true
    logging_level     = "INFO"  # Options: OFF, ERROR, INFO
    data_trace_enabled = false   # Detailed request/response logging, expensive
  }
}

# IAM role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "api-gateway-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "apigateway.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "api_gateway_cloudwatch" {
  name = "api-gateway-cloudwatch"
  role = aws_iam_role.api_gateway_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
        "logs:GetLogEvents",
        "logs:FilterLogEvents"
      ]
      Resource = "*"
    }]
  })
}
# API Gateway deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.main.body,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name = "v1"
}

output "api_url" {
  value = aws_api_gateway_stage.main.invoke_url
}