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
  description = "ARN of the existing create user Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:create-user"
}

variable "list_users_lambda_arn" {
  type = string
  description = "ARN of the existinglist users Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-users"
}

variable "get_user_lambda_arn" {
  type = string
  description = "ARN of the existing get user Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-user"
}

variable "update_user_lambda_arn" {
  type = string
  description = "ARN of the existing update user Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:update-user"
}

variable "delete_user_lambda_arn" {
  type = string
  description = "ARN of the existing delete user Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:delete-user"
}

variable "create_driver_lambda_arn" {
  type = string
  description = "ARN of the existing create driver Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:create-driver"
}

variable "list_drivers_lambda_arn" {
  type = string
  description = "ARN of the existing list drivers Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-drivers"
}

variable "get_driver_lambda_arn" {
  type = string
  description = "ARN of the existing get driver Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-driver"
}

variable "update_driver_lambda_arn" {
  type = string
  description = "ARN of the existing update driver Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:update-driver"
}

variable "delete_driver_lambda_arn" {
  type = string
  description = "ARN of the existing delete driver Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:delete-driver"
}

variable "create_pickup_lambda_arn" {
  type = string
  description = "ARN of the existing create pickup Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:create-pickup"
}

variable "list_pickups_lambda_arn" {
  type = string
  description = "ARN of the existing list pickups Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-pickups"
}

variable "get_pickup_lambda_arn" {
  type = string
  description = "ARN of the existing get pickup Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:get-pickup"
}

variable "update_pickup_lambda_arn" {
  type = string
  description = "ARN of the existing update pickup Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:update-pickup"
}

variable "delete_pickup_lambda_arn" {
  type = string
  description = "ARN of the existing delete pickup Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:delete-pickup"
}

variable "accept_pickup_lambda_arn" {
  type = string
  description = "ARN of the existing accept pickup Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:accept-pickup"
}

variable "available_pickups_lambda_arn" {
  type = string
  description = "ARN of the existing available pickups Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:available-pickups"
}

variable "cancel_pickup_acceptance_lambda_arn" {
  type = string
  description = "ARN of the existing cancel accepted pickup Lambda"
  default = "arn:aws:lambda:us-west-2:369547265320:function:cancel-accepted-pickup"
}

variable "cognito_user_pool_arn" {
  type        = string
  description = "ARN of the Cognito User Pool to use for authorization"
  default = "arn:aws:cognito-idp:us-west-2:369547265320:userpool/us-west-2_vriluhdDN"
}
