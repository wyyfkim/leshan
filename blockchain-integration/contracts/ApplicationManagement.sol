pragma solidity ^0.5.0;

import "solidity-util/lib/Strings.sol";
import "solidity-util/lib/Integers.sol";
import "solidity-util/lib/Addresses.sol";
import "./EventManager.sol";

contract ApplicationManagement is EventManager{
//    struct AlertEvent {
//        bytes32 deviceId;
//        bytes32 applicationId;
//        string category;
//        string message;
//        string timestamp;
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

//contract ApplicationManagement is PassageModel{

    using Strings for string;


    /***********************
      STRUCT DEFINITIONS
    ***********************/
//    struct Actor {
//        bytes32 actorId;
//        string name;
//        address accountAddress; // Ethereum address
//        string physicalAddress; // Physical address, may be separated (more costly)
//        // TODO: actor certification? ISO:9001?
//    }

    struct ProductVersion {
        bytes32 versionId;
        bytes32 previousVersionId;
        uint creationDate;
        address owner; // used to keep track of who owned the product at that version (could be a "bytes32 actorId")
        string latitude;
        string longitude;
        string customJsonData;
        string deviceClientName;
    }

    struct Product {
        bool exists; // always true! (used to check if the product exists)
        bool archived; // set to true when product gets merged/split
        bytes32 productId;
        bytes32 latestVersionId;
        bytes32[] versions;
        address owner;
        string name;
        string description;
        string temperatureAlerts;
        string locationAlerts;
    }

    /***********************
      MAPPINGS & STORAGE
    ***********************/
    mapping (bytes32 => Product) public productIdToProductStruct; // access a product struct directly from an ID
    bytes32[] public productIds; // access all product IDs

    mapping (string => Product) deviceClientNameToProductStruct; // access a product struct directly from a device client name

    mapping (bytes32 => ProductVersion) public versionIdToVersionStruct; // access a version struct from a version ID
    bytes32[] public productVersionIds; // access all version IDs

    mapping (address => bytes32[]) public ownerToProductsId; // access an account's products

//    mapping (address => Actor) public actorAddressToActorStruct; // access an actor struct from its Eth address
//    address[] public actorAddresses; // access all actor addresses

    function createProduct(
      string memory _name,
      string memory _description,
      string memory _latitude,
      string memory _longitude,
      string memory _customJsonData,
      string memory _deviceClientName
    ) public returns (bytes32 productId) {
    
        // Generate a pseudo-random product ID
        // from the current time and the sender's address
        bytes32 newProductId = keccak256(abi.encodePacked(now, msg.sender));

        // Create product
        Product storage product = productIdToProductStruct[newProductId];

        // Define product
        product.productId = newProductId;
        product.latestVersionId = "0"; // temporary value that gets replaced in updateProduct()
        product.versions = new bytes32[](0); // empty array at first
        product.exists = true;
        product.archived = false;
        product.owner = msg.sender;

        product.name = _name;
        product.description = _description;
        product.temperatureAlerts = "";
        product.locationAlerts = "";

        // Add new product ID
        productIds.push(newProductId);

        // Add product ID to account
        ownerToProductsId[msg.sender].push(newProductId);

        // Create initial product version
        updateProduct(newProductId, _latitude, _longitude, _customJsonData, _deviceClientName);

        // Fire an event to announce the creation of the product
        emit ProductCreated(newProductId, msg.sender);
        return newProductId;
    }

    function addTemperaturAlert(
        bytes32 _productId,
        string memory _alertData
    ) public returns (string memory newAlert) {
        // Get base product from storage
        Product storage product = productIdToProductStruct[_productId];
        product.temperatureAlerts = _alertData;
        return product.temperatureAlerts;
    }

    function addLocationAlert(
        bytes32 _productId,
        string memory _alertData
    ) public returns (string memory newAlert) {
        // Get base product from storage
        Product storage product = productIdToProductStruct[_productId];
        product.locationAlerts = _alertData;
        return product.locationAlerts;
    }

//    event productAlertAdded(bytes32 productId, bytes32 deviceID, );

    function updateProduct(
      bytes32 _productId, 
      string memory _latitude,
      string memory _longitude,
      string memory _customJsonData,
      string memory _deviceClientName
    ) public {
        Product storage product = productIdToProductStruct[_productId];
        if (bytes(_deviceClientName).length != 0) {
            string[] memory linkedDevices = _deviceClientName.split(";");
            for (uint i = 0; i < linkedDevices.length; i++) {
                deviceClientNameToProductStruct[linkedDevices[i]] = product;
            }
        }
        bytes32 newVersionId = keccak256(abi.encodePacked(now, msg.sender, _productId));
        ProductVersion storage version = versionIdToVersionStruct[newVersionId];
        version.versionId = newVersionId;
        version.creationDate = now;
        version.previousVersionId = product.latestVersionId;
        version.owner = product.owner;
        version.latitude = _latitude;
        version.longitude = _longitude;
        version.customJsonData = _customJsonData;
        version.deviceClientName = _deviceClientName;
        productVersionIds.push(newVersionId);
        product.versions.push(newVersionId);
        product.latestVersionId = newVersionId;
    }
    function getProductByDeviceClientName(string calldata _deviceClientName) external view returns (bytes32 productId) {
        // Get the requested product from storage
        Product memory product = deviceClientNameToProductStruct[_deviceClientName];
        return product.productId;
    }

    function getProductByIdExtra(bytes32 _productId, bytes32 specificVersionId) external view returns (string memory deviceClientName, string memory tempAlertStr, string memory locAlertStr) {
        Product memory product = productIdToProductStruct[_productId];
        ProductVersion memory requestedVersion = versionIdToVersionStruct[product.latestVersionId];
        if (specificVersionId != "latest") {
            // Get the requested product version
            requestedVersion = versionIdToVersionStruct[specificVersionId];
        }
        return (requestedVersion.deviceClientName, product.temperatureAlerts, product.locationAlerts);
    }

    function getProductById(bytes32 _productId, bytes32 specificVersionId) external view returns (string memory name, string memory description, string memory _latitude, string memory _longitude, uint versionCreationDate, bytes32[] memory versions) {
//        returns (string name, string description, string _latitude, string _longitude, uint versionCreationDate, bytes32[] versions, bytes32[] certificationsIds) {

      // Get the requested product from storage
      Product memory product = productIdToProductStruct[_productId];

      // Initialize a variable that will hold the requested product version struct
      ProductVersion memory requestedVersion = versionIdToVersionStruct[product.latestVersionId];
      if (specificVersionId != "latest") {
        // Get the requested product version
        requestedVersion = versionIdToVersionStruct[specificVersionId];
      }

      // Return the requested data
      return (product.name, product.description, requestedVersion.latitude, requestedVersion.longitude, requestedVersion.creationDate, product.versions);
    }

    function getProductCustomDataById(bytes32 _productId, bytes32 specificVersionId) external view returns (string memory customJsonData) {

        // Get the requested product from storage
        Product memory product = productIdToProductStruct[_productId];

        // Initialize a variable that will hold the requested product version struct
        ProductVersion memory requestedVersion = versionIdToVersionStruct[product.latestVersionId];

        if (specificVersionId != "latest") {
          // Get the requested product version
          requestedVersion = versionIdToVersionStruct[specificVersionId];
        }

        // Return the requested data
        return (requestedVersion.customJsonData);
    }


    function getOwnerProducts() external view returns (bytes32[] memory productsIds) {

        bytes32[] memory ownedProductsIds = ownerToProductsId[msg.sender];
        bytes32[] memory activeProducts = new bytes32[](ownedProductsIds.length);

        for (uint i = 0; i < ownedProductsIds.length; ++i) {
            if (!productIdToProductStruct[ownedProductsIds[i]].archived) {
                activeProducts[i] = ownedProductsIds[i];
            }
        }

        return activeProducts;
    }

    function getVersionLatLngById(bytes32 _versionId) external view returns (string memory latitude, string memory longitude) {

        // Get the requested version from storage
        ProductVersion storage version = versionIdToVersionStruct[_versionId];

        // Return the requested data
        return (version.latitude, version.longitude);
    }

    event ProductCreated(bytes32 newProductId, address indexed owner);
}

