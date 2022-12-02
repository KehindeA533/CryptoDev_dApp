// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IWhitelist {
    function getWhitelistedAddresses(address) external view returns (bool);
}
