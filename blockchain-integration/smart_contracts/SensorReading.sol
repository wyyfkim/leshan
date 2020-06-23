pragma solidity ^0.4.0;

contract SensorReading {
    bytes32 deviceId;
    string category;
    string message;
    string timestamp;
    constructor(bytes32 _deviceId, string memory _category, string memory _message, string memory _timestamp) public {
        deviceId = _deviceId;
        category = _category;
        message = _message;
        timestamp = _timestamp;
    }
}
contract TemperatureSensorReading is SensorReading {
    int temperature;
    constructor(bytes32 _deviceId, string memory _category, string memory _message, string memory _timestamp, int _temperature) public {
        deviceId = _deviceId;
        category = _category;
        message = _message;
        timestamp = _timestamp;
        temperature = _temperature;
    }
}
contract LocationSensorReading is SensorReading {
    int latitude;
    int longitude;
    constructor(bytes32 _deviceId, string memory _category, string memory _message, string memory _timestamp, int _latitude, int _longitude) public {
        deviceId = _deviceId;
        category = _category;
        message = _message;
        timestamp = _timestamp;
        latitude = _latitude;
        longitude = _longitude;
    }
}
