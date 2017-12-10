'use strict';

module.exports = {

  fabricCa: {
    uri: 'http://localhost:7054',
    name: 'ca.example.com',
    mspId: 'Org1MSP',
    admin: {
      name: 'admin',
      pwd: 'adminpw'
    },
    channel: 'spt',
    peer: {
      uri: 'grpc://localhost:7051'
    }
  }

};
