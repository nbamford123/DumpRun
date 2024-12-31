import type { z } from 'zod';

import type { operations } from '@/schemas/apiSchema.ts';
import type { APIResponse } from '../types/index.js';

export type HasPathParams<T extends keyof operations> =
	operations[T]['parameters'] extends {
		path: Record<string, unknown>;
	}
		? true
		: false;

export type PathParams<T extends keyof operations> =
	operations[T]['parameters'] extends {
		path: infer P;
	}
		? P
		: never;

export type QueryParams<T extends keyof operations> =
	operations[T]['parameters'] extends {
		query?: infer Q;
	}
		? NonNullable<Q>
		: never;

// Alternative for HasQueryParams that checks if there are any actual query parameters
export type HasQueryParams<T extends keyof operations> =
	operations[T]['parameters'] extends { query?: infer Q }
		? Q extends undefined
			? false
			: keyof NonNullable<Q> extends never
				? false
				: true
		: false;

// Helper to determine if operation needs parameters
export type NeedsOperationParam<T extends keyof operations> =
	HasQueryParams<T> extends true
		? true
		: HasPathParams<T> extends true
			? true
			: false;

// Fixed middleware options
export type MiddlewareOptions<T extends keyof operations> = {
	requiredRole: string[];
	validateInput?: z.ZodSchema;
} & (NeedsOperationParam<T> extends true
	? { operation: T }
	: { operation?: T });

// Get request body type from operation
export type OperationRequestBody<T extends keyof operations> =
	operations[T] extends {
		requestBody: { content: { 'application/json': infer T } };
	}
		? T
		: never;

export type HandlerContext<T extends keyof operations> = {
	requestId: string;
	cognitoUserId: string;
	userRole: string;
	body: OperationRequestBody<T>;
} & (HasQueryParams<T> extends true
	? { query: QueryParams<T> }
	: Record<string, never>) &
	(HasPathParams<T> extends true
		? {
				params: PathParams<T>;
			}
		: Record<string, never>);

export type OperationHandler<T extends keyof operations> = (
	context: HandlerContext<T>,
) => Promise<APIResponse>;

export type ParsedBody<T extends keyof operations> =
	operations[T]['requestBody'] extends {
		content: { 'application/json': infer U };
	}
		? U
		: never;
