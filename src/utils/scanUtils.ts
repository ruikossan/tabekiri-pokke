const recentScanMap = new Map<string, number>();
const DUPLICATE_SCAN_WINDOW_MS = 1800;

export function isDuplicateRecentScan(barcode: string, now = Date.now()): boolean {
  const normalized = barcode.trim();
  if (!normalized) return true;

  const lastScannedAt = recentScanMap.get(normalized);
  recentScanMap.set(normalized, now);
  return lastScannedAt !== undefined && now - lastScannedAt < DUPLICATE_SCAN_WINDOW_MS;
}
