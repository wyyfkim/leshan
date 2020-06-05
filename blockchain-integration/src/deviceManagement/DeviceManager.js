import getWeb3 from './utils/web3';
import TruffleContract from 'truffle-contract';
import DeviceManagerArtifact from './artifacts/DeviceManager.json';
import ApplicationArtifact from './artifacts/Application.json';


let web3;
let DeviceManager = new Promise(function (resolve, reject) {
  getWeb3.then(results => {
    web3 = results.web3;

    const deviceManager = TruffleContract(DeviceManagerArtifact);
    deviceManager.setProvider(web3.currentProvider);
    return deviceManager.deployed().then(instance => {
      console.log('Initiating DeviceManager instance...');
      resolve(instance);
    }).catch(error => {
      reject(error);
    });


  }).catch(error => {
    reject(error);
  });
});
let ApplicationManager = new Promise(function (resolve, reject) {
  getWeb3.then(results => {
    web3 = results.web3;

    const applicationManager = TruffleContract(ApplicationArtifact);
    applicationManager.setProvider(web3.currentProvider);
    return applicationManager.deployed().then(instance => {
      console.log('Initiating ApplicationManager instance...');
      resolve(instance);
    }).catch(error => {
      reject(error);
    });


  }).catch(error => {
    reject(error);
  });
});

export function getDefaultAccount() {
  return web3.eth.accounts[0];
}
export {ApplicationManager}
export default DeviceManager;
