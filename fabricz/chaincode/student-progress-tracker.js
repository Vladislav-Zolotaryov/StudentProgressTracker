const shim = require('fabric-shim');

const Chaincode = class {
  async Init(stub) {
    // use the instantiate input arguments to decide initial chaincode state values

    // save the initial states
    await stub.putState('test', Buffer.from('TEST'));

    return shim.success(Buffer.from('Initialized Successfully!'));
  }

  async Invoke(stub) {
    let value = await stub.getState('test');

    return shim.success(Buffer.from(value.toString()));
  }
};

shim.start(new Chaincode());
