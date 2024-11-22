import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';

import { getDriverService } from './driverServices.js';

const getDriverHandler: PrismaOperationHandler<'getDriver'> = async (context) => {
	const driver = await getDriverService(context.client, context.userId);
	if (driver === null) return NotFound('Driver not found');
	
	// Only admin or this user can retrieve record
	if (context.userRole !== 'admin' && context.userId !== driver.id) {
		console.warn('Unauthorized access attempt', {
			requestId: context.requestId,
		});
		return Forbidden("User doesn't have permission");
	}
	return createSuccessResponse<'getDriver'>(200, driver);
};

export const handler = createPrismaHandler(getDriverHandler, {
	requiredRole: ['driver', 'admin'],
	operation: 'getDriver'
});
