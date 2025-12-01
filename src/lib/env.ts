/// @notice Enumerates server-side only environment variables so secrets never leak to the browser bundle.
const serverEnv = {
  METAKEEP_API_KEY: process.env.METAKEEP_API_KEY,
} as const;

/// @notice Enumerates public environment variables that Next.js can inline into the client bundle.
const publicEnv = {
  NEXT_PUBLIC_METAKEEP_APP_ID: process.env.NEXT_PUBLIC_METAKEEP_APP_ID,
  NEXT_PUBLIC_USER_B_WALLET: process.env.NEXT_PUBLIC_USER_B_WALLET,
  NEXT_PUBLIC_SOLANA_DEVNET_RPC: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC,
  NEXT_PUBLIC_USDC_MINT_DEVNET: process.env.NEXT_PUBLIC_USDC_MINT_DEVNET,
  NEXT_PUBLIC_TRANSFER_AMOUNT: process.env.NEXT_PUBLIC_TRANSFER_AMOUNT,
} as const;

/// @notice Throws a descriptive error whenever an expected environment variable is missing.
function assertEnv(
  value: string | undefined,
  name: string,
  fallback?: string
): string {
  const resolved = value ?? fallback;
  if (!resolved) {
    throw new Error(
      `Missing required environment variable: ${name}. Please ensure it is set in your .env file and restart the development server.`
    );
  }
  return resolved;
}

/// @notice Gets a typed server-only environment variable such as the MetaKeep API key.
export function requireServerEnv(name: keyof typeof serverEnv): string {
  return assertEnv(serverEnv[name], name);
}

/// @notice Gets a typed public environment variable that Next.js exposes to the browser.
export function requirePublicEnv(
  name: keyof typeof publicEnv,
  fallback?: string
): string {
  return assertEnv(publicEnv[name], name, fallback);
}

