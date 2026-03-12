import { CompareResult } from '~/types/enum'

export function parseTimestamp(ts: string | undefined): number | null {
  if (!ts) return null
  const parsed = Date.parse(ts)
  return Number.isNaN(parsed) ? null : parsed
}

export function compareTimestampsV2(localTs: string | undefined, remoteTs: string | undefined): CompareResult {
  const localTime = parseTimestamp(localTs)
  const remoteTime = parseTimestamp(remoteTs)
  if (localTime == null || remoteTime == null) return CompareResult.NoRemote
  if (remoteTime > localTime) return CompareResult.RemoteNewer
  if (localTime > remoteTime) return CompareResult.LocalNewer
  return CompareResult.Equal
}

/**
 * 是否应拉取远程（唯一入口）：先看版本，再看时间戳。
 * 1. 无版本号 → 视为旧，不拉。
 * 2. 有版本号：版本大的是新；相等则比时间戳，remote_newer 才拉。
 */
export function shouldFetchRemoteV2(
  localUpdatedAt: string | undefined,
  remoteUpdatedAt: string | undefined,
  remoteVersion: number | undefined,
  currentVersion: number
): CompareResult {
  if (remoteVersion == null) return CompareResult.NoRemote
  if (remoteVersion > currentVersion) return CompareResult.RemoteNewer
  if (remoteVersion < currentVersion) return CompareResult.LocalNewer
  return compareTimestampsV2(localUpdatedAt, remoteUpdatedAt)
}
