export const getCorsHeaders = () => ({
	'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS,
	'Access-Control-Allow-Credentials': 'true',
	'Access-Control-Allow-Headers':
		'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
	'Content-Type': 'application/json',
});
