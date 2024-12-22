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
const Error = z
  .object({ code: z.string(), message: z.string() })
  .partial()
  .strict()
  .passthrough();
const NewUser = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phoneNumber: z
      .string()
      .regex(
        /^(\+1|1)?[-. ]?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
      ),
    address: z
      .object({
        street: z.string().min(1).max(100),
        city: z.string().min(1).max(100),
        state: z.string().regex(/^[A-Z]{2}$/),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      })
      .strict()
      .passthrough(),
    preferredContact: z.enum(["CALL", "TEXT"]).optional().default("TEXT"),
  })
  .strict()
  .passthrough();
const User = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phoneNumber: z.string(),
    address: z
      .object({
        street: z.string(),
        city: z.string(),
        state: z.string().regex(/^[A-Z]{2}$/),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      })
      .strict()
      .passthrough(),
    preferredContact: z.enum(["CALL", "TEXT"]).optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict()
  .passthrough();
const UpdateUser = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    address: z
      .object({
        street: z.string().min(1).max(100),
        city: z.string().min(1).max(100),
        state: z.string().regex(/^[A-Z]{2}$/),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      })
      .strict()
      .passthrough(),
    preferredContact: z.enum(["CALL", "TEXT"]),
  })
  .partial()
  .strict()
  .passthrough();
const NewDriver = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    phoneNumber: z
      .string()
      .regex(
        /^(\+1|1)?[-. ]?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/
      ),
    address: z
      .object({
        street: z.string().min(1).max(100),
        city: z.string().min(1).max(100),
        state: z.string().regex(/^[A-Z]{2}$/),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      })
      .strict()
      .passthrough(),
    preferredContact: z.enum(["CALL", "TEXT"]).optional().default("TEXT"),
    vehicleMake: z.string(),
    vehicleModel: z.string(),
    vehicleYear: z.number(),
  })
  .strict()
  .passthrough();
const Driver = z
  .object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phoneNumber: z.string(),
    address: z
      .object({
        street: z.string(),
        city: z.string(),
        state: z.string().regex(/^[A-Z]{2}$/),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      })
      .strict()
      .passthrough(),
    preferredContact: z.enum(["CALL", "TEXT"]).optional(),
    vehicleMake: z.string().optional(),
    vehicleModel: z.string().optional(),
    vehicleYear: z.number().optional(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict()
  .passthrough();
const UpdateDriver = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    address: z
      .object({
        street: z.string().min(1).max(100),
        city: z.string().min(1).max(100),
        state: z.string().regex(/^[A-Z]{2}$/),
        zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
      })
      .strict()
      .passthrough(),
    preferredContact: z.enum(["CALL", "TEXT"]),
    vehicleMake: z.string(),
    vehicleModel: z.string(),
    vehicleYear: z.number(),
  })
  .partial()
  .strict()
  .passthrough();
const NewPickup = z
  .object({
    location: z.string(),
    estimatedWeight: z.number(),
    wasteType: z.string(),
    requestedTime: z.string().datetime({ offset: true }),
  })
  .strict()
  .passthrough();
const Pickup = z
  .object({
    id: z.string(),
    userId: z.string(),
    driverId: z.string().nullable(),
    status: z.enum([
      "pending",
      "available",
      "accepted",
      "in_progress",
      "completed",
      "cancelled",
      "deleted",
    ]),
    location: z.string(),
    estimatedWeight: z.number().gte(1),
    wasteType: z.enum(["household", "construction", "green", "electronic"]),
    requestedTime: z.string().datetime({ offset: true }),
    assignedTime: z.string().datetime({ offset: true }),
    completedTime: z.string().datetime({ offset: true }),
    deletedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough();
const UpdatePickup = z
  .object({
    location: z.string(),
    estimatedWeight: z.number().gte(1),
    wasteType: z.enum(["household", "construction", "green", "electronic"]),
    requestedTime: z.string().datetime({ offset: true }),
    status: z.enum([
      "pending",
      "available",
      "accepted",
      "in_progress",
      "completed",
      "cancelled",
      "deleted",
    ]),
  })
  .partial()
  .strict();

export const schemas = {
  HealthCheck,
  Error,
  NewUser,
  User,
  UpdateUser,
  NewDriver,
  Driver,
  UpdateDriver,
  NewPickup,
  Pickup,
  UpdatePickup,
};

const endpoints = makeApi([
  {
    method: "post",
    path: "/drivers",
    alias: "createDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: NewDriver,
      },
    ],
    response: Driver,
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
    path: "/drivers",
    alias: "listDrivers",
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
      .object({ drivers: z.array(Driver), total: z.number().int() })
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
    path: "/drivers/:driverId",
    alias: "getDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Driver,
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
    path: "/drivers/:driverId",
    alias: "updateDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateDriver,
      },
      {
        name: "driverId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Driver,
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
    path: "/drivers/:driverId",
    alias: "deleteDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Driver,
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
    method: "get",
    path: "/health/dynamodb",
    alias: "checkDynamoDBHealth",
    requestFormat: "json",
    response: HealthCheck,
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
    path: "/health/postgres",
    alias: "checkPostgresHealth",
    requestFormat: "json",
    response: HealthCheck,
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
    method: "post",
    path: "/pickups",
    alias: "createPickup",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: NewPickup,
      },
    ],
    response: Pickup,
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
    path: "/pickups",
    alias: "listPickups",
    requestFormat: "json",
    parameters: [
      {
        name: "status",
        type: "Query",
        schema: z.enum([
          "pending",
          "assigned",
          "completed",
          "in_progress",
          "cancelled",
          "deleted",
        ]),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().gte(1).lte(100).optional().default(20),
      },
      {
        name: "cursor",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "startRequestedTime",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
      {
        name: "endRequestedTime",
        type: "Query",
        schema: z.string().datetime({ offset: true }).optional(),
      },
    ],
    response: z
      .object({ pickups: z.array(Pickup), nextCursor: z.string() })
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
    path: "/pickups/:pickupId",
    alias: "getPickup",
    requestFormat: "json",
    parameters: [
      {
        name: "pickupId",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "includeDeleted",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: Pickup,
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
    path: "/pickups/:pickupId",
    alias: "updatePickup",
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdatePickup,
      },
      {
        name: "pickupId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Pickup,
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
    path: "/pickups/:pickupId",
    alias: "deletePickup",
    requestFormat: "json",
    parameters: [
      {
        name: "pickupId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
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
    method: "post",
    path: "/pickups/:pickupId/accept",
    alias: "acceptPickup",
    requestFormat: "json",
    parameters: [
      {
        name: "pickupId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Pickup,
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
        status: 409,
        description: `The request could not be completed due to a conflict with the current state of the target resource.`,
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
    method: "post",
    path: "/pickups/:pickupId/cancel-acceptance",
    alias: "cancelAcceptance",
    requestFormat: "json",
    parameters: [
      {
        name: "pickupId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Pickup,
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
        status: 409,
        description: `The request could not be completed due to a conflict with the current state of the target resource.`,
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
    path: "/pickups/available",
    alias: "listAvailablePickups",
    requestFormat: "json",
    response: z.array(Pickup),
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
