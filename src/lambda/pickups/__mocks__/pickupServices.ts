import { vi } from 'vitest';

export const mockPickupService = {
  createPickup: vi.fn(),
  getPickup: vi.fn(),
  getPickups: vi.fn(),
  updatePickup: vi.fn(),
  deletePickup: vi.fn(),
  availablePickups: vi.fn(),
  acceptPickup: vi.fn(),
  cancelAcceptedPickup: vi.fn(),
};
export const getPickupService = vi.fn().mockReturnValue(mockPickupService);
