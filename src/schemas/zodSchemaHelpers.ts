import { z, type ZodTypeAny } from 'zod';

import { api } from './zodSchemas.js';
import type { operations } from '@/schemas/apiSchema.ts';

export const AuthInfo = z.object({
	sub: z.string(),
	'custom:role': z.enum(['user', 'driver', 'admin']),
});

// Define types for the endpoint structure we're working with
type Parameter = {
  name: string;
  type: 'Query' | 'Path';
  schema: ZodTypeAny;
};

type Endpoint = {
  alias: keyof operations;
  parameters: Parameter[];
};

const endpoints = api.api as Endpoint[];

export const getQuerySchema = <T extends keyof operations>(operation: T) => {
  const schemaEndpoint = endpoints.find((e) => e.alias === operation);
  return z.object(
    schemaEndpoint?.parameters
      .filter((p: Parameter) => p.type === 'Query')
      .reduce(
        (acc: Record<string, ZodTypeAny>, param) => {
          acc[param.name] = param.schema;
          return acc;
        },
        {},
      ) || {},
  );
};

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
      ?.parameters.some((p: Parameter) => p.type === 'Query'),
  );
};

export const getPathSchema = <T extends keyof operations>(operation: T) => {
  const schemaEndpoint = endpoints.find((e) => e.alias === operation);
  return z.object(
    schemaEndpoint?.parameters
      .filter((p: Parameter) => p.type === 'Path')
      .reduce(
        (acc: Record<string, ZodTypeAny>, param) => {
          acc[param.name] = param.schema;
          return acc;
        },
        {},
      ) || {},
  );
};

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
      ?.parameters.some((p: Parameter) => p.type === 'Path'),
  );
};

// Helper function to create schema from endpoint parameters
const createSchemaFromEndpoint = (endpointName: keyof operations) => {
  const endpoint = endpoints.find((e) => e.alias === endpointName);
  return z.object(
    endpoint?.parameters
      .filter((p: Parameter) => p.type === 'Query')
      .reduce((acc: Record<string, ZodTypeAny>, param) => {
        acc[param.name] = param.schema;
        return acc;
      }, {}) || {},
  );
};

export const listPickupsQuerySchema = createSchemaFromEndpoint('listPickups');
export const listUsersQuerySchema = createSchemaFromEndpoint('listUsers');
export const listDriversQuerySchema = createSchemaFromEndpoint('listDrivers');