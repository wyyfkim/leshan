import * as DeviceManagerArtifact from '../build/contracts/Application.json';
import ApplicationArtifact from '../build/contracts/ApplicationManagement.json';

var DeviceAdd = JSON.parse(DeviceManagerArtifact).networks[0].address
var ApplicationAdd = JSON.parse(ApplicationArtifact).networks[0].address
console.log(DeviceAdd)
console.log("ApplicationAdd")