import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

const NewUser = z
  .object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/)
      .optional(),
    address: z.string().optional(),
  })
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
  .passthrough();
const Error = z
  .object({ code: z.string(), message: z.string() })
  .partial()
  .passthrough();
const UpdateUser = z
  .object({
    name: z.string().min(1).max(100),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
    address: z.string(),
  })
  .partial()
  .passthrough();
const NewDriver = z
  .object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
    phone: z.string().optional(),
    address: z.string().optional(),
  })
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
  .passthrough();
const UpdateDriver = z
  .object({
    name: z.string(),
    phone: z.string(),
    address: z.string(),
    vehicleMake: z.string(),
    vehicleModel: z.string(),
    vehicleYear: z.number(),
  })
  .partial()
  .passthrough();
const NewPickup = z
  .object({
    userId: z.string().optional(),
    location: z.string(),
    estimatedWeight: z.number(),
    wasteType: z.string(),
    requestedTime: z.string().datetime({ offset: true }).optional(),
  })
  .passthrough();
const Pickup = z
  .object({
    id: z.string(),
    userId: z.string(),
    driverId: z.string(),
    status: z.enum(["pending", "assigned", "completed", "cancelled"]),
    location: z.string(),
    estimatedWeight: z.number(),
    wasteType: z.string(),
    requestedTime: z.string().datetime({ offset: true }),
    assignedTime: z.string().datetime({ offset: true }),
    completedTime: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const UpdatePickup = z
  .object({
    location: z.string(),
    estimatedWeight: z.number(),
    wasteType: z.string(),
    requestedTime: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();

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
          .enum(["pending", "assigned", "completed", "cancelled"])
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
    path: "/v1/pikcups/:pickupId",
    alias: "getPickup",
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
        status: 404,
        description: `Resource not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "put",
    path: "/v1/pikcups/:pickupId",
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
    path: "/v1/pikcups/:pickupId",
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
