import type { components } from '@/schemas/apiSchema.js';

type Pickup = components['schemas']['Pickup'];

export const validGetPickup = (
	role: string,
	requesterId: string,
	pickup: Pickup,
): boolean => {
	if (role === 'admin') return true;
	if (pickup.status === 'deleted') return false;
	if (role === 'user' && pickup.userId === requesterId) return true;
	if (role === 'driver') {
		if (pickup.driverId === requesterId)
			// Can return any status if its their pickup
			return true;
		if (pickup.status === 'available') return true;
	}
	return false;
};
