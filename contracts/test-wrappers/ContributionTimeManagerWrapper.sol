// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../ContributionTimeManager.sol";

/**
 * This just exposes internal functions of ContributionTimeManager
 * for testing
 */
contract ContributionTimeManagerWrapper is ContributionTimeManager {
  function _initContributionTimes() public {
    initContributionTimes();
  }

  function _getCurrentContributionTimeAverage() public view returns (uint) {
    return getCurrentContributionTimeAverage();
  }

  function _updateContributionTimes() public {
    return updateContributionTimes();
  }

  function _getPreviousContributionTime() public view returns (uint) {
    return _previousContributionTime;
  }

  function _getContributionTimeDeltas()
    public
    view
    returns (uint[MOVING_AVERAGE_SIZE] memory)
  {
    return _contributionTimeDeltas;
  }

  function _setPreviousContributionTime(uint previousContributionTime) public {
    _previousContributionTime = previousContributionTime;
  }

  function _setContributionTimeDeltas(
    uint[MOVING_AVERAGE_SIZE] memory contributionTimeDeltas
  ) public {
    _contributionTimeDeltas = contributionTimeDeltas;
  }
}
