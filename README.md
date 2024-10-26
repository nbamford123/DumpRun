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
│   │   ├── pickups/    # Pickup management endpoints + unit tests
│   │   └── users/      # User management endpoints + unit tests
│   ├── schemas/        # Zod schemas and type definitions
│   └── utils/          # Shared utilities
└── tests/              # Test suites
    ├── e2e-tests/      # End-to-end API tests
    └── integration-tests/  # Integration tests
```
### Key Directories

Each lambda domain folder contains its business logic and corresponding unit tests
Unit tests are co-located with the code they test in __tests__ directories

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

## Testing

This project implements a comprehensive testing strategy across three tiers:

### Unit Tests
These are located in `__tests__` directories next to the code they test. They are run on a pre-commit hook, or can be run manually with:
```sh
pnpm test
```

### Integration Tests 

Located in tests/integration-tests, these verify the database service functionality and require `docker-compose`.

First, copy the example test environment file:

```sh
cp .env.test.example .env.test
```
The example test configuration uses:

- Local DynamoDB running in Docker
- Local PostgreSQL test database
- Mock AWS credentials for local testing

> Note: These values work with the provided docker-compose configuration. If you modify the database setup, update these values accordingly.

```sh
pnpm test:integration
```

Run integration tests when:

- Making changes to service layer logic
- Modifying database interactions
- Updating data models
- Before creating a pull request

### E2E Tests
Located in `tests/e2e-tests`, our E2E tests are organized into three tiers of increasing complexity and coverage:

#### Tier 1: API Integration Tests
```sh
pnpm test:e2e:tier1
```
Verifies the basic integration between API Gateway and Lambda functions. These tests:

- Confirm API endpoints are accessible and properly configured
- Validate request/response formats and status codes
- Test API Gateway authorization and routing
- Do not require database connections
- Fastest to run, useful for quick API validation

#### Tier 2: Full Stack Integration
```sh
pnpm test:e2e:tier2
```
Comprehensive testing of individual endpoints through the entire stack. These tests:

- Exercise each endpoint's complete functionality
- Verify database operations (both PostgreSQL and DynamoDB)
- Test data persistence and retrieval
- Validate business logic and constraints
- Run against actual infrastructure

#### Tier 3: Workflow
```sh
pnpm test:e2e:tier3
```
End-to-end workflow tests that simulate real-world usage patterns. These tests:

- Follow complete user journeys (e.g., driver accepts pickup, completes ride)
- Test interactions between multiple endpoints
- Verify system behavior over time
- Validate complex business scenarios
- Most comprehensive but slowest to run

#### ⚠️ Prerequisites for E2E Tests:

- Tier 1: Valid AWS credentials, deployed API
- Tier 2: Above + configured databases
- Tier 3: Above + test user accounts and additional test data


> Note: These tests are currently run manually during deployment verification. Future updates will integrate them into the CI/CD pipeline with appropriate staging environments.

## Deployment
See infrastructure/README.md for detailed deployment instructions and infrastructure management.

## API Documentation
OpenAPI specification is available at api/dumprun-openapi.json.

Key endpoints:

- `/users` - User management
- `/drivers` - Driver management
- `/pickups` - Pickup booking and management
- `/health` - system status

## Architecture

### System Overview

<img src="./docs/images/architecture.svg" alt="Architecture Diagram" width="600" />

### Key Components

1. Client Applications
  - User mobile app
  - Driver mobile app
  - Administrative web interface
2. AWS Infrastructure
  - API Gateway for REST endpoints
  - WebSocket API for real-time updates (TBD)
  - Lambda functions for business logic
  - DynamoDB for real-time data
  - PostgreSQL for persistent storage
3. External Services (TBD)
  - Payment processing
  - Geographical services
4. Security & Authentication
  - AWS Cognito handles user authentication
  - Role-based access control for users, drivers, and admins
  - Secure token-based API access
  - Request signing for WebSocket connections

### Data Flow

1. Clients make requests to API Gateway endpoints
2. API Gateway authenticates and routes to appropriate Lambda
3. Lambda functions process requests and interact with databases
4. Real-time data flows through DynamoDB
5. Persistent data is stored in PostgreSQL

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