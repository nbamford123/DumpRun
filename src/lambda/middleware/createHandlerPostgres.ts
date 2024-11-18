import { Prisma, PrismaClient } from '@prisma/client';

import type { operations } from '@/schemas/apiSchema.ts';
import type { APILambda, APIResponse } from '../types/index.js';
import {
	createHandler,
	type HandlerContext,
	type OperationHandler,
	type MiddlewareOptions,
} from './createHandler.js';

let prismaClient: PrismaClient | undefined;

export const getPrismaClient = () => {
	if (!prismaClient) {
		prismaClient = new PrismaClient({
			log: ['error', 'warn'],
		});
	}
	return prismaClient;
};

export type PrismaHandlerContext = HandlerContext & {
	client: PrismaClient;
};
export type PrismaOperationHandler = (
	context: PrismaHandlerContext,
) => Promise<APIResponse>;

export const createPrismaHandler = <T extends keyof operations>(
	handler: PrismaOperationHandler,
	options: MiddlewareOptions,
): APILambda<T> => {
	const wrappedHandler: OperationHandler = async (context) => {
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
