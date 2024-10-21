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
    
