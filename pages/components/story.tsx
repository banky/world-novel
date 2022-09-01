import { Dispatch, SetStateAction, useState } from "react";
import { useQuery } from "react-query";
import { SentenceStructOutput } from "../../typechain-types/contracts/WorldNovel";
import { useContracts } from "../contract-context/contract-context";
import { removeTrailingPeriod } from "../helpers";
import { Dialog } from "./dialog";
import { useBoop } from "../hooks/use-boop";
import { animated } from "react-spring";

export const Story = () => {
  return (
    <div className="bg-amber-100 border-amber-500 border-2 rounded-xl p-4 overflow-auto h-full">
      <h1 className="text-2xl text-center">The story</h1>
      <StoryContent />
    </div>
  );
};

const StoryContent = () => {
  const { worldNovel } = useContracts();
  const {
    data: sentences,
    isLoading,
    isError,
  } = useQuery("currentSentences", async () =>
    worldNovel.getCurrentSentences()
  );
  const [openSentence, setOpenSentence] = useState<
    SentenceStructOutput | undefined
  >(undefined);

  if (isLoading) {
    return (
      <div role="status" className="animate-pulse">
        <div className="h-4 bg-amber-500 rounded-full w-full mb-4 opacity-10" />
        <div className="h-4 bg-amber-500 rounded-full w-full mb-4 opacity-10" />
        <div className="h-4 bg-amber-500 rounded-full w-full mb-4 opacity-10" />
        <div className="h-4 bg-amber-500 rounded-full w-full mb-4 opacity-10" />
        <div className="h-4 bg-amber-500 rounded-full w-full opacity-10" />
      </div>
    );
  }

  if (isError || sentences === undefined) {
    return <div>Could not load the story</div>;
  }

  if (sentences[0][1] === "") {
    return <div>The book is currently empty. What will you write? 😃</div>;
  }

  return (
    <>
      <p>
        {sentences.map((sentence, index) => {
          const text = sentence[1];
          return (
            <Sentence
              key={index}
              text={text}
              onClick={() => setOpenSentence(sentence)}
            />
          );
        })}
      </p>
      <VoteDialog
        isOpen={openSentence !== undefined}
        sentence={openSentence}
        onDismiss={() => setOpenSentence(undefined)}
      />
    </>
  );
};

const Sentence = ({
  text,
  onClick,
}: {
  text: string;
  onClick: VoidFunction;
}) => {
  if (text === "") {
    return null;
  }

  const formattedText = `${removeTrailingPeriod(text)}. `;

  return (
    <span className="inline hover:bg-teal-300 cursor-pointer" onClick={onClick}>
      {formattedText}
    </span>
  );
};

const VoteDialog = ({
  sentence,
  isOpen,
  onDismiss,
}: {
  sentence: SentenceStructOutput | undefined;
  isOpen: boolean;
  onDismiss: VoidFunction;
}) => {
  const [count, setCount] = useState(0);

  if (sentence === undefined) return null;

  return (
    <Dialog isOpen={isOpen} onDismiss={onDismiss} aria-label="Vote on sentence">
      <div className="bg-amber-100 border-amber-500 border-2 rounded-xl p-4 mb-4">
        {sentence[1]}
      </div>
      <div className="text-right">{`- ${sentence[0]}`}</div>
      <Arrows count={count} setCount={setCount} />

      <button
        className="bg-purple-100 border-purple-500 border-2 rounded-xl py-1 px-4 mx-auto w-64 block
        disabled:bg-gray-100 disabled:border-gray-500"
        onClick={() => {}}
        disabled={count === 0}
      >
        <h1 className="text-2xl text-center">{`Cast ${count} vote(s)`}</h1>
        <p>{`Cost: ${count} $NOVEL`}</p>
      </button>
    </Dialog>
  );
};

const Arrows = ({
  count,
  setCount,
}: {
  count: number;
  setCount: Dispatch<SetStateAction<number>>;
}) => {
  const [upButtonStyle, triggerUpButtonBoop] = useBoop({
    y: -10,
    timing: 50,
    springConfig: { tension: 500, friction: 20 },
  });
  const [downButtonStyle, triggerdownButtonBoop] = useBoop({
    y: 10,
    timing: 50,
    springConfig: { tension: 500, friction: 20 },
  });

  return (
    <div className="flex justify-center gap-4 items-center my-4">
      <animated.button
        onClick={() => {
          setCount((count) => count + 1);
          triggerUpButtonBoop();
        }}
        style={upButtonStyle}
      >
        <Arrow />
      </animated.button>
      <animated.button
        onClick={() => {
          setCount((count) => count - 1);
          triggerdownButtonBoop();
        }}
        disabled={count === 0}
        className="group"
        style={downButtonStyle}
      >
        <div className="rotate-180">
          <Arrow />
        </div>
      </animated.button>
    </div>
  );
};

const Arrow = () => {
  return (
    <svg
      className="stroke-purple-500 fill-purple-100 group-disabled:fill-gray-100 group-disabled:stroke-gray-500 mx-auto"
      width="45"
      height="45"
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="30" cy="30" r="29" strokeWidth="3" />
      <path
        d="M12.1006 36.4853L30.4854 18.1005L48.8701 36.4853"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};
