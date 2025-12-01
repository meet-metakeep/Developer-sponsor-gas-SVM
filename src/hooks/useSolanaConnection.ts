/// @notice Imports state plus memoization helpers to manage the Solana RPC connection.
import { useCallback, useState } from "react";
/// @notice Imports the Connection type so the hook can stay strictly typed without pulling the runtime bundle twice.
import type { Connection } from "@solana/web3.js";
/// @notice Ensures required public environment variables exist at runtime.
import { requirePublicEnv } from "@/lib/env";

/// @notice Extends the window type so TypeScript understands the injected Solana bundle.
declare global {
  interface Window {
    /// @notice Solana Web3.js namespace exposed by the CDN script in layout.tsx.
    solanaWeb3: typeof import("@solana/web3.js");
  }
}

/// @notice Manages a lazily initialized Solana RPC connection that targets devnet.
export function useSolanaConnection() {
  /// @notice Stores the Connection instance so downstream hooks can re-use it.
  const [connection, setConnection] = useState<Connection | null>(null);

  /// @notice Lazily initializes the connection and verifies that the RPC endpoint responds.
  const initializeConnection = useCallback(async () => {
    if (connection) {
      return;
    }
    if (typeof window === "undefined" || !window.solanaWeb3) {
      throw new Error("Solana Web3.js is not available in the browser context.");
    }
    const rpcUrl = requirePublicEnv(
      "NEXT_PUBLIC_SOLANA_DEVNET_RPC",
      "https://api.devnet.solana.com"
    );
    const solanaConnection = new window.solanaWeb3.Connection(rpcUrl, "confirmed");
    await solanaConnection.getVersion();
    setConnection(solanaConnection);
  }, [connection]);

  /// @notice Surfaces both the connection object and the initializer utility.
  return {
    connection,
    initializeConnection,
  };
}

