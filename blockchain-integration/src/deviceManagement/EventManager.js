import getWeb3 from './utils/web3';
import TruffleContract from 'truffle-contract';
import EventArtifact from './artifacts/EventManager.json';

let web3;
console.log("here")
let EventManager = new Promise(function (resolve, reject) {
    getWeb3.then(results => {
        console.log("test!!!!!!!")
        web3 = results.web3;
        const eventManager = TruffleContract(EventArtifact);
        eventManager.setProvider(web3.currentProvider);
        console.log("test")
        console.log(eventManager)
        return eventManager.deployed().then(instance => {
            console.log('Initiating EventManager instance...');
            resolve(instance);
        }).catch(error => {
            reject(error);
        });


    }).catch(error => {
        reject(error);
    });
});
export default EventManager;
