import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { STORAGE_KEYS } from "../config/constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protects routes that require a wallet to be connected.
 * Redirects to onboarding if no wallet is found in localStorage.
 * Shows nothing while checking to prevent flash of wrong content.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    // Check localStorage for wallet address
    const walletAddress = localStorage.getItem(STORAGE_KEYS.WALLET_ADDRESS);
    setHasWallet(!!walletAddress);
    setIsChecking(false);
  }, []);

  // Still checking → show nothing (prevents flash)
  if (isChecking) {
    return null;
  }

  // No wallet → redirect to onboarding
  if (!hasWallet) {
    return <Navigate to="/" replace />;
  }

  // Wallet connected → render the protected page
  return <>{children}</>;
}
