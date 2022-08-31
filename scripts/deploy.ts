import { ethers } from "hardhat";

async function main() {
  const WorldNovel = await ethers.getContractFactory("WorldNovel");

  const initialSupply = 1_000_000;
  const initialPrompt = "This is the initial prompt";

  const worldNovel = await WorldNovel.deploy(initialSupply, initialPrompt);

  const contract = await worldNovel.deployed();

  console.log(
    `World novel deployed with initial supply of ${initialSupply} and an initial prompt of ${initialPrompt}`
  );
  console.log(`Contract address: ${contract.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
