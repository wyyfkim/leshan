#!/bin/bash

truffle compile && truffle migrate --reset && cd deviceManagement && truffle migrate --reset && cd .. && cp deviceManagement/build/contracts/DeviceManager.json src/deviceManagement/artifacts/DeviceManager.json