import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';

import { getUserService } from './userServices.js';

const getUserHandler: PrismaOperationHandler<'getUser'> = async (context) => {
	const user = await getUserService(context.client, context.params.userId);
	if (user === null) return NotFound('User not found');
	
	// Only admin or this user can retrieve record
	if (context.userRole !== 'admin' && context.cognitoUserId !== user.id) {
		console.warn('Unauthorized access attempt', {
			requestId: context.requestId,
		});
		return Forbidden("User doesn't have permission");
	}
	return createSuccessResponse<'getUser'>(200, user);
};

export const handler = createPrismaHandler(getUserHandler, {
	requiredRole: ['user', 'admin'],
	operation: 'getUser'
});
