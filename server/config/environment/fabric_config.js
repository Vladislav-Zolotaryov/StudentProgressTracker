'use strict';

module.exports = {
  fabricCa: {
    uri: 'http://localhost:7054',
    name: 'ca.example.com',
    admin: {
      name: 'admin',
      pwd: 'adminpw'
    }
  },
  orderer: {
    url: "grpcs://localhost:7050",
    hostname: "orderer.example.com",
    tls_cacerts: "../../../fabric/basic-network/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt"
  },
  mspId: 'Org1MSP',
  channel: 'mychannel',
  peers: [
    {
      uri: 'grpc://localhost:7051',
      hostname: "peer0.org1.example.com",
      tls_cacerts: "../../../fabric/basic-network/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
    }
  ]
};
