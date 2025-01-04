import { schemas } from '@/schemas/zodSchemas.js';

import {
  createPrismaHandler,
  type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';
import type { Driver } from '../types/schemaTypes.js';

import { getDriverService, updateDriverService } from './driverServices.js';

const updateDriverHandler: PrismaOperationHandler<'updateDriver'> = async (
  context
) => {
  const user = await getDriverService(context.client, context.params.driverId);
  if (user === null) return NotFound('Driver not found');
  if (context.userRole !== 'admin' && context.cognitoUserId !== user.id) {
    console.warn('Unauthorized access attempt', {
      requestId: context.requestId,
    });
    return Forbidden("Driver doesn't have permission");
  }
  const updateDriver = (await updateDriverService(
    context.client,
    context.params.driverId,
    context.body
  )) as NonNullable<Driver>;
  return createSuccessResponse<'updateDriver'>(200, updateDriver);
};

export const handler = createPrismaHandler(updateDriverHandler, {
  requiredRole: ['driver', 'admin'],
  operation: 'updateDriver',
  validateInput: schemas.UpdateDriver,
});
