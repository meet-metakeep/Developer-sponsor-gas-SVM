/// @notice Imports the top-level MetaKeep experience so the page can stay server-rendered while delegating interactivity.
import { MetaKeepApp } from "@/components/MetaKeepApp";

/// @notice Renders the marketing shell that wraps the interactive MetaKeep transfer experience.
export default function Home() {
  /// @notice Outputs the hero, copy, and interactive widget in a centered container.
  return (
    <div className="container">
      <header>
        <h1>MetaKeep Gas Sponsorship Demo</h1>
        <p>Developer-sponsored USDC transfer on Solana Devnet</p>
      </header>
      <MetaKeepApp />
    </div>
  );
}
