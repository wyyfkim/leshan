pragma solidity ^0.5.0;

import "./SensorReading.sol";

contract EventManager {
    string[] categories;
    mapping (string => SensorReading[]) categoryToAlerts;
    function getAlertByCategoriy (string memory category) external view returns (string memory alerts) {
        SensorReading[] alerts = categoryToAlerts[category];
        string result = '';
        for (int i = 0; i < alerts.length; i++) {
            SensorReading alert = alerts[i];
            string temp = alert.deviceId + "," + alert.category + "," + alert.message + "," + alert.timestamp;
            result = result + temp;
        }
        return result;
    }
}
