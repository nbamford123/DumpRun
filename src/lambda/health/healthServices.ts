import type { PrismaClient } from '@prisma/client';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  DescribeTableCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';

import type { components } from '@/schemas/apiSchema.d.ts';

type HealthCheck = components['schemas']['HealthCheck'];

// PostgreSQL health check
export const checkPostgresHealth = async (
  prisma: PrismaClient
): Promise<HealthCheck> => {
  const startTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    };
  }
};

// DynamoDB health check
export const checkDynamoDBHealth = async (
  dynamoDb: DynamoDBDocumentClient
): Promise<HealthCheck> => {
  const startTime = Date.now();
  const tableName = process.env.TABLE_NAME || '';
  try {
    // DescribeTable is one of the lightest operations we can perform
    await dynamoDb.send(
      new DescribeTableCommand({
        TableName: tableName,
      })
    );
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime,
    };
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        latency: Date.now() - startTime,
        error: `Table ${tableName} not found`,
      };
    }
    // Any other error indicates a connection or permission issue
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
