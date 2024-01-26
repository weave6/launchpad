import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { PromiseOrValue } from "../typechain-types/common";
import { BigNumberish } from "ethers";
import { type } from "os";
import { defaultAbiCoder } from "@ethersproject/abi";
import { arrayify, keccak256 } from "ethers/lib/utils";

type Proof = {
  whitelistUser: string,
  chainId: number,
  salt: number,
  v: number,
  r: string
  s: string,
}

describe("GenesisPass", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture(_startTime: number, _endTime: number) {
    const startTime = _startTime === 0 ? (await time.latest()) + 1 * 60 : _startTime;
    const endTime = _endTime === 0 ? startTime + 120 : _endTime;
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob] = await ethers.getSigners();

    const GenesisPass = await ethers.getContractFactory("Weave6GenesisPass");
    const genesis = await GenesisPass.deploy("0x48578BbacA034680BF66a3c235Ba594c550c282d", startTime, endTime);

    return { genesis, startTime, endTime, owner, alice, bob };
  }

  describe("Deployment", function () {
    it("Should set the right init values", async function () {
      const { genesis, startTime, endTime } = await deployFixture(0, 0);
      expect(await genesis.startTimestamp()).to.equal(startTime);
      expect(await genesis.endTimestamp()).to.equal(endTime);
      expect(await genesis.name()).to.equal("Weave6 Genesis Pass");
      expect(await genesis.symbol()).to.equal("WGP");
      expect(await genesis.totalSupply()).to.equal(0);
    });

    it("Should set the right owner", async function () {
      const { genesis, owner } = await deployFixture(0, 0);
      expect(await genesis.owner()).to.equal(owner.address);
    });
  });

  describe("Update start time", function () {
    it("Should set by owner", async () => {
      const { genesis } = await deployFixture(0, 0);
      const startTime = (Date.now() / 1000).toFixed(0);
      await genesis.setStartTime(startTime);
      expect(await genesis.startTimestamp()).eq(startTime);
    });
    it("Can't set by other", async () => {
      const { alice, genesis } = await deployFixture(0, 0);
      const startTime = (Date.now() / 1000).toFixed(0);
      await expect(genesis.connect(alice).setStartTime(startTime)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Mint pass verify", function () {
    describe("Mint pass", function () {
      it("Should revert when not started", async () => {
        const { genesis } = await deployFixture(0, 0);
        await expect(genesis.mintGenesisPass("proof")).to.be.revertedWith("WGP: mint not started");
      });
      it("Should revert when ended", async () => {
        const { genesis } = await deployFixture(1,1);
        await expect(genesis.mintGenesisPass("proof")).to.be.revertedWith("WGP: mint has been finished");
      });

      it("Should revert when proof is wrong", async () => {
        const startTime = (Date.now() / 1000).toFixed(0);
        const { genesis} = await deployFixture(parseInt(startTime) - 10, 0);
        await expect(genesis.mintGenesisPass("proof")).to.be.revertedWith("WGP: not withelist user");
      });
      it("Should mint when proof is right", async () => {
        const startTime = (Date.now() / 1000).toFixed(0);
        const { genesis, owner} = await deployFixture(parseInt(startTime) - 10, parseInt(startTime)+200);
        
        let wallet = new ethers.Wallet("0x9d0e3c058c8b1020d196120c5b57cd909358a8e8b5eb881c343851ada1d9b830");
        let proof:Proof = {
          chainId: await owner.getChainId(),
          whitelistUser: owner.address,
          salt: 0x123,
          v: 0,
          s: "",
          r: ""
        }
        let hashData = keccak256(defaultAbiCoder.encode(["address", "uint256", "uint256"], [proof.whitelistUser, proof.chainId, proof.salt]));
        let signature = await wallet.signMessage(arrayify(hashData));
        let sig = ethers.utils.splitSignature(signature);
        proof.v = sig.v;
        proof.s =sig.s;
        proof.r = sig.r;
        let p = defaultAbiCoder.encode(["tuple Proof(address whitelistUser, uint256 chainId, uint256 salt, uint8 v, bytes32 r, bytes32 s)"], [proof]);
        console.log("chainid:", await owner.getChainId())
        console.log("address:", owner.address)
        console.log("proof:", p)
        let tx = await genesis.mintGenesisPass(p);
        expect(await genesis.balanceOf(owner.address)).to.equal(1)
        //wallet.signMessage()
      });
      it("Should revert when mint more than one", async () => {
        const startTime = (Date.now() / 1000).toFixed(0);
        const { genesis, owner} = await deployFixture(parseInt(startTime) - 10, parseInt(startTime)+200);
        
        let wallet = new ethers.Wallet("0x9d0e3c058c8b1020d196120c5b57cd909358a8e8b5eb881c343851ada1d9b830");
        let proof:Proof = {
          chainId: await owner.getChainId(),
          whitelistUser: owner.address,
          salt: 0x124,
          v: 0,
          s: "",
          r: ""
        }
        let hashData = keccak256(defaultAbiCoder.encode(["address", "uint256", "uint256"], [proof.whitelistUser, proof.chainId, proof.salt]));
        let signature = await wallet.signMessage(arrayify(hashData));
        let sig = ethers.utils.splitSignature(signature);
        proof.v = sig.v;
        proof.s =sig.s;
        proof.r = sig.r;
        let p = defaultAbiCoder.encode(["tuple Proof(address whitelistUser, uint256 chainId, uint256 salt, uint8 v, bytes32 r, bytes32 s)"], [proof]);
        
        await genesis.mintGenesisPass(p);
        await expect(genesis.mintGenesisPass(p)).to.be.revertedWith("WGP: can only mint one genesis pass")
        //wallet.signMessage()
      });
    });
  });
});
