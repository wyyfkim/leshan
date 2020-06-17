pragma solidity ^0.5.0;

contract EventManager {

    struct AlertEvent {
        bytes32 deviceId;
        bytes32 applicationId;
        string category;
        string message;
        string timestamp;

//        func bool alertTriggered(string message);
    }

//    struct gpsAlert :: AlerEvent {
//        bytes32 latitute;
//        bytes32 longtitute;
//        bytes32 radius;
//        func bool alertTriggered(string message) {
//
//            if (latitute > 0) {
//            return true;
//}    //thre
//        }
//    }

    /// @notice Maps app to a category string.
    mapping (bytes32 => string) appToCategories;

    /// @notice Maps app+category string to an AlertEvent struct.
    mapping (string => AlertEvent) appCategoryToMessage;

    ///curCategory is the current category
    ///allCategories is the string of all categories
    ///appCategory is the combination of appId and curCategory
    function addAlert (bytes32 deviceId, bytes32 applicationId, string memory curCategory, string memory message, string memory timestamp, string memory allCategories, string memory appCategory) public {
        appToCategories[applicationId] = allCategories;
        // Create alertEvent
        AlertEvent storage alertEvent = appCategoryToMessage[appCategory];
        alertEvent.deviceId = deviceId;
        alertEvent.applicationId = applicationId;
        alertEvent.category = curCategory;
        alertEvent.message = message;
        alertEvent.timestamp = timestamp;
    }
    function getAlertCategoriesByApplicationId (bytes32 applicationId) external view returns (string memory categories) {
        return appToCategories[applicationId];
    }
    function getAlertMessageByAppCategory (string calldata appCategory) external view returns (string memory messages, string memory timestamp){
        return (appCategoryToMessage[appCategory].message, appCategoryToMessage[appCategory].timestamp);
    }
}
