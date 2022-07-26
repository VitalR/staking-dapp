require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("dotenv").config();

const { PRIVATE_KEY_TESTNET, ALCHEMY_KEY, ETHERSCAN_API_KEY, PRIVATE_KEY_MAINNET } = process.env;

module.exports = {
  networks: {
    rinkeby: { 
      url: `https://eth-rinkeby.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: [PRIVATE_KEY_TESTNET]
    }, 
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
      accounts: [PRIVATE_KEY_MAINNET]
    },
  },
  solidity: {
    version: "0.8.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500
      }
    }
  },
  paths: {
    artifacts: ".client/src/artifacts"
  },
  gasPrice: "10000000000",
  gas: "auto",
  gasReporter: {
    gasPrice: 1,
    enabled: true,
    showTimeSpent: true,
    currency: "USD",
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  }
};
