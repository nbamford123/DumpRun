import { checkDynamoDBHealth } from './healthServices.js';
import {
	createDynamoHandler,
	type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';
import { createSuccessResponse } from '../types/index.js';

const healthCheckHandler: DynamoOperationHandler<
	'checkDynamoDBHealth'
> = async (context) => {
	const dynamoDBHealth = await checkDynamoDBHealth(context.client);
	return createSuccessResponse<'checkDynamoDBHealth'>(200, dynamoDBHealth);
};

export const handler = createDynamoHandler(healthCheckHandler, {
	requiredRole: ['admin'],
});
