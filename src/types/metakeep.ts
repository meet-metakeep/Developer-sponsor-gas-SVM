/// @notice Imports the Solana transaction type solely for type-checking MetaKeep's signing surface.
import type { Transaction } from "@solana/web3.js";

/// @notice Shapes the response returned by `MetaKeep.getWallet`.
export interface MetaKeepWalletResponse {
  /// @notice Indicates whether the operation succeeded or was cancelled by the user.
  status: string;
  /// @notice Wallet payload that contains the Solana address when available.
  wallet?: {
    /// @notice Solana public key emitted by MetaKeep.
    solAddress?: string;
  };
}

/// @notice Describes the subset of the MetaKeep SDK that the demo relies upon.
export interface MetaKeepSDK {
  /// @notice Requests a MetaKeep-managed wallet for the current user.
  getWallet: () => Promise<MetaKeepWalletResponse>;
  /// @notice Asks MetaKeep to sign a Solana transaction.
  signTransaction: (
    transaction: Transaction,
    note?: string
  ) => Promise<{ signature: string }>;
}

