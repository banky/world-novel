import { Dialog as ReachDialog, DialogProps } from "@reach/dialog";

export const Dialog = (props: DialogProps) => {
  return (
    <ReachDialog className="rounded-xl my-[30vh]" {...props}></ReachDialog>
  );
};
