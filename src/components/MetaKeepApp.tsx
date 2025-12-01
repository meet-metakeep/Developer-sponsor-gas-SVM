/// @notice Marks the component as client-side so hooks and SDKs can run in the browser.
"use client";

/// @notice Imports React state plus lifecycle utilities for orchestrating the demo flow.
import { useEffect, useState } from "react";
/// @notice Brings in the wallet summary card component.
import { WalletCard } from "@/components/WalletCard";
/// @notice Brings in the call-to-action button cluster.
import { ActionButtons } from "@/components/ActionButtons";
/// @notice Brings in the status and signature summary component.
import { StatusSection } from "@/components/StatusSection";
/// @notice Provides access to the MetaKeep SDK along with wallet metadata.
import { useMetaKeepSDK } from "@/hooks/useMetaKeepSDK";
/// @notice Provides a Solana RPC connection cached across renders.
import { useSolanaConnection } from "@/hooks/useSolanaConnection";
/// @notice Fetches and caches wallet balances from backend RPC proxies.
import { useWalletBalances } from "@/hooks/useWalletBalances";
/// @notice Transfers USDC while letting the developer wallet cover fees.
import { useTransfer } from "@/hooks/useTransfer";

/// @notice Enumerates the kinds of status banners the UI can surface.
type StatusType = "info" | "success" | "error" | "warning";

/// @notice Describes the structure of the status state tuple.
type StatusState = {
  /// @notice Human-readable text that explains the latest state transition.
  message: string;
  /// @notice Visual style of the status banner.
  type: StatusType;
};

