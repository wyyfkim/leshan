pragma solidity ^0.5.0;

import "./SensorReading.sol";
import "./utils.sol";


contract Device {
    bytes32 deviceId;
    string deviceClientName;
    string publicKey;
    bool active;
    string type;
    function isAlert(SensorReading sr) public view returns(bool);
}
contract TemperatureDevice is Device{
    double latitudeThreshold;
    double longitudeThreshold;
    double radiusThreshold;
    constructor(bytes32 _deviceId, string memory _deviceClientName, string memory _publicKey, bool _active, string memory _type, double memory _latitude, double memory _longitude, double memory _radius) public {
        deviceId = _deviceId;
        deviceClientName = _deviceClientName;
        publicKey = _publicKey;
        active = _active;
        type = _type;
        latitudeThreshold = _latitude;
        longitudeThreshold = _longitude;
        radiusThreshold = _radius;
    }
    function isAlert(SensorReading sr) public view returns(bool) {
        return (Math.sqrt(Math.pow(sr.latitude - latitudeThreshold, 2) + Math.pow(sr.longitude - longitudeThreshold, 2)) > radiusThreshold);
    }
}
contract LocationDevice is Device{
    double temperatureThreshold;
    constructor(bytes32 _deviceId, string memory _deviceClientName, string memory _publicKey, bool _active, string memory _type, double memory _temperature) public {
        deviceId = _deviceId;
        deviceClientName = _deviceClientName;
        publicKey = _publicKey;
        active = _active;
        type = _type;
        temperatureThreshold = _temperature;
    }
    function isAlert(SensorReading sr) public view returns(bool) {
        return sr.temperature > temperatureThreshold;
    }
}

