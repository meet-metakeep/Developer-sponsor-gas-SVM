/// @notice Imports Next.js request and response helpers for building typed API routes.
import { NextRequest, NextResponse } from "next/server";
/// @notice Ensures the Solana RPC endpoint is configured before proxying calls.
import { requirePublicEnv } from "@/lib/env";

/// @notice Fetches the SOL balance for a provided address by proxying to the configured Solana RPC endpoint.
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
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address.trim()],
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
    const lamports = data.result.value;
    const solBalance = (lamports / 1_000_000_000).toFixed(5);
    return NextResponse.json({ status: "SUCCESS", balance: solBalance });
  } catch (error) {
    console.error("Solana balance lookup failed", error);
    return NextResponse.json(
      {
        error: "Failed to get Solana balance",
        details: error instanceof Error ? error.message : "Unknown error",
        status: "ERROR",
      },
      { status: 500 }
    );
  }
}

