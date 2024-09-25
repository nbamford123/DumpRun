import type { components } from '@/schemas/apiSchema.d.ts'
import { Prisma, PrismaClient } from '@prisma/client'

type Driver = components['schemas']['Driver']
type NewDriver = components['schemas']['NewDriver']
type UpdateDriver = components['schemas']['UpdateDriver']

export const createDriverService = async (driver: NewDriver): Promise<Driver> => {
  const prisma = new PrismaClient()
  try {
    const newDriver = await prisma.driver.create({
      data: driver, // Prisma will automatically handle createdAt and updatedAt
    })
    return {
      ...newDriver,
      createdAt: newDriver.createdAt.toISOString(),
      updatedAt: newDriver.createdAt.toISOString()
    };
  } finally {
    await prisma.$disconnect()
  }
}

export const getDriverService = async (id: string): Promise<Driver | null> => {
  const prisma = new PrismaClient()
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: id }
    });
    return driver === null ? driver : {
      ...driver,
      createdAt: driver?.createdAt.toISOString(),
      updatedAt: driver?.updatedAt.toISOString()
    };
  } finally {
    await prisma.$disconnect()
  }
}

export const updateDriverService = async (id: string, driver: UpdateDriver): Promise<Driver | null> => {
  const prisma = new PrismaClient()
  try {
    const updatedDriver = await prisma.driver.update({
      where: { id: id },
      data: {
        ...driver,
      }
    });
    return {
      ...updatedDriver,
      createdAt: updatedDriver.createdAt.toISOString(),
      updatedAt: updatedDriver.updatedAt.toISOString()
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Record to update does not exist
      return null;
    }
    throw error; // Re-throw other errors  
  } finally {
    await prisma.$disconnect()
  }
}

export const deleteDriverService = async (id: string): Promise<Driver | null> => {
  const prisma = new PrismaClient()
  try {
    const driver = await prisma.driver.delete({
      where: {
        id: id
      }
    });
    return {
      ...driver,
      createdAt: driver.createdAt.toISOString(),
      updatedAt: driver.updatedAt.toISOString()
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Record to delete does not exist
      return null;
    }
    throw error; // Re-throw other errors
  } finally {
    await prisma.$disconnect()
  }
}
