import { schemas } from '@/schemas/zodSchemas.js';

import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';

import { getUserService, updateUserService } from './userServices.js';

const updateUserHandler: PrismaOperationHandler<'updateUser'> = async (
	context,
) => {
	// Only admin or this user can update
	const user = await getUserService(context.client, context.userId);
	if (user === null) return NotFound('User not found');
	if (context.userRole !== 'admin' && context.userId !== user.id) {
		console.warn('Unauthorized access attempt', {
			requestId: context.requestId,
		});
		return Forbidden("User doesn't have permission");
	}
	const updateUser = await updateUserService(
		context.client,
		context.userId,
		context.body,
	) as NonNullable<unknown>;
	return createSuccessResponse<'updateUser'>(200, updateUser);
};

export const handler = createPrismaHandler(updateUserHandler, {
	requiredRole: ['user', 'admin'],
	operation: 'updateUser',
	validateInput: schemas.UpdateUser,
});
