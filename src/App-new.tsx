import { useAccount, useDisconnect, useWatchBlockNumber } from 'wagmi'
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { BrowserProvider, Contract } from "ethers";
import { useWalletInfo } from '@reown/appkit/react'

import { Greeter__factory, StandardToken__factory } from "./types";

const greeterAddress = String(import.meta.env.VITE_GREETER_ADDRESS ?? "");
const tokenAddress = String(import.meta.env.VITE_TOKEN_ADDRESS ?? "");

function App() {
  const { address, isConnected } = useAccount()
  const { walletInfo } = useWalletInfo()

  // Store greeting in local state
  const [greeting, setGreeting] = useState<string>("");
  // Store user address in local state
  const [userAddress, setUserAddress] = useState<string>("");
  // Store amount in local state
  const [amount, setAmount] = useState<number>(0);

  useWatchBlockNumber({
    onBlockNumber() {
      // Block number changed - could refresh data here if needed
    },
  })

  useEffect(() => {
    if (isConnected) {
      toast.success(`Connected: ${address?.substring(0, 6)}...${address?.substring(38)}`);
    }
  }, [isConnected, address]);

  // Get ethers provider from wagmi
  async function getEthersProvider() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('No ethereum provider found');
    }

    return new BrowserProvider(window.ethereum);
  }

  // Get signer from provider
  async function getEthersSigner() {
    const provider = await getEthersProvider();
    return provider.getSigner();
  }

  // Call the smart contract, read the current greeting value
  async function fetchGreeting() {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const provider = await getEthersProvider();
      const contract = Greeter__factory.connect(greeterAddress, provider);
      const data = await contract.greet();
      toast.success(`Greeting: ${data}`);
    } catch (err: any) {
      toast.error(`Error: ${err.message || JSON.stringify(err)}`);
    }
  }

  // Call the smart contract, send an update
  async function handleSetGreeting() {
    if (!greeting) {
      toast.error("Please enter a greeting");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const signer = await getEthersSigner();
      const contract = Greeter__factory.connect(greeterAddress, signer);

      toast.loading("Sending transaction...");
      const transaction = await contract.setGreeting(greeting);

      toast.loading("Waiting for confirmation...");
      await transaction.wait();

      toast.dismiss();
      toast.success("Greeting updated successfully!");
      await fetchGreeting();
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Error: ${err.message || JSON.stringify(err)}`);
    }
  }

  // Get balance of the token contract
  async function getBalance() {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const provider = await getEthersProvider();
      const contract = StandardToken__factory.connect(tokenAddress, provider);

      const balance = await contract.balanceOf(String(address));
      toast.success(`Balance: ${balance.toString()}`);
    } catch (err: any) {
      toast.error(`Error: ${err.message || JSON.stringify(err)}`);
    }
  }

  // Send a transaction to the token contract
  async function sendToken() {
    if (!userAddress || !amount) {
      toast.error("Please enter recipient address and amount");
      return;
    }

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const signer = await getEthersSigner();
      const contract = StandardToken__factory.connect(tokenAddress, signer);

      toast.loading("Sending transaction...");
      const transaction = await contract.transfer(userAddress, amount);

      toast.loading("Waiting for confirmation...");
      await transaction.wait();

      toast.dismiss();
      toast.success("Tokens sent successfully!");
      await getBalance();
    } catch (err: any) {
      toast.dismiss();
      toast.error(`Error: ${err.message || JSON.stringify(err)}`);
    }
  }

  return (
    <div className="flex flex-col justify-center py-6 min-h-screen bg-gray-100 sm:py-12">
      {/* Header with WalletConnect Button */}
      <div className="relative py-3 sm:mx-auto sm:max-w-xl">
        <div className="flex relative flex-col items-center py-6 px-4 bg-white shadow-lg sm:p-10 sm:rounded-3xl">
          <h1 className="text-3xl font-bold text-center mb-4 text-gray-800">React DApp</h1>
          <p className="text-sm text-gray-600 mb-4 text-center">
            Powered by WalletConnect & Reown AppKit
          </p>

          <div className="flex flex-col items-center gap-3 w-full">
            {/* AppKit Connect Button */}
            <appkit-button />

            {isConnected && (
              <div className="text-center mt-2">
                <p className="text-xs text-gray-500">
                  Connected with: {walletInfo?.name || 'Wallet'}
                </p>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {address?.substring(0, 6)}...{address?.substring(38)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Greeter Contract Section */}
      <div className="relative py-3 sm:mx-auto sm:max-w-xl">
        <div className="justify-center items-center py-4 px-4 mx-auto max-w-2xl text-xl border-orange-500 md:flex lg:flex">
          <div className="p-2 font-semibold">
            <span className="text-gray-800">Greeter Contract</span>
            <span className="mx-1 text-3xl text-orange-500">/</span>
            {greeterAddress && (
              <a
                href={`https://mumbai.polygonscan.com/address/${greeterAddress}`}
                target="_blank"
                className="py-1 px-4 ml-2 text-white bg-orange-500 rounded-full shadow focus:outline-none hover:bg-orange-600"
                rel="noreferrer"
              >
                Check
              </a>
            )}
          </div>
        </div>
        <div className="flex relative flex-col py-10 px-4 bg-white shadow-lg sm:p-20 sm:rounded-3xl">
          <div className="flex flex-row flex-wrap gap-2">
            <button
              className="mt-1 btn btn-green"
              type="button"
              onClick={fetchGreeting}
              disabled={!isConnected}
            >
              Fetch Greeting
            </button>
            <div className="flex flex-row flex-wrap mt-1 gap-2 w-full">
              <input
                type="text"
                placeholder="Set greeting"
                className="flex-1 px-3 py-2 border rounded"
                onChange={(e) => setGreeting(e.target.value)}
                disabled={!isConnected}
              />
              <button
                className="btn btn-green"
                type="button"
                onClick={handleSetGreeting}
                disabled={!isConnected}
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
            {tokenAddress && (
              <a
                href={`https://mumbai.polygonscan.com/address/${tokenAddress}`}
                target="_blank"
                className="py-1 px-4 ml-2 text-white bg-orange-500 rounded-full shadow focus:outline-none hover:bg-orange-600"
                rel="noreferrer"
              >
                Check
              </a>
            )}
          </div>
        </div>
        <div className="flex relative flex-col py-10 px-4 bg-white shadow-lg sm:p-20 sm:rounded-3xl">
          <button
            className="mt-1 btn btn-green"
            type="button"
            onClick={getBalance}
            disabled={!isConnected}
          >
            Get Balance
          </button>

          <hr className="mt-4" />

          <input
            type="text"
            placeholder="User address"
            className="mt-4 px-3 py-2 border rounded"
            onChange={(e) => setUserAddress(e.target.value)}
            disabled={!isConnected}
          />
          <input
            type="number"
            placeholder="Amount"
            className="mt-2 px-3 py-2 border rounded"
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={!isConnected}
          />
          <button
            className="mt-4 btn btn-green"
            type="button"
            onClick={sendToken}
            disabled={!isConnected}
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
