/// @notice Imports React state utilities to persist SDK references across renders.
import { useState } from "react";
/// @notice Imports environment helpers so required configuration is validated.
import { requirePublicEnv } from "@/lib/env";
/// @notice Imports the strongly typed MetaKeep SDK surface so hooks avoid `any`.
import type { MetaKeepSDK } from "@/types/metakeep";

/// @notice Represents the MetaKeep constructor injected via the CDN bundle.
interface MetaKeepConstructor {
  new (config: { appId: string }): MetaKeepSDK;
}

/// @notice Extends the browser window type so TypeScript understands the MetaKeep SDK shim.
declare global {
  interface Window {
    /// @notice The MetaKeep constructor injected via the CDN script inside layout.tsx.
    MetaKeep: MetaKeepConstructor;
  }
}

/// @notice Encapsulates MetaKeep SDK initialization plus wallet metadata lookups.
export function useMetaKeepSDK() {
  /// @notice Stores the MetaKeep SDK instance once the CDN script is ready.
  const [sdk, setSdk] = useState<MetaKeepSDK | null>(null);
  /// @notice Stores the wallet address for User A (the end-user).
  const [userAWallet, setUserAWallet] = useState<string>("");
  /// @notice Stores the wallet address for User B (the recipient).
  const [userBWallet, setUserBWallet] = useState<string>("");
  /// @notice Stores the developer wallet address that will sponsor gas.
  const [devWallet, setDevWallet] = useState<string>("");
  /// @notice Indicates whether the SDK is still bootstrapping.
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  /// @notice Initializes the MetaKeep SDK and fetches wallet addresses from MetaKeep plus configuration.
  const initializeWallets = async () => {
    /// @notice Guards against double initialization by toggling the loading flag.
    setIsInitializing(true);
    try {
      if (typeof window === "undefined" || !window.MetaKeep) {
        throw new Error("MetaKeep SDK is not available in the current browser context.");
      }
      const appId = requirePublicEnv("NEXT_PUBLIC_METAKEEP_APP_ID");
      const userBAddress = requirePublicEnv("NEXT_PUBLIC_USER_B_WALLET");
      const metaKeepSDK = new window.MetaKeep({ appId });
      setSdk(metaKeepSDK);
      setUserBWallet(userBAddress);

      const devResponse = await fetch("/api/developer-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!devResponse.ok) {
        throw new Error("Unable to fetch developer wallet from MetaKeep.");
      }
      const devData = await devResponse.json();
      if (devData.status === "SUCCESS" && devData.wallet?.solAddress) {
        setDevWallet(devData.wallet.solAddress);
      } else {
        throw new Error(devData.error || "Missing developer wallet data.");
      }

      try {
        const userAResponse = await metaKeepSDK.getWallet();
        if (userAResponse?.status === "SUCCESS" && userAResponse.wallet?.solAddress) {
          setUserAWallet(userAResponse.wallet.solAddress);
        }
      } catch (error) {
        if ((error as { status?: string })?.status !== "OPERATION_CANCELLED") {
          throw error;
        }
      }
    } finally {
      setIsInitializing(false);
    }
  };

  /// @notice Exposes the SDK instance along with wallet metadata and the initializer.
  return {
    sdk,
    userAWallet,
    userBWallet,
    devWallet,
    isInitializing,
    initializeWallets,
  };
}

