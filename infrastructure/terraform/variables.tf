# variables.tf
variable "allowed_origins" {
  type    = string
  default = "http://localhost:5173"
}

variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "postgres_health_lambda_arn" {
  type = string
  description = "ARN of the existing PostgreSQL health check Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-postgres-health"
}

variable "dynamodb_health_lambda_arn" {
  type = string
  description = "ARN of the existing DynamoDB health check Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-dynamodb-health"
}

variable "create_user_lambda_arn" {
  type = string
  description = "ARN of the existing DynamoDB health check Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:create-user"
}

variable "list_users_lambda_arn" {
  type = string
  description = "ARN of the existing DynamoDB health check Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-users"
}

variable "get_user_lambda_arn" {
  type = string
  description = "ARN of the existing DynamoDB health check Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-user"
}

variable "update_user_lambda_arn" {
  type = string
  description = "ARN of the existing DynamoDB health check Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:update-user"
}

variable "delete_user_lambda_arn" {
  type = string
  description = "ARN of the existing DynamoDB health check Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:delete-user"
}

variable "cognito_user_pool_arn" {
  type        = string
  description = "ARN of the Cognito User Pool to use for authorization"
  default = "arn:aws:cognito-idp:us-west-2:369547265320:userpool/us-west-2_vriluhdDN"
}
