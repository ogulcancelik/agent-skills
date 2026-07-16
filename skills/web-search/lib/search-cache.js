import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SEARCH_ID_PATTERN = /^[a-f0-9]{12}$/;

export function getSearchCacheDir({ homeDir = homedir(), env = process.env, platform = process.platform } = {}) {
  let cacheBase;
  if (platform === "win32") {
    cacheBase = env.LOCALAPPDATA || join(homeDir, "AppData", "Local");
  } else if (platform === "darwin") {
    cacheBase = join(homeDir, "Library", "Caches");
  } else {
    cacheBase = env.XDG_CACHE_HOME || join(homeDir, ".cache");
  }
  return join(cacheBase, "web-search", "result-sets");
}

function ensurePrivateDir(cacheDir) {
  mkdirSync(cacheDir, { recursive: true, mode: 0o700 });
  const stat = lstatSync(cacheDir);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Search cache path is not a private directory: ${cacheDir}`);
  }
  if (typeof process.getuid === "function" && stat.uid !== process.getuid()) {
    throw new Error(`Search cache directory is not owned by the current user: ${cacheDir}`);
  }
  chmodSync(cacheDir, 0o700);
}

function cachePath(cacheDir, searchId) {
  if (!SEARCH_ID_PATTERN.test(searchId)) {
    throw new Error(`Invalid search result-set ID: ${searchId}`);
  }
  return join(cacheDir, `${searchId}.json`);
}

export function cleanupSearchCaches({ cacheDir, ttlMs, now = Date.now() }) {
  let entries;
  try {
    entries = readdirSync(cacheDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const path = join(cacheDir, entry.name);
    try {
      const cache = JSON.parse(readFileSync(path, "utf8"));
      if (!Number.isFinite(cache.timestamp) || now - cache.timestamp > ttlMs) {
        rmSync(path, { force: true });
      }
    } catch {
      rmSync(path, { force: true });
    }
  }
}

export function saveSearchCache(cache, { cacheDir = getSearchCacheDir(), ttlMs, now = Date.now() } = {}) {
  ensurePrivateDir(cacheDir);
  cleanupSearchCaches({ cacheDir, ttlMs, now });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const searchId = randomBytes(6).toString("hex");
    const finalPath = cachePath(cacheDir, searchId);
    if (existsSync(finalPath)) continue;

    const temporaryPath = join(cacheDir, `.${searchId}-${randomBytes(4).toString("hex")}.tmp`);
    try {
      writeFileSync(temporaryPath, JSON.stringify({ ...cache, timestamp: now }, null, 2), {
        encoding: "utf8",
        mode: 0o600,
        flag: "wx",
      });
      renameSync(temporaryPath, finalPath);
      return searchId;
    } catch (error) {
      rmSync(temporaryPath, { force: true });
      if (error?.code !== "EEXIST") throw error;
    }
  }

  throw new Error("Unable to allocate a unique search result-set ID");
}

export function loadSearchCache(searchId, { cacheDir = getSearchCacheDir(), ttlMs, now = Date.now() } = {}) {
  const path = cachePath(cacheDir, searchId);
  try {
    const cache = JSON.parse(readFileSync(path, "utf8"));
    if (!Number.isFinite(cache.timestamp) || now - cache.timestamp > ttlMs) {
      rmSync(path, { force: true });
      return null;
    }
    return cache;
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    return null;
  }
}
