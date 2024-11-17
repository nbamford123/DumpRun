import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from 'lambda/types/authInfoSchema.js';

import { getUserService } from './userServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
		const userId = event.pathParameters?.userId;
		if (!userId) {
			return {
				statusCode: 400,
				body: JSON.stringify({ message: 'Missing userId in path parameters' }),
			};
		}
		if (
			authInfo['custom:role'] === 'admin' ||
			(authInfo['custom:role'] === 'user' && authInfo.sub === userId)
		) {
			const user = await getUserService(userId);
			if (!user) {
				return {
					statusCode: 404,
					body: JSON.stringify({ message: 'User not found' }),
				};
			}
			return {
				statusCode: 200,
				body: JSON.stringify(user),
			};
		}
		return {
			statusCode: 403,
			body: JSON.stringify({
				message: 'Not authorized',
			}),
		};
	} catch (error) {
		console.error('Error in getUser:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Internal Server Error' }),
		};
	}
};
