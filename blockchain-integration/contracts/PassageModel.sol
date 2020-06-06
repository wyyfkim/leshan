pragma solidity ^0.5.0;



contract PassageModel {

    /***********************
      STRUCT DEFINITIONS
    ***********************/
    struct Actor {
        bytes32 actorId;
        string name;
        address accountAddress; // Ethereum address
        string physicalAddress; // Physical address, may be separated (more costly)
        // TODO: actor certification? ISO:9001?
    }

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

    mapping (address => Actor) public actorAddressToActorStruct; // access an actor struct from its Eth address
    address[] public actorAddresses; // access all actor addresses

}
