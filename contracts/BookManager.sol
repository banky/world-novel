// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Helpers.sol";

uint constant MAX_SENTENCES = 1000;
uint constant MAX_SENTENCE_LENGTH = 100;

struct Sentence {
  address author;
  string text;
  uint votes;
}

struct Book {
  Sentence[MAX_SENTENCES] sentences;
  string prompt;
}

contract BookManager {
  mapping(address => Book) _books;
  address _currentBookAddress;
  address[] public allBooks;
  uint _currentSentenceIndex;

  constructor(string memory initialPrompt) {
    addBook(initialPrompt);
  }

  /**
   * @notice Adds a book to the contract
   * @param prompt The prompt shown to users to adhere to
   */
  function addBook(string memory prompt) public virtual {
    address bookAddress = generateAddress();
    Book storage book = _books[bookAddress];
    book.prompt = prompt;
    allBooks.push(bookAddress);

    _currentBookAddress = bookAddress;
    _currentSentenceIndex = 0;
  }

  /**
   * @notice Adds a sentence to the current book
   * @param text The text of the sentence being added
   * @return isLastSentence
   */
  function addSentence(string memory text)
    public
    virtual
    returns (bool isLastSentence)
  {
    require(bytes(text).length < MAX_SENTENCE_LENGTH, "TL");

    Book storage currentBook = _books[_currentBookAddress];
    currentBook.sentences[_currentSentenceIndex] = Sentence(
      msg.sender, // Author
      text,
      0 // Votes
    );

    _currentSentenceIndex++;
    isLastSentence = _currentSentenceIndex == MAX_SENTENCES;

    if (isLastSentence) {
      _currentSentenceIndex = 0;
    }
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
   * @param numVotes The number of NovelToken to attach to vote
   */
  function voteOnSentence(uint sentenceIndex, uint numVotes) public virtual {
    require(sentenceIndex < MAX_SENTENCES, "OB");

    Book storage currentBook = _books[_currentBookAddress];
    Sentence storage sentence = currentBook.sentences[sentenceIndex];
    sentence.votes += numVotes;
  }

  function getTotalVotes() public view returns (uint totalVotes) {
    Book memory currentBook = getCurrentBook();
    for (uint i = 0; i < MAX_SENTENCES; ++i) {
      totalVotes += currentBook.sentences[i].votes;
    }
  }

  function getNumSentences() internal pure returns (uint) {
    return MAX_SENTENCES;
  }
}
