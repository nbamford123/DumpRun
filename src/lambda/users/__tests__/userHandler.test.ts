import { vi, describe, it, expect, beforeEach } from 'vitest';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
} from 'aws-lambda';

import type { DeepPartial } from '@/utils/DeepPartial.js';

// Mock the entire userServices module
vi.mock('../userServices', () => ({
  createUserService: vi.fn(),
  getUserService: vi.fn(),
  getUsersService: vi.fn(),
  updateUserService: vi.fn(),
  deleteUserService: vi.fn(),
}));

// Import after mocking
import {
  createUser,
  getUser,
  getUsers,
  updateUser,
  deleteUser,
} from '../userHandlers.js';
import {
  createUserService,
  getUserService,
  getUsersService,
  updateUserService,
  deleteUserService,
} from '../userServices.js';
import { mock } from 'node:test';

const USER_ID = 'user-id';
const mockUser = {
  id: USER_ID,
  address: "11382 High St. Northglenn, CO 80233",
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password',
  phone: '303-451-5978',
  createdAt: '2023-09-23T12:00:00Z',
  updatedAt: '2023-09-23T12:00:00Z',
};

const requestContext = {
  authorizer: {
    claims: {
      sub: USER_ID,
      'custom:role': 'user',
    },
  },
};
const requestContextAdmin = {
  authorizer: {
    claims: {
      sub: 'admin-id',
      'custom:role': 'admin',
    },
  },
};

const requestContextDriver = {
  authorizer: {
    claims: {
      sub: 'driver-id',
      'custom:role': 'driver',
    },
  },
};

describe('user lambdas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a user successfully', async () => {
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

  it('admin should get users successfully', async () => {
    const mockUsers = [
      mockUser,
      {
        ...mockUser,
        id: 'anotherid',
      },
    ];

    (
      getUsersService as vi.MockedFunction<typeof getUsersService>
    ).mockResolvedValue(mockUsers);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await getUsers(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUsers,
    );
  });

  it('admin should get users successfully with query params', async () => {
    const mockUsers = [
      mockUser,
      {
        ...mockUser,
        id: 'anotherid',
      },
    ];

    (
      getUsersService as vi.MockedFunction<typeof getUsersService>
    ).mockResolvedValue(mockUsers);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      queryStringParameters: {
        limit: 22,
        offset: 13,
      },
      requestContext: requestContextAdmin,
    };

    const result = await getUsers(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(200);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUsers,
    );
    expect(getUsersService).toHaveBeenCalledWith(22, 13);
  });

  it('should not get users when not admin', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
    };

    const result = await getUsers(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 500 for get users internal server error', async () => {
    // Mock createUserService to throw an error
    (
      getUsersService as vi.MockedFunction<typeof getUsersService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
    };

    const result = await getUsers(
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
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext,
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
    expect(getUserService).toHaveBeenCalledWith(USER_ID);
  });

  it('admin should get a user successfully', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext: requestContextAdmin,
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
    expect(getUserService).toHaveBeenCalledWith(USER_ID);
  });

  it('should not get a user with wrong role', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext: requestContextDriver,
    };

    const result = await getUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should not get a user with wrong id', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'def123' },
      requestContext,
    };

    const result = await getUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 404 for get non-existent user', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext: requestContextAdmin,
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
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
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

  it('should return a 403 for get user invalid access', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'xyz' },
      requestContext,
    };

    const result = await getUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 500 for get user internal server error', async () => {
    // Mock createUserService to throw an error
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext
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
      ...mockUser,
      name: 'John Updated',
      phone: '1234567890',
    };

    (
      updateUserService as vi.MockedFunction<typeof updateUserService>
    ).mockResolvedValue(mockUpdatedUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext,
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
    expect(updateUserService).toHaveBeenCalledWith(USER_ID, {
      name: 'John Updated',
      phone: '1234567890',
    });
  });

  it('should return 400 for missing user id in update user path', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
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
      'Missing userId in path parameters',
    );
  });

  it('should return 400 for invalid update user input', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext,
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

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext: requestContextAdmin,
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

  it('user should return 403 for update user not authorized', async () => {
    (
      updateUserService as vi.MockedFunction<typeof updateUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext: requestContextDriver,
      body: JSON.stringify({ name: 'John Updated' }),
    };

    const result = await updateUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 500 for update user internal server error', async () => {
    // Mock createUserService to throw an error
    (
      updateUserService as vi.MockedFunction<typeof updateUserService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      body: JSON.stringify({ name: 'John Updated' }),
      requestContext
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

  it('should return 204 for delete user success', async () => {
    (
      deleteUserService as vi.MockedFunction<typeof deleteUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext,
    };

    const result = await deleteUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(204);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUser,
    );
  });

  it('should return 204 for delete driver admin success', async () => {
    (
      deleteUserService as vi.MockedFunction<typeof deleteUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext: requestContextAdmin,
    };

    const result = await deleteUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(204);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual(
      mockUser,
    );
  });

  it('user should return 404 for delete user non-existent user', async () => {
    (
      deleteUserService as vi.MockedFunction<typeof deleteUserService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext,
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

  it('should return 400 for delete driver missing driver id parameter', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext,
    };

    const result = await deleteUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(400);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toHaveProperty(
      'message',
      'Missing userId in path parameters',
    );
  });

  it('should return 403 for delete user not authorized', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: 'abc123' },
      requestContext,
    };

    const result = await deleteUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 403 for delete user wrong role', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext: requestContextDriver,
    };

    const result = await deleteUser(
      event as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback,
    );

    expect(result?.statusCode).toBe(403);
    expect(JSON.parse((result as APIGatewayProxyResult).body)).toEqual({
      message: 'Not authorized',
    });
  });

  it('should return 500 for delete user internal server error', async () => {
    // Mock createUserService to throw an error
    (
      deleteUserService as vi.MockedFunction<typeof deleteUserService>
    ).mockRejectedValue(new Error('Database error'));

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: USER_ID },
      requestContext
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
