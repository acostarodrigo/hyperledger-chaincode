# download repo
Modify TLS_ENABLE to false in CA for template file
Modify log at orderer - FABRIC_LOGGING_SPEC=DEBUG
set all TLS_ENABLED to false for peer and orderer
set TFS_ENABLED to false in CLI composer file
Modify step1org3 and step2org3 to comment -tls

# remove any containers
./eyfn.sh down
./byfn.sh down

# start my first network
./byfn.sh generate
./byfn.sh up -l node

# start org CAs
docker-compose -f docker-compose-e2e.yaml up -d

# start org3 
./eyfn.sh generate
./eyfn.sh up -l node

# Upgrade network to 1.4 to support private data
./byfn.sh upgrade

# add chaincode path to cli container
- /Users/rodrigo/invectorIQ/projects/securitize/sourceCode/chaincode/:/commercialPaper

# connect to cli
docker exec -it cli /bin/bash

# install chaincode 
peer chaincode install -p /commercialPaper/ -n papercontract -l node -v 0

# instantiate chaincode
```
peer chaincode instantiate -C mychannel -l node -n papercontract -P "OR('Org1MSP.member','Org2MSP.member','Org3MSP.member')" --collections-config /commercialPaper/private/arrangement_collections.json -c '{"Args":["instantiate","issuer","USD,EUR,JPN", "org2,org3"]}' --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem -v 0
```

# upgrade chaincode
```
peer chaincode upgrade -C mychannel -l node -n papercontract -P "OR('Org1MSP.member','Org2MSP.member','Org3MSP.member')" --collections-config /commercialPaper/private/arrangement_collections.json -c '{"Args":["instantiate","issuer","USD,EUR,JPN", "org2,org3"]}' --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem -v 0
```

# recreate identities in Wallet
test getIssuer method

# REST
curl -s -X POST http://localhost:8888/users/register -H "content-type: application/x-www-form-urlencoded" -d 'username=rodrigo&secret=rodrigo&orgName=org1'