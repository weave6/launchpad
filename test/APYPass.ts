import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

import { BigNumberish } from "ethers";

describe("APYPass", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture(_startTime: number) {
    const startTime = _startTime === 0 ? (await time.latest()) + 1 * 60 : _startTime;
    const price = ethers.utils.parseEther("0.05");
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob] = await ethers.getSigners();

    const APYPass = await ethers.getContractFactory("APYPass");
    const apy = await APYPass.deploy("Weave6 APY Pass", "WAP", startTime);

    return { apy, startTime, owner, alice, bob, price };
  }

  describe("Deployment", function () {
    it("Should set the right init values", async function () {
      const { apy, startTime } = await deployFixture(0);
      expect(await apy.startTime()).to.equal(startTime);
      expect(await apy.name()).to.equal("Weave6 APY Pass");
      expect(await apy.symbol()).to.equal("WAP");
      expect(await apy.totalSupply()).to.equal(0);
    });

    it("Should set the right owner", async function () {
      const { apy, owner } = await deployFixture(0);
      expect(await apy.owner()).to.equal(owner.address);
    });
  });

  describe("Update start time", function () {
    it("Should set by owner", async () => {
      const { apy } = await deployFixture(0);
      const startTime = (Date.now() / 1000).toFixed(0);
      await apy.updateStartTime(startTime);
      expect(await apy.startTime()).eq(startTime);
    });
    it("Can't set by other", async () => {
      const { alice, apy } = await deployFixture(0);
      const startTime = (Date.now() / 1000).toFixed(0);
      await expect(apy.connect(alice).updateStartTime(startTime)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Mint pass verify", function () {
    describe("Mint pass", function () {
      it("Should revert when not started", async () => {
        const { apy, price } = await deployFixture(0);
        await expect(apy.mintAPYPass({ value: price })).to.be.revertedWith("APYPass: not started");
      });
      it("Should revert as the price not right", async () => {
        const { apy, price } = await deployFixture(1);
        await expect(apy.mintAPYPass({ value: price.sub(1) })).to.be.revertedWith("APYPass: payment value must be equal to price");
      });

      it("Should mint at fisrt time with right price", async () => {
        const { apy, price } = await deployFixture(1);

        const startValue = await apy.provider.getBalance(apy.address);
        const tx = await apy.mintAPYPass({ value: price });
        // console.log("tx finshed: %o", tx);

        expect(await apy.balanceOf(tx.from)).to.equal(1);
        expect(await apy.totalSupply()).to.equal(1);
        expect(await apy.tokenURI(1)).eq("ipfs://QmUtg6fpxGt2WHRndXe3ZbbbnqasGhQKrh8CreksUQ3uX1/apypass.json");
        const endValue = await apy.provider.getBalance(apy.address);
        console.log("startvalue = %s, endvalue = %s", startValue, endValue);
        expect(endValue.sub(startValue)).to.be.equal(price);
      });
      it("Should revert when mint twice", async () => {
        const { apy, price } = await deployFixture(1);
        const tx = await apy.mintAPYPass({ value: price });
        await expect(apy.mintAPYPass({ value: price })).to.be.revertedWith("APYPass: can only mint one pass");
      });
    });
  });
  describe("Withdraw", () => {
    it("can withdraw by owner", async () => {
      const { owner, apy, price } = await deployFixture(100);
      await (await apy.mintAPYPass({ value: price })).wait();
      const startBalance = await apy.provider.getBalance(owner.address);
      const tx = await apy.withdraw();
      const recipet = await tx.wait();
      const endValue = await apy.provider.getBalance(owner.address);
      expect(startBalance.add(price).sub(recipet.gasUsed.mul(recipet.effectiveGasPrice))).eq(endValue);
    });
    it("can not withdraw by other", async () => {
      const { owner, alice, apy, price } = await deployFixture(100);
      await expect(apy.connect(alice).withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
