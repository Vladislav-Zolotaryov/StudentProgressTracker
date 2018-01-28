const fabricHelper = require('./fabric_helper');
const TransactionID = require('fabric-client/lib/TransactionID.js');

export function index(req, res) {

  Promise.all([fabricHelper.channel, fabricHelper.adminUser])
    .then(values => {
      const transactionProposal = {
        chaincodeId: 'spt',
        txId: new TransactionID(values[1], false),
        fcn: 'save',
        args: ['key', 'id', 'value']
      };
      values[0].sendTransactionProposal(transactionProposal, 60000)
    })
    .then(results => {
      var proposalResponses = results[0];
      var proposal = results[1];
      for (var i in proposalResponses) {
        if (proposalResponses &&
          proposalResponses[i].response &&
          proposalResponses[i].response.status === 200) {
          console.log('Transaction proposal was good');
        } else {
          console.log('Transaction proposal was bad');
          throw proposalResponses[i];
        }
      }
      return [proposal, proposalResponses];
    })
      .then((proposal, proposalResponses) => {
        var request = {
          proposalResponses,
          proposal
        };
        return fabricHelper.channel.sendTransaction(request);
      }, err => {
        console.error('Failed the transaction proposal %s', err);
      })
      .then(results => {
        console.log('Result of transaction %s', results[0]);
        return results[0];
      })
      .catch(err => {
        console.error('Could not process transaction %s', err);
      });

  const query = {
    chaincodeId: 'spt',
    fcn: 'findAll',
    args: ['key']
  };

  fabricHelper.channel
    .then(channel => channel.queryByChaincode(query))
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
