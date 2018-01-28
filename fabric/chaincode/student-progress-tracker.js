const shim = require('fabric-shim');
const util = require('util');

const Chaincode = class {

  async Init(stub) {
    this.functionsMapper = {
      save: this.save,
      findAll: this.findAll,
      findById: this.findById,
      getVersion: this.getVersion
    };
    this.version = '1.0';
    return shim.success(Buffer.from('Initialized Successfully!'));
  }

  async Invoke(stub) {
    console.info('Transaction ID: %s', stub.getTxID());
    console.info(util.format('Args: %j', stub.getArgs()));

    let ret = stub.getFunctionAndParameters();
    console.info('Calling function: %s', ret.fcn);

    let functor = this.functionsMapper[ret.fcn];
    if (functor == null) {
      return shim.error(Buffer.from('There is no function called %s', ret.fcn));
    }

    return functor(this, stub, stub.getArgs().slice(1)).then(result => {
      console.info('Returning result %s', JSON.stringify(result));
      return shim.success(result.data);
    })
    .catch(err => shim.error(Buffer.from(err)));
  }

  async save(that, stub, args) {
    if (args.length != 3) {
      return shim.error('Incorrect arguments: Expecting a key, id and value');
    }
    return stub.putState(args[0] + '_' + args[1], args[3]);
  }

  async findAll(that, stub, args) {
    if (args.length != 1) {
      return shim.error('Incorrect arguments: Expecting a key');
    }
    return stub.getState(args[0]);
  }

  async findById(that, stub, args) {
    if (args.length != 2) {
      return shim.error('Incorrect arguments: Expecting a key and id');
    }
    return stub.getState(args[0] + '_' + args[1]);
  }

  async getVersion(that, stub, args) {
    return Buffer.from(that.version);
  }

};

shim.start(new Chaincode());
