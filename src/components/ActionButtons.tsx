/// @notice Declares the callbacks and UI state values consumed by the action bar.
interface ActionButtonsProps {
  /// @notice Handler that refreshes balances by calling the backend proxies.
  onRefreshBalances: () => void;
  /// @notice Handler that kicks off the MetaKeep-assisted USDC transfer.
  onTransferUSDC: () => void;
  /// @notice Disables the buttons while the app is initializing.
  disabled?: boolean;
  /// @notice Indicates whether a transfer is currently in-flight.
  isTransferring?: boolean;
  /// @notice Signals that User A lacks enough USDC to run the happy path.
  hasInsufficientUSDC?: boolean;
}

/// @notice Provides the refresh and transfer controls with a status-aware CTA label.
export function ActionButtons({
  /// @notice Callback invoked when the refresh button is pressed.
  onRefreshBalances,
  /// @notice Callback invoked when the transfer CTA is activated.
  onTransferUSDC,
  /// @notice Reflects whether the module is still bootstrapping credentials.
  disabled = false,
  /// @notice Toggles the spinner text while MetaKeep signs the transaction.
  isTransferring = false,
  /// @notice Communicates whether the CTA should be locked due to low USDC.
  hasInsufficientUSDC = false,
}: ActionButtonsProps) {
  /// @notice Determines the transfer amount label so the CTA mirrors configuration.
  const configuredTransferAmount =
    process.env.NEXT_PUBLIC_TRANSFER_AMOUNT ?? "0.01";

  /// @notice Builds the CTA copy so the render tree stays tidy.
  const transferCtaLabel = (() => {
    if (isTransferring) {
      return "Transferring...";
    }
    if (hasInsufficientUSDC) {
      return "Insufficient USDC";
    }
    return `Transfer ${configuredTransferAmount} USDC (A → B)`;
  })();

  /// @notice Renders the action buttons with state-aware disabled flags.
  return (
    <div className="action-section">
      <button
        onClick={onRefreshBalances}
        className="btn btn-secondary"
        disabled={disabled}
      >
        Refresh Balances
      </button>
      <button
        onClick={onTransferUSDC}
        className="btn btn-primary"
        disabled={disabled || isTransferring || hasInsufficientUSDC}
      >
        {transferCtaLabel}
      </button>
    </div>
  );
}

