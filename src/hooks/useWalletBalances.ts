/// @notice Imports memoization helpers plus React state to manage balance lookups.
import { useCallback, useState } from "react";

/// @notice Shapes the balance tuple for a single wallet.
interface Balance {
  /// @notice SOL balance label.
  sol: string;
  /// @notice USDC balance label.
  usdc: string;
}

/// @notice Shapes the aggregate balance object for all actors in the demo.
interface Balances {
  /// @notice Balances for User A.
  userA: Balance | null;
  /// @notice Balances for User B.
  userB: Balance | null;
  /// @notice Balances for the developer wallet.
  dev: Balance | null;
}

/// @notice Exposes helper functions that fetch wallet balances via Next.js API routes.
export function useWalletBalances() {
  /// @notice Stores cached balances so the UI can render instantly while refetching.
  const [balances, setBalances] = useState<Balances>({
    userA: null,
    userB: null,
    dev: null,
  });

  /// @notice Fetches the SOL balance for a wallet by calling the backend RPC proxy.
  const fetchSolBalance = useCallback(async (address: string): Promise<string> => {
    const response = await fetch("/api/solana-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) {
      throw new Error("Unable to fetch SOL balance.");
    }
    const data = await response.json();
    if (data.status === "SUCCESS" && data.balance) {
      return `${data.balance} SOL`;
    }
    throw new Error(data.error || "Invalid SOL balance response.");
  }, []);

  /// @notice Fetches the USDC balance for a wallet by calling the backend RPC proxy.
  const fetchUSDCBalance = useCallback(async (address: string): Promise<string> => {
    const response = await fetch("/api/usdc-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) {
      throw new Error("Unable to fetch USDC balance.");
    }
    const data = await response.json();
    if (data.status === "SUCCESS" && data.balance !== undefined) {
      return `${data.balance} USDC`;
    }
    throw new Error(data.error || "Invalid USDC balance response.");
  }, []);

  /// @notice Refreshes User A, User B, and developer balances in parallel.
  const refreshBalances = useCallback(
    async (userAWallet?: string, userBWallet?: string, devWallet?: string) => {
      if (!userAWallet || !userBWallet || !devWallet) {
        return;
      }
      setBalances({
        userA: { sol: "Loading...", usdc: "Loading..." },
        userB: { sol: "Loading...", usdc: "Loading..." },
        dev: { sol: "Loading...", usdc: "Loading..." },
      });
      try {
        const [
          userASol,
          userBSol,
          devSol,
          userAUsdc,
          userBUsdc,
          devUsdc,
        ] = await Promise.all([
          fetchSolBalance(userAWallet),
          fetchSolBalance(userBWallet),
          fetchSolBalance(devWallet),
          fetchUSDCBalance(userAWallet),
          fetchUSDCBalance(userBWallet),
          fetchUSDCBalance(devWallet),
        ]);
        setBalances({
          userA: { sol: userASol, usdc: userAUsdc },
          userB: { sol: userBSol, usdc: userBUsdc },
          dev: { sol: devSol, usdc: devUsdc },
        });
      } catch (error) {
        setBalances({
          userA: { sol: "Error", usdc: "Error" },
          userB: { sol: "Error", usdc: "Error" },
          dev: { sol: "Error", usdc: "Error" },
        });
        throw error;
      }
    },
    [fetchSolBalance, fetchUSDCBalance]
  );

  /// @notice Shares the cached balances plus the refresh helper with consumers.
  return {
    balances,
    refreshBalances,
  };
}

