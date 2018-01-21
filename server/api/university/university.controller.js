var FabricClient = require('fabric-client');
var FabricCaClient = require('fabric-ca-client');

var User = require('fabric-client/lib/User.js');
var fs = require('fs-extra');
var path = require('path');
var fabricConfig = require('../../config/environment/fabric_config');

function createFabricClient() {
  var storePath = path.join(__dirname, 'hfc-key-store');

  return FabricClient.newDefaultKeyValueStore({
    path: storePath
  }).then(stateStore => {
      console.log("Store path: " + JSON.stringify(storePath));
      var fabricClient = new FabricClient();
      fabricClient.setStateStore(stateStore);
      var cryptoSuite = FabricClient.newCryptoSuite();
      var cryptoStore = FabricClient.newCryptoKeyStore({
        path: storePath
      });
      cryptoSuite.setCryptoKeyStore(cryptoStore);
      fabricClient.setCryptoSuite(cryptoSuite);

      console.log("Created fabric client");
      return fabricClient;
    }).catch(err => {
      console.error('Failed to create fabric client: %s', err);
      return null;
    });
}

function createFabricCaClient(fabricClient) {
  console.log("Creating Fabric CA");
  var tlsOptions = {
    trustedRoots: [],
    verify: false
  };
  return new FabricCaClient(fabricConfig.fabricCa.uri, null, fabricConfig.fabricCa.name, fabricClient.getCryptoSuite());
}

function getAdmin(fabricClient, fabricCaClient) {
  var member;
  return fabricClient.getUserContext(fabricConfig.fabricCa.admin.name, true)
  .then(userFromStore => {
    if(userFromStore && userFromStore.isEnrolled()) {
      console.log('Successfully loaded admin from persistence');
      return userFromStore;
    } else {
      return fabricCaClient.enroll({
        enrollmentID: fabricConfig.fabricCa.admin.name,
        enrollmentSecret: fabricConfig.fabricCa.admin.pwd
      }).then(enrollment => {
        console.log('Successfully enrolled admin user "admin"');
        member = new User(fabricConfig.fabricCa.admin.name);
        member.setCryptoSuite(fabricClient.getCryptoSuite());
        return member.setEnrollment(enrollment.key, enrollment.certificate, fabricConfig.mspId);
      })
      .then(() => {
          fabricClient.setUserContext(member);
          return member;
      })
      .catch(err => {
          console.error('Failed to enroll and persist admin. Error: %s', err.stack ? err.stack : err);
          return null;
      });
    }
  })
  .then(adminUser => {
    console.log('Assigned the admin user to the fabric client ::%s', adminUser.toString());
    return adminUser
  })
  .catch(err => {
    console.error('Failed to enroll admin: %s', err);
    return null;
  });
}


function addOrderer(fabricClient) {
  	var caRootsPath = fabricConfig.orderer.tls_cacerts;
  	let data = fs.readFileSync(path.join(__dirname, caRootsPath));
  	let caroots = Buffer.from(data).toString();
  	return fabricClient.newOrderer(fabricConfig.orderer.url, {
  		'pem': caroots,
  		'ssl-target-name-override': fabricConfig.orderer.hostname
  	});
}

function addPeersToChannel(fabricClient, channel) {
  fabricConfig.peers.forEach(function(peer) {
    let data = fs.readFileSync(path.join(__dirname, peer.tls_cacerts));
    console.log('Setting up peer ' + peer.hostname);
    var peer = fabricClient.newPeer(peer.uri,  {
        pem: Buffer.from(data).toString(),
        'ssl-target-name-override': peer.hostname
      }
    );
    peer.setName(peer.hostname);
    channel.addPeer(peer);
  });
}

var getRegisteredUsers = function(username, fabricClient, fabricCaClient, adminUser) {
	return fabricClient.getUserContext(username, true).then((user) => {
			if (user && user.isEnrolled()) {
				console.log('Successfully loaded member from persistence');
				return user;
			} else {
				fabricCaClient.register({
						enrollmentID: username,
						affiliation: 'org1'
					}, adminUser)
				.then((secret) => {
					enrollmentSecret = secret;
					console.log(username + ' registered successfully');
					return fabricCaClient.enroll({
						enrollmentID: username,
						enrollmentSecret: secret
					});
				}, (err) => {
					console.log(username + ' failed to register');
					return '' + err;
					//return 'Failed to register '+username+'. Error: ' + err.stack ? err.stack : err;
				}).then((message) => {
					if (message && typeof message === 'string' && message.includes(
							'Error:')) {
						console.log(username + ' enrollment failed because ' + message);
						return message;
					}
					console.log(username + ' enrolled successfully');

					var member = new User(username);
					member._enrollmentSecret = enrollmentSecret;
					return member.setEnrollment(message.key, message.certificate, fabricConfig.mspId);
				}).then(() => {
					fabricClient.setUserContext(member);
					return member;
				}, (err) => {
					console.log(util.format('%s enroll failed: %s', username, err.stack ? err.stack : err));
					return '' + err;
				});
			}
		}).catch(err => {
      console.error('Failed to get user "%s" because: %s',username, err);
      return null;
    });
};

export function index(req, res) {
  const query = {
    chaincodeId: 'spb:v1',
    fcn: 'queryAll',
    args: ['']
  };

  var fabricClient;
  var fabricCaClient;
  createFabricClient()
  .then((innerClient) => {
     fabricClient = innerClient;
     fabricCaClient = createFabricCaClient(innerClient);
     return getAdmin(fabricClient, fabricCaClient)
   })
   .then((adminUser) => {
      var channel = fabricClient.newChannel(fabricConfig.channel);
      addOrderer(fabricClient)
      addPeersToChannel(fabricClient, channel)

      return channel.queryByChaincode(query)
  })
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
  })
  .catch(err => {
    console.error('Failed to query chain: %s', err);
    return null;
  });
}
