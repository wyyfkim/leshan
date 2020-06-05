#!/bin/bash

truffle compile && truffle migrate --reset && cp build/contracts/ApplicationManagement.json src/deviceManagement/artifacts/Application.json && cp build/contracts/Application.json src/deviceManagement/artifacts/DeviceManager.json
#truffle compile && truffle migrate --reset && cp build/contracts/PassageMain.json src/deviceManagement/artifacts/Application.json && cd deviceManagement && truffle migrate --reset && cd .. && cp deviceManagement/build/contracts/DeviceManager.json src/deviceManagement/artifacts/DeviceManager.json