import { vi, describe, it, expect, beforeEach } from 'vitest';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
} from 'aws-lambda';
import { schemas } from '@/schemas/zodSchemas.js';

// Mock the entire userServices module
vi.mock('../userServices', () => ({
  createUserService: vi.fn(),
  getUserService: vi.fn(),
  updateUserService: vi.fn(),
  deleteUserService: vi.fn(),
}));

// Import after mocking
import {
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from '../userHandlers.js';
import {
  createUserService,
  getUserService,
  updateUserService,
  deleteUserService,
} from '../userServices.js';

describe('user lambdas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a user successfully', async () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      phone: '303-555-1212',
      address: '11382 High St. Northglenn, CO 80233',
      password: 'password',
    };
    const mockCreatedUser = {
      ...mockUser,
      createdAt: '2024-09-22T12:00:00Z',
      updatedAt: '2024-09-22T12:00:00Z',
    };

    // Mock createUserService
    (
      createUserService as vi.MockedFunction<typeof createUserService>
    ).mockResolvedValue(mockCreatedUser);

    const event: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockUser),
    };

    const result = await createUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(201);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockCreatedUser,
    );
    expect(createUserService).toHaveBeenCalledWith(mockUser);
  });

  it('should return 400 for invalid create user input', async () => {
    const invalidUser = {
      username: 'testuser',
      // Missing required fields
    };

    const event: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify(invalidUser),
    };

    const result = await createUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Invalid input',
    );
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'errors',
    );
  });

  it('should return 500 for create user internal server error', async () => {
    const mockUser = {
      username: 'testuser',
      email: 'test@example.com',
      name: 'Test User',
      phone: '303-555-1212',
      address: '11382 High St. Northglenn, CO 80233',
      password: 'password',
    };

    // Mock createUserService to throw an error
    (
      createUserService as vi.MockedFunction<typeof createUserService>
    ).mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      body: JSON.stringify(mockUser),
    };

    const result = await createUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('should get a user successfully', async () => {
    const mockUser = {
      id: 'user123',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: '2023-09-23T12:00:00Z',
      updatedAt: '2023-09-23T12:00:00Z',
    };

    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(mockUser);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'user123' },
    };

    const result = await getUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUser,
    );
    expect(getUserService).toHaveBeenCalledWith('user123');
  });

  it('should return 404 for get non-existent user', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(null);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'nonexistent' },
    };

    const result = await getUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'User not found',
    });
  });

  it('should return 400 for get user missing userId', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: {},
    };

    const result = await getUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Missing userId in path parameters',
    });
  });

  it('should return 500 for get user internal server error', async () => {
    // Mock createUserService to throw an error
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'nonexistent' },
    };

    const result = await getUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('should update a user successfully', async () => {
    const mockUpdatedUser = {
      id: 'user123',
      name: 'John Updated',
      email: 'john@example.com',
      phone: '1234567890',
      createdAt: '2023-09-23T12:00:00Z',
      updatedAt: '2023-09-24T12:00:00Z',
    };

    (
      updateUserService as vi.MockedFunction<typeof updateUserService>
    ).mockResolvedValue(mockUpdatedUser);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'user123' },
      body: JSON.stringify({ name: 'John Updated', phone: '1234567890' }),
    };

    const result = await updateUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUpdatedUser,
    );
    expect(updateUserService).toHaveBeenCalledWith('user123', {
      name: 'John Updated',
      phone: '1234567890',
    });
  });

  it('should return 400 for invalid update user input', async () => {
    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'user123' },
      body: JSON.stringify({ name: '' }), // Assuming empty name is invalid
    };

    const result = await updateUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Invalid input',
    );
  });

  it('user should return 404 for update user non-existent user', async () => {
    (
      updateUserService as vi.MockedFunction<typeof updateUserService>
    ).mockResolvedValue(null);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'nonexistent' },
      body: JSON.stringify({ name: 'John Updated' }),
    };

    const result = await updateUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'User not found',
    });
  });

  it('should return 500 for update user internal server error', async () => {
    // Mock createUserService to throw an error
    (
      updateUserService as vi.MockedFunction<typeof updateUserService>
    ).mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'nonexistent' },
      body: JSON.stringify({ name: 'John Updated' }),
    };

    const result = await updateUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );
    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });

  it('user should return 404 for delete user non-existent user', async () => {
    (
      deleteUserService as vi.MockedFunction<typeof deleteUserService>
    ).mockResolvedValue(null);

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'nonexistent' },
    };

    const result = await deleteUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(404);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'User not found',
    });
  });

  it('should return 500 for delete user internal server error', async () => {
    // Mock createUserService to throw an error
    (
      deleteUserService as vi.MockedFunction<typeof deleteUserService>
    ).mockRejectedValue(new Error('Database error'));

    const event: Partial<APIGatewayProxyEvent> = {
      pathParameters: { userId: '22' },
    };

    const result = await deleteUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(500);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Internal Server Error',
    });
  });
});
