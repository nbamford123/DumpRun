import type { Context } from 'aws-lambda';

import { schemas } from '@/schemas/zodSchemas.js';
import { AuthInfo } from 'lambda/types/authInfoSchema.js';

import { createUserService } from './userServices.js';
import { getCorsHeaders } from '@/utils/corsHeaders.js';
import type {
	APIGatewayTransformedEvent,
	SuccessResponse,
} from 'lambda/types/lambdaTypes.js';

export const handler = async (
	event: APIGatewayTransformedEvent<'createUser'>,
	context: Context,
): Promise<SuccessResponse<'createUser'>> => {
	const headers = getCorsHeaders();
	try {
		const authInfo = AuthInfo.parse(event.requestContext?.authorizer?.claims);
		const requestBody = JSON.parse(event.body || '{}');
		const result = schemas.NewUser.safeParse(requestBody);
		if (!result.success) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({
					message: 'Invalid input',
					errors: result.error.issues,
				}),
			};
		}
		const newUser = await createUserService(authInfo.sub, result.data);
		return {
			statusCode: 201,
			headers,
			body: JSON.stringify(newUser),
		};
	} catch (error) {
		console.error('Message', {
			requestId: context.awsRequestId,
			msg: `Error in dynamoDBHealth: ${error}`,
		});
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({ error: error }),
		};
	}
};
