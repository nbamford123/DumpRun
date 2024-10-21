import {
  DynamoDBClient,
  type DynamoDBClientConfig,
} from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  type QueryCommandInput,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import { v4 as uuidv4 } from 'uuid';

import type { components } from '@/schemas/apiSchema.d.ts';

type Pickup = components['schemas']['Pickup'];
type NewPickup = components['schemas']['NewPickup'];

// Simple factory method to create a production instance of the dynamodb service
export const getPickupService = (
  tableName: string = process.env.DYNAMO_TABLE_NAME || 'Pickups',
) => {
  return new PickupService(tableName);
};

export class PickupService {
  private dynamoDB: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string, config: Partial<DynamoDBClientConfig> = {}) {
    const client = new DynamoDBClient(config);
    this.dynamoDB = DynamoDBDocumentClient.from(client);
    this.tableName = tableName;
  }
  createPickup = async (userId: string, pickup: NewPickup): Promise<Pickup> => {
    const pickupId = uuidv4();

    const params = {
      TableName: this.tableName,
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
    await this.dynamoDB.send(new PutCommand(params));

    return this.getPickup(pickupId);
  };

  getPickups = async (
    status: string,
    limit = 20,
    cursor?: string,
    startRequestedTime?: string,
    endRequestedTime?: string,
  ): Promise<{ pickups: Pickup[]; nextCursor: string | null }> => {
    const defaultStartTime = '0000-01-01T00:00:00Z';
    const defaultEndTime = '9999-12-31T23:59:59Z';

    const params: QueryCommandInput = {
      TableName: 'Pickups',
      IndexName: 'StatusIndex',
      KeyConditionExpression:
        '#status = :status AND #requestedTime BETWEEN :start AND :end',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#requestedTime': 'requestedTime',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':start': startRequestedTime || defaultStartTime,
        ':end': endRequestedTime || defaultEndTime,
      },
      Limit: limit,
      ScanIndexForward: false, // This will return results in descending order of requestedTime
    };

    if (cursor) {
      params.ExclusiveStartKey = JSON.parse(cursor);
    }
    const command = new QueryCommand(params);
    const result = await this.dynamoDB.send(command);

    return {
      pickups: result.Items || [],
      nextCursor: result.LastEvaluatedKey
        ? JSON.stringify(result.LastEvaluatedKey)
        : null,
    };
  };

  getPickup = async (pickupId: string): Promise<Pickup> => {
    const getParams = {
      TableName: this.tableName,
      Key: {
        id: pickupId,
      },
    };
    const result = await this.dynamoDB.send(new GetCommand(getParams));

    if (!result.Item) {
      throw new Error('Failed to retrieve pickup');
    }

    return result.Item as Pickup;
  };

  async updatePickup(
    pickupId: string,
    updateData: Partial<Pickup>,
  ): Promise<Pickup> {
    const setExpressions = [];
    const removeExpressions = [];
    const expressionAttributeValues: Record<string, string> = {};
    const expressionAttributeNames: Record<string, string> = {};

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
      removeExpressions.length > 0
        ? `REMOVE ${removeExpressions.join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join(' ');

    const params = {
      TableName: this.tableName,
      Key: { id: pickupId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
      ReturnValues: 'ALL_NEW' as const,
      ConditionExpression: 'attribute_exists(id)',
    };

    const result = await this.dynamoDB.send(new UpdateCommand(params));
    return result.Attributes as Pickup;
  }

  deletePickup = async (
    pickupId: string,
    hardDelete = false,
  ): Promise<Pickup> => {
    if (hardDelete) {
      // Delete the item from DynamoDB
      const result = await this.dynamoDB.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { id: pickupId },
          ReturnValues: 'ALL_OLD',
        }),
      );
      return result.Attributes as Pickup;
    }
    const params = {
      TableName: this.tableName,
      Key: { id: pickupId },
      UpdateExpression: 'SET #status = :status, deletedAt = :deletedAt',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'deleted',
        ':deletedAt': new Date().toISOString(),
      },
      ReturnValues: 'ALL_NEW' as const,
    };
    const result = await this.dynamoDB.send(new UpdateCommand(params));
    return result.Attributes as Pickup;
  };

  availablePickups = async (): Promise<Pickup[]> => {
    const queryParams = {
      TableName: this.tableName,
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'available',
      },
    };
    const result = await this.dynamoDB.send(new ScanCommand(queryParams));

    if (!result.Items) {
      throw new Error('Failed to retrieve available pickups');
    }

    return result.Items as Pickup[];
  };

  acceptPickup = async (
    pickupId: string,
    driverId: string,
  ): Promise<Pickup> => {
    const updateParams = {
      TableName: this.tableName,
      Key: {
        id: pickupId,
      },
      UpdateExpression: 'set #status = :status, driverId = :driverId',
      ConditionExpression: 'attribute_exists(id)', // Ensure the item exists
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'accepted',
        ':driverId': driverId,
      },
      ReturnValues: 'ALL_NEW' as const,
    };
    try {
      const result = await this.dynamoDB.send(new UpdateCommand(updateParams));

      if (!result.Attributes) {
        throw new Error('Failed to update pickup status');
      }
      return result.Attributes as Pickup;
    } catch (error) {
      if ((error as Error).name === 'ConditionalCheckFailedException') {
        throw new Error('Pickup not found');
      }
      throw error;
    }
  };
}
