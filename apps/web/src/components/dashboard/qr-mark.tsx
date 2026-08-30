/**
 * Decorative QR motif for the "download the app" footer — three finder squares
 * plus a woven module grid, matching the Figma. Not a scannable code.
 */
export function QrMark({ className }: { className?: string }) {
  const finders: Array<[number, number]> = [
    [0, 0],
    [44, 0],
    [0, 44],
  ];
  const bars = [0, 7, 14, 21, 28];

  return (
    <svg viewBox="0 0 76 76" className={className} role="img" aria-label="App download QR code">
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <rect width="32" height="32" rx="4" fill="#f3f4f7" />
          <rect x="10" y="10" width="12" height="12" rx="2" fill="#6b7280" />
        </g>
      ))}
      <g transform="translate(44 44)" fill="#f3f4f7">
        {bars.map((v) => (
          <rect key={`v${v}`} x={v} y={0} width={4} height={32} />
        ))}
        {bars.map((v) => (
          <rect key={`h${v}`} x={0} y={v} width={32} height={4} />
        ))}
        <rect x={22} y={22} width={10} height={10} rx={1} />
      </g>
    </svg>
  );
}
