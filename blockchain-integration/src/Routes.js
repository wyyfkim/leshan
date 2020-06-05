import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import App from './App';
import Account from './pages/Account';
import Create from './pages/Create';
import CreateCertification from './pages/CreateCertification';
import View from './pages/View';
import MyProducts from './pages/MyProducts';
import Update from './pages/Update';
import NotFound from './pages/NotFound';
import CombineScan from './pages/CombineScan';
import CombineList from './pages/CombineList';
import SplitProduct from './pages/SplitProduct';
import ManageDeviceHome from './deviceManagement/App';
import RegisterDevice from "./deviceManagement/components/RegisterDevice";
import ManageDevice from "./deviceManagement/components/ManageDevice";

import ManageDevices from './deviceManagement/components/ManageDevices'

const Routes = () => (
  <Router>
    <App>
      <Switch>
        <Route exact path="/" component={MyProducts} />
        <Route exact path="/account" component={Account} />
        <Route exact path="/create" component={Create} />
        <Route exact path="/CreateCertification" component={CreateCertification} />
        <Route exact path="/products/:productId" component={View} />
        <Route exact path="/products/:productId/versions/:versionId" component={View} />
        <Route exact path="/products/:productId/update" component={Update} />
        <Route exact path="/products/:productId/split" component={SplitProduct} />
        <Route exact path="/combineScan" component={CombineScan} />
        <Route exact path="/combineList" component={CombineList} />
        <Route exact path="/manageDevice" component={ManageDeviceHome} />
        <Route exact path="/register-device" component={RegisterDevice} />
        <Route exact path="/manage-devices" component={ManageDevices} />
        <Route path="/manage-device/:deviceId" component={ManageDevice} />



        <Route path="*" component={NotFound} />
      </Switch>
    </App>
  </Router>
);

export default Routes;
