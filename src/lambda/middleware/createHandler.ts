import type { operations } from '@/schemas/apiSchema.ts';
import {
	getQuerySchema,
	getPathSchema,
	hasQueryParams,
	hasPathParams,
} from '@/schemas/zodSchemaHelpers.js';
import { AuthInfo } from '../types/authInfoSchema.js';
import {
	type APILambda,
	BadRequest,
	Forbidden,
	Unauthorized,
	InternalServerError,
} from '../types/index.js';
import type {
	OperationHandler,
	MiddlewareOptions,
	HandlerContext,
	QueryParams,
	PathParams,
	ParsedBody
} from './types.js';

export const createHandler = <T extends keyof operations>(
	handler: OperationHandler<T>,
	options: MiddlewareOptions<T>,
): APILambda<T> => {
	return async (event, context) => {
		const { awsRequestId } = context;

		// Check for valid authentication info
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
		const role = authResult.data['custom:role'];
		if (!options.requiredRole.includes(role)) {
			console.warn('Unauthorized access attempt', {
				requestId: awsRequestId,
				role,
			});
			return Forbidden();
		}

		try {
			// Base context without parameters
			let handlerContext = {
				requestId: awsRequestId,
				userId: event.requestContext?.authorizer?.claims?.sub ?? '',
				userRole: role,
				body: undefined,
			} as HandlerContext<T>;

			if (event.body) {
				try {
					const requestBody = JSON.parse(event.body) as ParsedBody<T>;
					// TODO: if we're only going to return the body if validation exists, shouldn't we require it?
					if (options.validateInput) {
						const inputResult = options.validateInput.safeParse(requestBody);
						if (!inputResult.success) {
							console.error('Input validation failed', {
								requestId: awsRequestId,
								errors: inputResult.error.issues,
							});
							return BadRequest('Invalid input');
						}
						handlerContext = { ...handlerContext, body: inputResult.data };
					}
				} catch (error) {
					console.error('Failed to parse request body', {
						requestId: awsRequestId,
						error,
					});
					return BadRequest('Invalid JSON in request body');
				}
			}

			// Handle path parameters if operation requires them
			if (options.operation && hasPathParams(options.operation)) {
				const pathSchema = getPathSchema(options.operation);
				const pathResult = pathSchema.safeParse(event.pathParameters || {});

				if (!pathResult.success) {
					// Extract the first error message
					const issue = pathResult.error.issues[0];
					const message = `Invalid path parameter: ${issue?.path.join('.')} - ${issue?.message}`;
					//parameter: issue.path[0]
					console.error('Path parameter validation failed', {
						requestId: awsRequestId,
						errors: message,
					});
					return BadRequest(message);
				}

				handlerContext = {
					...handlerContext,
					params: pathResult.data as PathParams<T>,
				};
			}

			// Handle query parameters if operation requires them
			if (options.operation && hasQueryParams(options.operation)) {
				const querySchema = getQuerySchema(options.operation);
				const queryResult = querySchema.safeParse(
					event.queryStringParameters || {},
				);

				if (!queryResult.success) {
					console.error('Query parameter validation failed', {
						requestId: awsRequestId,
						errors: queryResult.error.issues,
					});
					return BadRequest('Invalid query parameters');
				}

				handlerContext = {
					...handlerContext,
					query: queryResult.data as QueryParams<T>,
				};
			}
			// Execute handler with context
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
