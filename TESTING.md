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

