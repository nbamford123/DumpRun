import { AuthInfo } from '../types/authInfoSchema.js';
import type { operations } from '@/schemas/apiSchema.ts';
import {
	type APILambda,
	type APIResponse,
	BadRequest,
	Forbidden,
	Unauthorized,
	InternalServerError,
} from '../types/index.js';

export type HandlerContext = {
	requestId: string;
	userId: string;
	userRole: string;
};

export type MiddlewareOptions = {
	requiredRole: string;
	validateInput?: z.ZodSchema;
};

export type OperationHandler = (
	context: HandlerContext,
) => Promise<APIResponse>;

export const createHandler = <T extends keyof operations>(
	handler: OperationHandler,
	options: MiddlewareOptions,
): APILambda<T> => {
	return async (event, context) => {
		const { awsRequestId } = context;
		const authResult = AuthInfo.safeParse(
			event.requestContext?.authorizer?.claims,
		);
		if (!authResult.success) {
			console.error('Auth validation failed', {
				requestId: awsRequestId,
				errors: authResult.error.issues,
			});
			return Unauthorized();
		}

		// Check role authorization
		if (authResult.data['custom:role'] !== options.requiredRole) {
			console.warn('Unauthorized access attempt', {
				requestId: awsRequestId,
				role: authResult.data['custom:role'],
			});
			return Forbidden();
		}

		try {
			// Input validation if schema provided
			if (options.validateInput) {
				const inputResult = options.validateInput.safeParse(event.body);
				if (!inputResult.success) {
					console.error('Input validation failed', {
						requestId: awsRequestId,
						errors: inputResult.error.issues,
					});
					return BadRequest('Invalid input');
				}
				event.body = inputResult.data;
			}

			// Create handler context
			const handlerContext: HandlerContext = {
				requestId: awsRequestId,
				userId: event.requestContext?.authorizer?.claims?.sub ?? '',
				userRole:
					event.requestContext?.authorizer?.claims?.['custom:role'] ?? '',
			};

			// Execute handler with validated context
			return await handler(handlerContext);
		} catch (error) {
			console.error('Handler execution failed', {
				requestId: awsRequestId,
				error: error instanceof Error ? error.message : String(error),
			});
			return InternalServerError();
		}
	};
};

// Example usage in a lambda file
// healthcheck.ts
// import { createHandler } from '../middleware/createHandler';
// import { z } from 'zod';

// const healthCheckHandler: LambdaHandler = async (event, context) => {
// 	const health = await checkDynamoDBHealth(context.client);
// 	return createSuccessResponse(200, health);
// };

// export const handler = createHandler(healthCheckHandler, {
// 	requireAuth: true,
// 	requiredRole: 'admin',
// });

// // user-update.ts
// const updateUserSchema = z.object({
// 	name: z.string(),
// 	email: z.string().email(),
// });

// const updateUserHandler: LambdaHandler<{
// 	body: z.infer<typeof updateUserSchema>;
// }> = async (event, context) => {
// 	// Handler has access to validated body and typed context
// 	const { name, email } = event.body;
// 	// ... update user logic
// 	return createSuccessResponse(200, { success: true });
// };

// export const handler = createHandler(updateUserHandler, {
// 	requireAuth: true,
// 	validateInput: updateUserSchema,
// });
