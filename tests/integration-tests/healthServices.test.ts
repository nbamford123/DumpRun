import { config } from 'dotenv';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import {
  checkPostgresHealth,
  checkDynamoDBHealth,
} from '@/lambda/health/healthServices';

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
console.log(dynamoConfig)
const dynamoDb = new DynamoDB(dynamoConfig);

describe('Pickup Service Integration Tests', () => {
  afterAll(async () => {
    dynamoDb.destroy();
  });

  it('should get a healthy response from postgrest', async () => {
    const health = await checkPostgresHealth();
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
      table: process.env.TABLE_NAME,
      latency: expect.any(Number),
    });
  });
});
