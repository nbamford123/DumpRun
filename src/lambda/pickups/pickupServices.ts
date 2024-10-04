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

export const getPickupsService = async (
  limit?: number,
  startKey?: string,
  status?: string[],
): Promise<{ pickups: Pickup[]; nextCursor: string | null }> => {
  const dynamoDB = new DynamoDB.DocumentClient();
  // which of these can be undefined to just return everything?
  const params: DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_NAME,
    Limit: limit,
    ExclusiveStartKey: startKey ? { id: startKey } : undefined,
    FilterExpression:
      status && status.length > 0 ? 'status IN (:status)' : undefined,
    ExpressionAttributeValues:
      status && status.length > 0 ? { ':status': status } : undefined,
  };

  const result = await dynamoDB.scan(params).promise();

  return {
    pickups: result.Items || [],
    nextCursor: result.LastEvaluatedKey ? result.LastEvaluatedKey.id : null,
  };
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

  const setExpressions = [];
  const removeExpressions = [];
  const expressionAttributeValues: ExpressionAttributeNameMap = {};
  const expressionAttributeNames: ExpressionAttributeNameMap = {};

  for (const [key, value] of Object.entries(updateData)) {
    if (value !== undefined) {
      if (value === null) {
        removeExpressions.push(`#${key}`);
      } else {
        setExpressions.push(`#${key} = :${key}`);
        expressionAttributeValues[`:${key}`] = value as string;
      }
      expressionAttributeNames[`#${key}`] = key;
    }
  }

  const updateExpression = [
    setExpressions.length > 0 ? `SET ${setExpressions.join(', ')}` : null,
    removeExpressions.length > 0 ? `REMOVE ${removeExpressions.join(', ')}` : null,
  ].filter(Boolean).join(' ');

  const params = {
    TableName: TABLE_NAME,
    Key: { pickupId },
    UpdateExpression: updateExpression,
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
  hardDelete = false,
): Promise<Pickup> => {
  const dynamoDB = new DynamoDB.DocumentClient();

  if (hardDelete) {
    // Delete the item from DynamoDB
    const result = await dynamoDB
      .delete({
        TableName: TABLE_NAME,
        Key: { id: pickupId },
        ReturnValues: 'ALL_OLD',
      })
      .promise();
      return result.Attributes as Pickup;
  } 
  const params = {
    TableName: TABLE_NAME,
    Key: { pickupId },
    UpdateExpression: 'SET status = :status, deletedAt = :deletedAt',
    ExpressionAttributeValues: {
      ':status': 'deleted',
      ':deletedAt': new Date().toISOString(),
      ReturnValues: 'ALL_NEW',
    },
  };
  const result = await dynamoDB.update(params).promise();
  return result.Attributes as Pickup;
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
