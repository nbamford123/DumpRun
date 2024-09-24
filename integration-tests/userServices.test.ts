import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { 
  createUserService, 
  getUserService, 
  updateUserService, 
  deleteUserService 
} from '@/lambda/users/userServices';

import type { NewUser, UpdateUser } from '@/schemas/apiSchema.d.ts';

const prisma = new PrismaClient()

beforeAll(async () => {
  // Connect to the test database
  await prisma.$connect()
})

afterAll(async () => {
  // Disconnect from the test database
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up the database before each test
  await prisma.user.deleteMany()
})

describe('User Service Integration Tests', () => {
  
  it('should create a new user', async () => {
    const newUser: NewUser = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '303-555-1212',
      address: '11382 High St. Northglenn, CO 80233',
      password: 'password123!'
    }
    
    const createdUser = await createUserService(newUser)
    
    expect(createdUser).toHaveProperty('id')
    expect(createdUser.name).toBe(newUser.name)
    expect(createdUser.email).toBe(newUser.email)
    expect(createdUser.phone).toBe(newUser.phone)
    expect(createdUser.address).toBe(newUser.address)
    expect(createdUser).toHaveProperty('createdAt')
    expect(createdUser).toHaveProperty('updatedAt')
    
    // Verify the user was actually created in the database
    const dbUser = await prisma.user.findUnique({ where: { id: createdUser.id } })
    const dbUserWithISOStrings = {
      ...dbUser,
      createdAt: dbUser?.createdAt.toISOString(),
      updatedAt: dbUser?.updatedAt.toISOString(),
    }
    expect(dbUserWithISOStrings).toEqual(createdUser)
  })

  it('should retrieve an existing user', async () => {
    const newUser = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '303-555-1212',
        address: '11382 High St. Northglenn, CO 80233',
        password: 'password123!'
      }
    })
    
    const retrievedUser = await getUserService(newUser.id)
    const newUserWithISOStrings = {
      ...newUser,
      createdAt: newUser?.createdAt.toISOString(),
      updatedAt: newUser?.updatedAt.toISOString(),
    }
    
    expect(retrievedUser).toEqual(newUserWithISOStrings)
  })

  it('should return null for non-existent user', async () => {
    expect(await getUserService('non-existent-id')).toBeNull()
  })

  it('should update an existing user', async () => {
    const newUser = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '303-555-1212',
        address: '11382 High St. Northglenn, CO 80233',
        password: 'password123!'
        }
    })
    
    const updateData: UpdateUser = {
      name: 'Robert Smith'
    }
    
    const updatedUser = await updateUserService(newUser.id, updateData)
    
    
    expect(updatedUser.name).toBe(updateData.name)
    expect(updatedUser.email).toBe(newUser.email)
    expect(new Date(updatedUser.updatedAt).getTime()).toBeGreaterThan(newUser.updatedAt.getTime())
    
    // Verify the user was actually updated in the database
    const dbUser = await prisma.user.findUnique({ where: { id: newUser.id } })
    const dbUserWithISOStrings = {
      ...dbUser,
      createdAt: dbUser?.createdAt.toISOString(),
      updatedAt: dbUser?.updatedAt.toISOString(),
    }
    expect(updatedUser).toEqual(dbUserWithISOStrings)
  })

  it('should return null for updating non-existent user', async () => {
    expect(await updateUserService('non-existent-id', {})).toBeNull()
  })

  it('should delete an existing user', async () => {
    const newUser = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '303-555-1212',
        address: '11382 High St. Northglenn, CO 80233',
        password: 'password123!'
        }
    })
    const newUserWithISOStrings = {
      ...newUser,
      createdAt: newUser?.createdAt.toISOString(),
      updatedAt: newUser?.updatedAt.toISOString(),
    }

    const deletedUser = await deleteUserService(newUser.id)

    expect(deletedUser).toEqual(newUserWithISOStrings)
    
    // Verify the user was actually deleted from the database
    const dbUser = await prisma.user.findUnique({ where: { id: newUser.id } })
    expect(dbUser).toBeNull()
  })

  it('should return null for non-existent user', async () => {
    expect(await deleteUserService('non-existent-id')).toBeNull()
  })
})