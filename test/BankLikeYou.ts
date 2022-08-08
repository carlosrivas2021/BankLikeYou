import {
  loadFixture,
  setBalance,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BankLikeYou", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshopt in every test.
  async function deployBankLikeYouFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const BankLikeYou = await ethers.getContractFactory("BankLikeYou");
    const bankLikeYou = await BankLikeYou.deploy();

    return { bankLikeYou, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should be enrolled", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await expect(bankLikeYou.getBalance()).to.be.revertedWith(
        "User should be enrolled"
      );
    });

    it("Should set the right owner", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      expect(await bankLikeYou.owner()).to.equal(owner.address);
    });
  });

  describe("Enrolled", function () {
    it("To enroll", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      await expect(await bankLikeYou.enroll())
        .to.emit(bankLikeYou, "LogEnrolled")
        .withArgs(owner.address);

      expect(await bankLikeYou.isEnrolled(owner.address)).to.be.true;
      await expect(bankLikeYou.enroll()).to.be.revertedWith(
        "User already enrolled"
      );
    });

    it("Is enrolled", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      expect(await bankLikeYou.isEnrolled(owner.address)).to.be.false;
    });
  });

  describe("Balance", function () {
    it("Get balance", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await bankLikeYou.enroll();
      expect(await bankLikeYou.getBalance()).to.equal(0);
    });

    it("Get bank balance", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      expect(await bankLikeYou.getBalanceBank()).to.equal(0);
    });

    it("Get bank balance with otherAccount", async function () {
      const { bankLikeYou, otherAccount } = await loadFixture(
        deployBankLikeYouFixture
      );

      await expect(
        bankLikeYou.connect(otherAccount).getBalanceBank()
      ).to.be.revertedWith("Caller is not owner");
    });
  });

  describe("Deposit", function () {
    it("Should be enrolled", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      const amount = 1_000_000_000;
      await expect(bankLikeYou.deposit({ value: amount })).to.be.revertedWith(
        "User should be enrolled"
      );
    });

    it("Deposit 1 ether", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );
      await bankLikeYou.enroll();
      const amount = 1_000_000_000;
      await expect(await bankLikeYou.deposit({ value: amount }))
        .to.emit(bankLikeYou, "LogDepositMade")
        .withArgs(owner.address, amount);
    });

    it("Deposit 1 ether", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);
      await bankLikeYou.enroll();
      const amount = 0;
      await expect(bankLikeYou.deposit({ value: amount })).to.be.revertedWith(
        "Your should send any value"
      );
    });
  });

  describe("Withdrawals", function () {
    it("Should be enrolled", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      const amount = 1_000_000_000;
      await expect(bankLikeYou.withdraw(amount)).to.be.revertedWith(
        "User should be enrolled"
      );
    });

    it("Should have balance", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await bankLikeYou.enroll();
      const amount = 1_000_000_000;
      await expect(bankLikeYou.withdraw(amount)).to.be.revertedWith(
        "Your balance is not enough"
      );
    });

    it("Withdrawals with error", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      await bankLikeYou.setFee(1);
      const amountWithdraw = 200_000_000;
      const valueBefore = await bankLikeYou.getBalance();
      await setBalance(bankLikeYou.address, 10);
      await expect(bankLikeYou.withdraw(amountWithdraw)).to.be.revertedWith(
        "Failed to send Ether"
      );
      const valueAfter = await bankLikeYou.getBalance();
      expect(valueBefore).to.be.equal(valueAfter);
    });

    it("Withdrawals with error balance and fee", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      const amountWithdraw = 1_000_000_000;
      await bankLikeYou.setFee(1);
      const valueBefore = await bankLikeYou.getBalance();
      await expect(bankLikeYou.withdraw(amountWithdraw)).to.be.revertedWith(
        "Your balance is not enough"
      );

      const valueAfter = await bankLikeYou.getBalance();
      expect(valueBefore).to.be.equal(valueAfter);
    });

    it("Withdrawals successful", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      const amountWithdraw = 200_000_000;
      await bankLikeYou.setFee(1);
      const valueBefore = await bankLikeYou.getBalance();
      const amountResult = amountDeposit - amountWithdraw - 1;
      await expect(await bankLikeYou.withdraw(amountWithdraw))
        .to.emit(bankLikeYou, "LogWithdrawalsMade")
        .withArgs(owner.address, amountWithdraw, amountResult);

      const valueAfter = await bankLikeYou.getBalance();
      expect(valueBefore).to.be.not.equal(valueAfter);
    });

    it("Withdrawals successful check balance", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      const amountWithdraw = 200_000_000;

      await expect(bankLikeYou.withdraw(amountWithdraw)).to.changeEtherBalances(
        [owner, bankLikeYou],
        [amountWithdraw, -amountWithdraw]
      );
    });
  });

  describe("Withdrawals all", function () {
    it("Should be enrolled", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await expect(bankLikeYou.withdrawAll()).to.be.revertedWith(
        "User should be enrolled"
      );
    });

    it("Should have balance", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await bankLikeYou.enroll();
      await expect(bankLikeYou.withdrawAll()).to.be.revertedWith(
        "Your balance is not enough"
      );
    });

    it("Withdrawals with error", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      await setBalance(bankLikeYou.address, 10);
      await expect(bankLikeYou.withdrawAll()).to.be.revertedWith(
        "Failed to send Ether"
      );
    });

    it("Withdrawals error with balance and fee", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await bankLikeYou.enroll();
      const amountDeposit = 1;
      await bankLikeYou.setFee(1);
      await bankLikeYou.deposit({ value: amountDeposit });
      await expect(bankLikeYou.withdrawAll()).to.be.revertedWith(
        "Your balance is not enough"
      );
    });

    it("Withdrawals successful", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      await expect(await bankLikeYou.withdrawAll())
        .to.emit(bankLikeYou, "LogWithdrawalsMade")
        .withArgs(owner.address, amountDeposit, 0);
    });

    it("Withdrawals successful", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      await expect(await bankLikeYou.withdrawAll())
        .to.emit(bankLikeYou, "LogWithdrawalsMade")
        .withArgs(owner.address, amountDeposit, 0);
    });

    it("Withdrawals successful check balance", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });

      await expect(bankLikeYou.withdrawAll()).to.changeEtherBalances(
        [owner, bankLikeYou],
        [amountDeposit, -amountDeposit]
      );
    });
  });

  describe("Transfer", function () {
    it("Should be enrolled", async function () {
      const { bankLikeYou, otherAccount } = await loadFixture(
        deployBankLikeYouFixture
      );

      const amount = 1_000_000_000;
      await expect(
        bankLikeYou.transfer(otherAccount.address, amount)
      ).to.be.revertedWith("User should be enrolled");
    });

    it("Should be different accounts", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      const amount = 1_000_000_000;
      await bankLikeYou.enroll();
      await bankLikeYou.deposit({ value: amount });
      await expect(
        bankLikeYou.transfer(owner.address, amount)
      ).to.be.revertedWith("Users should be different");
    });

    it("OtherAccount should be enrolled", async function () {
      const { bankLikeYou, otherAccount } = await loadFixture(
        deployBankLikeYouFixture
      );

      const amount = 1_000_000_000;
      await bankLikeYou.enroll();
      await bankLikeYou.deposit({ value: amount });
      await expect(
        bankLikeYou.transfer(otherAccount.address, amount)
      ).to.be.revertedWith("Receiver should be enrolled");
    });

    it("OtherAccount should not send token without balance", async function () {
      const { bankLikeYou, otherAccount } = await loadFixture(
        deployBankLikeYouFixture
      );

      const amount = 1_000_000_000;
      await bankLikeYou.connect(otherAccount).enroll();
      await bankLikeYou.enroll();
      await expect(
        bankLikeYou.transfer(otherAccount.address, amount)
      ).to.be.revertedWith("Your balance is not enough");
    });

    it("Transfer successful", async function () {
      const { bankLikeYou, otherAccount } = await loadFixture(
        deployBankLikeYouFixture
      );

      const amount = 1_000_000_000;
      await bankLikeYou.connect(otherAccount).enroll();
      await bankLikeYou.enroll();
      await bankLikeYou.deposit({ value: amount });
      const amountTransfer = 100_000;
      const amountResult = amount - amountTransfer;
      await expect(
        await bankLikeYou.transfer(otherAccount.address, amountTransfer)
      )
        .to.emit(bankLikeYou, "LogWTransferMade")
        .withArgs(otherAccount.address, amountTransfer, amountResult);
    });
  });

  describe("Fee", function () {
    it("set and get fee", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await bankLikeYou.setFee(1);
      expect(await bankLikeYou.getFee()).to.be.equal(1);
    });
  });

  describe("Profit", function () {
    it("get Profit", async function () {
      const { bankLikeYou } = await loadFixture(deployBankLikeYouFixture);

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      const amountWithdraw = 200_000_000;
      await bankLikeYou.setFee(1);
      await bankLikeYou.withdraw(amountWithdraw);

      expect(await bankLikeYou.getProfit()).to.be.equal(1);
    });

    it("withdrawProfits", async function () {
      const { bankLikeYou, owner } = await loadFixture(
        deployBankLikeYouFixture
      );

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      const amountWithdraw = 200_000_000;
      await bankLikeYou.setFee(1);
      await bankLikeYou.withdraw(amountWithdraw);

      await expect(bankLikeYou.withdrawProfits()).to.changeEtherBalances(
        [owner, bankLikeYou],
        [1, -1]
      );
    });

    it("withdrawProfits with error", async function () {
      const { bankLikeYou } = await loadFixture(
        deployBankLikeYouFixture
      );

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      const amountWithdraw = 200_000_000;
      await bankLikeYou.setFee(1);
      await bankLikeYou.withdraw(amountWithdraw);
      await setBalance(bankLikeYou.address, 0);
      await expect(
        bankLikeYou.withdrawProfits()
      ).to.be.revertedWith("Failed to send Ether");
    });

    it("withdrawProfits with error is not owner", async function () {
      const { bankLikeYou, otherAccount } = await loadFixture(
        deployBankLikeYouFixture
      );

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      const amountWithdraw = 200_000_000;
      await bankLikeYou.withdraw(amountWithdraw);

      await expect(
        bankLikeYou.connect(otherAccount).withdrawProfits()
      ).to.be.revertedWith("Caller is not owner");
    });

    it("withdrawProfits with error is not owner", async function () {
      const { bankLikeYou, otherAccount } = await loadFixture(
        deployBankLikeYouFixture
      );

      await bankLikeYou.enroll();
      const amountDeposit = 1_000_000_000;
      await bankLikeYou.deposit({ value: amountDeposit });
      const amountWithdraw = 200_000_000;
      await bankLikeYou.withdraw(amountWithdraw);

      await expect(
        bankLikeYou.connect(otherAccount).getProfit()
      ).to.be.revertedWith("Caller is not owner");
    });
  });
});
