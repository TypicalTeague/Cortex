export function Logo({ size = 22 }: { size?: number }) {
  // Two nested arcs: a thought taking shape.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--cx-accent)" />
      <path d="M21.5 10.5a8 8 0 1 0 0 11" fill="none" stroke="var(--cx-accent-ink)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M18.6 13.4a3.8 3.8 0 1 0 0 5.2" fill="none" stroke="var(--cx-accent-ink)" strokeWidth="2.6" strokeLinecap="round" opacity="0.65" />
    </svg>
  );
}

export function Brand({ size = 22 }: { size?: number }) {
  return (
    <span className="cx-brand">
      <Logo size={size} />
      <span>Cortex</span>
    </span>
  );
}
