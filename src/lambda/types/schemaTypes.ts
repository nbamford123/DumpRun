import type { Prisma } from '@prisma/client';

import type { components } from '@/schemas/apiSchema.ts';

export type User = components['schemas']['User'];
export type NewUser = components['schemas']['NewUser'];
export type UpdateUser = components['schemas']['UpdateUser'];
export type Driver = components['schemas']['Driver'];
export type NewDriver = components['schemas']['NewDriver'];
export type UpdateDriver = components['schemas']['UpdateDriver'];
export type PrismaError =
  | Prisma.PrismaClientKnownRequestError
  | Prisma.PrismaClientUnknownRequestError
  | Prisma.PrismaClientRustPanicError
  | Prisma.PrismaClientInitializationError
  | Prisma.PrismaClientValidationError;
