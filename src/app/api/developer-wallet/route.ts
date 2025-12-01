/// @notice Imports Next.js primitives for handling API requests and responses within the App Router.
import { NextResponse } from "next/server";
/// @notice Ensures the MetaKeep API key exists on the server before proxying requests.
import { requireServerEnv } from "@/lib/env";

/// @notice Proxies a request to MetaKeep to retrieve the developer wallet metadata.
export async function POST() {
  try {
    const apiKey = requireServerEnv("METAKEEP_API_KEY");
    const response = await fetch("https://api.metakeep.xyz/v3/getDeveloperWallet", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ id: "master" }),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`MetaKeep developer wallet lookup failed with ${response.status}.`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Developer wallet fetch failed", error);
    return NextResponse.json(
      {
        error: "Failed to fetch developer wallet",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

