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
    })
    .then(stateStore => {
      console.log('Store path: %s', JSON.stringify(storePath));
      var fabricClient = new FabricClient();
      fabricClient.setStateStore(stateStore);
      var cryptoSuite = FabricClient.newCryptoSuite();
      var cryptoStore = FabricClient.newCryptoKeyStore({
        path: storePath
      });
      cryptoSuite.setCryptoKeyStore(cryptoStore);
      fabricClient.setCryptoSuite(cryptoSuite);

      console.log('Created fabric client');
      return fabricClient;
    })
    .catch(err => {
      console.error('Failed to create fabric client: %s', err);
      throw new Error('Could not create fabric client ${err}');
    });
}

function createFabricCaClient(fabricClient) {
  console.log('Creating Fabric CA');
  return new FabricCaClient(fabricConfig.fabricCa.uri, null, fabricConfig.fabricCa.name, fabricClient.getCryptoSuite());
}

function getAdmin(fabricClient, fabricCaClient) {
  var member;
  return fabricClient.getUserContext(fabricConfig.fabricCa.admin.name, true)
    .then(userFromStore => {
      if (userFromStore && userFromStore.isEnrolled()) {
        console.log('Successfully loaded admin from persistence');
        return userFromStore;
      } else {
        return fabricCaClient.enroll({
          enrollmentID: fabricConfig.fabricCa.admin.name,
          enrollmentSecret: fabricConfig.fabricCa.admin.pwd
        })
          .then(enrollment => {
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
      return adminUser;
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
    pem: caroots,
    'ssl-target-name-override': fabricConfig.orderer.hostname
  });
}

function addPeersToChannel(fabricClient, channel) {
  fabricConfig.peers.forEach(function(peer) {
    let data = fs.readFileSync(path.join(__dirname, peer.tls_cacerts));
    console.log('Setting up peer %s', peer.hostname);
    var newPeer = fabricClient.newPeer(peer.uri, {
      pem: Buffer.from(data).toString(),
      'ssl-target-name-override': peer.hostname
    });
    newPeer.setName(peer.hostname);
    channel.addPeer(newPeer);
  });
}

function createChannel(fabricClient) {
  var channel = fabricClient.newChannel(fabricConfig.channel);
  addOrderer(fabricClient);
  addPeersToChannel(fabricClient, channel);
  return channel;
}

function getRegisteredUsers(username, fabricClient, fabricCaClient, adminUser) {
  var enrollmentSecret;
  return fabricClient.getUserContext(username, true).then(user => {
    if(user && user.isEnrolled()) {
      console.log('Successfully loaded member from persistence');
      return user;
    } else {
      fabricCaClient.register({
        enrollmentID: username,
        affiliation: 'org1'
      }, adminUser)
      .then(secret => {
        enrollmentSecret = secret;
        console.log('%s registered successfully', username);
        return fabricCaClient.enroll({
          enrollmentID: username,
          enrollmentSecret: secret
        });
      }, err => {
        console.log('%s failed to register', username);
        return err;
          //return 'Failed to register '+username+'. Error: ' + err.stack ? err.stack : err;
      })
      .then(message => {
        if(message && typeof message === 'string' && message.includes('Error:')) {
          console.log('%s enrollment failed because %s', username, message);
          return message;
        }
        console.log('%s enrolled successfully', username);
        var member = new User(username);
        member._enrollmentSecret = enrollmentSecret;
        return member.setEnrollment(message.key, message.certificate, fabricConfig.mspId);
      })
      .then(() => {
        fabricClient.setUserContext(member);
        return member;
      }, err => {
        console.log('%s enroll failed: %s', username, err.stack ? err.stack : err);
        return err;
      });
    }
  })
  .catch(err => {
    console.error('Failed to get user "%s" because: %s', username, err);
    return null;
  });
}

var fabricClientPromise = createFabricClient();

var fabricCaClientPromise = fabricClientPromise.then(fabricClient => createFabricCaClient(fabricClient), err => {
  console.error('Could not create Fabric CA client %s', err);
  throw err;
});

var adminUserPromise = Promise.all([fabricClientPromise, fabricCaClientPromise]).then(values => getAdmin(values[0], values[1]), err => {
  console.error('Could not init admin user %s', err);
  throw err;
});

var channelPromise = Promise.all([fabricClientPromise, adminUserPromise]).then(values => createChannel(values[0]), err => {
  console.error('Could create channel %s', err);
  throw err;
});

exports.fabricClient = fabricClientPromise;
exports.fabricCaClient = fabricCaClientPromise;
exports.adminUser = adminUserPromise;
exports.channel = channelPromise;
exports.getRegisteredUsers = getRegisteredUsers;
