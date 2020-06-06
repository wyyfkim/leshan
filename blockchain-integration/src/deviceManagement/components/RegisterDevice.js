import getWeb3 from '../utils/web3';
import DeviceManager, {getDefaultAccount } from '../DeviceManager';
import ApplicationArtifact from '../artifacts/Application.json';

import elliptic from 'elliptic';
import ethWallet from 'ethereumjs-wallet';
import { sha3, addHexPrefix, setLengthLeft } from 'ethereumjs-util';
import { merkleRoot } from 'merkle-tree-solidity';

import React, { Component } from 'react';
import './RegisterDevice.css';

import { Steps, Button, Input, Card, Spin, Alert, Divider, Form, Icon, Dropdown, Menu, message, notification } from 'antd';
import {faHeading} from "@fortawesome/fontawesome-free-solid";
import TruffleContract from "truffle-contract";


const Step = Steps.Step;
const { Meta } = Card;
const EC = elliptic.ec;
const FormItem = Form.Item;

let web3

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


const steps = [{
  title: 'Key pairs',
}, {
  title: 'Device Client Name',
},
  {
  title: 'Application',
},
  {
  title: 'Confirm',
}];

const openNotificationWithIcon = (type, message, description) => {
  notification[type]({
    message,
    description
  });
};

class RegisterDevice extends Component {
  constructor(props) {
    super(props);
    this.state = this.getInitialState();
  }

  getInitialState() {
    return {
      loading: false,
      current: 0,
      identifier: '',
      metadataHash: '',
      firmwareHash: '',
      showIdentifierInfo: false,
      publicKey: '',
      privateKey: '',
      address: '',
      deviceClientName: '',
      metadata: [{ value: '' }],
      firmware: '',
      curve: '',
      deviceId: '',
      applications: [],
      linkedApp:'',
      linkedAppName:'',
      // options:["App1", "App2"],
      options: [{name: 'Srigar', id: 1},{name: 'Sam', id: 2}]
    };
  }

