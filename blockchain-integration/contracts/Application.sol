pragma solidity ^0.5.0;

import "./MerkleProof.sol";
import "./ECRecovery.sol";

/**
 * @title Provides base functionalities for entities.
 */
contract EntityBase {
    /// @dev Entity in the device management system.
    struct Entity {
        // Arbitary data in case entity wants to have some public information available.
        string data;
    }

    /// @notice Maps owner to an Entity structure.
    mapping (address => Entity) public ownerToEntity;

    /// @dev Fired on entity data update.
    event EntityDataUpdated(address indexed owner, string newData);

    /**
     * @notice Update entity data.
     * @param _data Entity data.
     */
    function updateEntityData(string memory _data) public {
        ownerToEntity[msg.sender].data = _data;

        emit EntityDataUpdated(msg.sender, _data);
    }
}

/**
 * @title Provides base functionalities for devices.
 */
contract DeviceBase {
    /// @dev Main device structucture.
    struct Device {
        // Ethereum address of a device owner.
        address owner;

        // Unique device identifier. Can hold anything that fits into 32 bytes. Different from device ID.
        // Supposed to be a public key or a representation of one, such as fingerprint of RSA/ECC
        // public key or simply an Ethereum address. To make identifier be an Ethereum address,
        // use secp256k1 curve to generate public and private key pair, run keccak256 hash function
        // on public key and take last 20 bytes of generated hash to get Ethereum address.
        // If a device wants to be it's own entity, use same address as in owner property.
        bytes32 identifier;

        // Merkle root hash of metadata or simple hash of concatenated data.
        // It is recommended to use Merkle tree to store information on device as it enables to
        // prove membership of specific data by providing Merkle proof without revealing whole dataset.
        string publicKey;

        // Holds a hash of actual firmware hash. Actual firmware hash is not supposed to be stored.
        // Plain text or hash would expose data that is meant to be private, so "hash of hash" principle
        // gives privacy and makes integrity verification possible.
        bytes32 applicationId;
        string applicationName;

        string endpointClientName;

        // Additional data linked to device. Can be used to store hash of encrypted firmware on IPFS.
        //string offchainLink;

        // Full public key (even though parties can exchange public key other ways then use
        // blockchain to verify.)
        //string publicKey;
    }

    /// @notice State variable for storing devices. Index in the array is also a device ID.
    /// Array can hold a maximum of 2^256-1 entries.
    Device[] public devices;

    /// @notice Keeps track of total devices for each owner.
    mapping (address => uint) public ownerDeviceCount;

    /// @notice Keeps track of total devices for each owner.
    mapping (bytes32 => string) public applicationToLinkedDevices;

    /// @notice deviceClientName to linkedAPP id
    mapping (string => bytes32) deviceClientNameToAppId;
    /// @dev Fired on creation of new device.
    event DeviceCreated(uint indexed deviceId, address indexed owner, bytes32 identifier, string publicKey, bytes32 applicationId, string applicationName, string endpointClientName, string allDevices);

    /// @dev Modifier for ensuring that the message sender is owner of provided device ID.
    modifier onlyOwnerOf(uint _deviceId) {
        require(devices[_deviceId].owner == msg.sender, "Only for device owner");
        _;
    }

    /**
     * @notice Creates and saves device into storage. Emits DeviceCreated.
     * @param _identifier Unique device identifier, such as fingerprint of RSA/ECC public key or Ethereum address (recommended).
     * @param _publicKey Merkle root hash of metadata (recommended) or simple hash of concatenated metadata.
     * @param _applicationId App linked to.
     * @param _endpointClientName Endpoint Client Name.
     * @return Created device ID.
     */
    function createDevice(bytes32 _identifier, string memory _publicKey, bytes32 _applicationId, string memory _applicationName, string memory _endpointClientName, string memory _allDevices) public returns (uint) {
        Device memory newDevice = Device(msg.sender, _identifier, _publicKey, _applicationId, _applicationName, _endpointClientName);
//        applicationToLinkedDevices[_applicationId] = _applicationName;
        deviceClientNameToAppId[_endpointClientName] = _applicationId;
        applicationToLinkedDevices[_applicationId] = _allDevices;
        uint deviceId = devices.push(newDevice) - 1;
        ownerDeviceCount[msg.sender]++;
        emit DeviceCreated(deviceId, msg.sender, _identifier, _publicKey, _applicationId, _applicationName, _endpointClientName, _allDevices);
        return deviceId;
    }
    function getDevicesByAppId(bytes32 _appId) public view returns (string memory) {
        return applicationToLinkedDevices[_appId];
    }
    function getAppIdByDeviceClientName(string memory _deviceClientName) public view returns (bytes32) {
        return deviceClientNameToAppId[_deviceClientName];
    }
}

