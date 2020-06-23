/*******************************************************************************
 * Copyright (c) 2013-2015 Sierra Wireless and others.
 * 
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * and Eclipse Distribution License v1.0 which accompany this distribution.
 * 
 * The Eclipse Public License is available at
 *    http://www.eclipse.org/legal/epl-v20.html
 * and the Eclipse Distribution License is available at
 *    http://www.eclipse.org/org/documents/edl-v10.html.
 * 
 * Contributors:
 *     Sierra Wireless - initial API and implementation
 *******************************************************************************/
angular.module('resourceDirectives', [])
.directive('resource',

    function ($compile, $routeParams, $http, dialog, $filter, lwResources, $modal, helper) {
        let provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
        let getWeb3 = new Web3(provider);
        console.log(getWeb3)
        getWeb3.eth.defaultAccount = getWeb3.eth.accounts[0]
        console.log(getWeb3.eth.defaultAccount)
        window.ethereum.enable();

        console.log(getWeb3.eth.accounts)
        let account = getWeb3.eth.accounts[0];
        console.log(account)

        //ProductManager
        //addProductAlert, getProductByID
        let productABIstr = '[{"constant": false,"inputs": [{"name": "_productId","type": "bytes32"},{"name": "_alertData","type": "string"}],"name": "addTemperaturAlert","outputs": [{"name": "newAlert","type": "string"}],"payable": false,"stateMutability": "nonpayable","type": "function"},' +
            '{"constant": false,"inputs": [{"name": "_productId","type": "bytes32"},{"name": "_alertData","type": "string"}],"name": "addLocationAlert","outputs": [{"name": "newAlert","type": "string"}],"payable": false,"stateMutability": "nonpayable","type": "function"},' +
            '{"constant": true,"inputs": [{"name": "_deviceClientName","type": "string"}],"name": "getProductByDeviceClientName","outputs": [{"name": "productId","type": "bytes32"}],"payable": false,"stateMutability": "view","type": "function"},' +
            '{"constant": true,"inputs": [{"name": "_productId","type": "bytes32"},{"name": "specificVersionId","type": "bytes32"}],"name": "getProductByIdExtra","outputs": [{"name": "deviceClientName","type": "string"},{"name": "tempAlertStr","type": "string"},{"name": "locAlertStr","type": "string"}],"payable": false,"stateMutability": "view","type": "function"}]';
        let productABIJSON = JSON.parse(productABIstr);
        let productConstractAddress = "0x85426d54Ff0AA5e791711e1015C0fCF39cD2B247";
        let productContract = web3.eth.contract(productABIJSON);
        let productManager = productContract.at(productConstractAddress)

        //DeviceManager
        //getAppIdByDeviceClientName
        let deviceABIstr = '[{"constant": true,"inputs": [{"internalType": "string","name": "_deviceClientName","type": "string"}],"name": "getAppIdByDeviceClientName","outputs": [{"internalType": "bytes32","name": "","type": "bytes32"}],"payable": false,"stateMutability": "view","type": "function"},' +
            '{"constant": true,"inputs": [{"name": "_deviceClientName","type": "string"}],"name": "getThresholdByDeviceClientName","outputs": [{"name": "","type": "string"}],"payable": false,"stateMutability": "view","type": "function"}]';
        let deviceABIJSON = JSON.parse(deviceABIstr);
        let deviceConstractAddress = "0x4306b8EEe5C93Af5B42C2094Bb127867FA4a4D39";
        let deviceContract = web3.eth.contract(deviceABIJSON);
        let deviceManager = deviceContract.at(deviceConstractAddress)
    return {
        restrict: "E",
        replace: true,
        scope: {
            resource: '=',
            parent: '=',
            settings: '='
        },
        templateUrl: "partials/resource.html",
        link: function (scope, element, attrs) {
            scope.resource.path = scope.parent.path + "/" + scope.resource.def.id;
            scope.resource.read  =  {tooltip : "Read <br/>"   + scope.resource.path};
            scope.resource.write =  {tooltip : "Write <br/>"  + scope.resource.path};
            scope.resource.exec  =  {tooltip : "Execute <br/>"+ scope.resource.path};
            scope.resource.execwithparams = {tooltip : "Execute with parameters<br/>"+ scope.resource.path};
            scope.resource.observe  =  {tooltip : "Observe <br/>"+ scope.resource.path};

            scope.readable = function() {
                if(scope.resource.def.hasOwnProperty("operations")) {
                    return scope.resource.def.operations.indexOf("R") != -1;
                }
                return false;
            };

            scope.writable = function() {
                if(scope.resource.def.instancetype != "multiple") {
                    if(scope.resource.def.hasOwnProperty("operations")) {
                        return scope.resource.def.operations.indexOf("W") != -1;
                    }
                }
                return false;
            };

            scope.executable = function() {
                if(scope.resource.def.instancetype != "multiple") {
                    if(scope.resource.def.hasOwnProperty("operations")) {
                        return scope.resource.def.operations.indexOf("E") != -1;
                    }
                }
                return false;
            };

            scope.display = function(resource){
                if (resource.def.type === "opaque" && resource.value){
                    return "0x"+resource.value;
                }
                return resource.value;
            }

            scope.startObserve = function() {
                var format = scope.settings.single.format;
                var timeout = scope.settings.timeout.value;
                var uri = "api/clients/" + $routeParams.clientId + scope.resource.path+"/observe";
                $http.post(uri, null,{params:{format:format, timeout:timeout}})
                .success(function(data, status, headers, config) {
                    helper.handleResponse(data, scope.resource.observe, function (formattedDate){
                        if (data.success) {
                            scope.resource.observed = true;
                            if("value" in data.content) {
                                // single value
                                scope.resource.value = data.content.value;
                            }
                            else if("values" in data.content) {
                                // multiple instances
                                var tab = new Array();
                                for (var i in data.content.values) {
                                    tab.push(i+"="+data.content.values[i]);
                                }
                                scope.resource.value = tab.join(", ");
                            }
                            scope.resource.valuesupposed = false;
                            scope.resource.tooltip = formattedDate;
                        }	
                	});
                }).error(function(data, status, headers, config) {
                    if (status == 504){
                        helper.handleResponse(null, scope.resource.observe);
                    } else {
                        errormessage = "Unable to start observation on resource " + scope.resource.path + " for "+ $routeParams.clientId + " : " + status +" "+ data;
                        dialog.open(errormessage);
                    }
                    console.error(errormessage);
                });
            };

            scope.stopObserve = function() {
                var timeout = scope.settings.timeout.value;
                var uri = "api/clients/" + $routeParams.clientId + scope.resource.path + "/observe";
                $http.delete(uri)
                .success(function(data, status, headers, config) {
                    scope.resource.observed = false;
                    scope.resource.observe.stop = "success";
                }).error(function(data, status, headers, config) {
                    errormessage = "Unable to stop observation on resource " + scope.resource.path + " for "+ $routeParams.clientId + " : " + status +" "+ data;
                    dialog.open(errormessage);
                    console.error(errormessage);
                });
            };


            scope.read = function() {

                var timeout = scope.settings.timeout.value;
                var format = scope.settings.single.format;
                var uri = "api/clients/" + $routeParams.clientId + scope.resource.path;
                $http.get(uri, {params:{format:format, timeout:timeout}})
                .success(function(data, status, headers, config) {
                    // manage request information
                    helper.handleResponse(data, scope.resource.read, function (formattedDate){
                        if (data.success && data.content) {
                            var date = new Date()
                            var dateStr = date.toLocaleString(undefined, {day: 'numeric',month: 'numeric',year: 'numeric', hour: '2-digit', minute: '2-digit'})
                            if (scope.resource.path == "/3303/0/5700") {
                                console.log(productManager)
                                console.log(deviceManager)
                                deviceManager.getThresholdByDeviceClientName(String($routeParams.clientId).valueOf(), (error, thre) => {
                                    if (data.content.value > parseInt(thre)) {
                                        deviceManager.getAppIdByDeviceClientName(String($routeParams.clientId).valueOf(), (error, productID) => {
                                            console.log(productID) //result[0]->id  result[1]->oldAlertStr
                                            productManager.getProductByIdExtra(productID, "latest", (error, result) => {
                                                let oldAlertStr = result[1]
                                                console.log(oldAlertStr)
                                                var alertStr = "Temperature " + data.content.value + "cel is higher than " + thre + "cel ---- from device: " + $routeParams.clientId + " ---- " + dateStr;
                                                let newAlertStr = oldAlertStr + ";" + alertStr
                                                console.log(newAlertStr)

                                                productManager.addTemperaturAlert(
                                                    productID,
                                                    newAlertStr, {from: account}, (error, result) => {
                                                        console.log("inside!!!!3")
                                                        console.log(result)
                                                    })
                                                console.log("the end~")
                                            })
                                        })
                                    }
                                })
                            }
                            let target = 0
                            let locStr = ''
                            if (scope.resource.path == "/6/0/0") {
                                let latRand = Math.floor(Math.random() * 100) + 1; // returns a random integer from 1 to 100
                                let lonRand = Math.floor(Math.random() * 100) + 1; // returns a random integer from 1 to 100
                                locStr = latRand+","+lonRand
                                target = 1
                                deviceManager.getThresholdByDeviceClientName(String($routeParams.clientId).valueOf(), (error, thre) => {

                                    let splittedStr = thre.split(",")
                                    let lat = splittedStr[0]
                                    let lon = splittedStr[1]
                                    let rad = parseInt(splittedStr[2])
                                    let dist = Math.sqrt(Math.pow(lat-latRand, 2) +  Math.pow(lon-lonRand, 2))
                                    if (dist > rad) {
                                        deviceManager.getAppIdByDeviceClientName(String($routeParams.clientId).valueOf(), (error, productID) => {
                                            console.log(productID) //result[0]->id  result[1]->oldAlertStr
                                            productManager.getProductByIdExtra(productID, "latest", (error, result) => {
                                                let oldAlertStr = result[2]
                                                console.log(oldAlertStr)
                                                var alertStr = "Current location is " + locStr + ", " + dist + " away from "+ lat+","+lon + " ---- from device: " + $routeParams.clientId + " ---- " + dateStr;
                                                // var alertStr = "Latitude alert: " + data.content.value + " ---- from device: " + $routeParams.clientId + " ---- " + dateStr;
                                                let newAlertStr = oldAlertStr + ";" + alertStr
                                                console.log(newAlertStr)
                                                productManager.addLocationAlert(productID, newAlertStr, {from: account}, function (error, result) {
                                                    console.log("inside!!!!3")
                                                    console.log(result)
                                                })
                                                console.log("the end~")
                                            })
                                        })
                                    }
                                })
                            }
                            if("value" in data.content) {
                                if (target) {
                                    scope.resource.value = locStr;
                                } else {
                                    // single value
                                    scope.resource.value = data.content.value;
                                }
                            }
                            else if("values" in data.content) {
                                // multiple instances
                                var tab = new Array();
                                for (var i in data.content.values) {
                                    tab.push(i+"="+data.content.values[i]);
                                }
                                scope.resource.value = tab.join(", ");
                            }
                            scope.resource.valuesupposed = false;
                            scope.resource.tooltip = formattedDate;
                        }
                    });
                }).error(function(data, status, headers, config) {
                    if (status == 504){
                        helper.handleResponse(null, scope.resource.read);
                    } else { 
                        errormessage = "Unable to read resource " + scope.resource.path + " for "+ $routeParams.clientId + " : " + status +" "+ data;
                        dialog.open(errormessage);
                    }
                    console.error(errormessage);
                });
            };

            scope.write = function() {
                var modalResource = $modal.open({
                    templateUrl: 'partials/modal-resource.html',
                    controller: 'modalResourceController',
                    resolve: {
                      instance: function() {return scope.parent;},
                      resource: function() {return scope.resource;},
                    }
                  });

                modalResource.result.then(function (resource) {
                    resource.getPromisedValue().then(function(resourceValue){
                        // Build payload
                        var payload = {};
                        payload["id"] = resource.id;
                        payload["value"] = lwResources.getTypedValue(resourceValue, resource.def.type);

                        // Send request
                        var format = scope.settings.multi.format;
                        var timeout = scope.settings.timeout.value;
                        $http({method: 'PUT', url: "api/clients/" + $routeParams.clientId + scope.resource.path, data: payload, headers:{'Content-Type': 'application/json'},params:{format:format, timeout:timeout}})
                        .success(function(data, status, headers, config) {
                            helper.handleResponse(data, scope.resource.write, function (formattedDate){
                                if (data.success) {
                                    scope.resource.value = payload["value"];
                                    scope.resource.valuesupposed = true;
                                    scope.resource.tooltip = formattedDate;
                                }
                            });
                        }).error(function(data, status, headers, config) {
                            if (status == 504){
                                helper.handleResponse(null, scope.resource.write);
                            } else { 
                                errormessage = "Unable to write resource " + scope.resource.path + " for "+ $routeParams.clientId + " : " + status +" "+ data;
                                dialog.open(errormessage);
                            }
                            console.error(errormessage);
                        });
                    });
                });
            };

            scope.exec = function() {
                var timeout = scope.settings.timeout.value;
                $http({method:'POST', url:"api/clients/" + $routeParams.clientId+ scope.resource.path, params:{timeout:timeout}})
                .success(function(data, status, headers, config) {
                    helper.handleResponse(data, scope.resource.exec);
                }).error(function(data, status, headers, config) {
                    if (status == 504){
                        helper.handleResponse(null, scope.resource.exec);
                    } else { 
                        errormessage = "Unable to execute resource " + scope.resource.path + " for "+ $routeParams.clientId + " : " + status +" "+ data;
                        dialog.open(errormessage);
                    }
                    console.error(errormessage);
                });
            };

            scope.execWithParams = function() {
                $('#writeModalLabel').text(scope.resource.def.name);
                $('#writeInputValue').val(scope.resource.value);
                $('#writeSubmit').unbind();
                $('#writeSubmit').click(function(e){
                    e.preventDefault();
                    var value = $('#writeInputValue').val();

                    if(value) {
                        $('#writeModal').modal('hide');
                        var timeout = scope.settings.timeout.value;
                        $http({method: 'POST', url: "api/clients/" + $routeParams.clientId + scope.resource.path, data: value, params:{timeout:timeout}})
                        .success(function(data, status, headers, config) {
                            helper.handleResponse(data, scope.resource.exec);
                        }).error(function(data, status, headers, config) {
                            if (status == 504){
                                helper.handleResponse(null, scope.resource.exec);
                            } else { 
                                errormessage = "Unable to execute resource " + scope.resource.path + " for "+ $routeParams.clientId + " : " + status +" "+ data;
                                dialog.open(errormessage);
                            }
                            console.error(errormessage);
                        });
                    }
                });
                $('#writeModal').modal('show');
            };
        }
    };
});
