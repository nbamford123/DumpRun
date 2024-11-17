import { z } from 'zod';
import type { ZodTypeAny } from 'zod';
import { api } from './zodSchemas.js';

export const AuthInfo = z.object({
	sub: z.string(),
	'custom:role': z.enum(['user', 'driver', 'admin']),
});

const endpoints = api.api;

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