/// @notice Encapsulates the entire MetaKeep USDC transfer walkthrough.
export function MetaKeepApp() {
  /// @notice Accesses the SDK plus wallet metadata that originate from MetaKeep.
  const {
    sdk,
    userAWallet,
    userBWallet,
    devWallet,
    isInitializing,
    initializeWallets,
  } = useMetaKeepSDK();
  /// @notice Accesses the Solana connection singleton for RPC calls.
  const { connection, initializeConnection } = useSolanaConnection();
  /// @notice Provides SOL/USDC balances plus a refresh helper.
  const { balances, refreshBalances } = useWalletBalances();
  /// @notice Provides the transfer executor plus reactive transfer state.
  const { transferUSDC, transferState } = useTransfer();
  /// @notice Tracks UI copy plus severity for status messaging.
  const [status, setStatus] = useState<StatusState>({
    message: "",
    type: "info",
  });
  /// @notice Captures the latest transaction signature and Solscan deeplink.
  const [transactionInfo, setTransactionInfo] = useState<{
    signature: string;
    solscanLink: string;
  } | null>(null);
  /// @notice Stores the MetaKeep response for the user signature.
  const [userSignature, setUserSignature] = useState<{ signature: string } | null>(
    null
  );
  /// @notice Stores the MetaKeep response for the developer signature.
  const [developerSignature, setDeveloperSignature] = useState<{
    signature: string;
  } | null>(null);
  /// @notice Indicates whether both the SDK and Solana connection finished initializing.
  const [isInitialized, setIsInitialized] = useState(false);
  /// @notice Flags when User A does not have enough USDC to transfer 0.01 tokens.
  const [hasInsufficientUSDC, setHasInsufficientUSDC] = useState(false);

  /// @notice Computes the transfer amount configured for the sample (defaults to 0.01).
  const configuredTransferAmount =
    Number(process.env.NEXT_PUBLIC_TRANSFER_AMOUNT) || 0.01;

  /// @notice Bootstraps the SDK plus Solana connection immediately after mount.
  useEffect(() => {
    void initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /// @notice Refreshes balances each time wallets become available after initialization.
  useEffect(() => {
    if (userAWallet && userBWallet && devWallet && isInitialized) {
      void refreshBalances(userAWallet, userBWallet, devWallet);
    }
  }, [userAWallet, userBWallet, devWallet, isInitialized, refreshBalances]);

  /// @notice Watches the USDC balance for User A to surface funding guidance.
  useEffect(() => {
    const userABalanceLabel = balances.userA?.usdc;
    if (!userABalanceLabel || userABalanceLabel === "Loading...") {
      return;
    }
    const balanceValue = parseFloat(userABalanceLabel.replace(" USDC", ""));
    const insufficient = Number.isFinite(balanceValue)
      ? balanceValue < configuredTransferAmount
      : true;
    setHasInsufficientUSDC(insufficient);
    if (insufficient && userABalanceLabel !== "Error") {
      setStatus({
        message:
          "User A has insufficient USDC on devnet. Please fund this wallet to replay the sponsorship flow.",
        type: "warning",
      });
    }
  }, [balances.userA?.usdc, configuredTransferAmount]);

  /// @notice Initializes Solana plus MetaKeep while handling user-friendly status copy.
  const initializeApp = async () => {
    try {
      setStatus({
        message: "Initializing MetaKeep SDK and Solana connection...",
        type: "info",
      });
      await initializeConnection();
      await initializeWallets();
      setIsInitialized(true);
      setStatus({ message: "", type: "info" });
    } catch (error) {
      setStatus({
        message: `Initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
      setIsInitialized(false);
    }
  };

  /// @notice Refreshes all balances with optimistic UI updates.
  const handleRefreshBalances = async () => {
    try {
      if (!userAWallet || !userBWallet || !devWallet) {
        setStatus({
          message: "Wallet addresses are not ready yet. Please try again shortly.",
          type: "error",
        });
        return;
      }
      setStatus({ message: "Refreshing balances...", type: "info" });
      await refreshBalances(userAWallet, userBWallet, devWallet);
      setStatus({
        message: "Balances refreshed successfully!",
        type: "success",
      });
      setTimeout(() => setStatus({ message: "", type: "info" }), 3000);
    } catch (error) {
      setStatus({
        message: `Failed to refresh balances: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
      setTimeout(() => setStatus({ message: "", type: "info" }), 5000);
    }
  };

  /// @notice Orchestrates the MetaKeep-assisted USDC transfer with developer-sponsored gas.
  const handleTransferUSDC = async () => {
    try {
      if (!connection || !sdk || !userAWallet || !userBWallet || !devWallet) {
        setStatus({
          message:
            "Missing wallet or connection details. Please initialize the experience again.",
          type: "error",
        });
        return;
      }
      if (hasInsufficientUSDC) {
        setStatus({
          message:
            "User A has insufficient USDC on devnet. Please fund this wallet to continue.",
          type: "error",
        });
        return;
      }
      setStatus({
        message: "Starting USDC transfer...",
        type: "info",
      });
      const result = await transferUSDC(
        connection,
        sdk,
        userAWallet,
        userBWallet,
        devWallet,
        configuredTransferAmount
      );
      if (result.success) {
        setStatus({
          message: `Transfer successful! Transaction: ${result.signature}`,
          type: "success",
        });
        setTransactionInfo({
          signature: result.signature,
          solscanLink: `https://solscan.io/tx/${result.signature}?cluster=devnet`,
        });
        setUserSignature(result.userSignature);
        setDeveloperSignature(result.developerSignature);
        setTimeout(
          () => void refreshBalances(userAWallet, userBWallet, devWallet),
          2000
        );
        setTimeout(() => setStatus({ message: "", type: "info" }), 5000);
      }
    } catch (error) {
      setStatus({
        message: `Transfer failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        type: "error",
      });
      setTimeout(() => setStatus({ message: "", type: "info" }), 5000);
    }
  };

  /// @notice Presents the wallet grid, CTA cluster, and transactional telemetry.
  return (
    <>
      <div className="wallet-section">
        <WalletCard
          title=" User A"
          address={userAWallet || "Loading..."}
          solBalance={balances.userA?.sol || "Loading..."}
          usdcBalance={balances.userA?.usdc || "Loading..."}
        />
        <WalletCard
          title=" User B"
          address={userBWallet || "Loading..."}
          solBalance={balances.userB?.sol || "Loading..."}
          usdcBalance={balances.userB?.usdc || "Loading..."}
        />
        <WalletCard
          title=" Developer Wallet"
          address={devWallet || "Loading..."}
          solBalance={balances.dev?.sol || "Loading..."}
          usdcBalance={balances.dev?.usdc || "Loading..."}
          isDeveloper
        />
      </div>

      <ActionButtons
        onRefreshBalances={handleRefreshBalances}
        onTransferUSDC={handleTransferUSDC}
        disabled={isInitializing}
        isTransferring={transferState.isTransferring}
        hasInsufficientUSDC={hasInsufficientUSDC}
      />

      <StatusSection
        status={status}
        transactionInfo={transactionInfo}
        userSignature={userSignature}
        developerSignature={developerSignature}
      />
    </>
  );
}

