import { AppProps } from "next/app";
import {
  ConnectButton,
  getDefaultWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import "@rainbow-me/rainbowkit/styles.css";
import "@reach/dialog/styles.css";
import { QueryClient, QueryClientProvider } from "react-query";
import "../styles/globals.css";
import { Header } from "./components/header";
import { ContractsProvider } from "./contract-context/contract-context";

const getChainConfig = () => {
  if (process.env.NODE_ENV === "development") {
    const provider = jsonRpcProvider({
      rpc: () => ({
        http: `http://127.0.0.1:8545/`,
      }),
    });
    console.log("provider", provider);
    return configureChains(
      [chain.hardhat],
      [
        provider,
        // publicProvider(),
      ]
    );
  }

  return configureChains(
    [chain.polygon],
    [alchemyProvider({ apiKey: process.env.ALCHEMY_ID }), publicProvider()]
  );
};

const { chains, provider } = getChainConfig();

const { connectors } = getDefaultWallets({
  appName: "World Novel",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <ContractsProvider>
          <QueryClientProvider client={queryClient}>
            <div className="flex flex-col h-full p-4">
              <Header />
              <div className="flex-grow">
                <Component {...pageProps} />
              </div>
            </div>
          </QueryClientProvider>
        </ContractsProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}

export default MyApp;
