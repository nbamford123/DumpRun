import {
  createPrismaHandler,
  type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';
import type { Driver } from '../types/schemaTypes.js';

import { getDriverService, deleteDriverService } from './driverServices.js';

const deleteDriverHandler: PrismaOperationHandler<'deleteDriver'> = async (
  context
) => {
  const driver = await getDriverService(
    context.client,
    context.params.driverId
  );
  if (driver === null) return NotFound('Driver not found');

  // Only admin or *this* user can delete
  if (context.userRole === 'admin' || context.cognitoUserId === driver.id) {
    const deletedDriver = (await deleteDriverService(
      context.client,
      context.params.driverId
    )) as NonNullable<Driver>;

    return createSuccessResponse<'deleteDriver'>(204, deletedDriver);
  }
  console.warn('Unauthorized access attempt', {
    requestId: context.requestId,
  });
  return Forbidden("User doesn't have permission");
};

export const handler = createPrismaHandler(deleteDriverHandler, {
  requiredRole: ['driver', 'admin'],
  operation: 'deleteDriver',
});
