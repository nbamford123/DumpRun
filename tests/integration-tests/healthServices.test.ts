import { config } from 'dotenv';
import { describe, it, beforeAll, expect, afterAll } from 'vitest';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

import {
  checkPostgresHealth,
  checkDynamoDBHealth,
} from '@/lambda/health/healthServices';
import { getPrismaClient } from '@/lambda/middleware/createHandlerPostgres';

// Load environment variables from .env.test
config({ path: '.env.test' });

const dynamoConfig = {
  region: process.env.DYNAMODB_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY || '',
  },
};
const dynamoDb = new DynamoDB(dynamoConfig);

const prisma = getPrismaClient();

describe('Health Service Integration Tests', () => {
  beforeAll(async () => {
    // Connect to the test database
    await prisma.$connect();
  });
  afterAll(async () => {
    dynamoDb.destroy();
    // Disconnect from the test database
    await prisma.$disconnect();
  });

  it('should get a healthy response from postgrest', async () => {
    const health = await checkPostgresHealth(prisma);
    expect(health).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
      latency: expect.any(Number),
    });
  });

  it('should get a healthy response from dynamodb', async () => {
    const health = await checkDynamoDBHealth(dynamoDb);
    expect(health).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
      latency: expect.any(Number),
    });
  });
});
