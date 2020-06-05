import getWeb3 from '../utils/web3';
import DeviceManager, { getDefaultAccount } from '../DeviceManager';
import { addHexPrefix } from 'ethereumjs-util';

import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {Tag, Button, Input, Card, Timeline, Divider, Spin, Alert, Icon, notification, message, List} from 'antd';

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
      showEditOwner: false
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
      let device = await instance.devices(0);
      // console.log("printing device...")
      // console.log(device)
      // console.log("printing device2...")

      this.setState({
        web3,
        instance
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
      console.log("printing device...")
      console.log(device)
      console.log("printing device2...")

      let signatureCount = await instance.deviceSignatureCount(deviceId);
      let allEvents = instance.allEvents({ fromBlock: 0, toBlock: 'latest' });
      allEvents.get((error, logs) => {
        let filteredData = logs.filter(el => eventsToSave.includes(el.event) && el.args.deviceId.toNumber() === parseInt(deviceId, 10));
        if (!error) {
          // instance.getProductidByClientName(String(device[5]).valueOf(), (productID) => {
          console.log(device)
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
              endpointClientName: device[5]
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
      // let productIDCheck = await instance.getdeviceFirmByClientName(String(this.state.endpointClientName).valueOf());
      // console.log("printing productIDcheck")
      // console.log(productIDCheck)
      // allEvents.get((error, logs) => {
      //   if (!error) {
      //     // instance.getProductidByClientName(String(device[5]).valueOf(), (productID) => {
      //     this.setState({
      //       endpointClientName: productIDCheck
      //     })
      //   }
      // })
    } catch (error) {
      console.log(error);
      //message.error(error.message);
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

  commonChange(e) {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  render() {
    const { web3, loading, showError, owner, identifier, publicKey, applicationId, applicationName, productID, signatureCount, showEditApplicationId, showEditIdentifier, showEditPublicKey, showEditOwner, showEditProductID, endpointClientName } = this.state;
console.log(endpointClientName)
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

    // let productIDContent = () => {
    //   if (showEditProductID) {
    //     return (
    //         <div>
    //           <Input name="productID" value={this.state.productIDNew} onChange={this.commonChange} maxLength="66" />
    //           <Button type="primary" style={{ marginTop: '10px' }} onClick={() => this.saveData('product')}>Save</Button>
    //         </div>
    //     )
    //   }
    //   return (
    //       <div>
    //         Product ID: {productID.length > 0 ? productID : 'empty'}&nbsp;
    //         {owner === getDefaultAccount() &&
    //         <a><Icon type="edit" onClick={() => this.toggleEdit('product')} /></a>
    //         }
    //       </div>
    //   )
    // }

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
            {/*inked application Name: {applicationName.length > 0 ? applicationName : 'empty'}&nbsp;*/}
            Linked application Name: <Link to={`/products/${applicationId}`}>{applicationName.length > 0 ? applicationName : 'empty'}</Link>

            {/*<Link to={"/"} test>*/}
            {/*<Link to={'/'}Linked application Name: {applicationName.length > 0 ? applicationName : 'empty'}>*/}

            {/*{owner === getDefaultAccount() &&*/}
            {/*<a><Icon type="edit" onClick={() => this.toggleEdit('applicationId')} /></a>*/}
            {/*}*/}
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
              {/*<strong><div style={{ marginBottom: '20px' }}>{identifierContent()}</div></strong>*/}
              <Divider />
              {/*<div style={{ marginBottom: '20px' }}>{productIDContent()}</div>*/}
              <div style={{ marginBottom: '20px' }}>{publicKeyContent()}</div>
              <div style={{ marginBottom: '20px' }}>{applicationNameContent()}</div>
              {/*<div style={{ marginBottom: '20px' }}>{enpointClientNameContent()}</div>*/}
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
                          console.log(el.args)
                        // return <Timeline.Item color='green'>Device created by &nbsp;<Link to={"/lookup-entity/" + el.args.owner}><Tag>{el.args.owner}</Tag></Link>with &nbsp;<Link to={"/manage-device/" + el.args.deviceId.toNumber()}><Tag>ID {el.args.deviceId.toNumber()}</Tag></Link>, identifier <code>{el.args.identifier}</code>, metadata hash <code>{el.args.metadataHash}</code> and firmware hash <code>{el.args.firmwareHash} and product id <code>{el.args.productID}</code></code></Timeline.Item>
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