# Infrastructure Management
This directory contains infrastructure and deployment management scripts for the ride-sharing application backend.

⚠️ Note this is a work in progess that's moving to terraform, but several bash scripts are still necessary

## Environment Setup
Prerequisites:

- AWS CLI configured with appropriate permissions
- Shell environment with bash/zsh

## Deployment Prerequisites

1. Build and bundle the Lambda functions:
```sh
pnpm build
```

## Terraform scripts
The gateway deployment is handled via terraform, primarily in the `main.tf` file. That contains all of the steps to create the gateway from the openapi spec in `api/` and deploy it and set the cloudwatch permissions.
Each individual endpoint arn is set in `variables.tf` and referenced in `main.tf`. 

CORS support is folded into the open api spec programattically via terraform to keep the spec clean and focused on documentation.

cd to `infrastructure/terraform` and
```sh
terraform plan
```
```sh
terraform apply
```

## Deployment Scripts
- `create-update-lambda.sh`: creates or updates lambda function bundles from '`dist/`, detailed in `lambda-config.json`. Accepts an optional regular expression that will match against lambda function keys in the json file and only process those.
- `lambda-gateway-permissions.sh`: gives the gateway endpoints permissions to execute their respective lambda functions
- `trust-policy.sh`: Set up and configure AWS IAM roles and policies for API Gateway to push logs to CloudWatch, loads the policy from `trust-policy.json`

## Miscellaneous
Because we're using prisma for postgres access, we need the binary available to the lambdas at runtime. This layer was created and loaded via the follwing process:

- zip and create prisma layer (libquery_engine-rhel-openssl-3.0.x.so.node):
```sh
  aws lambda publish-layer-version \
    --layer-name prisma-engine \
    --description "Prisma Engine Layer" \
    --zip-file fileb://prisma-engine-layer.zip \
    --compatible-runtimes nodejs20.x
 ```
The rest of the lambda dependencies are bundled with each individual function during the build process. The size could probably be reduced by cherry picking aws dependencies per function, or creating a layer for all of them.
