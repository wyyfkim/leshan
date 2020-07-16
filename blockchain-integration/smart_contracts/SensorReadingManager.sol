pragma solidity ^0.5.0;

import "./Application.sol";
import "./EventManager.sol";
import "./SensorReading.sol";
import "./Device.sol";


contract SensorReadingManager {
    Application app;
    EventManager eventManager;
    function receive (bytes32 deivceId, string memory category, string memory message, string memory timestamp) public {
        SensorReading sensorReading = createNewSensorReading(category);
        sensorReading.fill(deivceId, category, message, timestamp, message);
        Device storage device = app.getDeviceByDeviceId(deviceId);
        if (device.isAlert(sensorReading)) {
            addAlert(eventManager, sensorReading, category);
        }
    }
    function createNewSensorReading(string memory category) public returns (SensorReading sensorReading) {
        SensorReading sensorReading;
        //initialize a proper SensorReading object
        switch (category) {
            case "location":
                sensorReading = new LocationSensorReading();
            case "temperature":
                sensorReading = new TemperatureSensorReading();
            default:
                sensorReading = new UnknownReading();
        }
        return sensorReading;
    }
    function addAlert (EventManager eventManager, SensorReading alert, string memory category) public {
        SensorReading[] storage existingAlerts = eventManager.categoryToAlerts[category];
        if (existingAlerts.length == 0) {
            eventManager.categories.push(category);
        }
        existingAlerts.push(alert);
    }
}
contract SensorReading {
    bytes32 deviceId;
    string category;
    string message;
    string timestamp;
    function fill(bytes32 _deviceId, string memory _category, string memory _message, string memory _timestamp, string _meessage);
}
contract LocationSensorReading is SensorReading {
    double latitude;
    double longitude;
    function fill(bytes32 _deviceId, string memory _category, string memory _message, string memory _timestamp) public {
        double latitudeReceived = Double.parseDouble(message.split(';')[0]);
        double longitudeReceived = Double.parseDouble(message.split(';')[1]);
        deviceId = _deviceId;
        category = _category;
        message = _message;
        timestamp = _timestamp;
        latitude = latitudeReceived;
        longitude = longitudeReceivedg;
    }
}
contract TemperatureSensorReading is SensorReading {
    double temperature;
    function fill(bytes32 _deviceId, string memory _category, string memory _message, string memory _timestamp, string _meessage) public {
        double temperatureReceived = Double.parseDouble(message);
        deviceId = _deviceId;
        category = _category;
        message = _message;
        timestamp = _timestamp;
        temperature = temperatureReceived;
    }
}
