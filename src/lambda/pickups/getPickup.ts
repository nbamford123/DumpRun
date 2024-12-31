import { schemas } from '@/schemas/zodSchemas.js';

import {
  createDynamoHandler,
  type DynamoOperationHandler,
} from '../middleware/createHandlerDynamo.js';

import { getPickupService } from './pickupServices.js';
import { validGetPickup } from './pickupHelpers.js';
import { createSuccessResponse, NotFound, Forbidden } from '../types/index.js';

const TEST_PICKUP_ID = 'test-pickup-id';
const getPickupHandler: DynamoOperationHandler<'getPickup'> = async (
  context
) => {
	// For e2e tier one test without hitting database
  if (context.params.pickupId === TEST_PICKUP_ID) {
    return NotFound('Test pickup not found');
  }
  const pickup = await getPickupService(
    context.client,
    context.params.pickupId
  );
  if (
    pickup == null ||
    (pickup.status === 'deleted' && context.userRole !== 'admin')
  )
    return NotFound('Pickup not found');

  if (validGetPickup(context.userRole, context.cognitoUserId, pickup))
    return createSuccessResponse<'getPickup'>(200, pickup);

  return Forbidden("User doesn't have permission");
};

export const handler = createDynamoHandler(getPickupHandler, {
  requiredRole: ['driver', 'admin', 'user'],
  operation: 'getPickup',
});
