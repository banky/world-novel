// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./NovelToken.sol";
import "./Helpers.sol";
import "./ContributionTimeManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

uint constant MAX_SENTENCES = 1000;
uint constant MAX_SENTENCE_LENGTH = 100;
uint constant MAX_SENTENCE_COST = 1000; // NovelToken
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

contract WorldNovel is Ownable, ContributionTimeManager {
  NovelToken public novelToken;

  mapping(address => Book) _books;
  address _currentBookAddress;
  address[] public allBooks;
  uint _currentSentenceIndex;

  WorldNovelPeriod _currentPeriod;

  constructor(uint initialSupply, string memory initialPrompt) {
    novelToken = new NovelToken(initialSupply);
    addBook(initialPrompt);
  }

  /**
   * @notice Adds a book to the contract
   * @param prompt The prompt shown to users to adhere to
   */
  function addBook(string memory prompt) public onlyOwner onlyInitializing {
    address bookAddress = generateAddress();
    Book storage book = _books[bookAddress];
    book.prompt = prompt;
    allBooks.push(bookAddress);

    _currentBookAddress = bookAddress;
    _currentSentenceIndex = 0;
    _currentPeriod = WorldNovelPeriod.WRITING;

    initContributionTimes();
  }

  /**
   * @notice Adds a sentence to the current book
   */
  function addSentence(string memory text) public onlyWriting {
    require(bytes(text).length < MAX_SENTENCE_LENGTH, "TL");

    uint cost = getCostToAddSentence();
    require(novelToken.balanceOf(msg.sender) >= cost, "IB");

    novelToken.transfer(msg.sender, address(this), cost);

    Book storage currentBook = _books[_currentBookAddress];
    currentBook.sentences[_currentSentenceIndex] = Sentence(
      msg.sender, // Author
      text,
      0 // Votes
    );

    updateContributionTimes();

    _currentSentenceIndex++;
    bool isLastSentence = _currentSentenceIndex == MAX_SENTENCES;
    if (isLastSentence) {
      _currentPeriod = WorldNovelPeriod.VOTING;
      _currentSentenceIndex = 0;
    }
  }

  /**
   * @notice Gets the cost in NovelToken to add a new sentence to the book
   * Uses a moving average of how fast people are contributing
   * to adjust the price to contribute
   */
  function getCostToAddSentence() public view onlyWriting returns (uint) {
    uint currentTimeAverage = getCurrentContributionTimeAverage();
    return MAX_SENTENCE_COST / currentTimeAverage;
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
  function voteOnSentence(uint sentenceIndex, uint numTokens)
    public
    notInitializing
  {
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

  modifier notInitializing() {
    require(_currentPeriod != WorldNovelPeriod.INITIALIZING, "NI");
    _;
  }
}

/**
 * Error codes
 * IB: Insufficient Balance to perform transaction
 * TF: Transfer Failed
 * TL: Text is Too Long
 * OB: Out of bounds
 * OW: Only in the Writing period
 * OI: Only in the Initializing period
 * NI: Only in the Not Initializing period
 */
