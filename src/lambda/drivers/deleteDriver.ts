import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from 'lambda/types/authInfoSchema.js';

import { deleteDriverService } from './driverServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
		const driverId = event.pathParameters?.driverId;
		if (!driverId) {
			return {
				statusCode: 400,
				body: JSON.stringify({
					message: 'Missing driverId in path parameters',
				}),
			};
		}

		if (
			authInfo['custom:role'] === 'admin' ||
			(authInfo['custom:role'] === 'driver' && authInfo.sub === driverId)
		) {
			const deletedDriver = await deleteDriverService(driverId);

			if (!deletedDriver) {
				return {
					statusCode: 404,
					body: JSON.stringify({ message: 'Driver not found' }),
				};
			}
			return {
				statusCode: 204,
				body: JSON.stringify(deletedDriver),
			};
		}
		return {
			statusCode: 403,
			body: JSON.stringify({
				message: 'Not authorized',
			}),
		};
	} catch (error) {
		console.error('Error in deleteDriver:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Internal Server Error' }),
		};
	}
};
