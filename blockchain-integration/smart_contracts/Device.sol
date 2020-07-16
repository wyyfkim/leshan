pragma solidity ^0.5.0;

import "./SensorReading.sol";
import "./utils.sol";

contract DeviceManager {
    string[] deviceCategories;
    mapping (string => string[]) categoryToParams;
    mapping (string => Device[]) categoryToDevice;
    mapping (bytes32 => Device) deviceIdToDevice;
    constructor () {
        TemperatureDevice temperatureDevice = new TemperatureDevice(self);
        LocationDevice locationDevice = new LocationDevice(self);
        temperatureDevice.init();
        locationDevice.init();
    }
    function register(string deviceCategory, string[] params) {
        deviceCategories.push(deviceCategory);
        categoryToParams[deviceCategory] = params;
    }
    function getListOfDeviceNames() {
        return deviceCategories;
    }
    function getParamsForDevice(string deviceCategory) public returns (string param) {
        return categoryToParams[deviceCategory];
    }
    function createNewDeviceInstance(bytes32 _identifier, string memory _deviceClientName, string memory _publicKey, string memory _category, string memory _threshold) {
        Device newDevice;
        switch (_category) {
        case "location":
            newDevice = new LocationDevice(_identifier, _deviceClientName, _publicKey, _category);
        case "TemperatureDevice":
            newDevice = new LocationDevice(_identifier, _deviceClientName, _publicKey, _category);
        default:
            newDevice = new UnknownDevie(_identifier, _deviceClientName, _publicKey, _category);
        }
        newDevice.setThresholdParameters(_threshold);
    }
}

contract Device {
    bytes32 deviceId;
    string deviceClientName;
    string publicKey;
    bool active;
    string type;
    function isAlert(SensorReading sr) public view returns(bool);
    function setThresholdParameters(string threshold);
}
contract LocationDevice is Device{
    double latitudeThreshold;
    double longitudeThreshold;
    double radiusThreshold;
    DeviceManager deviceManager;
    constructor(DeviceManager _deviceManager) {
        deviceManager = _deviceManager;
    }
    constructor(bytes32 _deviceId, string memory _deviceClientName, string memory _publicKey, bool _active, string memory _type, double memory _latitude, double memory _longitude, double memory _radius) public {
        deviceId = _deviceId;
        deviceClientName = _deviceClientName;
        publicKey = _publicKey;
        active = _active;
        category = _category;
    }
    function init() {
        deviceManager.register("location", ["latitude", "lonitude", "radius"]);
    }
    function setThresholdParameters(string threshold) {
        double latitude = Double.parseDouble(threshold)[0];
        double longitude = Double.parseDouble(threshold)[1];
        double radius = Double.parseDouble(threshold)[2];
        latitudeThreshold = latitude;
        longitudeThreshold = longitude;
        radiusThreshold = radius;
    }
    function isAlert(SensorReading sr) public view returns(bool) {
        return (Math.sqrt(Math.pow(sr.latitude - latitudeThreshold, 2) + Math.pow(sr.longitude - longitudeThreshold, 2)) > radiusThreshold);
    }
}
contract TemperatureDevice is Device{
    double temperatureThreshold;
    DeviceManager deviceManager;

    function init() {
        deviceManager.register("temperature", ["temperature"]);
    }
    constructor(DeviceManager _deviceManager) {
        deviceManager = _deviceManager;
    }
    constructor(bytes32 _deviceId, string memory _deviceClientName, string memory _publicKey, bool _active, string memory _type, double memory _temperature) public {
        deviceId = _deviceId;
        deviceClientName = _deviceClientName;
        publicKey = _publicKey;
        active = _active;
        category = _category;
    }
    function setThresholdParameters(string threshold) {
        double temperature = Double.parseDouble(threshold);
        temperatureThreshold = temperature;
    }
    function isAlert(SensorReading sr) public view returns(bool) {
        return sr.temperature > temperatureThreshold;
    }
}
contract UnknownDevice is Device{
    string unknownThreshold;
    constructor(bytes32 _deviceId, string memory _deviceClientName, string memory _publicKey, bool _active, string memory _type, double memory _latitude, double memory _longitude, double memory _radius) public {
        deviceId = _deviceId;
        deviceClientName = _deviceClientName;
        publicKey = _publicKey;
        active = _active;
        category = _category;
    }
    function setThresholdParameters(string threshold) {
        unknownThreshold = threshold;
    }
    function isAlert(SensorReading sr) public view returns(bool) {
        return false;
    }
}

