import { useState, useEffect, useCallback, useRef } from "react";
import { useAppKitAccount, useAppKitProvider, useAppKit } from "@reown/appkit/react";
import { CHAIN_CONFIG } from "../config/constants";
import { SofiaFeeProxyAbi } from "../config/SofiaFeeProxyABI";
import type { WalletConnection } from "../services/intuition";

const MULTIVAULT_ABI = [
  "function getTripleCost() view returns (uint256)",
  "function getAtomCost() view returns (uint256)",
  "function calculateAtomId(bytes data) pure returns (bytes32)",
  "function isTermCreated(bytes32 id) view returns (bool)",
  "function approve(address sender, uint8 approvalType)",
  "function redeem(address receiver, bytes32 termId, uint256 curveId, uint256 shares, uint256 minAssets) returns (uint256)",
  "function previewRedeem(bytes32 termId, uint256 curveId, uint256 shares) view returns (uint256 assetsAfterFees, uint256 sharesUsed)",
  "function maxRedeem(address account, bytes32 termId, uint256 curveId) view returns (uint256)",
  "function currentSharePrice(bytes32 id, uint256 curveId) view returns (uint256)",
];

/**
 * Hook that integrates AppKit (WalletConnect, MetaMask, Coinbase)
 * and produces a WalletConnection compatible with all existing services.
 */
export function useWalletConnection() {
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");
  const { open } = useAppKit();

  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const buildingRef = useRef(false);

  // Build WalletConnection when AppKit connects
  useEffect(() => {
    if (!isConnected || !address || !walletProvider || buildingRef.current) {
      if (!isConnected) {
        setWallet(null);
        setBalance(null);
      }
      return;
    }

    buildingRef.current = true;
    setLoading(true);

    (async () => {
      try {
        const { ethers } = await import("ethers");
        const provider = new ethers.BrowserProvider(walletProvider as import("ethers").Eip1193Provider);
        provider.pollingInterval = 30000;

        // Switch to Intuition chain
        try {
          await provider.send("wallet_addEthereumChain", [
            {
              chainId: CHAIN_CONFIG.CHAIN_ID_HEX,
              chainName: CHAIN_CONFIG.CHAIN_NAME,
              rpcUrls: [CHAIN_CONFIG.RPC_URL],
              nativeCurrency: CHAIN_CONFIG.NATIVE_CURRENCY,
            },
          ]);
        } catch {
          try {
            await provider.send("wallet_switchEthereumChain", [
              { chainId: CHAIN_CONFIG.CHAIN_ID_HEX },
            ]);
          } catch { /* already on correct chain */ }
        }

        const signer = await provider.getSigner();
        const addr = await signer.getAddress();

        const proxy = new ethers.Contract(CHAIN_CONFIG.SOFIA_PROXY, SofiaFeeProxyAbi, signer);
        const multiVault = new ethers.Contract(CHAIN_CONFIG.MULTIVAULT, MULTIVAULT_ABI, signer);

        const conn: WalletConnection = { provider, signer, proxy, multiVault, address: addr, ethers };
        setWallet(conn);

        // Save address
        localStorage.setItem("ethcc-wallet-address", addr);

        // Fetch balance
        const bal = await provider.getBalance(addr);
        setBalance(ethers.formatEther(bal));

        setError("");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Connection failed");
      } finally {
        setLoading(false);
        buildingRef.current = false;
      }
    })();
  }, [isConnected, address, walletProvider]);

  // Open the AppKit modal
  const connect = useCallback(() => {
    setError("");
    open();
  }, [open]);

  // Disconnect
  const disconnect = useCallback(() => {
    setWallet(null);
    setBalance(null);
    localStorage.removeItem("ethcc-wallet-address");
  }, []);

  return {
    wallet,
    address: address ?? null,
    isConnected,
    loading,
    error,
    balance,
    connect,
    disconnect,
  };
}
