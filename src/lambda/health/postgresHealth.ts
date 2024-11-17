import { checkPostgresHealth } from './healthServices.js';
import {
	createHandler,
	type OperationHandler,
} from '../middleware/createHandler.js';
import { createSuccessResponse } from '../types/index.js';

const healthCheckHandler: OperationHandler = async (context) => {
	const dynamoDBHealth = await checkPostgresHealth();
	return createSuccessResponse<'checkPostgresHealth'>(200, dynamoDBHealth);
};

export const handler = createHandler<'checkPostgresHealth'>(
	healthCheckHandler,
	{ requiredRole: 'admin' },
);
