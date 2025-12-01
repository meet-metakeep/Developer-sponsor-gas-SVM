/// @notice Shapes the props passed into the status and transaction summary block.
interface StatusSectionProps {
  /// @notice Current status message surface along with its severity.
  status: { message: string; type: "info" | "success" | "error" | "warning" };
  /// @notice Details about the last confirmed transfer, including Solscan deep link.
  transactionInfo: { signature: string; solscanLink: string } | null;
  /// @notice Signature payload returned by MetaKeep for the user wallet.
  userSignature?: { signature: string } | null;
  /// @notice Signature payload returned by MetaKeep for the developer wallet.
  developerSignature?: { signature: string } | null;
}

/// @notice Renders operational status, signatures, and transaction metadata to help auditors follow along.
export function StatusSection({
  /// @notice Live status copy.
  status,
  /// @notice Latest transaction metadata.
  transactionInfo,
  /// @notice Signature data produced for the user wallet.
  userSignature,
  /// @notice Signature data produced for the developer wallet.
  developerSignature,
}: StatusSectionProps) {
  /// @notice Indicates whether the status banner has actionable copy.
  const hasStatus = Boolean(status.message);

  /// @notice Renders the banners and cards that summarize the transfer lifecycle.
  return (
    <div className="status-section">
      {hasStatus && (
        <div className={`status-text ${status.type}`}>{status.message}</div>
      )}

      {userSignature && (
        <div className="signed-message">
          <h4>👤 User A&apos;s Signed Message</h4>
          <p className="signature-text">{userSignature.signature}</p>
        </div>
      )}

      {developerSignature && (
        <div className="signed-message">
          <h4>🛠️ Developer&apos;s Transaction Signature</h4>
          <p className="signature-text">{developerSignature.signature}</p>
        </div>
      )}

      {transactionInfo && (
        <div className="transaction-info">
          <h4>✅ Transaction Details</h4>
          <p>
            <strong>Transaction ID:</strong>{" "}
            <span>{transactionInfo.signature}</span>
          </p>
          <p>
            <strong>Solscan:</strong>{" "}
            <a
              href={transactionInfo.solscanLink}
              target="_blank"
              rel="noopener noreferrer"
              className="solscan-link"
            >
              View on Solscan
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

