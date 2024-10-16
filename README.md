# DumpRun

* install aws-cli
* zip and create prisma layer (libquery_engine-rhel-openssl-3.0.x.so.node):
 ```sh
  aws lambda publish-layer-version \
    --layer-name prisma-engine \
    --description "Prisma Engine Layer" \
    --zip-file fileb://prisma-engine-layer.zip \
    --compatible-runtimes nodejs20.x
  ```

  COGNITO_USER_POOL_ID us-west-2_vriluhdDN

  user1: 185183b0-c041-7049-eca3-c508a46f5ebe
  user2: 38b10310-d0b1-70c8-feab-cc0f030d8f54
  admin: b83183f0-b021-7030-5e45-0668ae56999b
  driver1: 28e1a370-90d1-7093-6940-2d9e1794750b
  driver2: 48211350-8051-70cf-ebd7-7fb7436b0a21
  
