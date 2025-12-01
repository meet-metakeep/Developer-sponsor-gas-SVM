/// @notice Imports the Next.js response helper to format JSON replies.
import { NextRequest, NextResponse } from "next/server";
/// @notice Validates that the MetaKeep API key exists before proxying signing requests.
import { requireServerEnv } from "@/lib/env";

/// @notice Proxies transaction-signing requests to MetaKeep so the developer wallet can cover gas.
export async function POST(request: NextRequest) {
  try {
    const apiKey = requireServerEnv("METAKEEP_API_KEY");
    const body = await request.json();
    const response = await fetch("https://api.metakeep.xyz/v2/app/sign/transaction", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MetaKeep signing error ${response.status}: ${errorText}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("MetaKeep signing proxy failed", error);
    return NextResponse.json(
      {
        error: "Failed to sign transaction with MetaKeep",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

