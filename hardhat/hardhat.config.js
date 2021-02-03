require('@nomiclabs/hardhat-ethers');
require('hardhat-abi-exporter');
/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const ROPSTEN_PRIVATE_KEY = 'f47115090f7b3ef2db325ae36739f100bb974bb3db3a6b3a43f49c0075085bba';
const INFURA_PROJECT_ID = 'dbb5964e1c98437389d0c43ee39db58a';


module.exports = {
    solidity: {
        version: "0.8.0",
        // docker: true,
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
            //evmVersion: "byzantium"
        }
    },
    abiExporter: {
        path: './abi',
        flat: true
    },
    networks: {
        ropsten: {
            url: `https://ropsten.infura.io/v3/${INFURA_PROJECT_ID}`,
            accounts: [`0x${ROPSTEN_PRIVATE_KEY}`]
        },

        elatest: {
            url: 'http://api.elastos.io:21636',
            accounts: [`0x${ROPSTEN_PRIVATE_KEY}`]
        },
    },
};
