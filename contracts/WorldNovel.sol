// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./NovelToken.sol";
import "./Helpers.sol";
import "./ContributionTimeManager.sol";
import "./BookManager.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

uint constant MAX_SENTENCE_COST = 1000; // NovelToken
uint constant SENTENCE_VOTING_COST = 1; // NovelToken
uint constant NUM_PAYOUTS = 10;

enum WorldNovelPeriod {
  INITIALIZING,
  WRITING,
  VOTING
}

contract WorldNovel is Ownable, ContributionTimeManager, BookManager {
  NovelToken public novelToken;

  WorldNovelPeriod _currentPeriod;

  constructor(uint initialSupply, string memory initialPrompt)
    BookManager(initialPrompt)
  {
    novelToken = new NovelToken(initialSupply);
  }

  /**
   * @notice Adds a book to the contract. The period is also updated to `WRITING`
   * @param prompt The prompt shown to users to adhere to
   */
  function addBook(string memory prompt)
    public
    override
    onlyOwner
    onlyInitializing
  {
    super.addBook(prompt);

    setCurrentPeriod(WorldNovelPeriod.WRITING);
    initContributionTimes();
  }

  /**
   * @notice Adds a sentence to the current book
   * @param text The text of the sentence being added
   * @return isLastSentence
   */
  function addSentence(string memory text)
    public
    override
    onlyWriting
    returns (bool isLastSentence)
  {
    uint cost = getCostToAddSentence();
    require(novelToken.balanceOf(msg.sender) >= cost, "IB");
    novelToken.transfer(msg.sender, address(this), cost);

    isLastSentence = super.addSentence(text);
    if (isLastSentence) {
      setCurrentPeriod(WorldNovelPeriod.VOTING);
    } else {
      updateContributionTimes();
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
   * @notice Vote on a sentence
   * @param sentenceIndex The sentence index in the current book
   * @param numTokens The number of NovelToken to attach to vote
   */
  function voteOnSentence(uint sentenceIndex, uint numTokens)
    public
    override
    notInitializing
  {
    require(novelToken.balanceOf(msg.sender) >= numTokens, "IB");

    super.voteOnSentence(sentenceIndex, numTokens);

    novelToken.transfer(msg.sender, address(this), numTokens);
  }

  /**
   * @notice Gets the current period of the WorldNovel contract
   */
  function getCurrentPeriod() public view returns (WorldNovelPeriod) {
    return _currentPeriod;
  }

  /**
   * @notice Sets the current period of the WorldNovel contract
   */
  function setCurrentPeriod(WorldNovelPeriod period) public onlyOwner {
    _currentPeriod = period;
  }

  /**
   * @notice Pays out all contributors with the tokens
   * the contract has collected. This is done linearly with number of
   * votes out of the total number of votes
   */
  function payout() public onlyOwner onlyVoting {
    Book memory currentBook = getCurrentBook();
    uint numSentences = getNumSentences();
    uint totalVotes = getTotalVotes();

    for (uint i = 0; i < numSentences; ++i) {
      uint votes = currentBook.sentences[i].votes;
      address author = currentBook.sentences[i].author;
      uint numTokens = (votes * novelToken.balanceOf(address(this))) /
        totalVotes;

      if (votes > 0) {
        novelToken.transfer(address(this), author, numTokens);
      }
    }

    setCurrentPeriod(WorldNovelPeriod.INITIALIZING);
  }

  modifier onlyWriting() {
    require(_currentPeriod == WorldNovelPeriod.WRITING, "OW");
    _;
  }

  modifier onlyInitializing() {
    require(_currentPeriod == WorldNovelPeriod.INITIALIZING, "OI");
    _;
  }

  modifier onlyVoting() {
    require(_currentPeriod == WorldNovelPeriod.VOTING, "OV");
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
 * OV: Only in the Voting period
 * NI: Only while Not Initializing
 */
