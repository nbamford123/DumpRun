import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from '@/schemas/authInfoSchema.js';

import { checkPostgresHealth } from './healthServices.js';

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
    const postgresHealth = await checkPostgresHealth();
    if (postgresHealth.status === 'healthy')
      return {
        statusCode: 200,
        body: JSON.stringify(postgresHealth),
      };
    return {
      statusCode: 500,
      body: JSON.stringify(postgresHealth),
    };
  } catch (error) {
    console.error('Error in postgresHealth:', error);
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
