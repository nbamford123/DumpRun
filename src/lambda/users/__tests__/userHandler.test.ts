import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { APIGatewayProxyEvent } from 'aws-lambda';

import {
  requestContextAdmin,
  requestContextDriver,
  requestContextUser,
  mockLambdaContext,
  getResult,
} from '@/utils/testUtils.js';
import type { DeepPartial } from '@/utils/DeepPartial.js';

// Mock the entire userServices module
vi.mock('../userServices', () => ({
  createUserService: vi.fn(),
  getUserService: vi.fn(),
  getUsersService: vi.fn(),
  updateUserService: vi.fn(),
  deleteUserService: vi.fn(),
}));

import { handler as createUser } from '../createUser.js';
import { handler as getUser } from '../getUser.js';
import { handler as getUsers } from '../getUsers.js';
import { handler as updateUser } from '../updateUser.js';
import { handler as deleteUser } from '../deleteUser.js';
import {
  createUserService,
  getUserService,
  getUsersService,
  updateUserService,
  deleteUserService,
} from '../userServices.js';

const mockUserId = requestContextUser.authorizer.claims.sub;
const mockUser = {
  id: mockUserId,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phoneNumber: '303-451-5978',
  preferredContact: 'TEXT',
  address: {
    street: '11382 High St',
    city: 'Northglenn',
    state: 'CO',
    zipCode: '80233',
  },
  createdAt: '2023-09-23T12:00:00Z',
  updatedAt: '2023-09-23T12:00:00Z',
};

