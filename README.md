## MetaKeep Developer Gas Sponsorship Demo

In this project, only the developer wallet pays rent / gas fees on behalf of User A, which transfers 0.01 USDC to User B. 


## Prerequisites

- MetaKeep account (sign up at [console.metakeep.xyz](https://console.metakeep.xyz))

- User A wallet address, sign up with User email id 
- Solana Devnet wallets (User A, User B, and developer) funded with SOL and USDC
- User B wallet address is pre-configured. 


## Configuration

### Obtaining MetaKeep Credentials

1. Navigate to [console.metakeep.xyz](https://console.metakeep.xyz) and sign in to your MetaKeep account.
2. Create a new Solana application or select an existing one from your dashboard.
3. Copy your **App ID** from the application settings page.
4. Navigate to the API Keys section in the console.
5. Generate a new API key or copy an existing one with appropriate permissions.
6. Store these credentials securely—you'll need them for the `.env` file.

### Setting Up Environment Variables

1. Copy the sample environment file:

```bash
cp env.example .env
```

2. Open the `.env` file in your editor and replace the placeholder values with your MetaKeep credentials:

| Variable | Description | Where to Find |
| --- | --- | --- |
| `METAKEEP_API_KEY` | Server-side API key for MetaKeep signing operations | MetaKeep Console → API Keys section |
| `NEXT_PUBLIC_METAKEEP_APP_ID` | Your Solana application ID | MetaKeep Console → Application Settings |
| `NEXT_PUBLIC_SOLANA_DEVNET_RPC` | Solana Devnet RPC endpoint | Pre-configured (no change needed) |
| `NEXT_PUBLIC_USDC_MINT_DEVNET` | Devnet USDC mint address | Pre-configured (no change needed) |
| `NEXT_PUBLIC_TRANSFER_AMOUNT` | Amount of USDC to transfer | Default: `0.01` (adjust as needed) |
| `NEXT_PUBLIC_USER_B_WALLET` | Recipient wallet address (User B) | Your Solana Devnet wallet address |


## MetaKeep API Usage

The integration separates **backend-only REST APIs** from the **client-side SDK** so that secrets never leave the server runtime.

### Backend-only REST APIs 

The following MetaKeep endpoints **must never be called from the browser** because they require the `METAKEEP_API_KEY`. We invoke them inside the Next.js App Router API routes (`/app/api/**`) so the key stays on the server:

- [`POST https://api.metakeep.xyz/v3/getDeveloperWallet`](https://docs.metakeep.xyz/reference/v3getdeveloperwallet) – retrieves the developer (sponsor) Solana wallet. This logic lives in `app/api/developer-wallet/route.ts` and runs only on the backend.  
- [`POST https://api.metakeep.xyz/v2/app/sign/transaction`](https://docs.metakeep.xyz/reference/v2apptransactionsign) – requests a developer signature for the fully prepared Solana transaction. Implemented in `app/api/metakeep-sign/route.ts`.

### Client-side SDK usage

The MetaKeep Web SDK’s [`getWallet`](https://docs.metakeep.xyz/reference/sdk-get-wallet) method is safe for the browser because it does not use your API key. Our `useMetaKeepSDK` hook calls:

```ts
const wallet = await sdk.getWallet();
```

This returns the user’s Solana, EVM, and EOS addresses after MetaKeep completes its built-in verification flow. The SDK handles end-user consent dialogs, while the backend APIs above handle developer wallets and sponsorship signatures.

### Flow summary

1. Browser loads MetaKeep SDK and calls `sdk.getWallet()` to obtain User A’s wallet (client-side).  
2. Browser calls internal routes (`/api/developer-wallet`, `/api/metakeep-sign`) which **run on the server** and in turn call the official MetaKeep REST APIs with the API key.  
3. The backend responds to the browser with sanitized data (wallet address or signature).  
4. The transaction is submitted to Solana with both signatures attached.

## Install & Run

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the demo.

## How It Works

1. `useMetaKeepSDK` loads the MetaKeep CDN SDK, registers User A, sets User B from configuration, and fetches the developer wallet via `/api/developer-wallet`.
2. `useSolanaConnection` hydrates a devnet `Connection` from the Solana Web3.js CDN bundle.
3. `useWalletBalances` talks to `/api/solana-balance` and `/api/usdc-balance`, which in turn proxy the configured RPC endpoint.
4. `useTransfer` creates the USDC transfer transaction, gathers the MetaKeep user signature, relays the serialized message to `/api/metakeep-sign` for a developer signature, and broadcasts the fully signed transaction while the dev wallet covers gas.

All API routes strip logging down to actionable errors and rely exclusively on the environment variables listed above.

## Linting & Testing

- `npm run lint` &mdash; Ensures the NatSpec-documented TypeScript code conforms to `eslint-config-next`.
- `npm run build` &mdash; Validates the production bundle can be generated successfully.

## Operational Notes

- User A needs at least `NEXT_PUBLIC_TRANSFER_AMOUNT` USDC on Devnet. The UI surfaces a warning when the balance is insufficient.
- The developer wallet data and signatures are always proxied server-side so API keys never reach the browser.
- All transactions link out to Solscan for easy verification.
