/// @notice Imports React state utilities to expose transfer progress to the UI.
import { useState } from "react";
/// @notice Imports Solana primitives used to craft instructions and transactions.
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
/// @notice Imports SPL helper utilities for token account discovery and transfers.
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
/// @notice Imports the Buffer polyfill so signatures can be added inside the browser bundle.
import { Buffer } from "buffer";
/// @notice Ensures required public configuration (mint addresses, etc.) is present.
import { requirePublicEnv } from "@/lib/env";
/// @notice Imports the MetaKeep SDK type to keep interop strongly typed.
import type { MetaKeepSDK } from "@/types/metakeep";

/// @notice Describes the reactive state that keeps the UI in sync with transfer progress.
interface TransferState {
  /// @notice Indicates whether a transfer is underway.
  isTransferring: boolean;
  /// @notice Captures any error message that surfaced while submitting the transaction.
  error: string | null;
  /// @notice Signals whether the previous transfer finished successfully.
  success: boolean;
}

/// @notice Converts a hex string to a Uint8Array so MetaKeep signatures can be applied to the transaction.
const hexToUint8Array = (hex: string) => {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
};

/// @notice Handles the end-to-end transfer flow while surfacing progress updates.
export function useTransfer() {
  /// @notice Tracks submission state so the CTA can disable itself.
  const [transferState, setTransferState] = useState<TransferState>({
    isTransferring: false,
    error: null,
    success: false,
  });

  /// @notice Transfers USDC from User A to User B while asking the developer wallet to cover fees.
  const transferUSDC = async (
    connection: Connection,
    sdk: MetaKeepSDK,
    userAWallet: string,
    userBWallet: string,
    devWallet: string,
    amount: number = Number(
      requirePublicEnv("NEXT_PUBLIC_TRANSFER_AMOUNT", "0.01")
    )
  ) => {
    setTransferState({ isTransferring: true, error: null, success: false });
    try {
      const usdcMint = new PublicKey(requirePublicEnv("NEXT_PUBLIC_USDC_MINT_DEVNET"));
      const userAPublicKey = new PublicKey(userAWallet);
      const userBPublicKey = new PublicKey(userBWallet);
      const devPublicKey = new PublicKey(devWallet);

      const userAATA = await getAssociatedTokenAddress(usdcMint, userAPublicKey);
      const userBATA = await getAssociatedTokenAddress(usdcMint, userBPublicKey);

      const userBATAInfo = await connection.getAccountInfo(userBATA);
      if (!userBATAInfo) {
        const createATAInstruction = createAssociatedTokenAccountInstruction(
          devPublicKey,
          userBATA,
          userBPublicKey,
          usdcMint
        );
        const ataTransaction = new Transaction().add(createATAInstruction);
        const ataResponse = await fetch("/api/metakeep-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction: ataTransaction
              .serialize({ requireAllSignatures: false })
              .toString("base64"),
            walletId: "master",
          }),
        });
        if (!ataResponse.ok) {
          throw new Error("Failed to create User B USDC token account.");
        }
      }

      const transferAmount = Math.floor(amount * 1_000_000);
      const transferInstruction = createTransferInstruction(
        userAATA,
        userBATA,
        userAPublicKey,
        transferAmount
      );

      const transaction = new Transaction().add(transferInstruction);
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = devPublicKey;

      const userSignature = await sdk.signTransaction(
        transaction,
        `Transfer ${amount} USDC to User B`
      );
      if (!userSignature) {
        throw new Error("User signature was not provided by MetaKeep.");
      }
      transaction.addSignature(
        userAPublicKey,
        Buffer.from(hexToUint8Array(userSignature.signature))
      );

      const serializedMessage = transaction.serializeMessage();
      const serializedMessageHex = `0x${Array.from(serializedMessage)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")}`;
      const developerSignResponse = await fetch("/api/metakeep-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionObject: { serializedTransactionMessage: serializedMessageHex },
          reason: "Developer gas sponsorship for USDC transfer",
        }),
      });
      if (!developerSignResponse.ok) {
        throw new Error("Developer signing request failed.");
      }
      const developerSignature = await developerSignResponse.json();
      if (developerSignature.status !== "SUCCESS" || !developerSignature.signature) {
        throw new Error(
          developerSignature.message || "Developer signing failed without a message."
        );
      }
      transaction.addSignature(
        devPublicKey,
        Buffer.from(hexToUint8Array(developerSignature.signature))
      );

      const signature = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      const confirmation = await connection.confirmTransaction(signature, "confirmed");
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      setTransferState({ isTransferring: false, error: null, success: true });
      return {
        signature,
        success: true,
        userSignature,
        developerSignature,
      };
    } catch (error) {
      setTransferState({
        isTransferring: false,
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      });
      throw error;
    }
  };

  /// @notice Exposes the transfer helper plus its reactive state tuple.
  return {
    transferUSDC,
    transferState,
  };
}

