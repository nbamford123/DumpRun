import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse } from '../types/index.js';

import { getUsersService } from './userServices.js';

const getUsersHandler: PrismaOperationHandler<'listUsers'> = async (
	context,
) => {
	const users = await getUsersService(
		context.client,
		context.query?.limit,
		context.query?.offset,
	);
	return createSuccessResponse<'listUsers'>(200, {
		users,
		total: users.length,
	});
};

export const handler = createPrismaHandler(getUsersHandler, {
	requiredRole: ['admin'],
	operation: 'listUsers',
});
