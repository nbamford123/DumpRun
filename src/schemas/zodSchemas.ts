import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const HealthCheck = z
  .object({
    status: z.enum(["healthy", "unhealthy"]),
    timestamp: z.string().datetime({ offset: true }),
    latency: z.number().optional(),
    error: z.string().optional(),
  })
  .strict()
  .passthrough();
const NewUser = z
  .object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$|^\d{3}-\d{3}-\d{4}$/),
    address: z.string(),
  })
  .strict()
  .passthrough();
const User = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough();
const Error = z
  .object({ code: z.string(), message: z.string() })
  .partial()
  .strict()
  .passthrough();
const UpdateUser = z
  .object({
    name: z.string().min(1).max(100),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$|^\d{3}-\d{3}-\d{4}$/),
    address: z.string(),
  })
  .partial()
  .strict()
  .passthrough();

export const schemas = {
  HealthCheck,
  NewUser,
  User,
  Error,
  UpdateUser,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/health/dynamodb",
    alias: "checkDynamoDBHealth",
    requestFormat: "json",
    response: HealthCheck,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Forbidden`,
        schema: z.void(),
      },
      {
        status: 500,
        description: `Internal Server Error`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/health/postgres",
    alias: "checkPostgresHealth",
    requestFormat: "json",
    response: HealthCheck,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Forbidden`,
        schema: z.void(),
      },
      {
        status: 500,
        description: `Internal Server Error`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "post",
    path: "/users",
    alias: "createUser",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: NewUser,
      },
    ],
    response: User,
    errors: [
      {
        status: 400,
        description: `Bad request`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal Server Error`,
        schema: Error,
      },
    ],
  },
  {
    method: "get",
    path: "/users",
    alias: "listUsers",
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
      {
        name: "offset",
        type: "Query",
        schema: z.number().int().gte(0).optional().default(0),
      },
    ],
    response: z
      .object({ users: z.array(User), total: z.number().int() })
      .partial()
      .strict()
      .passthrough(),
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: Error,
      },
      {
        status: 403,
        description: `Access forbidden`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal Server Error`,
        schema: Error,
      },
    ],
  },
  {
    method: "get",
    path: "/users/:userId",
    alias: "getUser",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: User,
    errors: [
      {
        status: 400,
        description: `Bad request`,
        schema: Error,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: Error,
      },
      {
        status: 403,
        description: `Access forbidden`,
        schema: Error,
      },
      {
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal Server Error`,
        schema: Error,
      },
    ],
  },
  {
    method: "put",
    path: "/users/:userId",
    alias: "updateUser",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateUser,
      },
      {
        name: "userId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: User,
    errors: [
      {
        status: 400,
        description: `Bad request`,
        schema: Error,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: Error,
      },
      {
        status: 403,
        description: `Access forbidden`,
        schema: Error,
      },
      {
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal Server Error`,
        schema: Error,
      },
    ],
  },
  {
    method: "delete",
    path: "/users/:userId",
    alias: "deleteUser",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: User,
    errors: [
      {
        status: 400,
        description: `Bad request`,
        schema: Error,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: Error,
      },
      {
        status: 403,
        description: `Access forbidden`,
        schema: Error,
      },
      {
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
      {
        status: 500,
        description: `Internal Server Error`,
        schema: Error,
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
