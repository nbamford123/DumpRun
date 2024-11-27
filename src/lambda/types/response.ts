import type { Context } from 'aws-lambda';

import type { operations } from '@/schemas/apiSchema.ts';
import { ErrorCodes, type APIError } from '@/schemas/errors.js';

import { getCorsHeaders } from '@/utils/corsHeaders.js';
import type { APIGatewayTransformedEvent } from './gateway.js';

export type SuccessStatusCode = 200 | 201 | 204;
export type ErrorStatusCode = 400 | 401 | 403 | 404 | 409 | 500;

export type SuccessResponse = {
	statusCode: SuccessStatusCode;
	headers: Record<string, unknown>;
	body: string;
};
export type ErrorResponse = {
	statusCode: ErrorStatusCode;
	headers: Record<string, unknown>;
	body: string;
};

export type APIResponse = SuccessResponse | ErrorResponse;

// Helper type to extract response type from operation
type OperationResponse<
	TOperation extends keyof operations,
	TStatus extends number,
> = TStatus extends keyof operations[TOperation]['responses']
	? operations[TOperation]['responses'][TStatus] extends {
			content: { 'application/json': infer T };
		}
		? T
		: never
	: never;

export type OperationSuccessResponse<TOperation extends keyof operations> =
	| OperationResponse<TOperation, 200>
	| OperationResponse<TOperation, 201>
	| OperationResponse<TOperation, 204>;

export type APILambda<TOperation extends keyof operations> = (
	event: APIGatewayTransformedEvent<TOperation>,
	context: Context,
) => Promise<APIResponse>;

// Helper function to maintain type safety during stringification
export const createSuccessResponse = <TOperation extends keyof operations>(
	statusCode: SuccessStatusCode,
	body?: OperationSuccessResponse<TOperation>,
): SuccessResponse => {
	return {
		statusCode,
		headers: getCorsHeaders(),
		body: JSON.stringify(body),
	};
};

export function createErrorResponse(
	statusCode: ErrorStatusCode,
	error: APIError,
): ErrorResponse {
	return {
		statusCode,
		headers: getCorsHeaders(),
		body: JSON.stringify(error),
	};
}

export const BadRequest = (message = 'Bad request') =>
	createErrorResponse(400, { code: ErrorCodes.BAD_REQUEST, message });
export const Conflict = (message = 'Conflict') =>
	createErrorResponse(409, { code: ErrorCodes.CONFLICT, message });
export const Unauthorized = (message = 'Invalid authorization data') =>
	createErrorResponse(401, { code: ErrorCodes.UNAUTHORIZED, message });
export const Forbidden = (message = 'User does not have required role') =>
	createErrorResponse(403, { code: ErrorCodes.FORBIDDEN, message });
export const NotFound = (message = 'Not found') =>
	createErrorResponse(404, { code: ErrorCodes.NOT_FOUND, message });
export const InternalServerError = (message = 'An unexpected error occurred') =>
	createErrorResponse(500, { code: ErrorCodes.INTERNAL_SERVER_ERROR, message });
