import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

import type { operations } from '@/schemas/apiSchema.ts';
import type { APILambda, APIResponse } from '../types/index.js';
import {
	createHandler,
	type HandlerContext,
	type OperationHandler,
	type MiddlewareOptions,
} from './createHandler.js';

const dynamoDBClient = new DynamoDB({
  maxAttempts: 3,
  retryMode: 'standard',
  // Region can be specified here if needed
  // region: process.env.AWS_REGION,
});

// Create a DocumentClient wrapper with additional configuration
const documentClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    // Removes attributes with undefined values
    removeUndefinedValues: true,
    // Converts empty strings, sets, and lists to null
    convertEmptyValues: true,
    // More precise number handling
    convertClassInstanceToMap: true
  },
  unmarshallOptions: {
    // Converts DynamoDB number to JS number instead of string
    wrapNumbers: false,
  }
});

// Export as a singleton
export const getDynamoClient = () => documentClient;

export type DynamoHandlerContext = HandlerContext & {
	client: DynamoDB;
};
export type DynamoOperationHandler = (
	context: DynamoHandlerContext,
) => Promise<APIResponse>;

export const createDynamoHandler = <T extends keyof operations>(
	handler: DynamoOperationHandler,
	options: MiddlewareOptions,
): APILambda<T> => {
	const wrappedHandler: OperationHandler = async (context) => {
		// Enhance the context with the DynamoDB client
		const dynamoContext = {
			...context,
			client: dynamoDBClient,
		};
		return handler(dynamoContext);
	};
	// Use the existing createHandler with our wrapped handler
	return createHandler(wrappedHandler, {
		...options,
	});
};
