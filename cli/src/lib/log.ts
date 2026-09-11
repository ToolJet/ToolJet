// Only the "✗ Error" label is colored red
export function formatError(message: string): string {
  return `\n\x1b[1;31m✗ Error\x1b[0m : ${message}\n`;
}

// only the "✓" icon is colored, so the message itself stays default-colored and readable in any terminal theme.
export function formatSuccess(message: string): string {
  return `\x1b[1;32m✓\x1b[0m ${message}`;
}

// Sub-second durations read better as milliseconds; above 1s, seconds are easier to scan.
export function formatDuration(ms: number): string {
  return ms > 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`;
}
