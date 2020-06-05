pragma solidity ^0.5.0;


//import "./PassageHelper.sol";
//import "./Dictionary.sol";
import "./PassageModel.sol";
import "solidity-util/lib/Strings.sol";
import "solidity-util/lib/Integers.sol";
import "solidity-util/lib/Addresses.sol";

//contract PassageMain is PassageHelper {
contract ApplicationManagement is PassageModel{
    using Strings for string;


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
//        product.certificationsIds = _certificationsIds;
        product.temperatureAlerts = "";
        product.locationAlerts = "";


//        product.deviceClientName = _deviceClientName;
        // Add new product ID
        productIds.push(newProductId);

        // Add product ID to account
        ownerToProductsId[msg.sender].push(newProductId);

        // Create initial product version
        updateProduct(newProductId, _latitude, _longitude, _customJsonData, _deviceClientName);

        // Fire an event to announce the creation of the product
        emit ProductCreated(newProductId, msg.sender);

//        deviceClientNameToProductStruct[_deviceClientName] = product;
        return newProductId;
    }


//    function addAlert(bytes32 _productId, string memory _alertData, string memory _category) {
//
//    }
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
//        return (product.name, product.description, requestedVersion.latitude, requestedVersion.longitude, requestedVersion.creationDate, product.versions, product.certificationsIds);

      // TODO: return the product versions using another function (i.e. getProductVersions(_productId))
      // instead of directly (as above)
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

        // TODO: return the product versions using another function (i.e. getProductVersions(_productId))
        // instead of directly (as above)
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

