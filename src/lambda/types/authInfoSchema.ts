import { z } from 'zod';

export const AuthInfo = z.object({
	sub: z.string(),
	'custom:role': z.enum(['user', 'driver', 'admin']),

	// Optional: add other standard Cognito claims if you need them
	// email: z.string().optional(),
	// email_verified: z.boolean().optional(),
	// auth_time: z.number().optional(),
	// exp: z.number().optional(),
	// iat: z.number().optional(),
	// ... etc
});
