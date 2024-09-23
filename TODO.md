# Temporary ToDo File

- ts-to-zod can do some more complicated stuff like validate emails and phone numbers via jsdoc comments: https://www.npmjs.com/package/ts-to-zod, but how can we leverage that when we're autogenerating types from the openapi spec?
- logging for the lambda functions? https://docs.aws.amazon.com/lambda/latest/dg/typescript-logging.html
- Make sure the update AWS github action validates the openapi spec
- set up github actions to automatically redploy aws gateway when openapi spec changes
- can user/driver change email/phone #? Makes sense in a way, but how to prevent account hijacking?
- Will we need to store the driver's dl #? What about insurance? Going to punt on that for now.
- Does the driver have to put in the vehicle info, etc. to create the account, or can that be done later? Obviously they can't pick up a job without it.
- PII! If we store any of this kind of stuff, we have to be incredibly careful with how we deal with it.
- It's fine and well to implement a delete operation for pickups, but in reality either the driver or the client should be able to cancel them. How are we going to handle that?
- Only user should be able to update pickup location, size, etc. What about time? Can either of them change that? Or would the driver have to request the user change it? Remember, the driver can always cancel it, though.
- Issue tracking software? Jira?
- Documentation will become an issue soon enough, too. Confluence?
- For admin frontend, does Next make the most sense?
- precommit hook with prettier, lint and testing

1. Implement Lambda Functions
# Lambda Implementation Plan

   1. Group Lambda functions by resource:
      - Users
      - Drivers
      - Pickups

   2. For each resource group:
      a. Implement CRUD operations
      b. Implement any additional operations (e.g., list all)
      c. Write unit tests for each function
      d. Mock any database calls or external services

   3. Implement any shared utilities or middleware:
      - Error handling
      - Input validation
      - Authentication checks

   4. Create a local testing environment:
      - Set up environment variables
      - Create mock event payloads

   5. Implement integration tests:
      - Test API Gateway to Lambda integration
      - Test Lambda to Lambda communication (if applicable)

   6. Document each Lambda function:
      - Input/output schema
      - Expected behavior
      - Error scenarios
      
2. Mock Database Interactions:
  While implementing your Lambda functions, use mocks for database interactions. This allows you to define the expected behavior of your data layer without actually implementing it yet. You can use a library like jest for mocking in your unit tests.
3. Set Up Local Testing Environment:
  Create a local environment for testing your Lambda functions. You can use tools like aws-sam-cli or serverless-offline to simulate the AWS environment locally.
4. Implement Shared Utilities:
  Develop shared utilities for common tasks such as input validation, error handling, and authentication checks. These can be used across your Lambda functions to ensure consistency and reduce code duplication.
5. API Gateway Integration:
  Once your Lambda functions are implemented and tested, set up the integration with API Gateway. This involves configuring the routes defined in your OpenAPI spec to trigger the appropriate Lambda functions.
6. Database Design and Implementation:
  After your Lambda functions are working correctly with mocked data, start designing your database schema. Consider using a NoSQL database like DynamoDB for flexibility and easy integration with AWS services. Implement your data access layer and replace the mocks in your Lambda functions with actual database calls.
7. Integration Testing:
  Develop integration tests that cover the entire flow from API Gateway through your Lambda functions and to the database. This ensures that all components of your system work together as expected.
8. Set Up CI/CD Pipeline:
  Create a CI/CD pipeline using a service like AWS CodePipeline or GitHub Actions. This should automate the process of testing, building, and deploying your application.
9. Monitoring and Logging:
  Implement logging in your Lambda functions and set up monitoring using AWS CloudWatch. This will help you track the performance and behavior of your application in production.

1. Set up your database:
   For PostgreSQL: Set up an RDS instance or use a local PostgreSQL for development.
   For DynamoDB: Create your tables in AWS or use DynamoDB Local for development.

2. Start writing Lambda functions:

Begin with simple functions that don't require database access.
Implement unit tests for these functions.
Gradually add database interactions and more complex logic.

3. Integrate Lambda with API Gateway:

Update your API Gateway configuration to point to your Lambda functions.
You can do this manually in the console or use Infrastructure as Code (IaC) tools like AWS SAM, CloudFormation, or Terraform.

4. Implement authentication and authorization:

Integrate your Cognito user pool with API Gateway.
Add authentication checks in your Lambda functions where necessary.

5. Set up your CI/CD pipeline:

Create GitHub Actions workflows for automated testing and deployment.

6. Expand your testing:

Implement integration tests for database interactions.
Create API tests to verify end-to-end functionality.
Conduct security testing, especially around your authentication setup.

7. Optimize and scale:

Based on your testing results, optimize your Lambda functions and database queries.
Consider implementing caching if needed (e.g., API Gateway caching, DAX for DynamoDB).

8. Documentation and monitoring:

Update your API documentation.
Set up CloudWatch alarms and logs for monitoring.
