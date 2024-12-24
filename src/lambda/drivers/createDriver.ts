import { schemas } from '@/schemas/zodSchemas.js';

import {
  createPrismaHandler,
  type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { Conflict, createSuccessResponse } from '../types/index.js';
import { createDriverService } from './driverServices.js';

const createDriverHandler: PrismaOperationHandler<'createDriver'> = async (
  context
) => {
  const response = await createDriverService(context.client, context.body);
  if (response.type === 'success')
    return createSuccessResponse<'createDriver'>(201, response.user);
  return Conflict(
    `${
      response.type === 'email_exists'
        ? `A user with email ${response.email} already exists`
        : `A user with phone number ${response.phoneNumber} already exists`
    }`
  );
};

export const handler = createPrismaHandler<'createDriver'>(
  createDriverHandler,
  {
    requiredRole: ['driver', 'admin'],
    validateInput: schemas.NewDriver,
  }
);
