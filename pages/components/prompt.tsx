import { useQuery } from "react-query";
import { useContracts } from "../contract-context/contract-context";

export const Prompt = () => {
  return (
    <div className="bg-purple-100 border-purple-500 border-2 rounded-xl p-4">
      <h1 className="text-2xl text-center">Prompt</h1>
      <PromptContent />
    </div>
  );
};

const PromptContent = () => {
  const { worldNovel } = useContracts();
  const {
    data: prompt,
    isLoading,
    isError,
  } = useQuery("currentPrompt", () => worldNovel.getCurrentPrompt());

  if (isLoading) {
    return (
      <div role="status" className="animate-pulse">
        <div className="h-4 bg-purple-500 rounded-full w-full mb-4 opacity-10"></div>
        <div className="h-4 bg-purple-500 rounded-full w-full opacity-10"></div>
      </div>
    );
  }

  if (isError) {
    return <div>Could not load the prompt</div>;
  }

  return <p className="">{prompt}</p>;
};