/**
 * @title Provides extra functionalities for devices.
 */
contract DeviceHelper is DeviceBase {
    /**
      * @notice Gets all devices owned by specified address.
      * @dev Use this function instead of filtering DeviceCreated event since devices could have been transferred between owners.
      * @param _owner Owner address.
      * @return Array of device IDs.
      */
    function getDevicesByOwner(address _owner) public view returns (uint[] memory) {
        uint[] memory deviceIds = new uint[](ownerDeviceCount[_owner]);
        uint counter = 0;
        for (uint i = 0; i < devices.length; i++) {
            if (devices[i].owner == _owner) {
                deviceIds[counter] = i;
                counter++;
            }
        }
        return deviceIds;
    }

    /**
     * @notice Checks if device is also an entity.
     * @param _deviceId ID of a  device.
     * @return Boolean status.
     */
    function isDeviceAnEntity(uint _deviceId) public view returns (bool) {
        return devices[_deviceId].owner == address(uint160(uint256(devices[_deviceId].identifier)));
    }

    /**
     * @notice Checks if provided leaf is a member of metadata contained in Merkle tree.
     * Assumes that each pair of leaves and each pair of pre-images are sorted.
     * @param _deviceId ID of a device containing metadata hash.
     * @param _proof Merkle proof containing sibling hashes on the branch from the leaf to the root of the Merkle tree.
     * @param _leaf Leaf of Merkle tree.
     * @return Boolean status.
     */
//    function isValidMetadataMember(uint _deviceId, bytes32[] memory _proof, bytes32 _leaf) public view returns (bool) {
//        return MerkleProof.verifyProof(_proof, devices[_deviceId].metadataHash, _leaf);
//    }

    /**
     * @notice Checks if provided firmware hash is equal to firmware hash device property.
     * @param _deviceId ID of a device containing firmware hash.
     * @param _firmwareHash Firmware hash (not the actual hash).
     * @return Boolean status.
     */
//    function isValidFirmwareHash(uint _deviceId, string memory _firmwareHash) public view returns (bool) {
//        return devices[_deviceId].firmwareHash == _firmwareHash;
//    }

    /**
     * @notice Validate authenticity of message signed by Etherium private key.
     * On-chain validation is available only for Ethereum signed messages.
     * @param _deviceId ID of a device that signed the message.
     * @param _messageHash Hash of sent message.
     * @param _signature Signature generated using web3.eth.sign().
     * @return Boolean status.
     */
    function isValidEthMessage(uint _deviceId, bytes32 _messageHash, bytes memory _signature) public view returns (bool) {
        return ECRecovery.recover(_messageHash, _signature) == address(uint160(uint256(devices[_deviceId].identifier)));
    }
}

/**
 * @title Provides base functionalities for signatures.
 */
