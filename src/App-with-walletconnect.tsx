import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import { Greeter__factory, StandardToken__factory } from "./types";
import { initializeWalletConnect } from "./config/walletconnect";

const greeterAddress = String(import.meta.env.VITE_GREETER_ADDRESS ?? "");
const tokenAddress = String(import.meta.env.VITE_TOKEN_ADDRESS ?? "");

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    ethereum: ethers.providers.ExternalProvider;
  }
}

type WalletProvider = "metamask" | "walletconnect" | null;

function App() {
  // Store greeting in local state
  const [greeting, setGreeting] = useState<string>("");
  // Store user address in local state
  const [userAddress, setUserAddress] = useState<string>("");
  // Store amount in local state
  const [amount, setAmount] = useState<number>(0);
  // Store wallet provider type
  const [walletProvider, setWalletProvider] = useState<WalletProvider>(null);
  // Store WalletConnect provider
  const [wcProvider, setWcProvider] = useState<any>(null);
  // Store connected account
  const [connectedAccount, setConnectedAccount] = useState<string>("");

  useEffect(() => {
    const checkMetamaskAndNetwork = async () => {
      if (typeof window.ethereum === "undefined") {
        console.log("MetaMask is not installed. WalletConnect is available as an alternative.");
      } else {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId !== 80001) {
          console.log("Current network:", network.chainId, "- Please consider switching to Mumbai Testnet (80001)");
        }
      }
    };

    checkMetamaskAndNetwork().catch(console.error);
  }, []);

  // Get the appropriate provider based on wallet type
  function getProvider(): ethers.providers.Web3Provider {
    if (walletProvider === "walletconnect" && wcProvider) {
      return new ethers.providers.Web3Provider(wcProvider);
    }
    if (window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    throw new Error("No wallet provider available");
  }

  // Connect with MetaMask
  async function connectMetaMask() {
    if (!window.ethereum) {
      toast.error("MetaMask is not installed. Please use WalletConnect instead.");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as string[];
      setWalletProvider("metamask");
      setConnectedAccount(accounts[0]);
      toast.success(`Connected with MetaMask: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
    } catch (error) {
      toast.error(`Error connecting MetaMask: ${error}`);
    }
  }

  // Connect with WalletConnect
  async function connectWalletConnect() {
    try {
      const provider = await initializeWalletConnect();

      // Enable session (triggers QR Code modal)
      await provider.enable();

      setWcProvider(provider);
      setWalletProvider("walletconnect");

      const accounts = await provider.request({ method: "eth_accounts" }) as string[];
      if (accounts.length > 0) {
        setConnectedAccount(accounts[0]);
        toast.success(`Connected with WalletConnect: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
      }

      // Subscribe to accounts change
      provider.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedAccount(accounts[0]);
          toast.success("Account changed");
        }
      });

      // Subscribe to chainId change
      provider.on("chainChanged", () => {
        toast.success("Chain changed");
      });

      // Subscribe to session disconnection
      provider.on("disconnect", () => {
        setWalletProvider(null);
        setWcProvider(null);
        setConnectedAccount("");
        toast.error("WalletConnect disconnected");
      });
    } catch (error) {
      toast.error(`Error connecting WalletConnect: ${error}`);
    }
  }

  // Disconnect wallet
  async function disconnectWallet() {
    if (walletProvider === "walletconnect" && wcProvider) {
      await wcProvider.disconnect();
    }
    setWalletProvider(null);
    setWcProvider(null);
    setConnectedAccount("");
    toast.success("Wallet disconnected");
  }

  // Request access to the user's account
  async function ensureConnection() {
    if (!walletProvider) {
      throw new Error("Please connect your wallet first");
    }

    if (walletProvider === "metamask" && window.ethereum?.request) {
      return window.ethereum.request({ method: "eth_requestAccounts" });
    }

    if (walletProvider === "walletconnect" && wcProvider) {
      return wcProvider.request({ method: "eth_accounts" });
    }

    throw new Error("No wallet provider available");
  }

  // Call the smart contract, read the current greeting value
  async function fetchGreeting() {
    try {
      const provider = getProvider();
      const contract = Greeter__factory.connect(greeterAddress, provider);
      const data = await contract.greet();
      toast.success(`Greeting: ${data}`);
    } catch (err) {
      toast.error(`Error: ${JSON.stringify(err)}`);
    }
  }

  // Call the smart contract, send an update
  async function handleSetGreeting() {
    if (!greeting) return;

    try {
      await ensureConnection();
      const provider = getProvider();
      const signer = provider.getSigner();
      const contract = Greeter__factory.connect(greeterAddress, signer);

      const transaction = await contract.setGreeting(greeting);
      toast.success("Transaction sent. Waiting for confirmation...");
      await transaction.wait();
      toast.success("Greeting updated successfully!");
      await fetchGreeting();
    } catch (error) {
      toast.error(`Error: ${error}`);
    }
  }

  // Get balance of the token contract
  async function getBalance() {
    try {
      const provider = getProvider();
      const contract = StandardToken__factory.connect(tokenAddress, provider);

      // Request account
      const accounts = await ensureConnection();
      const account = Array.isArray(accounts) ? accounts[0] : connectedAccount;
      const balance = await contract.balanceOf(String(account));
      toast.success(`Balance: ${balance.toString()}`);
    } catch (error) {
      toast.error(`Error: ${error}`);
    }
  }

  // Send a transaction to the token contract
  async function sendToken() {
    if (!userAddress || !amount) return;

    try {
      await ensureConnection();
      const provider = getProvider();
      const signer = provider.getSigner();
      const contract = StandardToken__factory.connect(tokenAddress, signer);

      const transaction = await contract.transfer(userAddress, amount);
      toast.success("Transaction sent. Waiting for confirmation...");
      await transaction.wait();
      toast.success("Tokens sent successfully!");
      await getBalance();
    } catch (error) {
      toast.error(`Error: ${error}`);
    }
  }

  return (
    <div className="flex flex-col justify-center py-6 min-h-screen bg-gray-100 sm:py-12">
      {/* Wallet Connection Section */}
      <div className="relative py-3 sm:mx-auto sm:max-w-xl">
        <div className="flex relative flex-col py-6 px-4 bg-white shadow-lg sm:p-10 sm:rounded-3xl">
          <h2 className="text-2xl font-bold text-center mb-4">Connect Wallet</h2>

          {!walletProvider ? (
            <div className="flex flex-col gap-3">
              <button
                className="btn btn-green"
                type="button"
                onClick={connectMetaMask}
              >
                Connect MetaMask
              </button>
              <button
                className="btn btn-blue"
                type="button"
                onClick={connectWalletConnect}
              >
                Connect with WalletConnect
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">Connected with {walletProvider === "metamask" ? "MetaMask" : "WalletConnect"}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {connectedAccount.substring(0, 6)}...{connectedAccount.substring(38)}
                </p>
              </div>
              <button
                className="btn btn-red"
                type="button"
                onClick={disconnectWallet}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Greeter Contract Section */}
      <div className="relative py-3 sm:mx-auto sm:max-w-xl">
        <div className="justify-center items-center py-4 px-4 mx-auto max-w-2xl text-xl border-orange-500 md:flex lg:flex">
          <div className="p-2 font-semibold">
            <span className="text-gray-800">Greeter Contract</span>
            <span className="mx-1 text-3xl text-orange-500">/</span>
            <a
              href={`https://mumbai.polygonscan.com/address/${greeterAddress}`}
              target="_blank"
              className="py-1 px-4 ml-2 text-white bg-orange-500 rounded-full shadow focus:outline-none"
              rel="noreferrer"
            >
              Check
            </a>
          </div>
        </div>
        <div className="flex relative flex-col py-10 px-4 bg-white shadow-lg sm:p-20 sm:rounded-3xl">
          <div className="flex flex-row flex-wrap">
            <button
              className="mt-1 btn btn-green"
              type="button"
              onClick={async () => fetchGreeting()}
              disabled={!walletProvider}
            >
              Fetch Greeting
            </button>
            <div className="flex flex-row flex-wrap mt-1">
              <input
                type="text"
                placeholder="Set greeting"
                onChange={(e) => {
                  setGreeting(e.target.value);
                }}
                disabled={!walletProvider}
              />
              <button
                className="ml-1 btn btn-green"
                type="button"
                onClick={async () => handleSetGreeting()}
                disabled={!walletProvider}
              >
                Set Greeting
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Token Contract Section */}
      <div className="relative py-3 mt-10 sm:mx-auto sm:max-w-xl">
        <div className="justify-center items-center py-4 px-4 mx-auto max-w-2xl text-xl border-orange-500 md:flex lg:flex">
          <div className="p-2 font-semibold">
            <span className="text-gray-800">Token Contract</span>
            <span className="mx-1 text-3xl text-orange-500">/</span>
            <a
              href={`https://mumbai.polygonscan.com/address/${tokenAddress}`}
              target="_blank"
              className="py-1 px-4 ml-2 text-white bg-orange-500 rounded-full shadow focus:outline-none"
              rel="noreferrer"
            >
              Check
            </a>
          </div>
        </div>
        <div className="flex relative flex-col py-10 px-4 bg-white shadow-lg sm:p-20 sm:rounded-3xl">
          <button
            className="mt-1 btn btn-green"
            type="button"
            onClick={async () => getBalance()}
            disabled={!walletProvider}
          >
            Get Balance
          </button>

          <hr className="mt-4" />

          <input
            type="text"
            placeholder="User address"
            onChange={(e) => {
              setUserAddress(e.target.value);
            }}
            disabled={!walletProvider}
          />
          <input
            type="number"
            placeholder="Amount"
            onChange={(e) => {
              setAmount(Number(e.target.value));
            }}
            disabled={!walletProvider}
          />
          <button
            className="mt-1 btn btn-green"
            type="button"
            onClick={async () => sendToken()}
            disabled={!walletProvider}
          >
            Send token
          </button>
        </div>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}

export default App;
