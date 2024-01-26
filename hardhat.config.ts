import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "./scripts/tasks";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  mocha: {
    timeout: 100000,
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
  },
};

export default config;
