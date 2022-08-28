// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

function generateAddress() view returns (address) {
  return
    address(bytes20(keccak256(abi.encodePacked(msg.sender, block.timestamp))));
}
