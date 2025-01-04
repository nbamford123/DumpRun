import { schemas } from '@/schemas/zodSchemas.js';

import {
  createPrismaHandler,
  type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';
import type { User } from '../types/schemaTypes.js';

import { getUserService, updateUserService } from './userServices.js';

const updateUserHandler: PrismaOperationHandler<'updateUser'> = async (
  context
) => {
  const user = await getUserService(context.client, context.params.userId);
  if (user === null) return NotFound('User not found');
  if (context.userRole !== 'admin' && context.cognitoUserId !== user.id) {
    console.warn('Unauthorized access attempt', {
      requestId: context.requestId,
    });
    return Forbidden("User doesn't have permission");
  }
  const updateUser = (await updateUserService(
    context.client,
    context.params.userId,
    context.body
  )) as NonNullable<User>;
  return createSuccessResponse<'updateUser'>(200, updateUser);
};

export const handler = createPrismaHandler(updateUserHandler, {
  requiredRole: ['user', 'admin'],
  operation: 'updateUser',
  validateInput: schemas.UpdateUser,
});
