import type { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { checkDynamoDBHealth } from './healthServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
    // only admin can check health
    if (authInfo['custom:role'] !== 'admin') {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: 'Not authorized',
        }),
      };
    }
    const dynamoDBHealth = await checkDynamoDBHealth(new DynamoDB({}));
    if (dynamoDBHealth.status === 'healthy')
      return {
        statusCode: 200,
        body: JSON.stringify(dynamoDBHealth),
      };
    return {
      statusCode: 500,
      body: JSON.stringify(dynamoDBHealth),
    };
  } catch (error) {
    console.error('Error in dynamoDBHealth:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        message: (error as Error).message,
      }),
    };
  }
};
