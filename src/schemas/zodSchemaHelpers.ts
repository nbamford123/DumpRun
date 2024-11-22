import { z, type ZodTypeAny } from 'zod';

import { api } from './zodSchemas.js';
import type { operations } from '@/schemas/apiSchema.ts';

export const AuthInfo = z.object({
	sub: z.string(),
	'custom:role': z.enum(['user', 'driver', 'admin']),
});

const endpoints = api.api;

export const getQuerySchema = <T extends keyof operations>(operation: T) => {
	const schemaEndpoint = endpoints.find((e) => e.alias === operation);
	return z.object(
		schemaEndpoint?.parameters
			.filter((p) => p.type === 'Query')
			.reduce(
				(
					acc: { [key: string]: unknown },
					param: { name: string; schema: string },
				) => {
					acc[param.name] = param?.schema;
					return acc;
				},
				{},
			) || {},
	);
};

// Type guard to check for query params
export const hasQueryParams = <T extends keyof operations>(
	operation: T,
): operation is T &
	keyof {
		[K in keyof operations as operations[K] extends {
			parameters: Array<{ type: 'Query' }>;
		}
			? K
			: never]: true;
	} => {
	return Boolean(
		endpoints
			.find((e) => e.alias === operation)
			?.parameters.some((p) => p.type === 'Query'),
	);
};

export const getPathSchema = <T extends keyof operations>(operation: T) => {
	const schemaEndpoint = endpoints.find((e) => e.alias === operation);
	return z.object(
		schemaEndpoint?.parameters
			.filter((p) => p.type === 'Path')
			.reduce(
				(
					acc: { [key: string]: unknown },
					param: { name: string; schema: string },
				) => {
					acc[param.name] = param?.schema;
					return acc;
				},
				{},
			) || {},
	);
};

// Type guard to check for query params
export const hasPathParams = <T extends keyof operations>(
	operation: T,
): operation is T &
	keyof {
		[K in keyof operations as operations[K] extends {
			parameters: Array<{ type: 'Path' }>;
		}
			? K
			: never]: true;
	} => {
	return Boolean(
		endpoints
			.find((e) => e.alias === operation)
			?.parameters.some((p) => p.type === 'Path'),
	);
};

const listPickupsEndpoint = endpoints.find((e) => e.alias === 'listPickups');

export const listPickupsQuerySchema = z.object(
	listPickupsEndpoint?.parameters
		.filter((p) => p.type === 'Query')
		.reduce((acc: { [key: string]: ZodTypeAny }, param) => {
			acc[param.name] = param?.schema;
			return acc;
		}, {}) || {},
);

const listUsersEndpoint = endpoints.find((e) => e.alias === 'listUsers');

export const listUsersQuerySchema = z.object(
	listUsersEndpoint?.parameters
		.filter((p) => p.type === 'Query')
		.reduce((acc: { [key: string]: ZodTypeAny }, param) => {
			acc[param.name] = param?.schema;
			return acc;
		}, {}) || {},
);

const listDriversEndpoint = endpoints.find((e) => e.alias === 'listDrivers');

export const listDriversQuerySchema = z.object(
	listDriversEndpoint?.parameters
		.filter((p) => p.type === 'Query')
		.reduce((acc: { [key: string]: ZodTypeAny }, param) => {
			acc[param.name] = param?.schema;
			return acc;
		}, {}) || {},
);
