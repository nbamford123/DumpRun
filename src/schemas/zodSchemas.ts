import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const NewUser = z
  .object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
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
    password: z.string().min(8),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$|^\d{3}-\d{3}-\d{4}$/),
    address: z.string(),
  })
  .partial()
  .strict()
  .passthrough();
const NewDriver = z
  .object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$|^\d{3}-\d{3}-\d{4}$/),
    address: z.string(),
    vehicleMake: z.string(),
    vehicleModel: z.string(),
    vehicleYear: z.number(),
  })
  .strict()
  .passthrough();
const Driver = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    address: z.string(),
    vehicleMake: z.string(),
    vehicleModel: z.string(),
    vehicleYear: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough();
const UpdateDriver = z
  .object({
    name: z.string().min(1).max(100),
    password: z.string().min(8),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$|^\d{3}-\d{3}-\d{4}$/),
    address: z.string(),
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
  NewUser,
  User,
  Error,
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
    path: "/v1/drivers",
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
    ],
  },
  {
    method: "get",
    path: "/v1/drivers",
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
      .object({ users: z.array(Driver), total: z.number().int() })
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
    ],
  },
  {
    method: "get",
    path: "/v1/drivers/:driverId",
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
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "put",
    path: "/v1/drivers/:driverId",
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
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "delete",
    path: "/v1/drivers/:driverId",
    alias: "deleteDriver",
    requestFormat: "json",
    parameters: [
      {
        name: "driverId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "post",
    path: "/v1/pickups",
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
    ],
  },
  {
    method: "get",
    path: "/v1/pickups",
    alias: "listPickups",
    requestFormat: "json",
    parameters: [
      {
        name: "status",
        type: "Query",
        schema: z
          .array(
            z.enum([
              "pending",
              "assigned",
              "completed",
              "in_progress",
              "cancelled",
              "deleted",
            ])
          )
          .optional(),
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
    ],
  },
  {
    method: "get",
    path: "/v1/pickups/:pickupId",
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
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "put",
    path: "/v1/pickups/:pickupId",
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
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "delete",
    path: "/v1/pickups/:pickupId",
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
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "post",
    path: "/v1/pickups/:pickupId/accept",
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
  },
  {
    method: "post",
    path: "/v1/pickups/:pickupId/cancel-acceptance",
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
        status: 403,
        description: `Not authorized to cancel this acceptance`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Pickup not found or not currently accepted`,
        schema: z.void(),
      },
    ],
  },
  {
    method: "get",
    path: "/v1/pickups/available",
    alias: "listAvailablePickups",
    requestFormat: "json",
    response: z.array(Pickup),
  },
  {
    method: "post",
    path: "/v1/users",
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
    ],
  },
  {
    method: "get",
    path: "/v1/users",
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
    ],
  },
  {
    method: "get",
    path: "/v1/users/:userId",
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
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "put",
    path: "/v1/users/:userId",
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
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "delete",
    path: "/v1/users/:userId",
    alias: "deleteUser",
    requestFormat: "json",
    parameters: [
      {
        name: "userId",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}

export const schemas_addons = {
  AuthInfo: z.object({
    sub: z.string(),
    'custom:role': z.enum(['user', 'driver', 'admin']),
  })
};
