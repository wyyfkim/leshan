import getWeb3 from '../utils/web3';
import DeviceManager, { getDefaultAccount } from '../DeviceManager';
import ApplicationArtifact from '../artifacts/Application.json';
import { addHexPrefix } from 'ethereumjs-util';

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {Tag, Button, Input, Card, Timeline, Divider, Spin, Alert, Icon, notification, message, List} from 'antd';
import TruffleContract from "truffle-contract";

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

const openNotificationWithIcon = (type, message, description) => {
  notification[type]({
    message,
    description
  });
};

const eventsToSave = ['DeviceCreated', 'DevicePropertyUpdated', 'DeviceTransfered', 'DeviceSigned', 'SignatureRevoked'];

class ManageDevice extends Component {
  constructor(props) {
    super(props);

    this.state = {
      deviceId: this.props.match.params.deviceId,
      loading: true,
      showError: false,
      showEditIdentifier: false,
      showEditPublicKey: false,
      showEditApplicationId: false,
      showEditProductID: false,
      showEditOwner: false,
    }

    this.commonChange = this.commonChange.bind(this);
    this.watchForChanges = this.watchForChanges.bind(this);
    this.updateDeviceData = this.updateDeviceData.bind(this);
  }

  componentWillReceiveProps({ match }) {
    this.setState({ 
      ...this.state,
      showError: false,
      deviceId: match.params.deviceId
    }, () => this.updateDeviceData());
  }

  async componentWillMount() {
    try {
      let web3 = (await getWeb3).web3;
      let instance = await DeviceManager;
      let device = await instance.devices(this.state.deviceId);

      // console.log("printing device...")
      // console.log(device)
      // console.log("printing device2...")
      console.log(device)

      this.setState({
        web3,
        instance,
        deactivated: device[6]
      });

      this.updateDeviceData();
    } catch (error) {
      console.log(error);
      //message.error(error.message);
      this.setState({
        loading: false,
        showError: true
      })
    }
  }

  async updateDeviceData() {
    try {
      const { instance, deviceId } = this.state;
      let device = await instance.devices(deviceId);
      let signatureCount = await instance.deviceSignatureCount(deviceId);
      let allEvents = instance.allEvents({ fromBlock: 0, toBlock: 'latest' });
      allEvents.get((error, logs) => {
        let filteredData = logs.filter(el => eventsToSave.includes(el.event) && el.args.deviceId.toNumber() === parseInt(deviceId, 10));
        if (!error) {
            this.setState({
              data: filteredData,
              loading: false,
              owner: device[0],
              identifier: device[1],
              publicKey: device[2],
              applicationId: device[3],
              applicationName: device[4],
              // productID: device[4],
              signatureCount: signatureCount.toNumber(),
              endpointClientName: device[5],
              deactivated: device[6]
            })

        }

        let { identifier, publicKey, applicationId, applicationName, endpointClientName, owner, productID } = this.state;
        this.setState({
          identifierNew: identifier,
          publicKeyNew: publicKey,
          applicationIdNew: applicationId,
          productIDNew: productID,
          ownerNew: owner
        })
      });
    } catch (error) {
      console.log(error);
      this.setState({
        loading: false,
        showError: true
      })
    }
  }

  toggleEdit(property) {
    const { showEditApplicationId, showEditIdentifier, showEditPublicKey, showEditOwner, showEditProductID } = this.state;

    switch (property) {
      case 'identifier':
        this.setState({
          showEditIdentifier: !showEditIdentifier
        })
        break;
      case 'publicKey':
        this.setState({
          showEditPublicKey: !showEditPublicKey
        })
        break;
      case 'applicationId':
        this.setState({
          showEditApplicationId: !showEditApplicationId
        })
        break;
      case 'transfer':
        this.setState({
          showEditOwner: !showEditOwner
        })
        break;
      case 'product':
        this.setState({
          showEditProductID: !showEditProductID
        })
        break;
      default:
    }
  }

  watchForChanges(property) {
    let filter = this.state.web3.eth.filter('latest', (error, result) => {
      if (!error) {
        openNotificationWithIcon('success', 'Transaction mined', `Property ${property} has been updated.`);
        this.state.filter.stopWatching();
        this.updateDeviceData();
      } else {
        console.error(error);
      }
    });

    this.setState({
      filter
    })
  }

