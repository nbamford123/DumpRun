import { describe, it, expect } from 'vitest'
import { handler } from './index'
import type {
  APIGatewayProxyEvent,
  Callback,
  Context,
  APIGatewayProxyResult,
} from 'aws-lambda'
describe('Lambda Handler', () => {
  it('returns a 200 status code', async () => {
    const result = await handler(
      {} as APIGatewayProxyEvent,
      {} as Context,
      {} as Callback<APIGatewayProxyResult>
    )
    expect(result?.statusCode).toBe(200)
  })
})