  reset() {
    this.setState(this.getInitialState());
  }
  async componentDidMount() {
    let applicationManager = await ApplicationManager;
    applicationManager.getOwnerProducts({ from: getDefaultAccount()})
      .then((result) => {
        result.map((productId) => {
          applicationManager.getProductById(String(productId).valueOf(), "latest")
            .then((result) => {
              let dataKey = productId
              let dataValue = result[0]
              this.setState({
                applications: [...this.state.applications, {"name": dataKey, "id": dataValue}]
              })
              console.log(this.state.applications)
            }).catch((error) => {console.log(error);})
          return false;
        })
      });
  }
  async componentWillMount() {
    try {
      let results = await getWeb3;

      this.setState({
        web3: results.web3,
      });
    } catch (error) {
      console.log(error);
      message.error(error.message);
    }
  }
  async watchForChanges(txHash) {
    let instance = await DeviceManager;
    let deviceCreatedEvent = instance.DeviceCreated()

    deviceCreatedEvent.watch((error, result) => {
      if (!error) {
        if (result.transactionHash === txHash) {
          openNotificationWithIcon('success', 'Transaction mined', 'Your device has been registered.');
          this.state.deviceCreatedEvent.stopWatching();
          this.setState({
            loading: false,
            deviceId: result.args.deviceId.toNumber()
          })
          this.next();
        }
      } else {
        console.error(error);
      }
    });

    this.setState({
      deviceCreatedEvent
    })
  }
  next() {
    const { current, identifier/*, metadataHash, firmwareHash*/ } = this.state;

    if ((current === 0) && (identifier === null || identifier === '')) {
      message.error('Invalid identifier: can\'t be empty');
      //} else if ((current === 1) && (metadataHash === null || metadataHash === '')) {
      //  message.error('Invalid metadata hash.');
      //} else if ((current === 2) && (firmwareHash === null || firmwareHash === '')) {
      //  message.error('Invalid firmware hash.');
    } else {
      this.setState(prevState => ({ current: prevState.current + 1 }));
    }
  }
  prev() {
    const current = this.state.current - 1;
    this.setState({ current });
  }
  gotoStep(i) {
    this.setState({ current: i });
  }
  handleChange(e) {
    this.setState({
      [e.target.name]: e.target.value,
    });

    if (this.state.current === 0) {
      this.setState({
        showIdentifierInfo: false
      });
    }

    if (this.state.current === 0 && e.target.name === 'Key pairs') {
      this.setState({
        showIdentifierInfo: false,
        publicKey: '',
        privateKey: '',
        address: '',
        curve: ''
      });
    }

    if (this.state.current === 1 && e.target.name === 'Device Client Name') {
      this.setState({
        deviceClientName: ''
        // metadata: [{ value: '' }]
      });
    }

    if (this.state.current === 2 && e.target.name === 'Application') {
      this.setState({
        firmware: ''
      });
    }
  }
  generateEthWallet() {
    console.log(`Generating new Ethereum wallet`);
    const newWallet = ethWallet.generate();

    let publicKey = newWallet.getPublicKey().toString('hex');
    let privateKey = newWallet.getPrivateKey().toString('hex');
    let address = newWallet.getAddressString();

    console.log(`Private key: ${privateKey}`);
    console.log(`Public key: ${publicKey}`);
    console.log(`Address: ${address}`);

    this.setState({
      identifier: address,
      showIdentifierInfo: true,
      address,
      publicKey,
      privateKey,
      curve: 'secp256k1'
    })
  }
  // generateEcKeyPair(curve) {
  //   let ec = new EC(curve);
  //   console.log(`Generating new ${curve} key pair`);
  //   let keyPair = ec.genKeyPair();
  //
  //   let publicKey = keyPair.getPublic(true, 'hex');
  //   let privateKey = keyPair.getPrivate('hex');
  //
  //   console.log(`Private key: ${privateKey}`);
  //   console.log(`Public key compressed: ${publicKey}`);
  //   console.log(`Public key uncompressed: ${keyPair.getPublic().encode('hex')}`);
  //
  //   this.setState({
  //     identifier: publicKey,
  //     showIdentifierInfo: true,
  //     address: '',
  //     publicKey,
  //     privateKey,
  //     curve
  //   })
  // }
  // calculateMetadataHash() {
  //   let elements = this.state.metadata.map(el => sha3(el.value));
  //   console.log(`Generating Merkle root hash`);
  //
  //   let metadataRootSha3 = merkleRoot(elements);
  //   console.log(`Merkle root hash ${metadataRootSha3.toString('hex')}`);
  //
  //   this.setState({
  //     metadataHash: metadataRootSha3.toString('hex')
  //   })
  // }
  calculateFirmwareHash() {
    let firmwareHash = sha3(this.state.firmware);

    this.setState({
      firmwareHash: firmwareHash.toString('hex')
    })
  }
  // removeMetadataField(k) {
  //   const { metadata } = this.state;
  //   metadata.splice(k, 1);
  //   this.setState({
  //     metadata
  //   })
  // }
  //
  // addMetadataField() {
  //   const { metadata } = this.state;
  //   metadata.push({ value: '' });
  //   this.setState({
  //     metadata
  //   });
  // }
  //
  // handleMetadataChange(e, index) {
  //   const { metadata } = this.state;
  //   metadata[index].value = e.target.value;
  //
  //   this.setState({
  //     metadata
  //   });
  // }
  downloadConfiguration() {
    const {identifier, deviceClientName, publicKey, privateKey, linkedAppId, linkedAppName, curve } = this.state;

    const configuration = {}

    if (identifier !== '') {
      configuration.deviceID = identifier;
    }
    if (deviceClientName.length > 0 && deviceClientName !== '') {
      configuration.deviceClientName = deviceClientName;
    }

    if (linkedAppName !== '') {
      configuration.linkedAppName = linkedAppName;
    }

    if (linkedAppId !== '') {
      configuration.linkedAppId = linkedAppId;
    }

    if (publicKey !== '') {
      configuration.publicKey = publicKey;
    }

    if (privateKey !== '') {
      configuration.privateKey = privateKey;
    }

    if (curve !== '') {
      configuration.curve = curve;
    }



    let configurationJson = JSON.stringify(configuration);

    let element = document.createElement("a");
    let file = new Blob([configurationJson], { type: 'text/json' });
    element.href = URL.createObjectURL(file);
    element.download = `device_${deviceClientName}.json`;
    element.click();
  }
  linkApp(e) {
    console.log(e)
    this.setState({
      linkedApp: e.key,
      linkedAppName: e.item.props.children
    })
  }
  getContentForStep(step) {
    const { identifier, publicKey, privateKey, metadataHash, firmwareHash, metadata, firmware, deviceClientName, linkedAppName } = this.state;
    // Key pairs
    if (step === 0) {

      return (
          <div>
            <p>
              Click to generate public key / private key pair
              {/*<strong>Unique device identifier</strong> is a public key or a fingerprint of RSA/ECC public key. It can also be an Ethereum address (recommended).*/}
            </p>

            <br /><br />
            <p> <strong> Public key: </strong> </p>

            <Input
                placeholder="Public key"
                style={{ maxWidth: '800px' }}
                value={publicKey}
                name="publicKey"
                maxLength="66"
                onChange={(e) => this.handleChange(e)}
            />
                        {/*<Input*/}
            {/*    placeholder="Private key"*/}
            {/*    style={{ maxWidth: '800px' }}*/}
            {/*    value={privateKey}*/}
            {/*    name="privateKey"*/}
            {/*    maxLength="66"*/}
            {/*    onChange={(e) => this.handleChange(e)}*/}
            {/*/>*/}
            {/*<Input*/}
            {/*    placeholder="Identifier e.g. Ethereum address"*/}
            {/*    style={{ maxWidth: '800px' }}*/}
            {/*    value={identifier}*/}
            {/*    name="identifier"*/}
            {/*    maxLength="66"*/}
            {/*    onChange={(e) => this.handleChange(e)}*/}
            {/*/>*/}
            <br /><br />
            <Button.Group size="large">
              <Button type="primary" style = {{background: '#038935', border: '#038935'}} onClick={() => this.generateEthWallet()}>Generate key pairs</Button>
              {/*<Dropdown overlay={ecMenu}>*/}
              {/*  <Button type="primary">*/}
              {/*    Generate elliptic curve key pair*/}
              {/*  </Button>*/}
              {/*</Dropdown>*/}
            </Button.Group>
            {this.state.showIdentifierInfo ?
                <div>
                  <br />
                  <Alert message="You will be given private key and device configuration on the last step." type="info" showIcon />
                </div> : null}
          </div>
      );
    }
    // Device Client Name
    if (step === 1) {
      return (
          <div>
            <p>
              Input the Device Client Name
              {/*<strong>Metadash hash</strong> is Merkle root hash of device information or just a hash of any data.*/}
            </p>
            <Input
                placeholder="Device Client Name"
                style={{ maxWidth: '800px' }}
                value={deviceClientName}
                name="deviceClientName"
                maxLength="66"
                onChange={(e) => this.handleChange(e)}
            />
            <Divider />
            {/*<p>*/}
            {/*  If you already don't have one, you can use inputs below to generate SHA-3 (Keccak) hash. With multiple fields, Merkle tree will be used.*/}
            {/*</p>*/}
            {/*<br />*/}
            {/*<Form>*/}
            {/*  {metadata.map((key, index) => {*/}
            {/*    return (*/}
            {/*        <FormItem>*/}
            {/*          <Input*/}
            {/*              placeholder="Some information"*/}
            {/*              style={{ width: '60%' }}*/}
            {/*              value={key.value}*/}
            {/*              maxLength="66"*/}
            {/*              onChange={(e) => this.handleMetadataChange(e, index)}*/}
            {/*          />*/}
            {/*          {metadata.length > 1 ? (*/}
            {/*              <Icon*/}
            {/*                  className="dynamic-delete-button"*/}
            {/*                  type="minus-circle-o"*/}
            {/*                  disabled={metadata.length === 1}*/}
            {/*                  onClick={() => this.removeMetadataField(index)}*/}
            {/*              />*/}
            {/*          ) : null}*/}
            {/*        </FormItem>*/}
            {/*    )*/}
            {/*  })*/}
            {/*  }*/}
            {/*  <FormItem>*/}
            {/*    <Button type="dashed" onClick={() => this.addMetadataField()} style={{ width: '60%' }}>*/}
            {/*      <Icon type="plus" /> Add field*/}
            {/*    </Button>*/}
            {/*  </FormItem>*/}
            {/*  <FormItem>*/}
            {/*    <Button type="primary" onClick={() => this.calculateMetadataHash()}>Generate</Button>*/}
            {/*  </FormItem>*/}
            {/*</Form>*/}
          </div>
      );
    }
    //Application
    if (step === 2) {
      const curves = this.state.applications
      const appMenu = (
          <Menu onClick={(e) => this.linkApp(e)}>
            {/*{curves.map(curve => <Menu.Item key={curve.name}>{curve.name}</Menu.Item>)}*/}
            {curves.map(curve => <Menu.Item key={curve.name}>{curve.id}</Menu.Item>)}
          </Menu>
      );
      return (
          <div>
            <p>
              Select the application to which the device will be linked
              {/*<strong>Firmware hash</strong> is a hash of actual firmware hash. Actual firmware hash is not supposed to be stored.*/}
            </p>
            <Input
                placeholder="linkedApp"
                style={{ maxWidth: '800px' }}
                value={this.state.linkedAppName}
                name="linkedApp"
                maxLength="66"
                onChange={(e) => this.handleChange(e)}
            />
            <br />
            <Dropdown overlay={appMenu}>
              <Button type="primary" style = {{background: '#038935', border: '#038935'}}>
                Created applications
              </Button>
            </Dropdown>

            {/*<Divider />*/}
            {/*<p>*/}
            {/*  You can use input to generate SHA-3 (Keccak) hash of any data.*/}
            {/*</p>*/}
            {/*<br />*/}
            {/*<Input*/}
            {/*    placeholder="Some data"*/}
            {/*    style={{ width: '60%' }}*/}
            {/*    value={firmware}*/}
            {/*    name="firmware"*/}
            {/*    onChange={(e) => this.handleChange(e)}*/}
            {/*/>*/}
            {/*<br />*/}
            {/*<br />*/}
            {/*<Button type="primary" onClick={() => this.calculateFirmwareHash()}>Generate</Button>*/}
          </div>
      );
    }

    // Overview/confirm
    if (step === 3) {
      return (
          <div>
            <Card title={<div>Device Client Name {deviceClientName.length > 0 ? deviceClientName : 'empty'} <a><Icon type="edit" onClick={() => this.gotoStep(1)} /></a></div>} bordered={false}>
              <Meta
                  title={<div>Publick key  {publicKey} <a><Icon type="edit" onClick={() => this.gotoStep(0)} /></a></div>}
                  // title={<div>Metadata hash {metadataHash.length > 0 ? metadataHash : 'empty'} <a><Icon type="edit" onClick={() => this.gotoStep(1)} /></a></div>}
                  description={<div>Linked application {linkedAppName.length > 0 ? linkedAppName : 'empty'} <a><Icon type="edit" onClick={() => this.gotoStep(2)} /></a></div>}
              />
            </Card>
          </div >
      );
    }

    // Configuration
    if (step === 4) {
      return (
          <div style={{ textAlign: 'center' }}>
            <Icon type="check-circle-o" style={{ fontSize: 46 }} />
            <br /><br />
            <p>
              Click below to download device configuration.
            </p>
            <br />
            <Button type="primary" style = {{background: '#038935', border: '#038935'}} onClick={() => this.downloadConfiguration()}>Download</Button>
          </div>
      );
    }
  }

