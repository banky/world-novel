import { useQuery } from "react-query";
import { useContracts } from "../contract-context/contract-context";

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
  } = useQuery("currentSentences", () => worldNovel.getCurrentSentences());

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

  if (sentences[0].text === "") {
    return <div>The book is currently empty. What will you write? 😃</div>;
  }

  return (
    <p>
      {sentences.map((sentence) => {
        return sentence.text;
      })}
    </p>
  );
};
