const express = require('express');
const app = express();
const Web3 = require('web3');
const { hashPersonalMessage, addHexPrefix, sha3, setLengthLeft } = require('ethereumjs-util');

const hashMessageHex = message => addHexPrefix(hashPersonalMessage(Buffer.from(message)).toString('hex'));

app.use(express.json());

const DeviceManagerArtifact = require('../deviceManagement/build/contracts/DeviceManager.json');
const ProductArtifact = require('../build/contracts/PassageMain.json');

let latestNetwork = DeviceManagerArtifact.networks[Object.keys(DeviceManagerArtifact.networks).reduce((res, curr) => curr > res ? curr : res)];
let productNetwork = ProductArtifact.networks[Object.keys(DeviceManagerArtifact.networks).reduce((res, curr) => curr > res ? curr : res)];

// Connect to local node
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
web3.eth.defaultAccount = web3.eth.accounts[0];

// Instance using ABI and contract address
const deviceManager = web3.eth.contract(DeviceManagerArtifact.abi).at(latestNetwork.address);
const allProduct = web3.eth.contract(ProductArtifact.abi).at(productNetwork.address);
// console.log(allProduct)

// Receive payload and validate on blockchain
app.post('/receive', function (req, res) {
console.log(req.body)
  // Validate message
  const { deviceId, message, signature, deviceIdentifier, metadataHash } = req.body;

  // const productID = "0x107db54d4b78910e4d63258182aba412d24dae6565cd1198c136c61330a41317"
  const productID = deviceManager.getLinkedProductId(deviceId);

  // console.log(productID)

  let validMessage = deviceManager.isValidEthMessage(deviceId, hashMessageHex(message), signature);
  // console.log('valid message: ' + validMessage);

  // Validate metadata
  const { metadata, proof } = req.body;
  let metadataHashed = addHexPrefix(sha3(metadata).toString('hex'));
  // console.log('metadataHash: ' + metadataHash);
  let validMetadata = deviceManager.isValidMetadataMember(deviceId, proof, metadataHashed);
  // console.log('valid metadata: ' + validMetadata);

  // Validate firmware
  const { firmware } = req.body;
  // let firmwareHash = addHexPrefix(sha3(firmware).toString('hex'));
  var firmwareHash = addHexPrefix(sha3(firmware).toString('hex'));
  // console.log(firmware)
  // console.log(firmwareHash)
  // console.log(typeof firmwareHash.valueOf())
  // console.log(deviceManager.printFirmwareHashCurrent(deviceId, firmwareHash));
  // console.log(deviceManager.printFirmwareHash(deviceId, firmwareHash.valueOf()));
  let validFirmware = deviceManager.isValidFirmwareHash(deviceId, firmwareHash);
  // console.log('valid firmware: ' + validFirmware);

  //try to retrieve device first
  let device = deviceManager.devices(deviceId);
  // console.log(device)
  // console.log(deviceIdentifier)
  let identifierToCheck = setLengthLeft(Buffer.from(deviceIdentifier.substring(2), 'hex'), 32).toString('hex')
  // console.log(identifierToCheck)
  // console.log(device[1])
  // console.log(identifierToCheck)
  // console.log( addHexPrefix(deviceIdentifier))
  let chekcIdentifier = Boolean(device[1] == addHexPrefix(identifierToCheck))
  let checkMetadata = Boolean(device[2] == addHexPrefix(metadataHash))
  let checkFirmware = Boolean(device[3] == firmwareHash)
  // Respond back with status

  // console.log(String(productID).valueOf())
  // console.log(typeof(String(productID).valueOf()))
  if(chekcIdentifier && checkMetadata && checkFirmware) {
    allProduct.addProductAlert(String(productID).valueOf(), message, {gas:1000000})
    res.send("Authenticated, message sent: "+message)
  } else {
    res.send({
      chekcIdentifier,
      checkMetadata,
      checkFirmware
    });
  }


})

app.listen(1337, () => console.log('Platform simulation listening on port 1337'));
