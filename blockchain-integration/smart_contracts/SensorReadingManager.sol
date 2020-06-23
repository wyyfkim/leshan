pragma solidity ^0.5.0;

import "./Application.sol";
import "./EventManager.sol";
import "./SensorReading.sol";
import "./Device.sol";


contract SensorReadingManager {
    Application app;
    EventManager eventManager;
    function receive (bytes32 deivceId, string memory category, string memory message, string memory timestamp) public {
        SensorReading storage sensorReading;
        //initialize a proper SensorReading object
        if (category == 'location') {
            int latitudeReceived = Integer.parseInt(message.split(';')[0]);
            int longitudeReceived = Integer.parseInt(message.split(';')[1]);
            sensorReading = new LocationSensorReading(deivceId, category, message, timestamp, latitudeReceived, longitudeReceived);
        } else {
            int temperatureReceived = Integer.parseInt(message);
            sensorReading = new TemperatureSensorReading(deivceId, category, message, timestamp, temperatureReceived);
        }
        Device storage device = app.getDeviceByDeviceId(deviceId);
        if (device.isAlert(sensorReading)) {
            addAlert(eventManager, sensorReading, category);
        }
    }
    function addAlert (EventManager eventManager, SensorReading alert, string memory category) public {
        SensorReading[] storage existingAlerts = eventManager.categoryToAlerts[category];
        if (existingAlerts.length == 0) {
            eventManager.categories.push(category);
        }
        existingAlerts.push(alert);
    }
}
