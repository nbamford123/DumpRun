import type { operations } from '@/schemas/apiSchema.d.ts';

// Base type for what API Gateway sends to Lambda after transformation
export interface APIGatewayTransformedEvent<
  TOperation extends keyof operations,
> {
  requestContext: {
    authorizer?: {
      claims: {
        'custom:role': string;
        sub: string;
        [key: string]: string;
      };
    };
    body?: operations[TOperation]['requestBody'] extends {
      content: { 'application/json': infer T };
    }
      ? T
      : never;
    pathParameters?: operations[TOperation]['parameters']['path'];
    queryStringParameters?: operations[TOperation]['parameters']['query'];
  };
}

