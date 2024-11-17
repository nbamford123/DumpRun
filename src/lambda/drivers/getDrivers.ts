import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from 'lambda/types/authInfoSchema.js';
import { listDriversQuerySchema } from '@/schemas/zodSchemaHelpers.js';

import { getDriversService } from './driverServices.js';

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
		const { limit, offset } = listDriversQuerySchema.parse(
			event.queryStringParameters || {},
		);

		const drivers = await getDriversService(limit, offset);

		return {
			statusCode: 200,
			body: JSON.stringify(drivers),
		};
	} catch (error) {
		console.error('Error in getUser:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Internal Server Error' }),
		};
	}
};
