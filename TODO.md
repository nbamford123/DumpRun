# Temporary ToDo File

## Backend
- Does delete pickup return the pickup for the hard delete (should we even allow that?)? not in openapi spec
- fix the console outputs for user tests
- should I be formatting zod error returns for query parameters/body the way I do for path? They're pretty useless now, and the path outputs as [Array]
- why are there two .env.local files? Do I need the one in integration tests?
- ask claude about lambda/cloudwatch logging. Is what I have sufficient? Not being set up in terraform!
- set up staging/prod stages in api gateway now? Later?
- the env example files are git ignored
- typo in README
- move testing stuff to a different markdown file? Minimize the readme in general. Maybe a different architecture doc too.
- what about keeping pickup history for both users and drivers? I guess as long as they're not deleted, but that means we should disable even the soft delete
- note that pickups also need some kind of completed state, what determines that? As far as the user is concerned, once the shit is gone and they've paid, it's done.
- when get pickup fails to find the pickup in the db, it throws and returns a 500, shouldn't that be a 404?
- zod failure on getPickups because it's missing the required "status" param, but it's returning a 500. Fix!
- need to revisit lambda logging-- too many 500s. Like a zod failure that then has to be looked up in cloudwatch
- should I create and delete cognito users in the e2e tests?
- should be using cognito groups instead of custom roles for admin,driver, user, then gateway authorizer could enforce that policy before the lambdas get called!
- who marks a pickup as complete? Driver or User? Driver makes more sense, but the User will have to okay it before payment goes through, right?
- turn off cloudwatch logs for gateway? What about lambdas? It costs $$$
- need to figure out a way to use the dynamodb schema in both test and prod, right now I'm swapping out the configs, that sux
- dynamo table name needs to be defined somewhere rather than sprinkled everywhere throughout the code, probably ENV
- is a 200 return from soft delete pickup correct?
- VPC Configuration: If your DynamoDB is accessed via VPC endpoints, you'll need to configure VPC settings for your Lambda.
- X-Ray Tracing: Consider adding X-Ray tracing for better insights into your Lambda and DynamoDB interactions.
- should users and drivers be soft deleted like pickups?
- the build script is building the services too, how can we leave them out? Maybe an index file that contains the lambdas but not support files like services?
- we have to have the email on the cognito user so they can interact with it, but what if someone wants to be a driver and a user? Different emails?
- should probably take email out of postgres? Or is it safer to have it duplicated from cognito?
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

1. Testing:
  Conduct security testing, especially around your authentication setup.
2. Set Up CI/CD Pipeline:
  Create a CI/CD pipeline using a service like AWS CodePipeline or GitHub Actions. This should automate the process of testing, building, and deploying your application.
3. Monitoring and Logging:
  Implement logging in your Lambda functions and set up monitoring using AWS CloudWatch. This will help you track the performance and behavior of your application in production.
4. Optimize and scale:
  Based on your testing results, optimize your Lambda functions and database queries.
  Consider implementing caching if needed (e.g., API Gateway caching, DAX for DynamoDB).
5. Documentation and monitoring:
  Update your API documentation.
  Set up CloudWatch alarms and logs for monitoring.

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

1. Resource Policies:
Consider setting up resource policies for your API to control who can invoke it at the API level.

2. WAF (Web Application Firewall):
For production APIs, consider setting up AWS WAF to protect against common web exploits.

3. SSL/TLS:
Ensure your API is only accessible via HTTPS. This is typically the default in API Gateway.

4. Logging and Monitoring:
Set up CloudWatch logs and metrics for your API to monitor usage and detect potential security issues.

## e2e test with production table

```javascript
// testSetup/dbUtils.ts
const TEST_PREFIX = 'e2e_test_';  // Clear identifier for test data

export function generateTestId() {
  return `${TEST_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function isTestData(id: string) {
  return id.startsWith(TEST_PREFIX);
}

export async function cleanupAllTestData() {
  // Scan table for test prefixed items and delete
  const testItems = await dynamoDB.scan({
    TableName: 'YourTable',
    FilterExpression: 'begins_with(id, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': TEST_PREFIX
    }
  }).promise();
  
  // Delete in batches
  // Important: Only delete items with test prefix
  for (const item of testItems.Items) {
    if (isTestData(item.id)) {
      await dynamoDB.delete({
        TableName: 'YourTable',
        Key: { id: item.id }
      }).promise();
    }
  }
}
```

### Safety checks in tests

```javascript
export async function createTestItem(data: any) {
  const testId = generateTestId();
  const testItem = {
    ...data,
    id: testId
  };
  
  // Double-check we're not accidentally using a non-test ID
  if (!isTestData(testItem.id)) {
    throw new Error('Attempting to create non-test data in tests');
  }
  
  return await apiGatewayClient.post('/items', testItem);
}

export async function deleteTestItem(id: string) {
  // Safety check before deletion
  if (!isTestData(id)) {
    throw new Error('Attempting to delete non-test data');
  }
  
  return await apiGatewayClient.delete(`/items/${id}`);
}
```

### Cleanup function before and after tests

```javascript
describe('API Gateway DB Integration Tests', () => {
  beforeAll(async () => {
    // Clean up any leftover test data from previous runs
    await cleanupAllTestData();
  });

  afterAll(async () => {
    // Clean up after tests
    await cleanupAllTestData();
  });

  it('completes CRUD operations', async () => {
    const testItem = {
      name: 'test item',
      attributes: {
        // Test all schema fields you care about
        stringField: 'test',
        numberField: 123,
        booleanField: true,
        arrayField: ['test'],
        objectField: { nested: 'value' }
      }
    };

    const createResponse = await createTestItem(testItem);
    expect(createResponse.statusCode).toBe(201);
    
    // Verify all fields were saved correctly
    const readResponse = await apiGatewayClient.get(`/items/${createResponse.body.id}`);
    expect(readResponse.body.attributes).toEqual(testItem.attributes);
  });
});
```

### Monitoring/Alerts for test data

```javascript
async function monitorTestData() {
  const testItems = await dynamoDB.scan({
    TableName: 'YourTable',
    FilterExpression: 'begins_with(id, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': TEST_PREFIX
    },
    Select: 'COUNT'
  }).promise();

  if (testItems.Count > 100) {  // Adjust threshold as needed
    // Alert via CloudWatch/SNS
    console.error(`High number of test items detected: ${testItems.Count}`);
  }
}
```

### Consider time based cleanup

```javascript
export function generateTestId() {
  const timestamp = Date.now();
  return `${TEST_PREFIX}${timestamp}_${Math.random().toString(36).slice(2)}`;
}

export async function cleanupOldTestData() {
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  // Parse timestamp from ID and delete old items
  const testItems = await dynamoDB.scan({
    TableName: 'YourTable',
    FilterExpression: 'begins_with(id, :prefix)',
    ExpressionAttributeValues: {
      ':prefix': TEST_PREFIX
    }
  }).promise();

  for (const item of testItems.Items) {
    const timestamp = parseInt(item.id.split('_')[1]);
    if (timestamp < oneDayAgo) {
      await deleteTestItem(item.id);
    }
  }
}
```