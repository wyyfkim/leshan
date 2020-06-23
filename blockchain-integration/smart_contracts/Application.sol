pragma solidity ^0.5.0;
import "./EventManager.sol";
import "./ApplicationManagement.sol";
import "./Device.sol";
import "./utils.sol";

contract Application {
    bytes32 appId;
    address blockchainUser;
    string name;
    string description;
    Version[] versions;
    Device[] devices;
    EventManager eventManager;
    mapping (bytes32 => bytes32) deviceIdToDevice;
    struct Version {
        uint creationDate;
        string customJsonData;
    }

    function registerDevice(bytes32 _identifier, string memory _deviceClientName, string memory _publicKey, string memory _type, string memory _threshold) {
        Device storage newDeivce;
        if (_type == 'location') {
            //_threshold will be in the format of "latitude;longitude;radius"
            double latitude = Double.parseInt(_threshold.split(';')[0]);
            double longitude = Double.parseInt(_threshold.split(';')[1]);
            double radius = Double.parseInt(_threshold.split(';')[2]);
            newDeivce = new LocationDevice(_identifier, _deviceClientName, _publicKey, true, _type, latitude, longitude, radius);
        } else {
            //_threshold will be in the format of "temperature"
            double temperature = Double.parseDouble(_threshold);
            newDeivce = new TemperatureDevice(_identifier, _deviceClientName, _publicKey, true, _type, temperature);
        }
        deviceIdToDevice[_identifier] = newDeivce;
    }

    function updateApplication(string memory customData, uint creationDate ) {
        Version newVersion = Version(customData, creationDate);
        versions.push(newVersion);
    }

    function changeDeviceActivityStatus(bytes32 deviceId) {
        Device storage targetDevice = deviceIdToDevice[deviceId];
        targetDevice.active = !targetDevice.active;
    }
    function getApplicationBasicById() public returns (string memory name, string memory description) {
        return (name, description);
    }
    function getApplicationCustomDataById(uint versionId) public returns (string memory customData, string memory creationDate) {
        Version targetVersion = versionId[versionId];
        return (targetVersion.customJsonData, targetVersion.creationDate);
    }
    function getLinkedDevices() public returns (Device[] devices) {
        return devices;
    }
    function getCredentialsByDeviceClientName() public returns (string memory publicKey) {
        return publicKey;
    }
    function getDeviceByDeviceId(bytes32 deviceId) public returns (Device memory device) {
        return deviceIdToDevice[deviceId];
    }
}

