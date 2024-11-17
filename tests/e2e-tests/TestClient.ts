import axios, { type AxiosInstance } from 'axios';
import { describe, it, expect, beforeAll } from 'vitest';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import dotenv from 'dotenv';

dotenv.config();

export interface TestUser {
	username: string;
	password: string;
	token?: string;
}

export class TestClient {
	private api: AxiosInstance;
	private cognito: CognitoIdentityProvider;

	constructor() {
		this.api = axios.create({
			baseURL: process.env.API_URL,
			validateStatus: null,
		});

		this.cognito = new CognitoIdentityProvider({
			region: process.env.AWS_REGION,
		});
	}

	async authenticateUser(username: string, password: string): Promise<string> {
		try {
			const response = await this.cognito.initiateAuth({
				AuthFlow: 'USER_PASSWORD_AUTH',
				ClientId: process.env.COGNITO_CLIENT_ID || '',
				AuthParameters: {
					USERNAME: username,
					PASSWORD: password,
				},
			});
			if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
				const challengeResponse = await this.cognito.respondToAuthChallenge({
					ClientId: process.env.COGNITO_CLIENT_ID || '',
					ChallengeName: 'NEW_PASSWORD_REQUIRED',
					Session: response.Session,
					ChallengeResponses: {
						USERNAME: username,
						NEW_PASSWORD: process.env.TEST_USER_PASSWORD || '',
					},
				});
				return challengeResponse.AuthenticationResult?.IdToken || '';
			}

			return response.AuthenticationResult?.IdToken || '';
		} catch (error) {
			console.error('Authentication failed:', error);
			throw error;
		}
	}

	async request(
		method: string,
		path: string,
		options: {
			token?: string;
			body?: Record<string, unknown>;
			params?: Record<string, string>;
		} = {},
	) {
		const { token, body, params } = options;

		// Normalize the path
		const normalizedPath = path.replace(/\/+/g, '/');
		const basePath = process.env.AWS_GATEWAY_API_BASE_PATH?.replace(/\/+$/, '');
		const fullUrl = `${basePath}${normalizedPath}`;

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'X-Amz-Debug': 'true',
		};

		if (token) {
			headers.Authorization = `Bearer ${token}`;
		}

		return this.api.request({
			method,
			url: fullUrl,
			headers,
			...(body && { data: body }),
			...(params && { params }),
		});
	}
}
