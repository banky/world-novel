import { useEffect } from "react";
import { useProvider, useContract, useContractRead } from "wagmi";
import { WorldNovel } from "../typechain-types";
import { Input } from "./components/input";
import { Prompt } from "./components/prompt";
import { Story } from "./components/story";
import { WORLD_NOVEL_CONTRACT_ADDRESS } from "./constants";
import WorldNovelInterface from "../artifacts/contracts/WorldNovel.sol/WorldNovel.json";
import { useContracts } from "./contract-context/contract-context";

export default function Home() {
  return (
    <>
      {/* <Head></Head> */}

      <main className="max-w-3xl mx-auto h-full flex flex-col gap-8">
        <Prompt />
        <div className="flex-1 basis-0 min-h-0">
          <Story />
        </div>
        <Input />
      </main>
    </>
  );
}
