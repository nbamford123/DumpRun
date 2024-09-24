import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { 
  createDriverService, 
  getDriverService, 
  updateDriverService, 
  deleteDriverService 
} from '@/lambda/drivers/driverServices';

import type { NewDriver, UpdateDriver } from '@/schemas/apiSchema.d.ts';

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
  await prisma.driver.deleteMany()
})

describe('Driver Service Integration Tests', () => {
  
  it('should create a new Driver', async () => {
    const newDriver: NewDriver = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '303-555-1212',
      address: '11382 High St. Northglenn, CO 80233',
      password: 'password123!',
      vehicleMake: 'Ford',
      vehicleModel: 'f150',
      vehicleYear: 1998
    }
    
    const createdDriver = await createDriverService(newDriver)
    
    expect(createdDriver).toHaveProperty('id')
    expect(createdDriver.name).toBe(newDriver.name)
    expect(createdDriver.email).toBe(newDriver.email)
    expect(createdDriver.phone).toBe(newDriver.phone)
    expect(createdDriver.address).toBe(newDriver.address)
    expect(createdDriver.vehicleMake).toBe(newDriver.vehicleMake)
    expect(createdDriver.vehicleModel).toBe(newDriver.vehicleModel)
    expect(createdDriver.vehicleYear).toBe(newDriver.vehicleYear)
    expect(createdDriver).toHaveProperty('createdAt')
    expect(createdDriver).toHaveProperty('updatedAt')
    
    // Verify the user was actually created in the database
    const dbDriver = await prisma.driver.findUnique({ where: { id: createdDriver.id } })
    const dbDriverWithISOStrings = {
      ...dbDriver,
      createdAt: dbDriver?.createdAt.toISOString(),
      updatedAt: dbDriver?.updatedAt.toISOString(),
    }
    expect(dbDriverWithISOStrings).toEqual(createdDriver)
  })

  it('should retrieve an existing driver', async () => {
    const newDriver = await prisma.driver.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '303-555-1212',
        address: '11382 High St. Northglenn, CO 80233',
        password: 'password123!',
        vehicleMake: 'Ford',
        vehicleModel: 'f150',
        vehicleYear: 1998
        }
    })
    
    const retrievedDriver = await getDriverService(newDriver.id)
    const newDriverWithISOStrings = {
      ...newDriver,
      createdAt: newDriver?.createdAt.toISOString(),
      updatedAt: newDriver?.updatedAt.toISOString(),
    }
    
    expect(retrievedDriver).toEqual(newDriverWithISOStrings)
  })

  it('should return null for non-existent driver', async () => {
    expect(await getDriverService('non-existent-id')).toBeNull()
  })

  it('should update an existing driver', async () => {
    const newDriver = await prisma.driver.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '303-555-1212',
        address: '11382 High St. Northglenn, CO 80233',
        password: 'password123!',
        vehicleMake: 'Ford',
        vehicleModel: 'f150',
        vehicleYear: 1998
      }
    })
    const updateData: UpdateDriver = {
      name: 'Robert Smith'
    }   
    const updatedDriver = await updateDriverService(newDriver.id, updateData)
    
    expect(updatedDriver.name).toBe(updateData.name)
    expect(updatedDriver.email).toBe(newDriver.email)
    expect(new Date(updatedDriver.updatedAt).getTime()).toBeGreaterThan(newDriver.updatedAt.getTime())
    
    // Verify the user was actually updated in the database
    const dbDriver = await prisma.driver.findUnique({ where: { id: newDriver.id } })
    const dbDriverWithISOStrings = {
      ...dbDriver,
      createdAt: dbDriver?.createdAt.toISOString(),
      updatedAt: dbDriver?.updatedAt.toISOString(),
    }
    expect(updatedDriver).toEqual(dbDriverWithISOStrings)
  })

  it('should return null for updating non-existent driver', async () => {
    expect(await updateDriverService('non-existent-id', {})).toBeNull()
  })

  it('should delete an existing driver', async () => {
    const newDriver = await prisma.driver.create({
      data: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '303-555-1212',
        address: '11382 High St. Northglenn, CO 80233',
        password: 'password123!',
        vehicleMake: 'Ford',
        vehicleModel: 'f150',
        vehicleYear: 1998
        }
    })

    const newDriverWithISOStrings = {
      ...newDriver,
      createdAt: newDriver?.createdAt.toISOString(),
      updatedAt: newDriver?.updatedAt.toISOString(),
    }

    const deletedDriver = await deleteDriverService(newDriver.id)

    expect(deletedDriver).toEqual(newDriverWithISOStrings)
    
    // Verify the user was actually deleted from the database
    const dbDriver= await prisma.driver.findUnique({ where: { id: newDriver.id } })
    expect(dbDriver).toBeNull()
  })

  it('delete should return null for non-existent driver', async () => {
    expect(await deleteDriverService('non-existent-id')).toBeNull()
  })
})