  async createDevice() {
    const { identifier, publicKey, privateKey, metadataHash, firmwareHash, address, deviceClientName, linkedApp, linkedAppName } = this.state;
    //invoke serverlet
    // var security = {endpoint: "testendpoint111", psk : { identity : "pskIdentity111" , key : "aabbccdd"}};
    var security = {endpoint: "sensor1", psk : { identity : "username" , key : "aabbccdd"}};
    // const response1 = await fetch('/api/security/clients/', {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'text/plain' },
    //   body: JSON.stringify(security),
    // })
    // console.log(response1)
    //blockchain
    try {
      let instance = await DeviceManager;

      let identifierToSave = identifier;
      if (address !== '') {
        let addressToPad = address;
        if (address.startsWith('0x')) {
          addressToPad = addressToPad.substring(2);
        }
        identifierToSave = setLengthLeft(Buffer.from(addressToPad, 'hex'), 32).toString('hex');
      }

      //    function createDevice(bytes32 _identifier, string memory _publicKey, bytes32 _applicationId, string memory _endpointClientName) public returns (uint) {

      // let result = await instance.createDevice(addHexPrefix(identifierToSave), addHexPrefix(metadataHash), addHexPrefix(firmwareHash), "test", { from: getDefaultAccount(), gas:1000000 });
      let existingDeviceString = await instance.getDevicesByAppId(linkedApp, { from: getDefaultAccount()});
      let newDeviceString = existingDeviceString == ''?deviceClientName : existingDeviceString +", " +deviceClientName
      console.log(existingDeviceString)
      console.log(newDeviceString)
      // let result = await instance.createDevice(addHexPrefix(identifierToSave), publicKey, linkedApp, newDeviceString, deviceClientName, { from: getDefaultAccount(), gas:1000000 });
      let result = await instance.createDevice(addHexPrefix(identifierToSave), publicKey, linkedApp, linkedAppName, deviceClientName, newDeviceString, { from: getDefaultAccount(), gas:1000000 });
      this.watchForChanges(result.tx);
      openNotificationWithIcon('info', 'Transaction sent', 'Once mined, your device will be registered.');
      this.setState({
        loading: true
      });
    } catch (error) {
      console.log(error);
      message.error(error.message);
    }
  }
  render() {
    const { current } = this.state;
    return (
        <div>
          <Spin spinning={this.state.loading} className="loading-spin">
            <Steps current={current}>
              {steps.map(item => <Step key={item.title} title={item.title} />)}
            </Steps>
            <div className="steps-content">{this.getContentForStep(current)}</div>
            <div className="steps-action">
              {
                current < steps.length - 1
                && <Button type="primary" style = {{background: '#038935', border: '#038935'}} onClick={() => this.next()}>Next</Button>
              }
              {
                current === steps.length - 1
                && <Button type="primary" style = {{background: '#038935', border: '#038935'}} onClick={() => this.createDevice()}>Register</Button>
              }
              {
                current > 0 && current !== 4
                && (
                    <Button style={{ marginLeft: 8 }} onClick={() => this.prev()}>
                      Previous
                    </Button>
                )
              }
              {/*{*/}
              {/*  current === 4*/}
              {/*  && (*/}
              {/*      <Button type="primary" onClick={() => this.reset()}>*/}
              {/*        Reset*/}
              {/*      </Button>*/}
              {/*  )*/}
              {/*}*/}
            </div>
          </Spin>
        </div>
    );
  }
}

export default RegisterDevice;
