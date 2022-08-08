// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "hardhat/console.sol";

contract BankLikeYou {
    //
    // State variables
    //

    /* We want to protect our users balance from other contracts */
    mapping(address => uint) private balances;

    /* We want to create a getter function and allow
    contracts to be able to see if a user is enrolled.  */
    mapping(address => bool) private enrolled;

    uint private fee;

    /* Let's make sure everyone knows who owns the bank. */
    address public owner;

    //
    // Events
    //

    /* Add an argument for this event, an accountAddress */
    event LogEnrolled(address indexed accountAddress);

    /* Add 2 arguments for this event, an accountAddress and an amount */
    event LogDepositMade(address indexed accountAddress, uint indexed amount);

    /* Create an event that logs Withdrawals
    It should log 3 arguments:
    the account address, the amount withdrawn, and the new balance. */
    event LogWithdrawalsMade(
        address indexed accountAddress,
        uint indexed amount,
        uint indexed newBalance
    );

    event LogWTransferMade(
        address indexed accountAddress,
        uint indexed amount,
        uint indexed newBalanceSender
    );

    //
    // Modifiers
    //

    modifier isOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    modifier isEnrolledModifier() {
        require(enrolled[msg.sender], "User should be enrolled");
        _;
    }

    modifier hasBalance(uint amount) {
        require(balances[msg.sender] >= amount, "Your balance is not enough");
        _;
    }

    //
    // Functions
    //

    constructor() payable {
        owner = payable(msg.sender);
    }

    // Function to receive Ether
    receive() external payable {}

    /// @notice Get balance
    /// @return The balance of the user
    function getBalance() public view isEnrolledModifier returns (uint) {
        return balances[msg.sender];
    }

    /// @notice Enroll a customer with the bank
    /// @return The users enrolled status
    // Emit the appropriate event
    function enroll() public returns (bool) {
        require(!enrolled[msg.sender], "User already enrolled");
        enrolled[msg.sender] = true;
        emit LogEnrolled(msg.sender);
        return enrolled[msg.sender];
    }

    /// @notice Deposit ether into bank
    /// @return The balance of the user after the deposit is made
    // This function can receive ether
    // Users should be enrolled before they can make deposits
    function deposit() public payable isEnrolledModifier returns (uint) {
        require(msg.value > 0, "Your should send any value");

        balances[msg.sender] += msg.value;
        emit LogDepositMade(msg.sender, msg.value);

        return balances[msg.sender];
    }

    /// @notice Withdraw ether from bank
    /// @param withdrawAmount amount you want to withdraw
    /// @return The balance remaining for the user
    // Emit the appropriate event
    function withdraw(uint withdrawAmount)
        public
        isEnrolledModifier
        hasBalance(withdrawAmount)
        returns (uint)
    {
        applyFee(msg.sender, withdrawAmount, false);
        (bool sent, ) = msg.sender.call{value: withdrawAmount}("");
        require(sent, "Failed to send Ether");

        balances[msg.sender] -= withdrawAmount;
        emit LogWithdrawalsMade(
            msg.sender,
            withdrawAmount,
            balances[msg.sender]
        );
        return balances[msg.sender];
    }

    /// @notice Transfer ether into bank
    /// @return The balance of the user after the transfer is made
    // This function can receive ether
    // Users should be enrolled before they can make deposits
    function transfer(address addr, uint transferAmount)
        public
        payable
        isEnrolledModifier
        hasBalance(transferAmount)
        returns (uint)
    {
        require(msg.sender != addr, "Users should be different");
        require(enrolled[addr], "Receiver should be enrolled");

        balances[msg.sender] -= transferAmount;
        balances[addr] += transferAmount;
        //Change event
        emit LogWTransferMade(addr, transferAmount, balances[msg.sender]);

        return balances[msg.sender];
    }

    /// @notice Withdraw remaining ether from bank
    /// @return bool transaction success
    // Emit the appropriate event
    function withdrawAll()
        public
        isEnrolledModifier
        hasBalance(1)
        returns (bool)
    {
        applyFee(msg.sender, balances[msg.sender], true);
        (bool sent, ) = msg.sender.call{value: balances[msg.sender]}("");
        require(sent, "Failed to send Ether");

        emit LogWithdrawalsMade(msg.sender, balances[msg.sender], 0);
        balances[msg.sender] = 0;

        return true;
    }

    function isEnrolled(address addr) public view returns (bool) {
        return enrolled[addr];
    }

    function getBalanceBank() public view isOwner returns (uint) {
        return address(this).balance;
    }

    function setFee(uint newFee) public isOwner returns (bool) {
        fee = newFee;
        return true;
    }

    function getFee() public view isOwner returns (uint) {
        return fee;
    }

    function applyFee(
        address addr,
        uint amount,
        bool all
    ) private returns (uint) {
        uint feeLocal = fee;

        if (all) {
            uint rest = balances[addr] - feeLocal;
            require(rest > 0, "Your balance is not enough");
        } else {
            require(
                balances[addr] >= feeLocal + amount,
                "Your balance is not enough"
            );
        }

        balances[addr] -= feeLocal;
        balances[address(this)] += feeLocal;

        emit LogWithdrawalsMade(addr, feeLocal, balances[addr]);
        return feeLocal;
    }

    function getProfit() public view isOwner returns (uint) {
        return balances[address(this)];
    }

    function withdrawProfits() public isOwner returns (bool) {
        (bool sent, ) = msg.sender.call{value: balances[address(this)]}("");
        require(sent, "Failed to send Ether");
        emit LogWithdrawalsMade(msg.sender, balances[address(this)], 0);
        balances[address(this)] = 0;
        return true;
    }
}
