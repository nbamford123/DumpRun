import type { components } from '@/schemas/apiSchema.d.ts'

type User = components['schemas']['User']
type NewUser = components['schemas']['NewUser']
type UpdateUser = components['schemas']['UpdateUser']

export const createUserService = async (user: NewUser): Promise<User> => {
  const newUser: User = {
    ...user,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  // database insert
  return Promise.resolve(newUser)
}

export const getUserService = async (id: string): Promise<User> => {
  const newUser: User = {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  // throw on user not found? Make sure it's the proper error so the handler returns a 404
  // database insert
  return Promise.resolve(newUser)
}

export const updateUserService = async (id: string, user: UpdateUser): Promise<User> => {
  const updatedUser: User = {
    ...user,
    updatedAt: new Date().toISOString(),
  }
  // database insert
  return Promise.resolve(updatedUser)
}

export const deleteUserService = async (id: string): Promise<User> => {
  // database insert
  const user = await getUserService(id);
  return Promise.resolve(user);
}
