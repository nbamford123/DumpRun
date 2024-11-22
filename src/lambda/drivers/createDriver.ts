import { schemas } from '@/schemas/zodSchemas.js';

import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse } from '../types/index.js';
import { createDriverService } from './driverServices.js';

const createDriverHandler: PrismaOperationHandler<'createDriver'> = async (
	context,
) => {
	const newDriver = await createDriverService(
		context.client,
		context.userId,
		context.body,
	);
	return createSuccessResponse<'createDriver'>(201, newDriver);
};

export const handler = createPrismaHandler<'createDriver'>(createDriverHandler, {
	requiredRole: ['driver', 'admin'],
	validateInput: schemas.NewDriver,
});
