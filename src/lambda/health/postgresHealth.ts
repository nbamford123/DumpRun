import { checkPostgresHealth } from './healthServices.js';
import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse } from '../types/index.js';

const healthCheckHandler: PrismaOperationHandler<
	'checkPostgresHealth'
> = async (context) => {
	const postgresHealth = await checkPostgresHealth(context.client);
	return createSuccessResponse<'checkPostgresHealth'>(200, postgresHealth);
};

export const handler = createPrismaHandler<'checkPostgresHealth'>(
	healthCheckHandler,
	{ requiredRole: ['admin'] },
);
