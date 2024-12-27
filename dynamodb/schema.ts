import { CreateTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { CreateTableCommandInput } from '@aws-sdk/client-dynamodb';

import { config } from 'dotenv';

// Load environment variables from .env.test
// How are we going to run the integration test? Somehow need to differentiate between testing and prod,
// although I guess prod only needs to be run once.
config({ path: '.env.test' });
const client = new DynamoDBClient({
	region: process.env.DYNAMODB_REGION,
	endpoint: 'http://dynamodb-local:8000',
	credentials: {
		accessKeyId: process.env.DYNAMODB_ACCESS_KEY_ID || '',
		secretAccessKey: process.env.DYNAMODB_SECRET_ACCESS_KEY || '',
	},
});
// const client = new DynamoDBClient({});

const pickupsTableSchema: CreateTableCommandInput = {
	TableName: 'Pickups',
	KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
	AttributeDefinitions: [
		{ AttributeName: 'id', AttributeType: 'S' },
		{ AttributeName: 'userId', AttributeType: 'S' },
		{ AttributeName: 'status', AttributeType: 'S' },
		{ AttributeName: 'requestedTime', AttributeType: 'S' },
	],
	GlobalSecondaryIndexes: [
		{
			IndexName: 'UserIdIndex',
			KeySchema: [
				{ AttributeName: 'userId', KeyType: 'HASH' },
				{ AttributeName: 'requestedTime', KeyType: 'RANGE' },
			],
			Projection: {
				ProjectionType: 'ALL',
			},
			ProvisionedThroughput: {
				ReadCapacityUnits: 5,
				WriteCapacityUnits: 5,
			},
		},
		{
			IndexName: 'StatusIndex',
			KeySchema: [
				{ AttributeName: 'status', KeyType: 'HASH' },
				{ AttributeName: 'requestedTime', KeyType: 'RANGE' },
			],
			Projection: {
				ProjectionType: 'ALL',
			},
			ProvisionedThroughput: {
				ReadCapacityUnits: 5,
				WriteCapacityUnits: 5,
			},
		},
	],
	ProvisionedThroughput: {
		ReadCapacityUnits: 5,
		WriteCapacityUnits: 5,
	},
};

async function createPickupsTable() {
	console.log('Creating Pickup table');
	// await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay
	try {
		const command = new CreateTableCommand(pickupsTableSchema);
		const response = await client.send(command);
		console.log('Pickup table created successfully:', response);
	} catch (error) {
		if (error.name === 'ResourceInUseException') {
			console.log('Pickup table already exists');
		} else {
			console.error('Error creating Pickup table:', error);
		}
	}
}

// Call the function to create the table
createPickupsTable().catch((error) => {
	console.error('Unhandled error:', error);
	process.exit(1);
});

export { pickupsTableSchema };
