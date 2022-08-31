import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("BookManager", () => {
  async function deployBookManagerFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const BookManager = await ethers.getContractFactory("BookManager");
    const bookManager = await BookManager.deploy(
      "This is a prompt. Do with me as you please"
    );

    return { bookManager, owner, otherAccount };
  }

  describe("constructor", () => {
    it("initializes the first book with the prompt", async () => {
      const { bookManager } = await loadFixture(deployBookManagerFixture);

      const currentBook = await bookManager.getCurrentBook();

      expect(currentBook.prompt).to.equal(
        "This is a prompt. Do with me as you please"
      );
    });
  });

  describe("addBook", () => {
    it("adds a book to storage", async () => {
      const { bookManager } = await loadFixture(deployBookManagerFixture);

      await bookManager.addBook("This is a new book with a new prompt");
      const currentBook = await bookManager.getCurrentBook();

      expect(currentBook.prompt).to.equal(
        "This is a new book with a new prompt"
      );
    });
  });

  describe("addSentence", () => {
    it("adds a new sentence to the current book", async () => {
      const { bookManager } = await loadFixture(deployBookManagerFixture);

      await bookManager.addSentence("This is a new sentence");
      const currentBook = await bookManager.getCurrentBook();

      expect(currentBook.prompt).to.equal(
        "This is a prompt. Do with me as you please"
      );
    });

    it("reverts if the sentence is too long", async () => {
      const { bookManager } = await loadFixture(deployBookManagerFixture);
      const longSentence =
        "Lorem ipsum dolor sit amet, consectetur adipiscing \
        elit, sed do eiusmod tempor incididunt ut labore et \
        dolore magna aliqua. Ut enim ad minim veniam, quis nostrud \
        exercitation ullamco laboris nisi";

      await expect(bookManager.addSentence(longSentence)).to.be.revertedWith(
        "TL"
      );
    });
  });

  describe("getCurrentBook", () => {
    it("gets the current book", async () => {
      const { bookManager } = await loadFixture(deployBookManagerFixture);

      const currentBook = await bookManager.getCurrentBook();

      expect(currentBook.prompt).to.equal(
        "This is a prompt. Do with me as you please"
      );
    });
  });

  describe("voteOnSentence", () => {
    it("successfully votes on the targeted sentence", async () => {
      const { bookManager } = await loadFixture(deployBookManagerFixture);
      await bookManager.addSentence("Hi, this is the first sentence");
      await bookManager.voteOnSentence(0, 69);

      const currentBook = await bookManager.getCurrentBook();
      const votes = currentBook.sentences[0].votes;

      expect(votes).to.equal(69);
    });

    it("reverts if voting on a sentence that is out of bounds", async () => {
      const { bookManager } = await loadFixture(deployBookManagerFixture);

      await expect(bookManager.voteOnSentence(1000, 69)).to.be.revertedWith(
        "OB"
      );
    });
  });

  describe("getTotalVotes", () => {
    it("gets the expected total number of votes", async () => {
      const { bookManager } = await loadFixture(deployBookManagerFixture);
      await bookManager.addSentence("Hi, this is the first sentence");
      await bookManager.addSentence("Hi, this is the second sentence");
      await bookManager.addSentence("Hi, this is the third sentence");

      await bookManager.voteOnSentence(0, 10);
      await bookManager.voteOnSentence(0, 20);
      await bookManager.voteOnSentence(0, 30);

      const totalVotes = await bookManager.getTotalVotes();

      expect(totalVotes).to.equal(60);
    });
  });

  describe("getCurrentPrompt", () => {
    it("gets the current prompt", async () => {
      const { bookManager } = await loadFixture(deployBookManagerFixture);

      const currentPrompt = await bookManager.getCurrentPrompt();

      expect(currentPrompt).to.equal(
        "This is a prompt. Do with me as you please"
      );
    });
  });

  describe("getCurrentSentences", () => {
    it("gets the current sentences", async () => {
      const { bookManager, owner } = await loadFixture(
        deployBookManagerFixture
      );

      await bookManager.addSentence("Hi, this is the first sentence");
      const currentSentences = await bookManager.getCurrentSentences();

      expect(currentSentences.length).to.equal(1000);
      expect(currentSentences[0].author).to.equal(owner.address);
      expect(currentSentences[0].text).to.equal(
        "Hi, this is the first sentence"
      );
    });
  });
});
