var FabricClient = require('fabric-client');
var FabricCaClient = require('fabric-ca-client');

var path = require('path');
var fabricConfig = require('../../config/environment/fabric_config');

var fabricClient = new FabricClient();
var fabricCaClient = null;

var storePath = path.join(__dirname, 'hfc-key-store');
console.log('Store path: ${storePath}');

FabricClient.newDefaultKeyValueStore({
  path: storePath
})
  .then(stateStore => {
    // assign the store to the fabric client
    fabricClient.setStateStore(stateStore);
    var cryptoSuite = FabricClient.newCryptoSuite();
    // use the same location for the state store (where the users' certificate are kept)
    // and the crypto store (where the users' keys are kept)
    var cryptoStore = FabricClient.newCryptoKeyStore({
      path: storePath
    });
    cryptoSuite.setCryptoKeyStore(cryptoStore);
    fabricClient.setCryptoSuite(cryptoSuite);
    var tlsOptions = {
      trustedRoots: [],
      verify: false
    };
    // be sure to change the http to https when the CA is running TLS enabled
    fabricCaClient = new FabricCaClient(fabricConfig.fabricCa.uri, tlsOptions, fabricConfig.fabricCa.name, cryptoSuite);

    // first check to see if the admin is already enrolled
    return fabricClient.getUserContext('admin', true);
  })
  .then(userFromStore => {
    if(userFromStore && userFromStore.isEnrolled()) {
      console.log('Successfully loaded admin from persistence');
      return userFromStore;
    } else {
      // need to enroll it with CA server
      return fabricCaClient.enroll({
        enrollmentID: fabricConfig.fabricCa.admin.name,
        enrollmentSecret: fabricConfig.fabricCa.admin.pwd
      }).then(enrollment => {
        console.log('Successfully enrolled admin user "admin"');
        return fabricClient.createUser({
          username: fabricConfig.fabricCa.admin.name,
          mspid: fabricConfig.mspId,
          cryptoContent: {
            privateKeyPEM: enrollment.key.toBytes(),
            signedCertPEM: enrollment.certificate
          }
        });
      })
        .then(user => fabricClient.setUserContext(user))
        .catch(err => {
          console.error('Failed to enroll and persist admin. Error: %s', err.stack ? err.stack : err);
          throw new Error('Failed to enroll admin');
        });
    }
  })
  .then(adminUser => {
    console.log('Assigned the admin user to the fabric client ::%s', adminUser.toString());
  })
  .catch(err => {
    console.error('Failed to enroll admin: %s', err);
  });

var peer = fabricClient.newPeer(fabricConfig.peer.uri);
var channel = fabricClient.newChannel(fabricConfig.channel);
channel.addPeer(peer);

export function index(req, res) {
  const query = {
    chaincodeId: 'main:v1',
    fcn: 'queryAll',
    args: ['']
  };

  return channel.queryByChaincode(query)
    .then(queryResponses => {
      console.log('Query has completed, checking results');
      if(queryResponses && queryResponses.length > 0) {
        if(queryResponses[0] instanceof Error) {
          console.error('Error from query = ', queryResponses[0]);
          return res.status(500).json(queryResponses[0]);
        } else {
          console.log('Response is ', queryResponses[0].toString());
          return res.status(200).json(queryResponses[0].toString());
        }
      } else {
        console.log('No payloads were returned from query');
        return res.status('404');
      }
    });
}
