var ApplicationManager = artifacts.require("./ApplicationManagement.sol");
var Application = artifacts.require("./Application.sol");


module.exports = function(deployer) {
  deployer.deploy(ApplicationManager);
  deployer.deploy(Application);

};
