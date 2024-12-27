import { getCorsHeaders } from '@/utils/corsHeaders.js';

export const requestContextDriver = {
	authorizer: {
		claims: {
			sub: 'driver_id',
			'custom:role': 'driver',
		},
	},
};
export const requestContextAdmin = {
	authorizer: {
		claims: {
			sub: 'admin-id',
			'custom:role': 'admin',
		},
	},
};
export const requestContextUser = {
	authorizer: {
		claims: {
			sub: 'user_id',
			'custom:role': 'user',
		},
	},
};
export const mockLambdaContext = {
	awsRequestId: 'aws123',
	getRemainingTimeInMillis: () => 10000,
};

export const getResult = (statusCode: number, body?: Record<string, unknown>) => ({
	statusCode,
	headers: getCorsHeaders(),
	body: body ? JSON.stringify(body) : undefined,
});
