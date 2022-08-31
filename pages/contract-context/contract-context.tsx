import React, { ReactNode } from "react";
import { useProvider, useContract, useSigner } from "wagmi";
import { WorldNovel } from "../../typechain-types";
import { WORLD_NOVEL_CONTRACT_ADDRESS } from "../constants";
import WorldNovelInterface from "../../artifacts/contracts/WorldNovel.sol/WorldNovel.json";
import { Contract } from "ethers";

interface Contracts {
  worldNovel: WorldNovel;
}

export const ContractsContext = React.createContext<Contracts | undefined>(
  undefined
);

export const useContracts = () => {
  const context = React.useContext(ContractsContext);

  if (context === undefined) {
    throw new Error("useContracts must be used within a ContractsProvider");
  }
  return context;
};

export const ContractsProvider = ({ children }: { children: ReactNode }) => {
  const provider = useProvider();
  const { data: signer } = useSigner();
  const worldNovel = useContract<WorldNovel>({
    addressOrName: WORLD_NOVEL_CONTRACT_ADDRESS,
    contractInterface: WorldNovelInterface.abi,
    signerOrProvider: signer ?? provider,
  });

  const contracts = {
    worldNovel,
  };

  return (
    <ContractsContext.Provider value={contracts}>
      {children}
    </ContractsContext.Provider>
  );
};
