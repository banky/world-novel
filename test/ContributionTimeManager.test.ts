import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ContributionTimeManager", () => {
  async function deployContributionTimeManagerFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const ContributionTimeManager = await ethers.getContractFactory(
      "ContributionTimeManagerWrapper"
    );
    const contributionTimeManager = await ContributionTimeManager.deploy();
    await contributionTimeManager._initContributionTimes();

    return { contributionTimeManager, owner, otherAccount };
  }

  describe("initContributionTimes", () => {
    it("initializes the _previousContributionTime", async () => {
      const { contributionTimeManager } = await loadFixture(
        deployContributionTimeManagerFixture
      );

      const currentTime = await time.latest();
      const previousContributionTime =
        await contributionTimeManager._getPreviousContributionTime();

      expect(currentTime).to.equal(previousContributionTime);
    });

    it("initializes the _contributionTimeDeltas array", async () => {
      const { contributionTimeManager } = await loadFixture(
        deployContributionTimeManagerFixture
      );

      const contributionTimeDeltas =
        await contributionTimeManager._getContributionTimeDeltas();

      for (let index = 0; index < contributionTimeDeltas.length; index++) {
        const contributionTimeDelta = contributionTimeDeltas[index];
        expect(contributionTimeDelta).to.equal(1000);
      }
    });
  });

  describe("getCurrentContributionTimeAverage", () => {
    it("gets the expected average contribution time", async () => {
      const { contributionTimeManager } = await loadFixture(
        deployContributionTimeManagerFixture
      );

      await contributionTimeManager._setContributionTimeDeltas([
        10, 100, 40, 20, 400,
      ]);

      const average =
        await contributionTimeManager._getCurrentContributionTimeAverage();
      expect(average).to.equal(114);
    });

    it("returns 1 if the total time delta is 0", async () => {
      const { contributionTimeManager } = await loadFixture(
        deployContributionTimeManagerFixture
      );

      await contributionTimeManager._setContributionTimeDeltas([0, 0, 0, 0, 0]);

      const average =
        await contributionTimeManager._getCurrentContributionTimeAverage();
      expect(average).to.equal(1);
    });
  });

  describe("updateContributionTimes", () => {
    it("updates the contribution times with the latest block times", async () => {
      const { contributionTimeManager } = await loadFixture(
        deployContributionTimeManagerFixture
      );

      const newTime = await time.increase(20);
      await contributionTimeManager._updateContributionTimes();
      const contributionTimeDeltas =
        await contributionTimeManager._getContributionTimeDeltas();
      const previousContributionTime =
        await contributionTimeManager._getPreviousContributionTime();

      // There is an expected 1 second increase in addition to the `time.increase` for some reason 😕
      expect(
        contributionTimeDeltas[contributionTimeDeltas.length - 1]
      ).to.equal(20 + 1);
      expect(previousContributionTime).to.equal(newTime + 1);
    });
  });
});
