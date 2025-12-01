/// @notice Defines the props required to render a wallet summary card.
interface WalletCardProps {
  /// @notice Human-friendly label shown at the top of the card.
  title: string;
  /// @notice Base58 wallet address rendered in a monospace block.
  address: string;
  /// @notice SOL balance string (already formatted with the unit suffix).
  solBalance: string;
  /// @notice USDC balance string (already formatted with the unit suffix).
  usdcBalance: string;
  /// @notice Flag that highlights the developer wallet with a tinted border.
  isDeveloper?: boolean;
}

/// @notice Presents a single wallet summary including address plus SOL/USDC balances.
export function WalletCard({
  /// @notice User-facing label for the card.
  title,
  /// @notice Address string displayed to the builder.
  address,
  /// @notice SOL balance label.
  solBalance,
  /// @notice USDC balance label.
  usdcBalance,
  /// @notice Indicates if the wallet belongs to the sponsoring developer.
  isDeveloper = false,
}: WalletCardProps) {
  /// @notice Chooses the CSS class that tints developer cards differently.
  const cardClass = isDeveloper ? "wallet-card developer" : "wallet-card";

  /// @notice Provides the wallet body markup so the return statement stays terse.
  const walletBody = (
    <div className="wallet-info">
      <p>
        <strong>Address:</strong> <span>{address}</span>
      </p>
      <p>
        <strong>SOL Balance:</strong> <span>{solBalance}</span>
      </p>
      <p>
        <strong>USDC Balance:</strong> <span>{usdcBalance}</span>
      </p>
    </div>
  );

  /// @notice Renders the wallet container together with its heading and data rows.
  return (
    <div className={cardClass}>
      <h3>{title}</h3>
      {walletBody}
    </div>
  );
}

