import EthereumProvider from "@walletconnect/ethereum-provider";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "1eebe528ca0ce94a99ceaa2e915058d7";

export const initializeWalletConnect = async () => {
  const provider = await EthereumProvider.init({
    projectId,
    chains: [1], // Ethereum mainnet
    optionalChains: [80001, 137, 11155111], // Mumbai, Polygon, Sepolia
    showQrModal: true,
    qrModalOptions: {
      themeMode: "light" as const,
      themeVariables: {
        "--wcm-z-index": "9999",
      },
    },
    metadata: {
      name: "React DApp",
      description: "Ethereum DApp with WalletConnect Integration",
      url: typeof window !== "undefined" ? window.location.origin : "",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });

  return provider;
};

export { projectId };
