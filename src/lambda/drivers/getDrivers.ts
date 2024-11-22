import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse } from '../types/index.js';

import { getDriversService } from './driverServices.js';

const getDriverssHandler: PrismaOperationHandler<'listDrivers'> = async (
	context,
) => {
	const drivers = await getDriversService(
		context.client,
		context.query?.limit,
		context.query?.offset,
	);
	return createSuccessResponse<'listDrivers'>(200, {
		drivers,
		total: drivers.length,
	});
};

export const handler = createPrismaHandler(getDriverssHandler, {
	requiredRole: ['admin'],
	operation: 'listDrivers',
});
