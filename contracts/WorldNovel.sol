// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./NovelToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

uint constant MAX_SENTENCES = 1000;
uint constant MAX_SENTENCE_LENGTH = 100;
uint constant MOVING_AVERAGE_SIZE = 5;
uint constant MAX_DELTA_BETWEEN_CONTRIBUTIONS = 1000; // seconds
uint constant SENTENCE_VOTING_COST = 1; // NovelToken

struct Sentence {
  address author;
  string text;
  uint votes;
}

struct Book {
  Sentence[MAX_SENTENCES] sentences;
  string prompt;
}

enum WorldNovelPeriod {
  INITIALIZING,
  WRITING,
  VOTING
}

contract WorldNovel is Ownable {
  NovelToken public novelToken;

  mapping(address => Book) _books;
  address _currentBookAddress;
  address[] public allBooks;
  uint _currentSentenceIndex;

  uint[MOVING_AVERAGE_SIZE] _contributionTimeDeltas;
  uint _previousContributionTime;

  WorldNovelPeriod _currentPeriod;

  constructor(uint initialSupply, string memory initialPrompt) {
    novelToken = new NovelToken(initialSupply);
    addBook(initialPrompt);
    initContributionTimes();
  }

  function generateAddress() private view returns (address) {
    return
      address(
        bytes20(keccak256(abi.encodePacked(msg.sender, block.timestamp)))
      );
  }

  function addBook(string memory prompt) public onlyOwner onlyInitializing {
    address bookAddress = generateAddress();
    Book storage book = _books[bookAddress];
    book.prompt = prompt;
    _books[bookAddress] = book;
    allBooks.push(bookAddress);

    _currentBookAddress = bookAddress;
    _currentSentenceIndex = 0;

    _currentPeriod = WorldNovelPeriod.WRITING;
  }

  function initContributionTimes() private {
    for (uint i = 0; i < MOVING_AVERAGE_SIZE; ++i) {
      _contributionTimeDeltas[i] = MAX_DELTA_BETWEEN_CONTRIBUTIONS;
    }

    _previousContributionTime = block.timestamp;
  }

  /**
   * @notice Gets the average of all the elements in `_contributionTimeDeltas`
   */
  function getCurrentContributionTimeAverage() private view returns (uint) {
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

  function updateContributionTimes() private {
    for (uint i = 0; i < MOVING_AVERAGE_SIZE - 1; ++i) {
      _contributionTimeDeltas[i] = _contributionTimeDeltas[i + 1];
    }

    uint newDelta = block.timestamp - _previousContributionTime;
    _contributionTimeDeltas[MOVING_AVERAGE_SIZE - 1] = newDelta;
  }

  /**
   * @notice Adds a sentence to the current book
   */
  function addSentence(string memory text) public onlyWriting {
    Book storage currentBook = _books[_currentBookAddress];
    require(_currentSentenceIndex < MAX_SENTENCES, "IS");
    require(bytes(text).length < MAX_SENTENCE_LENGTH, "TL");

    uint cost = getCostToAddSentence();
    require(novelToken.balanceOf(msg.sender) >= cost, "IB");

    novelToken.transfer(msg.sender, address(this), cost);

    currentBook.sentences[_currentSentenceIndex] = Sentence(
      msg.sender,
      text,
      0
    );
    _currentSentenceIndex++;

    updateContributionTimes();
  }

  /**
   * @notice Gets the cost in NovelToken to add a new sentence to the book
   * Uses a moving average of how fast people are contributing
   * to adjust the price to contribute
   */
  function getCostToAddSentence() public view onlyWriting returns (uint) {
    uint currentTimeAverage = getCurrentContributionTimeAverage();

    // Upper bound the cost to MAX_DELTA_BETWEEN_CONTRIBUTIONS
    uint maxCost = MAX_DELTA_BETWEEN_CONTRIBUTIONS;
    return maxCost / currentTimeAverage;
  }

  /**
   * @notice Gets the current book
   */
  function getCurrentBook() public view returns (Book memory) {
    return _books[_currentBookAddress];
  }

  /**
   * @notice Vote on a sentence
   * @param sentenceIndex The sentence index in the current book
   * @param numTokens The number of NovelToken to attach to vote
   */
  function voteOnSentence(uint sentenceIndex, uint numTokens) public {
    require(sentenceIndex < MAX_SENTENCES, "OB");
    require(novelToken.balanceOf(msg.sender) >= numTokens, "IB");

    Book storage currentBook = _books[_currentBookAddress];
    Sentence storage sentence = currentBook.sentences[sentenceIndex];
    sentence.votes += numTokens;

    novelToken.transfer(msg.sender, address(this), numTokens);
  }

  function setCurrentPeriod(WorldNovelPeriod period) public onlyOwner {
    _currentPeriod = period;
  }

  modifier onlyWriting() {
    require(_currentPeriod == WorldNovelPeriod.WRITING, "OW");
    _;
  }

  modifier onlyInitializing() {
    require(_currentPeriod == WorldNovelPeriod.INITIALIZING, "OI");
    _;
  }
}

/**
 * Error codes
 * IS: Insufficient Space to store sentence in book
 * IB: Insufficient Balance to perform transaction
 * TF: Transfer Failed
 * TL: Text is Too Long
 * OB: Out of bounds
 * OW: Only in the Writing period
 * OI: Only in the Initializing period
 */
