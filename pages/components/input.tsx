import { ButtonHTMLAttributes, DetailedHTMLProps, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useContracts } from "../contract-context/contract-context";
import { Dialog } from "./dialog";

const CHARACTER_LIMIT = 100; // Get this value from the contract on load

export const Input = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState("");

  return (
    <>
      <div className="flex items-center gap-4 border-cyan-500 border-2 rounded-xl focus-within:ring-cyan-600 focus-within:ring-2 p-2">
        <textarea
          placeholder="Add to the book!"
          className="w-full outline-none resize-none"
          value={text}
          onChange={(event) => {
            const value = event.target.value;
            const trucatedValue = value.substring(0, CHARACTER_LIMIT);
            setText(trucatedValue);
          }}
        />
        <div className="flex flex-col items-center gap-2">
          <AddButton
            onClick={() => setDialogOpen(true)}
            disabled={text.length === 0}
          />
          <p className="whitespace-nowrap">{`${text.length} / ${CHARACTER_LIMIT}`}</p>
        </div>
      </div>

      <ConfirmDialog
        text={text}
        isOpen={dialogOpen}
        onConfirmed={() => setText("")}
        onDismiss={() => setDialogOpen(false)}
      />
    </>
  );
};

const AddButton = (
  props: DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  return (
    <button
      className="shrink-0 w-10 h-10 bg-purple-100 border-purple-500 border-2
      rounded-full relative disabled:bg-gray-100 disabled:border-gray-500"
      {...props}
    >
      <div className="absolute top-2 bottom-2 left-0 right-0 mx-auto w-0.5 rounded-sm bg-black" />
      <div className="absolute top-0 bottom-0 left-2 right-2 my-auto h-0.5 rounded-sm bg-black" />
    </button>
  );
};

const ConfirmDialog = ({
  text,
  isOpen,
  onDismiss,
  onConfirmed,
}: {
  text: string;
  isOpen: boolean;
  onDismiss: VoidFunction;
  onConfirmed: VoidFunction;
}) => {
  const { worldNovel } = useContracts();
  const {
    data: costToAddSentence,
    isLoading, // TODO: Handle loading and error
    isError,
  } = useQuery("costToAddSentence", () => worldNovel.getCostToAddSentence());
  const queryClient = useQueryClient();

  const addSentenceMutation = useMutation(
    async () => {
      const transaction = await worldNovel.addSentence(text);
      await transaction.wait();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries("currentSentences");
        onConfirmed();
        onDismiss();
      },
    }
  );

  const cost = `Cost: ${costToAddSentence} $NOVEL`;

  return (
    <Dialog isOpen={isOpen} onDismiss={onDismiss} aria-label="Confirm input">
      <div className="bg-amber-100 border-amber-500 border-2 rounded-xl p-4 mb-4">
        {text}
      </div>
      <button
        className="bg-purple-100 border-purple-500 border-2 rounded-xl py-1 px-4 mx-auto w-64 block"
        onClick={() => addSentenceMutation.mutate()}
      >
        <h1 className="text-2xl text-center">Submit</h1>
        <p>{cost}</p>
      </button>
    </Dialog>
  );
};
