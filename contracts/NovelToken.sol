// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "hardhat/console.sol";

contract NovelToken is ERC20 {
  constructor(uint initialSupply) ERC20("Novel", "NVL") {
    _mint(tx.origin, initialSupply);
    // approve(tx.origin, initialSupply);
  }

  function transfer(
    address from,
    address to,
    uint amount
  ) public {
    _transfer(from, to, amount);
  }
}
