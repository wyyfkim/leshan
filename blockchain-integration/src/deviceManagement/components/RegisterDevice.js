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
import {FormGroup, Label} from "reactstrap";


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
  title: 'Device Client Name and type',
},
  {
  title: 'Application',
},
  { title: 'Key pairs',
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
      type:'',
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
      this.setState(prevState => ({ current: prevState.current + 1 }));
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

    if (this.state.current === 2 && e.target.name === 'Key pairs') {
      this.setState({
        showIdentifierInfo: false,
        publicKey: '',
        privateKey: '',
        address: '',
        curve: ''
      });
    }

    if (this.state.current === 0 && e.target.name === 'Device Client Name and type') {
      this.setState({
        deviceClientName: ''
        // metadata: [{ value: '' }]
      });
    }

    if (this.state.current === 1 && e.target.name === 'Application') {
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
    this.setState({
      linkedApp: e.key,
      linkedAppName: e.item.props.children
    })
  }
  setType(e) {
    this.setState({
      type: e.key
    })
  }

  onChangeHandler=event=>{
    const handleFileRead = (e) => {
      let content = reader.result
      let key = JSON.parse(content)
      this.setState({
        publicKey: key.publicKey
      });

      console.log(key)
      console.log(key.publicKey)
      console.log(content)
    }
    console.log(event.target.files[0])
    let reader = new FileReader()
    reader.onloadend = handleFileRead
    console.log(reader)
    reader.readAsText(event.target.files[0])
    console.log(reader)
  }
  getContentForStep(step) {
    const { identifier, publicKey, privateKey, metadataHash, firmwareHash, metadata, firmware, deviceClientName, linkedAppName } = this.state;
    // Key pairs
    if (step === 2) {

      return (
          <div>
            <p>
              Upload your public key file or type in your public key
              {/*<strong>Unique device identifier</strong> is a public key or a fingerprint of RSA/ECC public key. It can also be an Ethereum address (recommended).*/}
            </p>

            <br /><br />
            <p> <strong> Public key: </strong> </p>
            <input type="file" name="file" onChange={this.onChangeHandler}/>
            <br /><br />
            <Input
                placeholder="Public key"
                style={{ maxWidth: '800px' }}
                value={publicKey}
                name="publicKey"
                maxLength="66"
                onChange={(e) => this.handleChange(e)}
            />

            <br /><br />
            {this.state.showIdentifierInfo ?
                <div>
                  <br />
                  <Alert message="You will be given private key and device configuration on the last step." type="info" showIcon />
                </div> : null}
          </div>
      );
    }
    // Device Client Name
    if (step === 0) {
      const types = ['location', 'temperature']
      const typeMenu = (
          <Menu onClick={(e) => this.setType(e)}>
            {types.map(type => <Menu.Item key={type}>{type}</Menu.Item>)}
          </Menu>
      );
      let showThreshold = () => {
        if (this.state.type.localeCompare('location') == 0) {
          return (
              <div>
                <br/>
                <p>Input the threshold data</p>
                <br/>
                <FormGroup>
                  <Label>Latitude</Label>
                  <Input value={this.state.Latitude} onChange={(e) => {this.setState({Latitude: e.target.value})}}></Input>
                </FormGroup>
                <FormGroup>
                  <Label>Longitude</Label>
                  <Input value={this.state.Longitude} onChange={(e) => {this.setState({Longitude: e.target.value})}}></Input>
                </FormGroup>
                <FormGroup>
                  <Label>Radius</Label>
                  <Input value={this.state.Radius} onChange={(e) => {this.setState({Radius: e.target.value})}}></Input>
                </FormGroup>
              </div>
          )
        }
        if (this.state.type.localeCompare('temperature') == 0) {
          return (
              <div>
                <br/>
                <p>Input the threshold data</p>
                <br/>
                <FormGroup>
                  <Label>Temperature (celsius) </Label>
                  <Input value={this.state.Temperature} onChange={(e) => {this.setState({Temperature: e.target.value})}}></Input>
                </FormGroup>
              </div>
          )
        }
      }
      return (
          <div>
            <p>
              Input the Device Client Name
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
            <p>
              Select the device type  <strong>{this.state.type}</strong>
            </p>
            <br/>
            <Dropdown overlay={typeMenu}>
              <Button type="primary" style = {{background: '#038935', border: '#038935'}}>
                {this.state.type.length > 0? this.state.type : "Device type"}
              </Button>
            </Dropdown>
            <br/>
            {showThreshold()}
          </div>
      );
    }
    //Application
    if (step === 1) {
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
              Select the application to which the device will be linked:   <strong>{this.state.linkedAppName}</strong>
              {/*<strong>Firmware hash</strong> is a hash of actual firmware hash. Actual firmware hash is not supposed to be stored.*/}
            </p>
            <br />
            <Dropdown overlay={appMenu}>
              <Button type="primary" style = {{background: '#038935', border: '#038935'}}>
                {this.state.linkedAppName.length > 0? this.state.linkedAppName : "Select applications"}
              </Button>
            </Dropdown>
          </div>
      );
    }

    // Overview/confirm
    if (step === 3) {
      var threshold;
      if (this.state.type.length > 0) {
        if (this.state.type.localeCompare('location') == 0) {
          threshold = "{latitude:" +this.state.Latitude+", longitude:"+this.state.Longitude+", radius:"+this.state.Radius+"}"
        } else if (this.state.type.localeCompare('temperature') == 0) {
          threshold = "temperature:" +this.state.Temperature
        } else {
          threshold = "empty"
        }
      }

      return (
          <div>
            <Card title={<div>Device client name: {deviceClientName.length > 0 ? deviceClientName : 'empty'}, device type: {this.state.type.length > 0 ? this.state.type : 'empty'}, threshold: {threshold} <a><Icon type="edit" onClick={() => this.gotoStep(0)} /></a></div>} bordered={false}>
              <Meta
                  title={<div>Linked application {linkedAppName.length > 0 ? linkedAppName : 'empty'} <a><Icon type="edit" onClick={() => this.gotoStep(1)} /></a></div>}
                  description={<div>Publick key  {publicKey} <a><Icon type="edit" onClick={() => this.gotoStep(2)} /></a></div>}
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
              You device is registered successfully
              {/*Click below to download device configuration.*/}
            </p>
            {/*<br />*/}
            {/*<Button type="primary" style = {{background: '#038935', border: '#038935'}} onClick={() => this.downloadConfiguration()}>Download</Button>*/}
          </div>
      );
    }
  }

  async createDevice() {
    const { identifier, publicKey, privateKey, metadataHash, firmwareHash, address, deviceClientName, linkedApp, linkedAppName, type, Latitude, Longitude, Radius,Temperature } = this.state;
    let thresholdStr = ''
    if (this.state.type.localeCompare('location') == 0) {
      thresholdStr = Latitude + "," + Longitude + "," + Radius
    } else if (this.state.type.localeCompare('temperature') == 0) {
      thresholdStr = Temperature
    }
    console.log(thresholdStr)

    try {
      let instance = await DeviceManager;

      let identifierToSave = publicKey;
      if (address !== '') {
        let addressToPad = address;
        if (address.startsWith('0x')) {
          addressToPad = addressToPad.substring(2);
        }
        identifierToSave = setLengthLeft(Buffer.from(addressToPad, 'hex'), 32).toString('hex');
      }

      let existingDeviceString = await instance.getDevicesByAppId(linkedApp, { from: getDefaultAccount()});
      let newDeviceString = existingDeviceString == ''?deviceClientName : existingDeviceString +", " +deviceClientName
      let result = await instance.createDevice(addHexPrefix(identifierToSave), publicKey, linkedApp, linkedAppName, deviceClientName, newDeviceString,type, thresholdStr,{ from: getDefaultAccount(), gas:1000000 });
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
            </div>
          </Spin>
        </div>
    );
  }
}

export default RegisterDevice;
