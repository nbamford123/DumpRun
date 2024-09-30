import type { APIGatewayProxyHandler } from 'aws-lambda';
import { schemas } from '@/schemas/zodSchemas.js';

import {
  createDriverService,
  getDriverService,
  updateDriverService,
  deleteDriverService,
} from './driverServices.js';

export const createDriver: APIGatewayProxyHandler = async (event) => {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const result = schemas.NewDriver.safeParse(requestBody);
    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input',
          errors: result.error.issues,
        }),
      };
    }
    const newDriver = await createDriverService(result.data);
    return {
      statusCode: 201,
      body: JSON.stringify(newDriver),
    };
  } catch (error) {
    console.error('Error in create driver ', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

export const getDriver: APIGatewayProxyHandler = async (event) => {
  try {
    const driverId = event.pathParameters?.driverId;
    if (!driverId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing driverId in path parameters',
        }),
      };
    }

    const driver = await getDriverService(driverId);
    if (!driver) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Driver not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(driver),
    };
  } catch (error) {
    console.error('Error in getDriver:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

export const updateDriver: APIGatewayProxyHandler = async (event) => {
  try {
    const driverId = event.pathParameters?.driverId;
    if (!driverId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing driverId in path parameters',
        }),
      };
    }

    const requestBody = JSON.parse(event.body || '{}');
    const result = schemas.UpdateDriver.safeParse(requestBody);
    if (!result.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input',
          errors: result.error.issues,
        }),
      };
    }

    const updatedUDriver = await updateDriverService(driverId, result.data);
    if (!updatedUDriver) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Driver not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(updatedUDriver),
    };
  } catch (error) {
    console.error('Error in updateDriver:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};

export const deleteDriver: APIGatewayProxyHandler = async (event) => {
  try {
    const driverId = event.pathParameters?.driverId;
    if (!driverId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Missing driverId in path parameters',
        }),
      };
    }

    const deletedDriver = await deleteDriverService(driverId);

    if (!deletedDriver) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Driver not found' }),
      };
    }
    return {
      statusCode: 204,
      body: JSON.stringify(deletedDriver),
    };
  } catch (error) {
    console.error('Error in deleteDriver:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
