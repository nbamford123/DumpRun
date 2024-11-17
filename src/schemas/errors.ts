// src/schemas/errors.ts
import type { components } from './apiSchema.js';

type BaseError = components['schemas']['Error'];

export type StandardErrorType = Exclude<
	keyof components['responses'],
	200 | 201
>;

export type APIError = Omit<BaseError, 'code'> & {
	code: (typeof ErrorCodes)[keyof typeof ErrorCodes];
};

export const ErrorCodes = {
	BAD_REQUEST: 'BadRequest',
	UNAUTHORIZED: 'Unauthorized',
	FORBIDDEN: 'Forbidden',
	NOT_FOUND: 'NotFound',
	CONFLICT: 'Conflict',
	INTERNAL_SERVER_ERROR: 'InternalServerError',
	// Add any additional domain-specific codes here
} as const satisfies Record<string, StandardErrorType>;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
