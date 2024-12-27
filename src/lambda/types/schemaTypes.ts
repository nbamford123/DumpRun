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

// Cognito error types
export interface CognitoError extends Error {
  name: string;
  code?: string;
  message: string;
  $metadata?: {
    httpStatusCode: number;
    requestId: string;
    attempts: number;
    totalRetryDelay: number;
  };
}

export function isCognitoError(error: unknown): error is CognitoError {
  return (
    error instanceof Error &&
    'name' in error &&
    typeof (error as CognitoError).name === 'string' &&
    (!('code' in error) || typeof (error as CognitoError).code === 'string') &&
    (!('$metadata' in error) ||
      (typeof (error as CognitoError).$metadata === 'object' &&
        error.$metadata !== null))
  );
}

export type CognitoErrorName =
  | 'UserNotFoundException'
  | 'InvalidParameterException'
  | 'TooManyRequestsException'
  | 'NotAuthorizedException'
  | 'UserNotConfirmedException'
  | 'ResourceNotFoundException';

export function isCognitoErrorName(name: string): name is CognitoErrorName {
  return [
    'UserNotFoundException',
    'InvalidParameterException',
    'TooManyRequestsException',
    'NotAuthorizedException',
    'UserNotConfirmedException',
    'ResourceNotFoundException',
  ].includes(name);
}

// Assuming we will throw on any generic error and return a 500
export type CreateUserResult<T> =
  | { type: 'success'; user: T }
  | { type: 'phone_exists'; phoneNumber: string }
  | { type: 'email_exists'; email: string };
// | { type: 'error'; error: Error };

export const isValidPreferredContact = (val: unknown): val is 'CALL' | 'TEXT' =>
  val === 'CALL' || val === 'TEXT';
