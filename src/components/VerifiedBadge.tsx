/** Blue verified check, shown beside verified account names. */
export function VerifiedBadge({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Terverifikasi" role="img">
      <path
        fill="#1d9bf0"
        d="M12 1.5l2.4 2.1 3.2-.3.9 3.1 2.9 1.4-1.2 3 1.2 3-2.9 1.4-.9 3.1-3.2-.3L12 22.5l-2.4-2.1-3.2.3-.9-3.1-2.9-1.4 1.2-3-1.2-3 2.9-1.4.9-3.1 3.2.3z"
      />
      <path
        fill="#fff"
        d="M10.8 15.6l-3-3 1.3-1.3 1.7 1.7 4.1-4.1 1.3 1.3z"
      />
    </svg>
  );
}
