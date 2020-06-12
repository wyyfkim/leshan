import DeviceManager, { getDefaultAccount } from '../DeviceManager';

import React, { Component } from 'react';
import {Spin, List, message, Divider} from 'antd';
import { Link } from 'react-router-dom';

class ManageDevices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      instance: null,
      devices: [],
      activeDevices: [],
      deactiveDevices: [],
    }
  }

  async componentDidMount() {
    try {
      let instance = await DeviceManager;
      let deviceIds = (await instance.getDevicesByOwner(getDefaultAccount())).map(el => el.toNumber());

      let devicePromises = [];
      for (let deviceId of deviceIds) {
        let devicePromise = instance.devices(deviceId);
        devicePromises.push(devicePromise);
      }

      let devices = await Promise.all(devicePromises);
      var activeDevices = []
      var deactiveDevices = []
      for (var index = 0; index < devices.length; index++) {
        let device = devices[index];
        if (device[6]) {
          deactiveDevices.push(device)
        } else {
          activeDevices.push(device)
        }
      }
      this.setState({
        instance,
        devices,
        deviceIds,
        loading: false,
        activeDevices,
        deactiveDevices,
      });
    } catch (error) {
      console.log(error);
      message.error(error.message);
    }
  }

  render() {
    const { activeDevices, deactiveDevices, loading } = this.state;

    return (
      <div>
        <Spin spinning={loading} className="loading-spin">
          {activeDevices.length > 0 && !loading &&
            <div>
              <p>

                Below you can find your active devices. Click to see more details and manage.
              </p>
              <List
                bordered={true}
                itemLayout="horizontal"
                dataSource={activeDevices}
                renderItem={(device, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Link to={`/manage-device/${device[7].c[0]}`}>{`Endpoint client name: ${device[5]}`}</Link>}
                    />
                  </List.Item>
                )}
              />
            </div>
          }
          {activeDevices.length === 0 && !loading &&
            <p>You don't have any active devices registered.</p>
          }
          <br></br>
          <Divider />
          <br></br>
          {deactiveDevices.length > 0 && !loading &&
          <div>
            <p>
              Below you can find your deactivated devices. Click to see more details and manage.
            </p>
            <List
                bordered={true}
                itemLayout="horizontal"
                dataSource={deactiveDevices}
                renderItem={(device, index) => (
                    <List.Item>
                      <List.Item.Meta
                          title={<Link to={`/manage-device/${device[7].c[0]}`}>{`Endpoint client name: ${device[5]}`}</Link>}
                      />
                    </List.Item>
                )}
            />
          </div>
          }
          {deactiveDevices.length === 0 && !loading &&
          <p>You don't have any deactivated devices.</p>
          }
        </Spin>
      </div>



    )
  }
}

export default ManageDevices;