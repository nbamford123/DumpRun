import { PrismaClient } from '@prisma/client';
import type { DynamoDB } from '@aws-sdk/client-dynamodb';
import type { components } from '@/schemas/apiSchema.d.ts';

type HealthCheck = components['schemas']['HealthCheck'];

// PostgreSQL health check
export const checkPostgresHealth = async (): Promise<HealthCheck> => {
	const prisma = new PrismaClient();
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
	} finally {
		await prisma.$disconnect();
	}
};

// DynamoDB health check
export const checkDynamoDBHealth = async (
	dynamoDb: DynamoDB,
): Promise<HealthCheck> => {
	const startTime = Date.now();
	try {
		await dynamoDb.describeTable({
			TableName: process.env.TABLE_NAME || '',
		});
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
