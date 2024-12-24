import { schemas } from '@/schemas/zodSchemas.js';

import {
  createPrismaHandler,
  type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { Conflict, createSuccessResponse } from '../types/index.js';
import { createUserService } from './userServices.js';

const createUserHandler: PrismaOperationHandler<'createUser'> = async (
  context
) => {
  const response = await createUserService(context.client, context.body);
  if (response.type === 'success')
    return createSuccessResponse<'createUser'>(201, response.user);
  return Conflict(
    `${
      response.type === 'email_exists'
        ? `A user with email ${response.email} already exists`
        : `A user with phone number ${response.phoneNumber} already exists`
    }`
  );
};

export const handler = createPrismaHandler<'createUser'>(createUserHandler, {
  requiredRole: ['admin'],
  validateInput: schemas.NewUser,
});