  async saveData(property) {
    const { instance, deviceId, identifier, identifierNew, publicKey, publicKeyNew, applicationId, applicationIdNew, owner, ownerNew, productID, productIDNew } = this.state;

    try {
      switch (property) {
        case 'identifier':
          if (identifier !== identifierNew) {

            await instance.updateIdentifier(deviceId, addHexPrefix(identifierNew), { from: getDefaultAccount() });
            this.watchForChanges(property);
            openNotificationWithIcon('info', 'Transaction sent', 'Once mined, identifier for this device will be updated.');
            this.setState({
              loading: true,
            });
          }
          break;
        case 'publicKey':
          if (publicKey !== publicKeyNew) {
            await instance.updateMetadataHash(deviceId, addHexPrefix(publicKeyNew), { from: getDefaultAccount() });
            this.watchForChanges(property + ' hash');
            openNotificationWithIcon('info', 'Transaction sent', 'Once mined, publicKey for this device will be updated.');
            this.setState({
              loading: true,
            });
          }
          break;
        case 'applicationId':
          if (applicationId !== applicationIdNew) {
            await instance.updateFirmwareHash(deviceId, addHexPrefix(applicationIdNew), { from: getDefaultAccount() });
            this.watchForChanges(property + ' hash');
            openNotificationWithIcon('info', 'Transaction sent', 'Once mined, applicationId for this device will be updated.');
            this.setState({
              loading: true,
            });
          }
          break;


        case 'product':
          if (productID !== productIDNew) {
            await instance.updateProductID(deviceId, productIDNew, { from: getDefaultAccount() });
            this.watchForChanges(property + ' hash');
            openNotificationWithIcon('info', 'Transaction sent', 'Once mined, productID for this device will be updated.');
            this.setState({
              loading: true,
            });
          }
          break;


        case 'transfer':
          if (owner !== ownerNew) {
            await instance.transferDevice(deviceId, addHexPrefix(ownerNew), { from: getDefaultAccount() });
            this.watchForChanges('owner');
            openNotificationWithIcon('info', 'Transaction sent', 'Once mined, owner for this device will be updated.');
            this.setState({
              loading: true,
            });
          }
          break;
        default:
      }

      this.toggleEdit(property);
    } catch (error) {
      console.log(error);
      message.error(error.message);
      this.toggleEdit(property);
    }

  }

  async deactivate() {
    const { instance, deviceId, applicationId, endpointClientName, deactivated } = this.state;

    let tempResult = await instance.changeActivityStatus(deviceId, { from: getDefaultAccount(), gas:1000000 });
    let connectedDevicesStr = await instance.getDevicesByAppId(applicationId, { from: getDefaultAccount() });
    var newConnectedDevicesStr = ''
    if (!deactivated) {
      let connectedDevices = connectedDevicesStr.split(",")
      console.log(connectedDevices)
      for (var index = 0; index < connectedDevices.length; index++) {
        connectedDevices[index].trim()
        if (connectedDevices[index].trim().localeCompare(endpointClientName) != 0 && connectedDevices[index].trim()!="") {
          newConnectedDevicesStr = newConnectedDevicesStr + connectedDevices[index]
        }
        if (index != connectedDevices.length - 1) {
          newConnectedDevicesStr = newConnectedDevicesStr + ", "
        }
      }
      let applicationManager = await ApplicationManager;
    } else {
      newConnectedDevicesStr = connectedDevicesStr.trim() == ""? endpointClientName : connectedDevicesStr + "," + endpointClientName
    }
    let tempResultForUpdateDevices = await instance.updateAppConnectedDevices(applicationId, newConnectedDevicesStr,  { from: getDefaultAccount() })
    console.log(newConnectedDevicesStr)
    console.log(instance)
    this.setState({
      deactivated: !this.state.deactivated
    });

  }

  commonChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  render() {
    const { web3, loading, showError, owner, identifier, publicKey, applicationId, applicationName, productID, signatureCount, showEditApplicationId, showEditIdentifier, showEditPublicKey, showEditOwner, showEditProductID, endpointClientName } = this.state;
    let identifierContent = () => {
      if (showEditIdentifier) {
        return (
          <div>
            <Input name="identifierNew" value={this.state.identifierNew} onChange={this.commonChange} maxLength="66" />
            <Button type="primary" style={{ marginTop: '10px' }} onClick={() => this.saveData('identifier')}>Save</Button>
          </div>
        )
      }
      return (
        <div>
          Identifier {identifier}&nbsp;
          {owner === getDefaultAccount() &&
            <a><Icon type="edit" onClick={() => this.toggleEdit('identifier')} /></a>
          }
        </div>
      )
    }

    let publicKeyContent = () => {
      if (showEditPublicKey) {
        return (
          <div>
            <Input name="publicKeyNew" value={this.state.publicKeyNew} onChange={this.commonChange} maxLength="66" />
            <Button type="primary" style={{ marginTop: '10px' }} onClick={() => this.saveData('publicKey')}>Save</Button>
          </div>
        )
      }
      return (
        <div>
          Public key: {publicKey.length > 0 ? publicKey : 'empty'}&nbsp;
          {owner === getDefaultAccount() &&
            <a><Icon type="edit" onClick={() => this.toggleEdit('publicKey')} /></a>
          }
        </div>
      )
    }

    let applicationNameContent = () => {
      // if (showEditApplicationId) {
      //   return (
      //     <div>
      //       <Input name="applicationIdNew" value={this.state.applicationIdNew} onChange={this.commonChange} maxLength="66" />
      //       <Button type="primary" style={{ marginTop: '10px' }} onClick={() => this.saveData('applicationId')}>Save</Button>
      //     </div>
      //   )
      // }
      return (
          <div>
            Linked application Name: <Link to={`/products/${applicationId}`}>{applicationName.length > 0 ? applicationName : 'empty'}</Link>
          </div>
      )
    }
    let enpointClientNameContent = () => {
      return (
          <div>
            Endpoint Client Name: {endpointClientName.length > 0 ? endpointClientName : 'empty'}&nbsp;
          </div>
      )
    }
    let transferContent = () => {
      if (showEditOwner) {
        return (
          <div>
            <Input name="ownerNew" value={this.state.ownerNew} onChange={this.commonChange} maxLength="66" />
            <Button type="primary" style={{ marginTop: '10px' }} onClick={() => this.saveData('transfer')}>Save</Button>
          </div>
        )
      }
      return (
        <div>
          {/*{owner === getDefaultAccount() &&*/}
          {/*  <Button type="dashed" onClick={() => this.toggleEdit('transfer')}> Transfer ownership</Button>*/}
          {/*}*/}
          {/*{owner !== getDefaultAccount() &&*/}
          {/*  <div>*/}
          {/*    Owned by <Link to={"/lookup-entity/" + owner}><Tag>{owner}</Tag></Link>*/}
          {/*  </div>*/}
          {/*}*/}
        </div>
      )
    }

    return (
      <div>
        <Spin spinning={loading} className="loading-spin">
          {loading === false && showError === false && typeof publicKey !== 'undefined' &&
            <div>
              <strong><div style={{ marginBottom: '20px' }}>{enpointClientNameContent()}</div></strong>
              <Button style={{ marginLeft: 8 }} onClick={() => this.deactivate()}>
                {this.state.deactivated? "Activate" : "Deactivate"}
              </Button>
              <Divider />
              <div style={{ marginBottom: '20px' }}>{publicKeyContent()}</div>
              <div style={{ marginBottom: '20px' }}>{applicationNameContent()}</div>
              {transferContent()}
              <Divider />
              {signatureCount > 0 &&
              <div>
              <div>This device has <strong>{signatureCount}</strong> active signature(s). Devices that have been signed can't be updated.</div>
              <Divider />
              </div>
              }
              <Card title={'Historical events for device (oldest to newest)'}>
                {this.state.data.length !== 0 ?
                  <div>
                    {/*<p style={{ marginBottom: '20px' }}>Events that are filtered are {eventsToSave.join(', ')} </p>*/}
                    <Timeline style={{ marginTop: '10px' }}>
                      {this.state.data.map(el => {
                        if (el.event === 'DeviceCreated')
                        return <Timeline.Item color='green'>Device created by &nbsp;<Link to={"/lookup-entity/" + el.args.owner}><Tag>{el.args.owner}</Tag></Link>with endpoint client name <code>{el.args.endpointClientName}</code>, public key <code>{el.args.publicKey}</code> and linked application <code>{el.args.applicationName} </code></Timeline.Item>
                        if (el.event === 'DevicePropertyUpdated')
                          return <Timeline.Item>Property {web3.toUtf8(el.args.property)} updated to <code>{el.args.newValue}</code></Timeline.Item>
                        if (el.event === 'DeviceTransfered')
                          return <Timeline.Item color='orange'>Device transfered to &nbsp;<Link to={"/lookup-entity/" + el.args.newOwner}><Tag>{el.args.newOwner}</Tag></Link></Timeline.Item>
                        if (el.event === 'DeviceSigned')
                          return <Timeline.Item color='purple'>Signature with  &nbsp;<Link to={"/check-signature/" + el.args.signatureId.toNumber()}><Tag>ID {el.args.signatureId.toNumber()}</Tag></Link>created by {el.args.signer}</Timeline.Item>  
                        if (el.event === 'SignatureRevoked')
                          return <Timeline.Item color='purple'>Signature with  &nbsp;<Link to={"/check-signature/" + el.args.signatureId.toNumber()}><Tag>ID {el.args.signatureId.toNumber()}</Tag></Link>revoked</Timeline.Item>  
                        else
                          return null
                      })}
                    </Timeline>
                  </div>
                  :
                  <p><em>empty</em></p>
                }
              </Card>
            </div>
          }
          {/*
          {loading === false && owner !== getDefaultAccount() &&
            <Alert message="You don't own this device." type="error" showIcon />
          }
          */}
          {loading === false && showError &&
            <Alert
              message="Error"
              description="Error loading device: invalid ID format or device doesn't exist."
              type="error"
              showIcon
            />
          }
        </Spin >
      </div>
    );
  }
}

export default ManageDevice;