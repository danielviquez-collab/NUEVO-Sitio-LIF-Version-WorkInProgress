const integer = new Intl.NumberFormat('en-US', {
  useGrouping: true,
  maximumFractionDigits: 0,
});

// es-CR grouping differs between JavaScript engines; keep server and client text identical.
export function formatScore(value: number) {
  return integer.formatToParts(value)
    .map((part) => part.type === 'group' ? '\u00a0' : part.value)
    .join('');
}