contract SignatureBase {
    /// @dev Main signature structucture.
    struct Signature {
        // Ethereum address of the signer.
        address signer;

        // ID of device to sign.
        uint deviceId;

        // Using 256 bits ensures no overflow on year 2038 (Unix seconds).
        uint expiryTime;

        // Updates to true once signer decides to revoke signature.
        bool revoked;
    }

    /// @notice State variable for storing signatures. Index in the array is also a signature ID.
    /// Array can hold a maximum of 2^256-1 entries.
    Signature[] public signatures;

    /// @notice Keeps track of total signatures for each device.
    mapping (uint => uint) public deviceSignatureCount;

    /// @dev Fired when an address signs a device.
    event DeviceSigned(uint indexed signatureId, uint indexed deviceId, address indexed signer, uint expiryTime);

    /// @dev Fired when signature is revoked.
    event SignatureRevoked(uint indexed signatureId, uint indexed deviceId);

    /// @dev Modifier for ensuring that the device hasn't been signed already.
    modifier notSigned(uint _deviceId) {
        require(deviceSignatureCount[_deviceId] == 0, "Must not be signed");
        _;
    }

    /**
     * @notice Signs a device and signature into storage. Emits DeviceSigned.
     * @param _deviceId ID of to be signed device.
     * @param _expiryTime Expiry time in Unix seconds.
     * @return Created signature ID.
     */
    function signDevice(uint _deviceId, uint _expiryTime) public returns (uint) {
        Signature memory signature = Signature(msg.sender, _deviceId, _expiryTime, false);
        uint signatureId = signatures.push(signature) - 1;
        deviceSignatureCount[_deviceId]++;

        emit DeviceSigned(signatureId, _deviceId, msg.sender, _expiryTime);
        return signatureId;
    }

    /**
     * @notice Revokes a signature. Emits SignatureRevoked.
     * @param _signatureId ID of to be revoked signature.
     */
    function revokeSignature(uint _signatureId) public {
        require(signatures[_signatureId].signer == msg.sender, "Only for creator of the signature");
        require(signatures[_signatureId].revoked == false, "Signature mustn't be revoked already");
        Signature storage signature = signatures[_signatureId];
        signature.revoked = true;
        deviceSignatureCount[signature.deviceId]--;

        emit SignatureRevoked(_signatureId, signature.deviceId);
    }
}

/**
 * @title Provides extra functionalities for signatures.
 */
contract SignatureHelper is SignatureBase {
    /**
     * @notice Gets all signatures for specific device.
     * @dev Use this function instead of filtering DeviceSigned event since signatures could have been revoked.
     * @param _deviceId ID of a device.
     * @return Array of signature IDs.
     */
    function getActiveSignaturesForDevice(uint _deviceId) public view returns (uint[] memory) {
        uint[] memory signatureIds = new uint[](deviceSignatureCount[_deviceId]);
        uint counter = 0;
        for (uint i = 0; i < signatures.length; i++) {
            if (signatures[i].deviceId == _deviceId && signatures[i].revoked == false) {
                signatureIds[counter] = i;
                counter++;
            }
        }
        return signatureIds;
    }
}

/**
 * @title Enriches devices giving them option to be updated only if not signed already.
 */
contract DeviceUpdatable is DeviceHelper, SignatureHelper {
    /// @dev Fired on device ownership transfer, keeps track of historical device owners.
    event DeviceTransfered(uint indexed deviceId, address oldOwner, address newOwner);

    /// @dev Fired on device property update, keeps track of historical property values.
    event DevicePropertyUpdated(uint indexed deviceId, bytes32 indexed property, bytes32 newValue);

    /**
     * @notice Transfer device ownership from one external account to another. Emits DeviceTransfered.
     * @param _deviceId ID of to be transfered device.
     * @param _to Address of new owner.
     */
    function transferDevice(uint _deviceId, address _to) public onlyOwnerOf(_deviceId) notSigned(_deviceId) {
        address currentOwner = devices[_deviceId].owner;
        devices[_deviceId].owner = _to;
        ownerDeviceCount[msg.sender]--;
        ownerDeviceCount[_to]++;

        emit DeviceTransfered(_deviceId, currentOwner, _to);
    }

    /**
     * @notice Update device with new identifier. Emits DevicePropertyUpdated.
     * @param _deviceId ID of a device.
     * @param _newIdentifier New identifier.
     */
    function updateIdentifier(uint _deviceId, bytes32 _newIdentifier) public onlyOwnerOf(_deviceId) notSigned(_deviceId) {
        devices[_deviceId].identifier = _newIdentifier;

        emit DevicePropertyUpdated(_deviceId, "identifier", _newIdentifier);
    }

    /**
     * @notice Update device with new metadata hash. Emits DevicePropertyUpdated.
     * @param _deviceId ID of a device.
     * @param _newPublicKey New PublicKey
     */
    function updateMetadataHash(uint _deviceId, string memory _newPublicKey) public onlyOwnerOf(_deviceId) notSigned(_deviceId) {
        devices[_deviceId].publicKey = _newPublicKey;

//        emit DevicePropertyUpdated(_deviceId, "metadata", _newMetadataHash);
    }

    /**
     * @notice Update device with new firmware hash. Emits DevicePropertyUpdated.
     * @param _deviceId ID of a device.
     * @param _newApplicationId New _newApplicationId.
     */
    function updateApplicationId(uint _deviceId, bytes32 _newApplicationId) public onlyOwnerOf(_deviceId) notSigned(_deviceId) {
        devices[_deviceId].applicationId = _newApplicationId;

//        emit DevicePropertyUpdated(_deviceId, "firmware", _newFirmwareHash);
    }
}

