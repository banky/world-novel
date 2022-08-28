import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

enum WorldNovelPeriod {
  INITIALIZING = 0,
  WRITING,
  VOTING,
}

describe("WorldNovel", () => {
  async function deployWorldNovelFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();
    const initialSupply = ethers.utils.parseEther("1000000");
    const initialPrompt = "This is a prompt. Write a great story";

    const WorldNovel = await ethers.getContractFactory("WorldNovel");
    const worldNovel = await WorldNovel.deploy(initialSupply, initialPrompt);

    const novelTokenAddress = await worldNovel.novelToken();
    const NovelToken = await ethers.getContractFactory("NovelToken");
    const novelToken = NovelToken.attach(novelTokenAddress);

    return { worldNovel, owner, otherAccount, novelToken };
  }

  describe("addBook", () => {
    it("adds a book as expected", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);

      await worldNovel.setCurrentPeriod(WorldNovelPeriod.INITIALIZING);
      await worldNovel.addBook("This is a prompt for a brand new book");
      const book = await worldNovel.getCurrentBook();

      expect(book.prompt).to.equal("This is a prompt for a brand new book");
    });

    it("reverts if the user is not the owner", async () => {
      const { worldNovel, otherAccount } = await loadFixture(
        deployWorldNovelFixture
      );

      await worldNovel.setCurrentPeriod(WorldNovelPeriod.INITIALIZING);
      await expect(
        worldNovel
          .connect(otherAccount)
          .addBook("This is a prompt for a brand new book")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if the contract is not initializing", async () => {
      const { worldNovel, otherAccount } = await loadFixture(
        deployWorldNovelFixture
      );

      await expect(
        worldNovel.addBook("This is a prompt for a brand new book")
      ).to.be.revertedWith("OI");
    });
  });

  describe("getCurrentBook", () => {
    it("initializes with a valid book", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);
      const currentBook = await worldNovel.getCurrentBook();

      expect(currentBook.prompt).to.be.equal(
        "This is a prompt. Write a great story"
      );
      expect(currentBook.sentences.length).to.be.equal(1000);
    });
  });

  describe("getCostToAddSentence", () => {
    it("gives the right cost initially", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);
      const costToAddSentence = await worldNovel.getCostToAddSentence();

      expect(costToAddSentence).to.be.equal(1);
    });

    it("adding sentences quickly should raise the price", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);

      await worldNovel.addSentence("Hello, I am the first sentence");
      await time.increase(1);
      await worldNovel.addSentence("Hi, I am the second sentence");
      await time.increase(1);
      await worldNovel.addSentence("Hi, I am the third sentence");

      const costToAddSentence = await worldNovel.getCostToAddSentence();

      expect(costToAddSentence).to.be.equal(2);
    });

    it("reverts if not in the writing period", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);

      await worldNovel.setCurrentPeriod(WorldNovelPeriod.VOTING);

      await expect(worldNovel.getCostToAddSentence()).to.be.revertedWith("OW");
    });
  });

  describe("addSentence", () => {
    it("adds a new sentence to the current book", async () => {
      const { worldNovel, owner } = await loadFixture(deployWorldNovelFixture);

      await worldNovel.addSentence("Hello, I am the first sentence");
      const currentBook = await worldNovel.getCurrentBook();

      expect(currentBook.sentences[0].author).to.equal(owner.address);
      expect(currentBook.sentences[0].text).to.equal(
        "Hello, I am the first sentence"
      );
    });

    it("reduces the balance of the writer", async () => {
      const { worldNovel, owner, novelToken } = await loadFixture(
        deployWorldNovelFixture
      );

      const previousBalance = await novelToken.balanceOf(owner.address);
      await worldNovel.addSentence("Hello, I am the first sentence");
      const currentBook = await worldNovel.getCurrentBook();
      const newBalance = await novelToken.balanceOf(owner.address);

      expect(currentBook.sentences[0].author).to.equal(owner.address);
      expect(currentBook.sentences[0].text).to.equal(
        "Hello, I am the first sentence"
      );
      expect(newBalance).to.be.lt(previousBalance);
    });

    // This test takes a long time to run, do `it.skip` during dev
    it.only("reverts if the book is full", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);

      /**
       * This test is slow, is there a better way to populate the contract?
       */
      for (let index = 0; index < 1000; index++) {
        await worldNovel.addSentence(`Hello, I am sentence number ${index}`);
      }

      await expect(
        worldNovel.addSentence(`I am a new sentence that shouldn't fit`)
      ).to.be.revertedWith("OW");
    });

    it("reverts if the sentence is too long", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);
      const longSentence =
        "Lorem ipsum dolor sit amet, consectetur adipiscing \
        elit, sed do eiusmod tempor incididunt ut labore et \
        dolore magna aliqua. Ut enim ad minim veniam, quis nostrud \
        exercitation ullamco laboris nisi";

      await expect(worldNovel.addSentence(longSentence)).to.be.revertedWith(
        "TL"
      );
    });

    it("reverts if user doesn't have enough $NOVEL", async () => {
      const { worldNovel, otherAccount } = await loadFixture(
        deployWorldNovelFixture
      );

      await expect(
        worldNovel
          .connect(otherAccount)
          .addSentence("Hello, I am the first sentence")
      ).to.be.revertedWith("IB");
    });

    it("reverts if not in the writing period", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);

      await worldNovel.setCurrentPeriod(WorldNovelPeriod.VOTING);

      await expect(
        worldNovel.addSentence("Hello, I am the first sentence")
      ).to.be.revertedWith("OW");
    });
  });

  describe("getCurrentBook", () => {
    it("returns the current book", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);

      const currentBook = await worldNovel.getCurrentBook();
      expect(currentBook.prompt).to.equal(
        "This is a prompt. Write a great story"
      );
    });
  });

  describe("voteOnSentence", () => {
    it("successfully votes on the targeted sentence", async () => {
      const { worldNovel, owner, novelToken } = await loadFixture(
        deployWorldNovelFixture
      );
      await worldNovel.addSentence("Hi, this is the first sentence");

      const initialBalance = await novelToken.balanceOf(owner.address);
      await worldNovel.voteOnSentence(0, 69);

      const currentBook = await worldNovel.getCurrentBook();
      const votes = currentBook.sentences[0].votes;
      const newBalance = await novelToken.balanceOf(owner.address);

      expect(votes).to.equal(69);
      expect(initialBalance.sub(newBalance)).to.equal(69);
    });

    it("reverts if voting on a sentence that is out of bounds", async () => {
      const { worldNovel } = await loadFixture(deployWorldNovelFixture);

      await expect(worldNovel.voteOnSentence(1000, 69)).to.be.revertedWith(
        "OB"
      );
    });

    it("reverts if the user votes for more than they can afford", async () => {
      const { worldNovel, otherAccount, novelToken } = await loadFixture(
        deployWorldNovelFixture
      );

      // Give some $NOVEL to the other
      await novelToken["transfer(address,uint256)"](otherAccount.address, 100);

      await expect(
        worldNovel.connect(otherAccount).voteOnSentence(0, 169)
      ).to.be.revertedWith("IB");
    });

    it("reverts if the novel is still initializing", async () => {
      const { worldNovel, otherAccount } = await loadFixture(
        deployWorldNovelFixture
      );

      await worldNovel.setCurrentPeriod(WorldNovelPeriod.INITIALIZING);

      await expect(worldNovel.voteOnSentence(0, 169)).to.be.revertedWith("NI");
    });
  });
});
