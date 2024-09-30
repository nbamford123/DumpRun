#!/bin/bash

 # Check if the correct number of arguments is provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <input> <output>"
  exit 1
fi

input=$1
output=$2

# Run the openapi-zod-client command
openapi-zod-client "$input" -o "$output"

# Append the export text to the output file
cat <<EOL >> "$output"

export const AuthInfoSchema = z.object({
  sub: z.string(),
  'custom:role': z.enum(['user', 'driver', 'admin']),
});
EOL