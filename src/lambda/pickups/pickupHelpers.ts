import type { components } from '@/schemas/apiSchema.js';

type Pickup = components['schemas']['Pickup'];

export const validGetPickup = (
	role: string,
	requesterId: string,
	pickup: Pickup,
): boolean => {
	if (role === 'admin') return true;
	// user can get their pickup
	if (role === 'user' && pickup.userId === requesterId) return true;
	// driver can get any available pickup, or any pickup they've accepted
	if (role === 'driver') {
		if (pickup.driverId === requesterId)
			return true;
		if (pickup.status === 'available') return true;
	}
	return false;
};
