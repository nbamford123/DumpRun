import type { components } from '@/schemas/apiSchema.d.ts'
import { Prisma, PrismaClient } from '@prisma/client'

type User = components['schemas']['User']
type NewUser = components['schemas']['NewUser']
type UpdateUser = components['schemas']['UpdateUser']

export const createUserService = async (user: NewUser): Promise<User> => {
  const prisma = new PrismaClient()
  try {
    const newUser = await prisma.user.create({
      data: user, // Prisma will automatically handle createdAt and updatedAt
    })
    return {
      ...newUser,
      createdAt: newUser.createdAt.toISOString(),
      updatedAt: newUser.createdAt.toISOString()
    };
  } finally {
    await prisma.$disconnect()
  }
}

export const getUserService = async (id: string): Promise<User | null> => {
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.findUnique({
      where: { id: id }
    });
    return user === null ? user : {
      ...user,
      createdAt: user?.createdAt.toISOString(),
      updatedAt: user?.updatedAt.toISOString()
    };
  } finally {
    await prisma.$disconnect()
  }
}

export const updateUserService = async (id: string, user: UpdateUser): Promise<User | null> => {
  const prisma = new PrismaClient()
  try {
    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: {
        ...user,
      }
    });
    return {
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString()
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

export const deleteUserService = async (id: string): Promise<User | null> => {
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.delete({
      where: {
        id: id
      }
    });
    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
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
