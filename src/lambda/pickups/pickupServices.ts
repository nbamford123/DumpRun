import { DynamoDB } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import type { components } from '@/schemas/apiSchema.d.ts';
import type { ExpressionAttributeNameMap } from 'aws-sdk/clients/dynamodb.js';
// Somehow stored with the mongo schema?
const TABLE_NAME = 'Pickups';

type Pickup = components['schemas']['Pickup'];
type NewPickup = components['schemas']['NewPickup'];
type UpdatePickup = components['schemas']['UpdatePickup'];

export const createPickupService = async (
  userId: string,
  pickup: NewPickup,
): Promise<Pickup> => {
  const dynamoDB = new DynamoDB.DocumentClient();
  const pickupId = uuidv4();

  const params = {
    TableName: 'Pickups',
    Item: {
      id: pickupId,
      userId: userId,
      status: 'pending',
      location: pickup.location,
      estimatedWeight: pickup.estimatedWeight,
      wasteType: pickup.wasteType,
      requestedTime: pickup.requestedTime,
    },
  };
  await dynamoDB.put(params).promise();

  return getPickupService(pickupId);
};

export const getPickupService = async (pickupId: string): Promise<Pickup> => {
  const dynamoDB = new DynamoDB.DocumentClient();

  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      id: pickupId,
    },
  };
  const result = await dynamoDB.get(getParams).promise();

  if (!result.Item) {
    throw new Error('Failed to retrieve the newly created pickup');
  }

  return result.Item as Pickup;
};

export async function updatePickupService(
  pickupId: string,
  updateData: Partial<Pickup>,
): Promise<Pickup> {
  const dynamoDB = new DynamoDB.DocumentClient();

  const updateExpression = [];
  const expressionAttributeValues: ExpressionAttributeNameMap = {};
  const expressionAttributeNames: ExpressionAttributeNameMap = {};

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined && value !== null) {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = value as string;
      expressionAttributeNames[`#${key}`] = key;
    }
  }

  const params = {
    TableName: TABLE_NAME,
    Key: { pickupId },
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
    ExpressionAttributeNames: expressionAttributeNames,
    ReturnValues: 'ALL_NEW',
    ConditionExpression: 'attribute_exists(pickupId)',
  };

  const result = await dynamoDB.update(params).promise();
  return result.Attributes as Pickup;
}

export const deletePickupService = async (
  pickupId: string,
): Promise<Pickup> => {
  const dynamoDB = new DynamoDB.DocumentClient();

  // Delete the item from DynamoDB
  await dynamoDB
    .delete({
      TableName: TABLE_NAME,
      Key: { id: pickupId },
    })
    .promise();

  return getPickupService(pickupId);
};

export const availablePickupsService = async (): Promise<Pickup[]> => {
  const dynamoDB = new DynamoDB.DocumentClient();

  const queryParams = {
    TableName: TABLE_NAME,
    FilterExpression: '#status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': 'available',
    },
  };
  const result = await dynamoDB.scan(queryParams).promise();

  if (!result.Items) {
    throw new Error('Failed to retrieve the newly created pickup');
  }

  return result.Items as Pickup[];
};

export const acceptPickupService = async (
  pickupId: string,
  driverId: string,
): Promise<Pickup> => {
  const dynamoDB = new DynamoDB.DocumentClient();
  const updateParams = {
    TableName: TABLE_NAME,
    Key: {
      id: pickupId,
    },
    UpdateExpression: 'set #status = :status, driverId = :driverId',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': 'accepted',
      ':driverId': driverId,
    },
    ReturnValues: 'ALL_NEW',
  };
  const result = await dynamoDB.update(updateParams).promise();

  if (!result.Attributes) {
    throw new Error('Failed to update pickup status');
  }

  return result.Attributes as Pickup;
};
