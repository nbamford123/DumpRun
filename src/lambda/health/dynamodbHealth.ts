import { checkDynamoDBHealth } from './healthServices.js';
import {
	createHandler,
	type OperationHandler,
} from '../middleware/createHandler.js';
import { createSuccessResponse } from '../types/index.js';

const healthCheckHandler: OperationHandler = async (context) => {
	const dynamoDBHealth = await checkDynamoDBHealth(context.client);
	return createSuccessResponse<'checkDynamoDBHealth'>(200, dynamoDBHealth);
};

export const handler = createHandler<'checkDynamoDBHealth'>(
	healthCheckHandler,
	{ requiredRole: 'admin' },
);
