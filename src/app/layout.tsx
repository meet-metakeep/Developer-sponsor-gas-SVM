/// @notice Imports the Next.js metadata contract to describe global SEO data in a structured way.
import type { Metadata } from "next";
/// @notice Imports the Inter font helper to keep typography consistent across the demo.
import { Inter } from "next/font/google";
/// @notice Loads the global stylesheet so every route shares the same visual language.
import "./globals.css";

/// @notice Configures the Inter font subset so the font-face is limited to the Latin glyphs required by the UI copy.
const inter = Inter({ subsets: ["latin"] });
/// @notice Centralizes the MetaKeep CDN URL so the script tag stays declarative and easy to audit.
const METAKEEP_CDN_URL =
  "https://cdn.jsdelivr.net/npm/metakeep@2.2.8/lib/index.js";
/// @notice Centralizes the Solana Web3.js CDN bundle so the same version is reused everywhere.
const SOLANA_WEB3_CDN_URL =
  "https://unpkg.com/@solana/web3.js@1.87.6/lib/index.iife.min.js";

/// @notice Provides human-readable metadata for SEO surfaces and link previews.
export const metadata: Metadata = {
  /// @notice Communicates the purpose of the experience in browser tabs and search results.
  title: "MetaKeep Gas Sponsorship Demo",
  /// @notice Explains that the page showcases a developer-sponsored USDC transfer on Solana devnet.
  description:
    "Developer-sponsored MetaKeep experience that transfers 0.01 USDC on Solana Devnet while the builder covers the gas.",
};

/// @notice Wraps every route in shared HTML tags and preloads the scripts that power MetaKeep and Solana interactions.
export default function RootLayout({
  /// @notice Represents the React node tree rendered by individual routes.
  children,
}: Readonly<{
  /// @notice Type constraint that guarantees any valid React node can be rendered inside the layout.
  children: React.ReactNode;
}>) {
  /// @notice Renders the semantic HTML scaffold and injects the MetaKeep plus Solana SDK scripts exactly once.
  return (
    <html lang="en">
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src={METAKEEP_CDN_URL}
          integrity="sha256-dVJ6hf8zqdtHxHJCDJnLAepAyCCbu6lCXzZS3lqMIto="
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src={SOLANA_WEB3_CDN_URL} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
