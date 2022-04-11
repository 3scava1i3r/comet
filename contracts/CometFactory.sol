// SPDX-License-Identifier: XXX ADD VALID LICENSE
pragma solidity 0.8.13;

import "./Comet.sol";
import "./CometConfiguration.sol";

contract CometFactory is CometConfiguration {
    function clone(Configuration calldata config) external returns (address) {
        return address(new Comet(config));
    }
}