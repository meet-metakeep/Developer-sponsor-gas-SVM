/// @notice Imports Next.js routing primitives to implement an API endpoint inside the App Router.
import { NextRequest, NextResponse } from "next/server";
/// @notice Ensures required mint and RPC configuration is available.
import { requirePublicEnv } from "@/lib/env";

/// @notice Fetches the aggregated USDC balance for the provided wallet by querying the Solana RPC endpoint.
export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();
    if (!address) {
      return NextResponse.json(
        { error: "Address is required", status: "ERROR" },
        { status: 400 }
      );
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim())) {
      return NextResponse.json(
        { error: "Invalid Solana address format", status: "ERROR" },
        { status: 400 }
      );
    }
    const rpcUrl = requirePublicEnv("NEXT_PUBLIC_SOLANA_DEVNET_RPC");
    const usdcMint = requirePublicEnv("NEXT_PUBLIC_USDC_MINT_DEVNET");
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          address.trim(),
          { mint: usdcMint },
          { encoding: "jsonParsed" },
        ],
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`RPC request failed with status ${response.status}.`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || "Unknown RPC error");
    }
    let totalBalance = 0;
    if (data.result?.value) {
      for (const account of data.result.value) {
        totalBalance += account.account.data.parsed.info.tokenAmount.uiAmount || 0;
      }
    }
    return NextResponse.json({
      status: "SUCCESS",
      balance: totalBalance.toFixed(2),
    });
  } catch (error) {
    console.error("USDC balance lookup failed", error);
    return NextResponse.json(
      {
        error: "Failed to get USDC balance",
        details: error instanceof Error ? error.message : "Unknown error",
        status: "ERROR",
      },
      { status: 500 }
    );
  }
}

