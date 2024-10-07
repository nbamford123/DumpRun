import 'dotenv/config'; // This will automatically load the .env file
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  createPickupService,
  getPickupService,
  deletePickupService,
  updatePickupService,
  availablePickupsService,
  acceptPickupService,
} from '@/lambda/pickups/pickupServices';

describe('Pickup Service Integration Tests', () => {
  let dynamoDB: DynamoDBDocumentClient;

  beforeAll(async () => {
    const client = new DynamoDBClient({
      region: process.env.DYNAMODB_REGION,
      endpoint: process.env.DYNAMODB_ENDPOINT,
      credentials: {
        accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY || '',
      },
      tls: true,
    });
    dynamoDB = DynamoDBDocumentClient.from(client);
  });

  afterEach(async () => {
    const scanParams = {
      TableName: 'Pickups',
    };
    const scanResult = await dynamoDB.send(new ScanCommand(scanParams));
    const deletePromises = scanResult.Items?.map((item) =>
      dynamoDB.send(
        new DeleteCommand({
          TableName: 'Pickups',
          Key: { id: item.id },
        }),
      ),
    );
    if (deletePromises) {
      await Promise.all(deletePromises);
    }
  });

  afterAll(() => {
    dynamoDB.destroy();
  });

  it('should create a new pickup', async () => {
    const userId = 'testUser123';
    const newPickup = {
      location: '123 Test St, Test City',
      estimatedWeight: 50,
      wasteType: 'recyclable',
      requestedTime: '2023-04-01T10:00:00Z',
    };

    const createdPickup = await createPickupService(userId, newPickup);

    expect(createdPickup).toBeDefined();
    expect(createdPickup.id).toBeDefined();
    expect(createdPickup.userId).toBe(userId);
    expect(createdPickup.status).toBe('pending');
    expect(createdPickup.location).toBe(newPickup.location);
    expect(createdPickup.estimatedWeight).toBe(newPickup.estimatedWeight);
    expect(createdPickup.wasteType).toBe(newPickup.wasteType);
    expect(createdPickup.requestedTime).toBe(newPickup.requestedTime);

    // Verify the pickup was actually created in the database
    const retrievedPickup = await getPickupService(createdPickup.id);
    expect(retrievedPickup).toEqual(createdPickup);
  });

  it('should throw on get nonexistant pickup', async () => {
    const userId = 'testUser123';
    const newPickup = {
      location: '123 Test St, Test City',
      estimatedWeight: 50,
      wasteType: 'recyclable',
      requestedTime: '2023-04-01T10:00:00Z',
    };

    await createPickupService(userId, newPickup);
    await expect(getPickupService('nonExistentId')).rejects.toThrow(
      'Failed to retrieve pickup',
    );
  });

  it('should update a pickup', async () => {
    const userId = 'testUser123';
    const newPickup = {
      location: '123 Test St, Test City',
      estimatedWeight: 50,
      wasteType: 'recyclable',
      requestedTime: '2023-04-01T10:00:00Z',
    };

    const createdPickup = await createPickupService(userId, newPickup);
    const updateData = {
      estimatedWeight: 250,
    };
    const updatedPickup = await updatePickupService(
      createdPickup.id,
      updateData,
    );
    expect(updatedPickup).toEqual({ ...createdPickup, ...updateData });
  });

  it('should soft delete a pickup', async () => {
    const userId = 'testUser123';
    const newPickup = {
      location: '123 Test St, Test City',
      estimatedWeight: 50,
      wasteType: 'recyclable',
      requestedTime: '2023-04-01T10:00:00Z',
    };

    const createdPickup = await createPickupService(userId, newPickup);
    const deletedPickup = await deletePickupService(createdPickup.id);
    expect(deletedPickup.id).toEqual(createdPickup.id);
    expect(deletedPickup.status).toEqual('deleted');
    expect(deletedPickup).toHaveProperty('deletedAt');
    expect(new Date(deletedPickup.deletedAt).toISOString()).toEqual(
      deletedPickup.deletedAt,
    );

    // Perform a get operation to verify the status in the database
    const retrievedPickup = await getPickupService(createdPickup.id);
    expect(deletedPickup).toEqual(retrievedPickup);
  });
});

it('should hard delete a pickup', async () => {
  const userId = 'testUser123';
  const newPickup = {
    location: '123 Test St, Test City',
    estimatedWeight: 50,
    wasteType: 'recyclable',
    requestedTime: '2023-04-01T10:00:00Z',
  };

  const createdPickup = await createPickupService(userId, newPickup);
  const deletedPickup = await deletePickupService(createdPickup.id, true);
  expect(deletedPickup).toEqual(createdPickup);

  // Perform a get operation to verify the status in the database
  await expect(getPickupService(createdPickup.id)).rejects.toThrow(
    'Failed to retrieve pickup',
  );
});

it('should get available pickups', async () => {
  const userId = 'testUser123';
  const pickup = {
    location: '123 Test St, Test City',
    estimatedWeight: 50,
    wasteType: 'recyclable',
    requestedTime: '2023-04-01T10:00:00Z',
  };
  const p1 = await createPickupService(userId, pickup);
  const p2 = await createPickupService(userId, pickup);
  const p3 = await createPickupService(userId, pickup);
  const p4 = await createPickupService(userId, pickup);
  const update = {
    status: 'available',
  };
  const p2a = await updatePickupService(p2.id, update);
  const p4a = await updatePickupService(p4.id, update);

  const avail = await availablePickupsService();
  const srt = (a, b) => a.id.localeCompare(b.id);
  expect(avail.sort(srt)).toEqual([p2a, p4a].sort(srt));
});

it('should accept a pickup', async () => {
  const userId = 'testUser123';
  const pickup = {
    location: '123 Test St, Test City',
    estimatedWeight: 50,
    wasteType: 'recyclable',
    requestedTime: '2023-04-01T10:00:00Z',
  };
  const p1 = await createPickupService(userId, pickup);
  const p2 = await createPickupService(userId, pickup);
  const p3 = await createPickupService(userId, pickup);
  const p4 = await createPickupService(userId, pickup);
  const update = {
    status: 'available',
  };
  const p2a = await updatePickupService(p2.id, update);
  const p4a = await updatePickupService(p4.id, update);

  const accepted = await acceptPickupService(p2.id, 'driver123');
  expect(accepted).toEqual({
    ...p2,
    driverId: 'driver123',
    status: 'accepted',
  });
});

it('should fail to accept a pickup that doesnt exist', async () => {
  await expect(acceptPickupService('fakeid', 'driver123')).rejects.toThrow(
    'Pickup not found',
  );
});
