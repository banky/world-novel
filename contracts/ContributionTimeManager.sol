// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

uint constant MOVING_AVERAGE_SIZE = 5;
uint constant MAX_DELTA_BETWEEN_CONTRIBUTIONS = 1000; // seconds

/**
 * This contract is used to manage contribution times
 * It uses a sliding average which goes down when `updateContributionTimes`
 * is called in quick succession
 */
contract ContributionTimeManager {
  uint[MOVING_AVERAGE_SIZE] private _contributionTimeDeltas;
  uint private _previousContributionTime;

  /**
   * @notice Initializes the _contributionTimeDeltas with large values
   * This makes sure the initial cost of writing sentences is low
   */
  function initContributionTimes() internal {
    for (uint i = 0; i < MOVING_AVERAGE_SIZE; ++i) {
      _contributionTimeDeltas[i] = MAX_DELTA_BETWEEN_CONTRIBUTIONS;
    }

    _previousContributionTime = block.timestamp;
  }

  /**
   * @notice Gets the average of all the elements in `_contributionTimeDeltas`
   */
  function getCurrentContributionTimeAverage() internal view returns (uint) {
    uint total = 0;

    for (uint i = 0; i < MOVING_AVERAGE_SIZE; ++i) {
      total += _contributionTimeDeltas[i];
    }

    // If all the previous transactions were in the same block
    // just assume the average is 1 second which is the smallest value possible
    if (total == 0) {
      return 1;
    }

    return total / MOVING_AVERAGE_SIZE;
  }

  function updateContributionTimes() internal {
    for (uint i = 0; i < MOVING_AVERAGE_SIZE - 1; ++i) {
      _contributionTimeDeltas[i] = _contributionTimeDeltas[i + 1];
    }

    uint newDelta = block.timestamp - _previousContributionTime;
    _previousContributionTime = block.timestamp;
    _contributionTimeDeltas[MOVING_AVERAGE_SIZE - 1] = newDelta;
  }
}
