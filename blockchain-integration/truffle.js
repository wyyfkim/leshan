// module.exports = {
//   // See <http://truffleframework.com/docs/advanced/configuration>
//   // to customize your Truffle configuration!
//   networks: {
//     development: {
//       host: "localhost",
//       port: 9545,
//       network_id: "*",
//     }
//   }
// };

const fs = require('fs');
const HDWalletProvider = require('truffle-hdwallet-provider');


let secrets;

if (fs.existsSync('secrets.json')) {
  secrets = JSON.parse(fs.readFileSync('secrets.json', 'utf8'));
}

module.exports = {
  networks: {
    development: {
        network_id: "*",
        host: 'localhost',
        port: 9545
    }
  },
    compilers: {
        solc: {
            // version: "0.4.17"  // ex:  "0.4.20". (Default: Truffle's installed solc)
            version: "0.5.0"  // ex:  "0.4.20". (Default: Truffle's installed solc)

        }
    }
};