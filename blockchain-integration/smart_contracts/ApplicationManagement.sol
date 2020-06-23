pragma solidity ^0.5.0;
import "./EventManager.sol";
import "./SensorReadingManager.sol";
import "./Application.sol";


contract ApplicationManagement {
    Application[] applications;
    address[] blockchainUsers;
    mapping (address => Application[]) blockchainUserToApp;
    mapping (bytes32 => Application) appIdToApp;
    mapping (bytes32 => bytes32) deviceIdToAppId;

    function createApplication (bytes32 _identifier, address _blockchainUser, string memory _name, string memory _description, string memory _customJsonData, uint _creationDate) {
        Application newApp = new Application(_identifier, _blockchainUser, _name, _description);
        Version newVersion = new Version(_creationDate, _customJsonData);
        newApp.versions.push(newVersion);
        EventManager newEventManager = new EventManager();
        SensorReadingManager newSensorReadingManager = new SensorReadingManager();
        newApp.eventManager = newEventManager;
        newSensorReadingManager.app = newApp;
        newSensorReadingManager.eventManager = newEventManager;
        blockchainUserToApp[_blockchainUser].push(newApp);
        appIdToApp[_identifier] = newApp;
    }

    function getApplicationsByOwner(address owner) public returns (Application app) {
        return appIdToApp[app];
    }
    function getLinkedApplicationByDeviceId(bytes32 deviceId) {
        return deviceIdToAppId[deviceId];
    }
}
