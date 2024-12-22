import { schemas } from '@/schemas/zodSchemas.js';

import {
	createPrismaHandler,
	type PrismaOperationHandler,
} from '../middleware/createHandlerPostgres.js';
import { createSuccessResponse } from '../types/index.js';
import { createUserService } from './userServices.js';

const createUserHandler: PrismaOperationHandler<'createUser'> = async (
	context,
) => {
	const newUser = await createUserService(
		context.client,
		context.body,
	);
	return createSuccessResponse<'createUser'>(201, newUser);
};

export const handler = createPrismaHandler<'createUser'>(createUserHandler, {
	requiredRole: ['admin'],
	validateInput: schemas.NewUser,
});
