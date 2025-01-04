import {
  createPrismaHandler,
  type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';
import type { User } from '../types/schemaTypes.js';

import { getUserService, deleteUserService } from './userServices.js';

const deleteUserHandler: PrismaOperationHandler<'deleteUser'> = async (
  context
) => {
  const user = await getUserService(context.client, context.params.userId);
  if (user === null) return NotFound('User not found');

  // Only admin or *this* user can delete
  if (context.userRole !== 'admin' && context.cognitoUserId !== user.id) {
    console.warn('Unauthorized access attempt', {
      requestId: context.requestId,
    });
    return Forbidden("User doesn't have permission");
  }

  const deletedUser = (await deleteUserService(
    context.client,
    context.params.userId
  )) as NonNullable<User>;

  return createSuccessResponse<'deleteUser'>(204, deletedUser);
};

export const handler = createPrismaHandler(deleteUserHandler, {
  requiredRole: ['user', 'admin'],
  operation: 'deleteUser',
});
