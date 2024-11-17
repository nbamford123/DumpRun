import type { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthInfo } from 'lambda/types/authInfoSchema.js';

import { getPickupService } from './pickupServices.js';

export const handler: APIGatewayProxyHandler = async (event) => {
	try {
		const authInfo = AuthInfo.parse(event.requestContext.authorizer?.claims);
		// I guess you have to be a driver to accept a pickup
		// Should we also check that you haven't scheduled another one at the same time?
		if (
			authInfo['custom:role'] === 'driver' ||
			authInfo['custom:role'] === 'admin'
		) {
			const pickupService = getPickupService();
			const pickups = await pickupService.availablePickups();
			return {
				statusCode: 200,
				body: JSON.stringify(pickups),
			};
		}
		return {
			statusCode: 403,
			body: JSON.stringify({
				message: 'Not authorized to accept this pickup',
			}),
		};

		// return error wrong role or whatever here. not a driver?
	} catch (error) {
		console.error('Error in acceptPickup:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ message: 'Internal server error' }),
		};
	}
};
