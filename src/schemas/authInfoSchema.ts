import { z } from 'zod';

export const AuthInfo = z.object({
  sub: z.string(),
  'custom:role': z.enum(['user', 'driver', 'admin']),
});
