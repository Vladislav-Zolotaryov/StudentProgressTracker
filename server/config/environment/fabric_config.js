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
  mspId: 'Org1MSP',
  channel: 'mychannel',
  peer: {
    uri: 'grpc://localhost:7051'
  }

};
