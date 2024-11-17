import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from 'lambda/types/authInfoSchema.js';
import { listUsersQuerySchema } from '@/schemas/zodSchemaHelpers.js';

import { getUsersService } from './userServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
		// Fine-grained authorization
		if (authInfo['custom:role'] !== 'admin') {
			return {
				statusCode: 403,
				body: JSON.stringify({
					message: 'Not authorized',
				}),
			};
		}
		// Extract query parameters
		const { limit, offset } = listUsersQuerySchema.parse(
			event.queryStringParameters || {},
		);

		const users = await getUsersService(limit, offset);

		return {
			statusCode: 200,
			body: JSON.stringify(users),
		};
	} catch (error) {
		console.error('Error in getUser:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Internal Server Error' }),
		};
	}
};