/// @title Device manager core contract.
contract Application is EntityBase, DeviceUpdatable {
    /// @dev Merges contracts.
}
//pragma solidity ^0.5.0;
//
//import "./MerkleProof.sol";
//import "./ECRecovery.sol";
//
///**
// * @title Provides base functionalities for entities.
// */
//contract EntityBase {
//    /// @dev Entity in the device management system.
//    struct Entity {
//        // Arbitary data in case entity wants to have some public information available.
//        string data;
//    }
//
//    /// @notice Maps owner to an Entity structure.
//    mapping (address => Entity) public ownerToEntity;
//
//    /// @dev Fired on entity data update.
//    event EntityDataUpdated(address indexed owner, string newData);
//
//    /**
//     * @notice Update entity data.
//     * @param _data Entity data.
//     */
//    function updateEntityData(string memory _data) public {
//        ownerToEntity[msg.sender].data = _data;
//
//        emit EntityDataUpdated(msg.sender, _data);
//    }
//}
//
///**
// * @title Provides base functionalities for devices.
// */
//contract DeviceBase {
//    /// @dev Main device structucture.
//    struct Device {
//        // Ethereum address of a device owner.
//        address owner;
//
//        // Unique device identifier. Can hold anything that fits into 32 bytes. Different from device ID.
//        // Supposed to be a public key or a representation of one, such as fingerprint of RSA/ECC
//        // public key or simply an Ethereum address. To make identifier be an Ethereum address,
//        // use secp256k1 curve to generate public and private key pair, run keccak256 hash function
//        // on public key and take last 20 bytes of generated hash to get Ethereum address.
//        // If a device wants to be it's own entity, use same address as in owner property.
//        bytes32 identifier;
//
//        // Merkle root hash of metadata or simple hash of concatenated data.
//        // It is recommended to use Merkle tree to store information on device as it enables to
//        // prove membership of specific data by providing Merkle proof without revealing whole dataset.
//        string metadataHash;
//
//        // Holds a hash of actual firmware hash. Actual firmware hash is not supposed to be stored.
//        // Plain text or hash would expose data that is meant to be private, so "hash of hash" principle
//        // gives privacy and makes integrity verification possible.
//        string firmwareHash;
//
//        //product ID that the device is linked to
////        bytes32 productID;
//        string endpointClientName;
//
//        // Additional data linked to device. Can be used to store hash of encrypted firmware on IPFS.
//        //string offchainLink;
//
//        // Full public key (even though parties can exchange public key other ways then use
//        // blockchain to verify.)
//        //string publicKey;
//    }
//
//    /// @notice State variable for storing devices. Index in the array is also a device ID.
//    /// Array can hold a maximum of 2^256-1 entries.
//    Device[] public devices;
//
//    /// @notice Keeps track of total devices for each owner.
//    mapping (address => uint) public ownerDeviceCount;
//
//    /// @dev Fired on creation of new device.
//    event DeviceCreated(uint indexed deviceId, address indexed owner, bytes32 identifier, string metadataHash, string firmwareHash, string endpointClientName);
//
//    /// @dev Modifier for ensuring that the message sender is owner of provided device ID.
//    modifier onlyOwnerOf(uint _deviceId) {
//        require(devices[_deviceId].owner == msg.sender, "Only for device owner");
//        _;
//    }
//
//    /**
//     * @notice Creates and saves device into storage. Emits DeviceCreated.
//     * @param _identifier Unique device identifier, such as fingerprint of RSA/ECC public key or Ethereum address (recommended).
//     * @param _metadataHash Merkle root hash of metadata (recommended) or simple hash of concatenated metadata.
//     * @param _firmwareHash Hash of actual firmware hash.
//     * @return Created device ID.
//     */
//    function createDevice(bytes32 _identifier, string memory _metadataHash, string memory _firmwareHash, string memory _endpointClientName) public returns (uint deviceID) {
////        Device memory newDevice = Device(msg.sender, _identifier, _metadataHash, _firmwareHash, _productID, _endpointClientName);
//        Device storage newDevice = DeviceClientNameToDeviceStruct[_endpointClientName];
//        newDevice.identifier = _identifier;
//        newDevice.metadataHash = _metadataHash;
//        newDevice.firmwareHash = _firmwareHash;
//        newDevice.endpointClientName = _endpointClientName;
//        uint deviceId = devices.push(newDevice) - 1;
//        ownerDeviceCount[msg.sender]++;
////        DeviceClientNameToDeviceStruct[_endpointClientName] = newDevice;
//        emit DeviceCreated(deviceId, msg.sender, _identifier, _metadataHash, _firmwareHash, _endpointClientName);
//        return deviceId;
//    }
//    mapping (string => Device) public DeviceClientNameToDeviceStruct; // access a Device struct directly from an ID
////    function getProductidByClientName(string memory _clientname) public view returns (bytes32 productID) {
//////        uint[] memory deviceIds = new uint[](ownerDeviceCount[_owner]);
////        Device memory device = DeviceClientNameToDeviceStruct[_clientname];
////        return device.productID;
////    }
////    function getdeviceFirmByClientName(string memory _clientname) public view returns (string memory firmware) {
////        Device memory device = DeviceClientNameToDeviceStruct[_clientname];
////        return device.firmwareHash;
////    }
//
//}
//
///**
// * @title Provides extra functionalities for devices.
// */
//contract DeviceHelper is DeviceBase {
//   /**
//     * @notice Gets all devices owned by specified address.
//     * @dev Use this function instead of filtering DeviceCreated event since devices could have been transferred between owners.
//     * @param _owner Owner address.
//     * @return Array of device IDs.
//     */
//    function getDevicesByOwner(address _owner) public view returns (uint[] memory) {
//        uint[] memory deviceIds = new uint[](ownerDeviceCount[_owner]);
//        uint counter = 0;
//        for (uint i = 0; i < devices.length; i++) {
//            if (devices[i].owner == _owner) {
//                deviceIds[counter] = i;
//                counter++;
//            }
//        }
//        return deviceIds;
//    }
//
////    function getLinkedProductId(uint _deviceId) public view returns (bytes32) {
////        return devices[_deviceId].productID;
////    }
//
//    function getFirmwarehash(uint _deviceId) public view returns (string memory) {
//        return devices[_deviceId].firmwareHash;
//    }
//    /**
//     * @notice Checks if device is also an entity.
//     * @param _deviceId ID of a  device.
//     * @return Boolean status.
//     */
//    function isDeviceAnEntity(uint _deviceId) public view returns (bool) {
//        return devices[_deviceId].owner == address(uint160(uint256(devices[_deviceId].identifier)));
//    }
//
//
//    /**
//     * @notice Checks if provided leaves are members of metadata contained in Merkle tree.
//     * Assumes that each pair of leaves and each pair of pre-images are sorted.
//     * @param _deviceId ID of a device containing metadata hash.
//     * @param _proof Merkle proof containing sibling hashes on the branch from the leaf to the root of the Merkle tree.
//     * @param _leaf Leaf of Merkle tree.
//     * @return Boolean status.
//     */
////    function isValidMetadataMember(uint _deviceId, bytes32[] memory _proof, bytes32 _leaf) public view returns (bool) {
////        return MerkleProof.verifyProof(_proof, devices[_deviceId].metadataHash, _leaf);
////    }
//
//    /**
//     * @notice Checks if provided firmware hash is equal to firmware hash device property.
//     * @param _deviceId ID of a device containing firmware hash.
//     * @param _firmwareHash Firmware hash (not the actual hash).
//     * @return Boolean status.
//     */
////    function isValidFirmwareHash(uint _deviceId,  _firmwareHash) public view returns (bool) {
////        bytes32 current = devices[_deviceId].firmwareHash;
////        return devices[_deviceId].firmwareHash != _firmwareHash;
////    }
//
////
////    function printFirmwareHashCurrent(uint _deviceId, bytes32 _firmwareHash) public view returns (bytes32) {
////        bytes32 current = devices[_deviceId].firmwareHash;
////        return current;
////    }
////    function printFirmwareHash(uint _deviceId, bytes32 _firmwareHash) public view returns (bytes32) {
////        return _firmwareHash;
////    }
//
//    /**
//     * @notice Validate authenticity of message signed by Etherium private key.
//     * On-chain validation is available only for Ethereum signed messages.
//     * @param _deviceId ID of a device that signed the message.
//     * @param _messageHash Hash of sent message.
//     * @param _signature Signature generated using web3.eth.sign().
//     * @return Boolean status.
//     */
//    function isValidEthMessage(uint _deviceId, bytes32 _messageHash, bytes memory _signature) public view returns (bool) {
//        return ECRecovery.recover(_messageHash, _signature) == address(uint160(uint256(devices[_deviceId].identifier)));
//    }
//}
//
///**
// * @title Provides base functionalities for signatures.
// */
//contract SignatureBase {
//    /// @dev Main signature structucture.
//    struct Signature {
//        // Ethereum address of the signer.
//        address signer;
//
//        // ID of device to sign.
//        uint deviceId;
//
//        // Using 256 bits ensures no overflow on year 2038 (Unix seconds).
//        uint expiryTime;
//
//        // Updates to true once signer decides to revoke signature.
//        bool revoked;
//    }
//
//    /// @notice State variable for storing signatures. Index in the array is also a signature ID.
//    /// Array can hold a maximum of 2^256-1 entries.
//    Signature[] public signatures;
//
//    /// @notice Keeps track of total signatures for each device.
//    mapping (uint => uint) public deviceSignatureCount;
//
//    /// @dev Fired when an address signs a device.
//    event DeviceSigned(uint indexed signatureId, uint indexed deviceId, address indexed signer, uint expiryTime);
//
//    /// @dev Fired when signature is revoked.
//    event SignatureRevoked(uint indexed signatureId, uint indexed deviceId);
//
//    /// @dev Modifier for ensuring that the device hasn't been signed already.
//    modifier notSigned(uint _deviceId) {
//        require(deviceSignatureCount[_deviceId] == 0, "Must not be signed");
//        _;
//    }
//
//    /**
//     * @notice Signs a device and signature into storage. Emits DeviceSigned.
//     * @param _deviceId ID of to be signed device.
//     * @param _expiryTime Expiry time in Unix seconds.
//     * @return Created signature ID.
//     */
//    function signDevice(uint _deviceId, uint _expiryTime) public returns (uint) {
//        Signature memory signature = Signature(msg.sender, _deviceId, _expiryTime, false);
//        uint signatureId = signatures.push(signature) - 1;
//        deviceSignatureCount[_deviceId]++;
//
//        emit DeviceSigned(signatureId, _deviceId, msg.sender, _expiryTime);
//        return signatureId;
//    }
//
//    /**
//     * @notice Revokes a signature. Emits SignatureRevoked.
//     * @param _signatureId ID of to be revoked signature.
//     */
//    function revokeSignature(uint _signatureId) public {
//        require(signatures[_signatureId].signer == msg.sender, "Only for creator of the signature");
//        require(signatures[_signatureId].revoked == false, "Signature mustn't be revoked already");
//        Signature storage signature = signatures[_signatureId];
//        signature.revoked = true;
//        deviceSignatureCount[signature.deviceId]--;
//
//        emit SignatureRevoked(_signatureId, signature.deviceId);
//    }
//}
//
///**
// * @title Provides extra functionalities for signatures.
// */
//contract SignatureHelper is SignatureBase {
//    /**
//     * @notice Gets all signatures for specific device.
//     * @dev Use this function instead of filtering DeviceSigned event since signatures could have been revoked.
//     * @param _deviceId ID of a device.
//     * @return Array of signature IDs.
//     */
//    function getActiveSignaturesForDevice(uint _deviceId) public view returns (uint[] memory) {
//        uint[] memory signatureIds = new uint[](deviceSignatureCount[_deviceId]);
//        uint counter = 0;
//        for (uint i = 0; i < signatures.length; i++) {
//            if (signatures[i].deviceId == _deviceId && signatures[i].revoked == false) {
//                signatureIds[counter] = i;
//                counter++;
//            }
//        }
//        return signatureIds;
//    }
//}
//
///**
// * @title Enriches devices giving them option to be updated only if not signed already.
// */
//contract DeviceUpdatable is DeviceHelper, SignatureHelper {
//    /// @dev Fired on device ownership transfer, keeps track of historical device owners.
//    event DeviceTransfered(uint indexed deviceId, address oldOwner, address newOwner);
//
//    /// @dev Fired on device property update, keeps track of historical property values.
//    event DevicePropertyUpdated(uint indexed deviceId, bytes32 indexed property, string newValue);
//
//    /**
//     * @notice Transfer device ownership from one external account to another. Emits DeviceTransfered.
//     * @param _deviceId ID of to be transfered device.
//     * @param _to Address of new owner.
//     */
//    function transferDevice(uint _deviceId, address _to) public onlyOwnerOf(_deviceId) notSigned(_deviceId) {
//        address currentOwner = devices[_deviceId].owner;
//        devices[_deviceId].owner = _to;
//        ownerDeviceCount[msg.sender]--;
//        ownerDeviceCount[_to]++;
//
//        emit DeviceTransfered(_deviceId, currentOwner, _to);
//    }
//
//    /**
//     * @notice Update device with new identifier. Emits DevicePropertyUpdated.
//     * @param _deviceId ID of a device.
//     * @param _newIdentifier New identifier.
//     */
//    function updateIdentifier(uint _deviceId, bytes32 _newIdentifier) public onlyOwnerOf(_deviceId) notSigned(_deviceId) {
//        devices[_deviceId].identifier = _newIdentifier;
//
////        emit DevicePropertyUpdated(_deviceId, "identifier", _newIdentifier);
//    }
//
//
//    /**
//     * @notice Update device with new metadata hash. Emits DevicePropertyUpdated.
//     * @param _deviceId ID of a device.
//     * @param _newMetadataHash New metadata hash.
//     */
//    function updateMetadataHash(uint _deviceId, string memory _newMetadataHash) public onlyOwnerOf(_deviceId) notSigned(_deviceId) {
//        devices[_deviceId].metadataHash = _newMetadataHash;
//
//        emit DevicePropertyUpdated(_deviceId, "metadata", _newMetadataHash);
//    }
//
//    /**
//     * @notice Update device with new firmware hash. Emits DevicePropertyUpdated.
//     * @param _deviceId ID of a device.
//     * @param _newFirmwareHash New firmware hash.
//     */
//    function updateFirmwareHash(uint _deviceId, string memory _newFirmwareHash) public onlyOwnerOf(_deviceId) notSigned(_deviceId) {
//        devices[_deviceId].firmwareHash = _newFirmwareHash;
//
//        emit DevicePropertyUpdated(_deviceId, "firmware", _newFirmwareHash);
//    }
//
////    function updateProductID(uint _deviceId, bytes32 _newProductID) public onlyOwnerOf(_deviceId) notSigned(_deviceId) {
////        devices[_deviceId].productID = _newProductID;
////
////    }
//
//}
//
///// @title Device manager core contract.
//contract DeviceManager is EntityBase, DeviceUpdatable {
//    /// @dev Merges contracts.
//}
