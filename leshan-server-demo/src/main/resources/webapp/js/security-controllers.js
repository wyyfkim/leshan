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

angular.module('securityControllers', [])

.controller('SecurityCtrl', [
    '$scope',
    '$http',
    'dialog',
    function SecurityCtrl($scope, $http, dialog) {
        // let instance;
        // let account;
        // let getWeb3 = new Promise(function (resolve, reject) {
        //     window.addEventListener('load', function () {
        //         let results;
        //         let web3 = window.web3;
        //         if (typeof web3 !== 'undefined') {
        //             web3 = new Web3(web3.currentProvider);
        //             results = {
        //                 web3: web3
        //             };
        //             resolve(results)
        //         } else {
        //             let provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
        //             web3 = new Web3(provider);
        //             results = {
        //                 web3: web3
        //             };
        //             reject(results);
        //         }
        //     })
        // })
        // let DeviceManager = new Promise(function (resolve, reject) {
        //     getWeb3.then(results => {
        //         web3 = results.web3;
        //         account = web3.eth.defaultAccount
        //         console.log("account")
        //         console.log(account)
        //         var abiStr = '[{"constant": false,"inputs": [{"internalType": "bytes32","name": "_identifier","type": "bytes32"},{"internalType": "string","name": "_metadataHash","type": "string"},{"internalType": "string","name": "_firmwareHash","type": "string"},{"internalType": "bytes32","name": "_productID","type": "bytes32"}],"name": "createDevice","outputs": [{"internalType": "uint256","name": "deviceID","type": "uint256"}],"payable": false,"stateMutability": "nonpayable","type": "function"}]';
        //         var abiJSON = JSON.parse(abiStr);
        //         var constractAddress = "0xfcf863df98849cfa04b080c35d09a83d312a1f0c";
        //         var deviceContract = web3.eth.contract(abiJSON);
        //         var deviceManager = deviceContract.at(constractAddress)
        //         instance = deviceManager;
        //         return deviceManager;
        //     }).catch(error => {
        //         reject(error);
        //     });
        // });
        function toHex(byteArray){
            var hex = [];
            for (var i in byteArray){
                hex[i] = byteArray[i].toString(16).toUpperCase();
                if (hex[i].length === 1){
                    hex[i] = '0' + hex[i];
                }
            }
            return hex.join('');
        };
        function base64ToBytes(base64){
            var byteKey = atob(base64);
            var byteKeyLength = byteKey.length;
            var array = new Uint8Array(new ArrayBuffer(byteKeyLength));
            for(i = 0; i < byteKeyLength; i++) {
              array[i] = byteKey.charCodeAt(i);
            }
            return array;
        }
        
        // update navbar
        angular.element("#navbar").children().removeClass('active');
        angular.element("#security-navlink").addClass('active');

        // get the list of security info by end-point
        $http.get('api/security/clients'). error(function(data, status, headers, config){
            $scope.error = "Unable to get the clients security info list: " + status + " " + data;
            console.error($scope.error);
        }).success(function(data, status, headers, config) {
            $scope.securityInfos = {};
            for (var i = 0; i < data.length; i++) {
                $scope.securityInfos[data[i].endpoint] = data[i];
            }
        });

        $http.get('api/security/server'). error(function(data, status, headers, config){
            $scope.error = "Unable to get the server security info list: " + status + " " + data;
            console.error($scope.error);
        }).success(function(data, status, headers, config) {
            if (data.certificate){
                $scope.certificate = data.certificate
                $scope.certificate.bytesDer = base64ToBytes($scope.certificate.b64Der);
                $scope.certificate.hexDer = toHex($scope.certificate.bytesDer);

                $scope.pubkey = data.certificate.pubkey;
                $scope.pubkey.bytesDer = base64ToBytes($scope.pubkey.b64Der);
                $scope.pubkey.hexDer = toHex($scope.pubkey.bytesDer);
            } else if (data.pubkey) {
                $scope.pubkey = data.pubkey;
                $scope.pubkey.bytesDer = base64ToBytes($scope.pubkey.b64Der);
                $scope.pubkey.hexDer = toHex($scope.pubkey.bytesDer);
            }
        });

        $scope.remove = function(endpoint) {
            $http({method: 'DELETE', url: "api/security/clients/" + endpoint, headers:{'Content-Type': 'text/plain'}})
            .success(function(data, status, headers, config) {
                delete $scope.securityInfos[endpoint];
           }).error(function(data, status, headers, config) {
               errormessage = "Unable to remove security info for endpoint " + endpoint + ": " + status + " - " + data;
               dialog.open(errormessage);
               console.error(errormessage);
            });
        };

        $scope.saveFile = function(filename, bytes) {
            var blob = new Blob([bytes], {type: "application/octet-stream"});
            saveAs(blob, filename);
        };

        $scope.save = function() {
            $scope.$broadcast('show-errors-check-validity');
            let getWeb3 = new Web3(window.web3.currentProvider);
            let account = getWeb3.eth.defaultAccount;
            let DeviceABIstr = '[{"constant": false,"inputs": [{"internalType": "bytes32","name": "_identifier","type": "bytes32"},{"internalType": "string","name": "_metadataHash","type": "string"},{"internalType": "string","name": "_firmwareHash","type": "string"},{"internalType": "string","name": "_endpointClientName","type": "string"}],"name": "createDevice","outputs": [{"internalType": "uint256","name": "","type": "uint256"}],"payable": false,"stateMutability": "nonpayable","type": "function"}]';
            let DeviceABIJSON = JSON.parse(DeviceABIstr);
            let DeviceConstractAddress = "0x73651f89379550EBFD84b394579Fb1d8604eAc01";
            let DeviceContract = web3.eth.contract(DeviceABIJSON);
            let DeviceManager = DeviceContract.at(DeviceConstractAddress)
            if ($scope.form.$valid) {
                if($scope.securityMode == "psk") {
                    var security = {endpoint: $scope.endpoint, psk : { identity : $scope.pskIdentity , key : $scope.pskValue}};
                    console.log("sghaldkjfgh!!!!")
                    console.log(DeviceManager)
                    console.log(String($scope.pskIdentity).valueOf())
                    console.log(String($scope.pskValue).valueOf())
                    console.log(String($scope.endpoint).valueOf())

                    // DeviceManager.createDevice("0x1234", String($scope.pskIdentity).valueOf(), String($scope.pskValue).valueOf(), String($scope.endpoint).valueOf(), { from: account}, (error, txHash) => {
                    //     console.log(error)
                    //     console.log(txHash)
                    // });
                    // console.log("sghaldkjfgh!!!2")

                } else if($scope.securityMode == "rpk") {
                    var security = {endpoint: $scope.endpoint, rpk : { x : $scope.rpkXValue , y : $scope.rpkYValue, params : $scope.rpkParamsValue || $scope.defaultParams}};
                } else {
                    var security = {endpoint: $scope.endpoint, x509 : true};
                }
                console.log("security printing..")
                console.log(security)
                if(security) {
                    $http({method: 'PUT', url: "api/security/clients/", data: security, headers:{'Content-Type': 'text/plain'}})
                    .success(function(data, status, headers, config) {
                        $scope.securityInfos[$scope.endpoint] = security;
                        $('#newSecurityModal').modal('hide');
                    }).error(function(data, status, headers, config) {
                        errormessage = "Unable to add security info for endpoint " + $scope.endpoint + ": " + status + " - " + data;
                        dialog.open(errormessage);
                        console.error(errormessage);
                    });
                }
            }
        };

        $scope.showModal = function() {
            $('#newSecurityModal').modal('show');
            $scope.$broadcast('show-errors-reset');
            $scope.endpoint = '';
            $scope.securityMode = 'psk';
            $scope.pskIdentity = '';
            $scope.pskValue = '';
            $scope.rpkXValue = '';
            $scope.rpkYValue = '';
            $scope.defaultParams = 'secp256r1';
       };
}])


/* directive to toggle error class on input fields */
.directive('showErrors', function($timeout) {
    return {
        restrict : 'A',
        require : '^form',
        link : function(scope, el, attrs, formCtrl) {
            // find the text box element, which has the 'name' attribute
            var inputEl = el[0].querySelector("[name]");
            // convert the native text box element to an angular element
            var inputNgEl = angular.element(inputEl);
            // get the name on the text box
            var inputName = inputNgEl.attr('name');

            // only apply the has-error class after the user leaves the text box
            inputNgEl.bind('blur', function() {
                el.toggleClass('has-error', formCtrl[inputName].$invalid);
            });

            scope.$on('show-errors-check-validity', function() {
                el.toggleClass('has-error', formCtrl[inputName].$invalid);
            });

            scope.$on('show-errors-reset', function() {
                $timeout(function() {
                    el.removeClass('has-error');
                }, 0, false);
            });
        }
    };
});
