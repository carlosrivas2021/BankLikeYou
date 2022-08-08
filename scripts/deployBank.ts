import { ethers } from "hardhat";

async function main() {

  const BankLikeYou = await ethers.getContractFactory("BankLikeYou");
  const bankLikeYou = await BankLikeYou.deploy();

  await bankLikeYou.deployed();

  console.log("BankLikeYou deployed to:", bankLikeYou.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
