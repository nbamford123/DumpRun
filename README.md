# DumpRun Backend

## Overview
Backend service for the DumpRun platform - a service connecting waste removal drivers with customers needing debris removal. Provides core functionality for user/driver management and pickup scheduling/tracking.

## Project Status
🚧 Alpha Stage - Core functionality implemented, undergoing testing and refinement.

## Tech Stack

### Infrastructure
- API Gateway: RESTful API endpoint management
- Lambda: Serverless compute
- Cognito: user authentication and management
- Databases
  - DynamoDB: Real-time data (user and locations, active pickups)
  - PostgreSQL: Persistent data (user and driver profiles, ride history)

### Development and Testing
- TypeScript: Strongly-typed JavaScript, providing compile-time type safety
- Docker/Compose: Local development environment and database containerization
- Vitest: Fast, modern test runner with TypeScript support
- Prisma: Type-safe ORM for database operations
- Zod: Runtime type validation and schema definition
- OpenAPI: API specification and documentation
- PNPM: Fast, disk-efficient package manager
- Biome: Linting and formatting
- Husky: Git hooks for code quality
- Tsup: Fast typescript bundling, powered by esbuild

## Project Structure
```
.
├── api/                # OpenAPI specification and API documentation
├── dynamodb/           # DynamoDB schema and local setup
├── infrastructure/     # Deployment scripts and AWS configuration
├── prisma/             # Postgres schema and migrations
├── src/
│   ├── lambda/         # Lambda function implementations
│   │   ├── drivers/    # Driver management endpoints + unit tests
│   │   ├── health/     # Health check endpoints + unit tests
│   │   ├── middleware/ # Utility functions and types for parsing and validating requests and create responses + unit tests
│   │   ├── pickups/    # Pickup management endpoints + unit tests
│   │   ├── types/      # Shared lambda types
│   │   └── users/      # User management endpoints + unit tests
│   ├── schemas/        # Zod schemas and type definitions
│   └── utils/          # Shared utilities
└── tests/              # Test suites
    ├── e2e-tests/      # End-to-end API tests
    └── integration-tests/ # Integration tests
```
### Key Directories

Each lambda domain folder contains its business logic and corresponding unit tests.

Unit tests are co-located with the code they test in __tests__ directories.

For detailed information about infrastructure setup and deployment, see infrastructure/README.md.

## Getting Started

### Prerequisites

- AWS Account with appropriate permissions
- Node.js (version 20.18.0)
- AWS CLI configured
- git
- pnpm
- nvm
- docker desktop and docker-compose (for integration tests)

### Local Development

1. Clone the repository:
```sh
git clone git@github.com:TruckLink/DumpRun.git
```
2. Set node version:
```sh
nvm use
```
3. Install dependencies
```sh
pnpm i
```
4. Set up local environment
```sh
cp .env.example .env
# Configure your environment variables
```

After setup, you can:
- Test endpoints locally against containerized databases
- Run the full test suite
- Validate API changes against OpenAPI spec

#### Building the project
```sh
# Build the project
pnpm build
```
This builds and bundles the lambda functions into `dist/`, required for deployment to AWS.

#### Type Safety Workflow
The project maintains type safety through automated tooling:
```sh
# Validate OpenAPI spec and generate types
pnpm sync-types
```

This command:

- Validates the OpenAPI specification
- Generates TypeScript types from the OpenAPI spec
- Generates Zod schemas for runtime validation

> Important: Run this command after any changes to the OpenAPI specification.

## Deployment
See infrastructure/README.md for detailed deployment instructions and infrastructure management.

## Testing
See TESTING.md for testing documentation.

## API Documentation
OpenAPI specification is available at api/dumprun-openapi.json.

Key endpoints:

- `/users` - User management
- `/drivers` - Driver management
- `/pickups` - Pickup booking and management
- `/health` - system status

## Monitoring and Logging

- CloudWatch Logs for Lambda functions
- CloudWatch Metrics for performance monitoring

## Security

- All database access is restricted to Lambda functions
- API Gateway handles authentication/authorization
- VPC configuration isolates PostgreSQL
- DynamoDB access controlled via IAM

## Known Issues
(see TODO.md)

## Contributing

- Fork the repository
- Create your feature branch
- Commit your changes
- Push to the branch
- Create a new Pull Request

See CONTRIBUTING.md for detailed guidelines. (TBD)

## License
PROPRIETARY AND CONFIDENTIAL
This repository contains proprietary and confidential information. Unauthorized copying, distribution, or use of this repository, via any medium, is strictly prohibited.
Copyright (c) 2024 Nathan Bamford

## Contact
nathan.bamford@gmail.com