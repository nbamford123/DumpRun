# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  name = "dumprun-api"
  body = templatefile("${path.root}/../../api/test-openapi.json", {
    aws_region = var.aws_region
    postgres_health_lambda_arn = var.postgres_health_lambda_arn
    dynamodb_health_lambda_arn = var.dynamodb_health_lambda_arn
    cognito_user_pool_arn = var.cognito_user_pool_arn
  })
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  put_rest_api_mode = "overwrite"
  disable_execute_api_endpoint = false
}

# Enable CORS for all resources
resource "aws_api_gateway_resource" "cors" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "cors" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.cors.id
  http_method   = "OPTIONS"
  authorization = "NONE"  # OPTIONS requests should not require authorization
}

resource "aws_api_gateway_integration" "cors" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cors.id
  http_method = aws_api_gateway_method.cors.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "cors" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cors.id
  http_method = aws_api_gateway_method.cors.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Credentials" = true
  }
}

resource "aws_api_gateway_integration_response" "cors" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.cors.id
  http_method = aws_api_gateway_method.cors.http_method
  status_code = aws_api_gateway_method_response.cors.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.allowed_origins}'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"  
  }
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

# Get cloudwatch logs activated! At least errors
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

# API Gateway deployment
resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  
  depends_on = [
    aws_api_gateway_integration.cors,
    aws_api_gateway_integration_response.cors
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_rest_api.main.body,
      aws_api_gateway_method.cors,
      aws_api_gateway_integration.cors,
      aws_api_gateway_method_response.cors,
      aws_api_gateway_integration_response.cors
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