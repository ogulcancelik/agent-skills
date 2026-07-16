import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { getSearchCacheDir, loadSearchCache, saveSearchCache } from "../lib/search-cache.js";

function withCacheDir(run) {
  const root = mkdtempSync(join(tmpdir(), "web-search-cache-test-"));
  const cacheDir = join(root, "cache");
  try {
    run(cacheDir);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("search result sets remain isolated", () => {
  withCacheDir((cacheDir) => {
    const options = { cacheDir, ttlMs: 60_000, now: 1_000 };
    const firstId = saveSearchCache({ query: "first", results: [{ link: "https://first.example" }] }, options);
    const secondId = saveSearchCache({ query: "second", results: [{ link: "https://second.example" }] }, options);

    assert.notEqual(firstId, secondId);
    assert.equal(loadSearchCache(firstId, options).query, "first");
    assert.equal(loadSearchCache(secondId, options).query, "second");
  });
});

test("search caches expire independently", () => {
  withCacheDir((cacheDir) => {
    const searchId = saveSearchCache(
      { query: "expiring", results: [] },
      { cacheDir, ttlMs: 100, now: 1_000 },
    );

    assert.equal(loadSearchCache(searchId, { cacheDir, ttlMs: 100, now: 1_050 }).query, "expiring");
    assert.equal(loadSearchCache(searchId, { cacheDir, ttlMs: 100, now: 1_101 }), null);
  });
});

test("search cache files are private", { skip: process.platform === "win32" }, () => {
  withCacheDir((cacheDir) => {
    const searchId = saveSearchCache(
      { query: "private", results: [] },
      { cacheDir, ttlMs: 60_000, now: 1_000 },
    );

    assert.equal(statSync(cacheDir).mode & 0o777, 0o700);
    assert.equal(statSync(join(cacheDir, `${searchId}.json`)).mode & 0o777, 0o600);
    assert.deepEqual(readdirSync(cacheDir), [`${searchId}.json`]);
  });
});

test("default cache paths use per-user cache locations", () => {
  assert.equal(
    getSearchCacheDir({ homeDir: "/home/test", env: {}, platform: "linux" }),
    "/home/test/.cache/web-search/result-sets",
  );
  assert.equal(
    getSearchCacheDir({ homeDir: "/Users/test", env: {}, platform: "darwin" }),
    "/Users/test/Library/Caches/web-search/result-sets",
  );
  assert.equal(
    getSearchCacheDir({ homeDir: "C:\\Users\\test", env: { LOCALAPPDATA: "C:\\Cache" }, platform: "win32" }),
    join("C:\\Cache", "web-search", "result-sets"),
  );
});

test("search caches reject symlink directories", { skip: process.platform === "win32" }, () => {
  const root = mkdtempSync(join(tmpdir(), "web-search-cache-symlink-test-"));
  const target = join(root, "target");
  const cacheDir = join(root, "cache");
  try {
    mkdirSync(target);
    symlinkSync(target, cacheDir);
    assert.throws(
      () => saveSearchCache({ query: "unsafe", results: [] }, { cacheDir, ttlMs: 60_000 }),
      /not a private directory/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("search result-set IDs reject path traversal", () => {
  withCacheDir((cacheDir) => {
    assert.throws(
      () => loadSearchCache("../outside", { cacheDir, ttlMs: 60_000 }),
      /Invalid search result-set ID/,
    );
  });
});
