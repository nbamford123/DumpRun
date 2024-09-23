import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getUserService, createUserService, deleteUserService } from '../userServices';
import { connectToDatabase, closeDatabaseConnection } from '../database';

describe('User Service Integration Tests', () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await closeDatabaseConnection();
  });

  it('should create, retrieve, and delete a user', async () => {
    // Create a user
    const newUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    const createdUser = await createUserService(newUser);
    expect(createdUser).toHaveProperty('id');
    expect(createdUser.name).toBe(newUser.name);
    expect(createdUser.email).toBe(newUser.email);

    // Retrieve the user
    const retrievedUser = await getUserService(createdUser.id);
    expect(retrievedUser).toEqual(createdUser);

    // Delete the user
    await deleteUserService(createdUser.id);

    // Attempt to retrieve the deleted user
    const deletedUser = await getUserService(createdUser.id);
    expect(deletedUser).toBeNull();
  });

  it('should return null for non-existent user', async () => {
    const nonExistentUser = await getUserService('non-existent-id');
    expect(nonExistentUser).toBeNull();
  });

  // Add more tests for other service functions...
});