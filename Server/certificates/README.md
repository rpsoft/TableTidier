# JWT

> :warning: **WARNING, CHANGE 'private.pem' FILE IN PRODUCTION!!!**


```bash
# generate private key
openssl ecparam -name secp256k1 -genkey -noout -out certificates/private.pem
# generate public key
openssl ec -in private.pem -pubout -out public.pem

```