# Temporary ToDo File

- dynamodb needs different environment variables, different script? Script flag? This script is getting kind of complex
- probably should give them all 10sec and 256MB by default?
- should users and drivers be soft deleted like pickups?
- the build script is building the services too, how can we leave them out? Maybe an index file that contains the lambdas but not support files like services?
- we have to have the email on the cognito user so they can interact with it, but what if someone wants to be a driver and a user? Different emails?
- should probably take email out of postgres
- try and figure out a way to not include the entire zod schemas bundle in every built file. Maybe some settings on the generator?
- go through various documents in drive and extract important considerations-- there's a lot of good stuff there, but not worth killing momentum at this point.
- when can you delete a pickup? Current statuses are: pending" | "available" | "accepted" | "in_progress" | "completed" | "cancelled" | "deleted. For now I'm saying it has to be pending, available or cancelled
- does it make any sense to have an "in_progress" pickup state? Once you pick up a load and the user pays, isn't it over? Maybe for taking stuff from home depot or wherever...
- what about pending? What does that even mean?
- should pickups have an accepted timestamp? Probably.
- Drivers or admin can get the list of available pickups (constrained by geographic location?   We might want this to be constrained by truck size vs. load size too).
- should a user be able to have more than one pickup scheduled? If so "list pickups" ought to differentiate between admin and user (only list pickups for that user id)
- put prisma/docker setup tasks in readme-- when to run integration tests? How can they be run on github? Probably they can't
- logging for the lambda functions? https://docs.aws.amazon.com/lambda/latest/dg/typescript-logging.html
- Make sure the update AWS github action validates the openapi spec
- set up github actions to automatically redploy aws gateway when openapi spec changes
- is driver really just a special user? Like the driver table would only contain extra info and a userid back to the user table?
- can user/driver change email/phone #? Makes sense in a way, but how to prevent account hijacking?
- Will we need to store the driver's dl #? What about insurance? Going to punt on that for now.
- Does the driver have to put in the vehicle info, etc. to create the account, or can that be done later? Obviously they can't pick up a job without it.
- PII! If we store any of this kind of stuff, we have to be incredibly careful with how we deal with it.
- Issue tracking software? Jira?
- Documentation will become an issue soon enough, too. Confluence?
- For admin frontend, does Next make the most sense?

1. API Gateway Integration:
  Once your Lambda function are implemented and tested, set up the integration with API Gateway. This involves configuring the routes defined in your OpenAPI spec to trigger the appropriate Lambda functions.
  You can do this manually in the console or use Infrastructure as Code (IaC) tools like AWS SAM, CloudFormation, or Terraform.
2. Testing:
  Develop integration tests that cover the entire flow from API Gateway through your Lambda functions and to the database. This ensures that all components of your system work together as expected.
  Create API tests to verify end-to-end functionality.
  Conduct security testing, especially around your authentication setup.
3. Set Up CI/CD Pipeline:
  Create a CI/CD pipeline using a service like AWS CodePipeline or GitHub Actions. This should automate the process of testing, building, and deploying your application.
4. Monitoring and Logging:
  Implement logging in your Lambda functions and set up monitoring using AWS CloudWatch. This will help you track the performance and behavior of your application in production.
5. Optimize and scale:
  Based on your testing results, optimize your Lambda functions and database queries.
  Consider implementing caching if needed (e.g., API Gateway caching, DAX for DynamoDB).
6. Documentation and monitoring:
  Update your API documentation.
  Set up CloudWatch alarms and logs for monitoring.


### Implementing Authorization:
You have a few options for implementing the driver/user role-based access:

1. API Gateway Resource Policies:
You can set up resource policies in API Gateway that check the claims in the JWT.
For example, you could allow access to /v1/pickups/available only if the "user_type" claim is "driver".
2. Lambda Authorizer:
Instead of the built-in Cognito authorizer, you can use a custom Lambda authorizer.
This Lambda function would receive the JWT, decode it, check the claims, and return an IAM policy dynamically.
3. In Your Lambda Functions:
The Lambda functions receive the decoded JWT claims in the event object.
You can add logic in your Lambdas to check these claims and authorize actions accordingly.

**Recommended Approach**:

Use Cognito groups to categorize users and drivers.
Set up API Gateway resource policies or a Lambda authorizer to enforce coarse-grained access control.
Implement fine-grained access control in your Lambda functions by checking the Cognito groups or custom claims.

### Plan for Reviewing AWS Permissions

1. Current Stage (Development):

Use the current permissive policy to set up and test your AWS resources.
Document all AWS actions your application actually performs.


2. Pre-Production Review:

Review the documented AWS actions.
Create a new, more restrictive policy based on these actual needs.
Test the new policy thoroughly in a staging environment.


3. Production Preparation:

Implement the principle of least privilege:

Scope down Resource fields to specific ARNs where possible.
Replace wildcard permissions with specific actions.


Consider creating separate roles for different functions if they have distinct permission needs.
Implement AWS Organizations and Service Control Policies if dealing with multiple accounts or teams.


4. Ongoing Maintenance:

Regularly audit and update permissions as your application evolves.
Use AWS IAM Access Analyzer to identify unused permissions and external access.
Keep your team informed about the importance of AWS security best practices.



TODO: Schedule permission review before moving to production. Target date: [Insert Date Here]