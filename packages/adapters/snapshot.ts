import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

const cache = new Map<string, unknown>();

/**
 * Read a snapshot file from data/snapshots/ with simple in-memory caching.
 * Snapshots are versioned and small, so caching the full content is fine.
 */
export async function readSnapshot<T>(...segments: string[]): Promise<T> {
  const key = segments.join("/");
  const cached = cache.get(key);
  if (cached !== undefined) return cached as T;

  const filePath = path.join(
    process.cwd(),
    "data",
    "snapshots",
    ...segments,
  );
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as T;
  cache.set(key, parsed);
  return parsed;
}
