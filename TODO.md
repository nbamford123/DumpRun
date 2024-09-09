# Temporary ToDo File

* Make sure the update AWS github action validates the openapi spec
* set up github actions to automatically redploy aws gateway when openapi spec changes
* can user/driver change email/phone #? Makes sense in a way, but how to prevent account hijacking?
* Will we need to store the driver's dl #? What about insurance? Going to punt on that for now.
* Does the driver have to put in the vehicle info, etc. to create the account, or can that be done later? Obviously they can't pick up a job without it.
* PII! If we store any of this kind of stuff, we have to be incredibly careful with how we deal with it.
* It's fine and well to implement a delete operation for pickups, but in reality either the driver or the client should be able to cancel them. How are we going to handle that?
*. Only user should be able to update pickup location, size, etc. What about time? Can either of them change that? Or would the driver have to request the user change it? Remember, the driver can always cancel it, though.
* Issue tracking software? Jira? 
* Documentation will become an issue soon enough, too. Confluence?
* For admin frontend, does Next make the most sense?


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