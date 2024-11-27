import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';

import { getUserService, deleteUserService } from './userServices.js';

const deleteUserHandler: PrismaOperationHandler<'deleteUser'> = async (
	context,
) => {
	const user = await getUserService(context.client, context.userId);
	if (user === null) return NotFound('User not found');

	// Only admin or *this* user can delete
	if (context.userRole !== 'admin' && context.userId !== user.id) {
		console.warn('Unauthorized access attempt', {
			requestId: context.requestId,
		});
		return Forbidden("User doesn't have permission");
	}

	const deletedUser = (await deleteUserService(
		context.client,
		context.userId,
	)) as NonNullable<unknown>;

	return createSuccessResponse<'deleteUser'>(204, deletedUser);
};

export const handler = createPrismaHandler(deleteUserHandler, {
	requiredRole: ['user', 'admin'],
	operation: 'deleteUser',
});
