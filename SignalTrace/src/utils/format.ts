const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Formats a byte count using binary (1024) units, e.g. 1536 -> "1.5 KB". */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  const digits = exponent === 0 ? 0 : fractionDigits;
  return `${value.toFixed(digits)} ${BYTE_UNITS[exponent]}`;
}

/** Formats a byte-per-second rate, e.g. 2048 -> "2.0 KB/s". */
export function formatRate(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}
