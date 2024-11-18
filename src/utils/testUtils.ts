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
