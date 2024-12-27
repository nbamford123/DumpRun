import { PrismaClient } from '@prisma/client';

import type { operations } from '@/schemas/apiSchema.ts';
import { createHandler } from './createHandler.js';
import type { APILambda, APIResponse } from '../types/index.js';
import type {
	HandlerContext,
	OperationHandler,
	MiddlewareOptions,
} from './types.js';

let prismaClient: PrismaClient | undefined;

export const getPrismaClient = () => {
	if (!prismaClient) {
		prismaClient = new PrismaClient({
			log: ['error', 'warn'],
		});
	}
	return prismaClient;
};

export type PrismaHandlerContext<T extends keyof operations> =
	HandlerContext<T> & {
		client: PrismaClient;
	};
export type PrismaOperationHandler<T extends keyof operations>  = (
	context: PrismaHandlerContext<T>,
) => Promise<APIResponse>;

export const createPrismaHandler = <T extends keyof operations>(
	handler: PrismaOperationHandler<T>,
	options: MiddlewareOptions<T>,
): APILambda<T> => {
	const wrappedHandler: OperationHandler<T> = async (context) => {
		return handler({
			...context,
			client: getPrismaClient(),
		});
	};
	const finalHandler = createHandler(wrappedHandler, options);

	return async (event, lambdaContext) => {
		try {
			return await finalHandler(event, lambdaContext);
		} finally {
			// Cleanup if lambda is about to be shut down
			if (lambdaContext.getRemainingTimeInMillis() < 1000) {
				await prismaClient?.$disconnect();
				prismaClient = undefined;
			}
		}
	};
};