describe('user lambdas', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create a user successfully', async () => {
    // Mock createUserService
    (
      createUserService as vi.MockedFunction<typeof createUserService>
    ).mockResolvedValue({ type: 'success', user: mockUser });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      body: JSON.stringify(mockUser),
    };

    const result = await createUser(event, mockLambdaContext);
    expect(result).toEqual(getResult(201, mockUser));
    expect(createUserService).toHaveBeenCalledWith(expect.anything(), mockUser);
  });

  it('should return 400 for invalid create user input', async () => {
    const invalidUser = {
      username: 'testuser',
      // Missing required fields
    };

    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      body: JSON.stringify(invalidUser),
    };

    const result = await createUser(event, mockLambdaContext);

    expect(result?.statusCode).toBe(400);
  });

  it('should return 409 for create user phone number exists', async () => {
    // Mock createUserService
    (
      createUserService as vi.MockedFunction<typeof createUserService>
    ).mockResolvedValue({
      type: 'phone_exists',
      phoneNumber: mockUser.phoneNumber,
    });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      body: JSON.stringify(mockUser),
    };

    const result = await createUser(event, mockLambdaContext);
    expect(result.statusCode).toEqual(409);
    expect(JSON.parse(result.body).message).toEqual(
      `A user with phone number ${mockUser.phoneNumber} already exists`
    );
  });

  it('should return 409 for create user email exists', async () => {
    // Mock createUserService
    (
      createUserService as vi.MockedFunction<typeof createUserService>
    ).mockResolvedValue({
      type: 'email_exists',
      email: mockUser.email,
    });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextAdmin,
      body: JSON.stringify(mockUser),
    };

    const result = await createUser(event, mockLambdaContext);
    expect(result.statusCode).toEqual(409);
    expect(JSON.parse(result.body).message).toEqual(
      `A user with email ${mockUser.email} already exists`
    );
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
    const result = await getUsers(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(200, { users: mockUsers, total: mockUsers.length })
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
    const result = await getUsers(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(200, { users: mockUsers, total: mockUsers.length })
    );
    expect(getUsersService).toHaveBeenCalledWith(expect.anything(), 22, 13);
  });

  it('should get a user successfully', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextUser,
    };

    const result = await getUser(event, mockLambdaContext);

    expect(result).toEqual(getResult(200, mockUser));
    expect(getUserService).toHaveBeenCalledWith(expect.anything(), mockUserId);
  });

  it('should not get a user with wrong id', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue({ ...mockUser, id: 'abc123' });

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextUser,
    };

    const result = await getUser(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(403, {
        code: 'Forbidden',
        message: "User doesn't have permission",
      })
    );
  });

  it('should return 404 for get non-existent user', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextAdmin,
    };
    const result = await getUser(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(404, { code: 'NotFound', message: 'User not found' })
    );
  });

  it('should return 400 for get user missing userId', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextUser,
    };

    const result = await getUser(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(400, {
        code: 'BadRequest',
        message: 'Invalid path parameter: userId - Required',
      })
    );
  });

  it('should update a user successfully', async () => {
    const mockUpdatedUser = {
      ...mockUser,
      firstName: 'John Updated',
      phone: '1234567890',
    };
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(mockUser);
    (
      updateUserService as vi.MockedFunction<typeof updateUserService>
    ).mockResolvedValue(mockUpdatedUser);
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextUser,
      body: JSON.stringify({ firstName: 'John Updated', phone: '1234567890' }),
    };
    const result = await updateUser(event, mockLambdaContext);
    expect(result).toEqual(getResult(200, mockUpdatedUser));
    expect(updateUserService).toHaveBeenCalledWith(
      expect.anything(),
      mockUserId,
      {
        firstName: 'John Updated',
        phone: '1234567890',
      }
    );
  });

  it('should return 400 for missing user id in update user path', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextUser,
    };
    const result = await updateUser(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(400, {
        code: 'BadRequest',
        message: 'Invalid path parameter: userId - Required',
      })
    );
  });

  it('should return 400 for invalid update user input', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextUser,
      body: JSON.stringify({ firstName: '' }), // Assuming empty name is invalid
    };

    const result = await updateUser(event, mockLambdaContext);
    expect(result?.statusCode).toBe(400);
  });

  it('should return 404 for update user non-existent user', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(null);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextAdmin,
      body: JSON.stringify({ name: 'John Updated' }),
    };
    const result = await updateUser(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(404, { code: 'NotFound', message: 'User not found' })
    );
  });

  it('user should return 403 for update user not authorized', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue({ ...mockUser, id: 'abc123' });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextDriver,
      body: JSON.stringify({ name: 'John Updated' }),
    };
    const result = await updateUser(event, mockLambdaContext);

    expect(result?.statusCode).toBe(403);
  });

  it('should return 204 for delete user success', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(mockUser);
    (
      deleteUserService as vi.MockedFunction<typeof deleteUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextUser,
    };
    const result = await deleteUser(event, mockLambdaContext);

    expect(result).toEqual(getResult(204, mockUser));
  });

  it('should return 204 for admin delete user success', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(mockUser);
    (
      deleteUserService as vi.MockedFunction<typeof deleteUserService>
    ).mockResolvedValue(mockUser);

    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextAdmin,
    };
    const result = await deleteUser(event, mockLambdaContext);

    expect(result).toEqual(getResult(204, mockUser));
  });

  it('user should return 404 for delete user non-existent user', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue(null);
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextUser,
    };
    const result = await deleteUser(event, mockLambdaContext);

    expect(result?.statusCode).toBe(404);
  });

  it('should return 400 for delete user missing userId parameter', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      requestContext: requestContextUser,
    };
    const result = await deleteUser(event, mockLambdaContext);

    expect(result).toEqual(
      getResult(400, {
        code: 'BadRequest',
        message: 'Invalid path parameter: userId - Required',
      })
    );
  });

  it('should return 403 for delete user not authorized', async () => {
    (
      getUserService as vi.MockedFunction<typeof getUserService>
    ).mockResolvedValue({ ...mockUser, id: 'abc123' });
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextUser,
    };

    const result = await deleteUser(event, mockLambdaContext);

    expect(result?.statusCode).toBe(403);
  });

  it('should return 403 for delete user wrong role', async () => {
    const event: DeepPartial<APIGatewayProxyEvent> = {
      pathParameters: { userId: mockUserId },
      requestContext: requestContextDriver,
    };
    const result = await deleteUser(event, mockLambdaContext);

    expect(result?.statusCode).toBe(403);
  });
});
