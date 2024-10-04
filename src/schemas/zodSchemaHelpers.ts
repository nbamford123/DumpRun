import { z } from 'zod';
import type { ZodTypeAny } from 'zod';
import { api } from './zodSchemas.js';

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
