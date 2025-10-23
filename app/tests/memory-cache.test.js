import { test, mock } from "node:test";
import assert from "node:assert";

import { MemoryCache } from "../../dist/app/classes/memory-cache.js";

test("memory cache with cache hit", () => {
  const cache = new MemoryCache();
  const key = ["bg-rank", "1"];
  const value = "a leaderboard object";
  cache.set(key, value);
  assert.strictEqual(cache.get(key), value);
});

test("memory cache with cache miss", () => {
  const cache = new MemoryCache();
  const key = ["bg-rank", "1"];
  assert.strictEqual(cache.get(key), undefined);
});

test("memory cache with cache miss due to outdated key", async () => {
  mock.timers.enable({ apis: ["setTimeout"], now: new Date() });

  const cache = new MemoryCache();
  const key = ["bg-rank", "1"];
  const value = "a leaderboard object";
  cache.set(key, value);
  mock.timers.tick(60 * 1000);
  assert.strictEqual(cache.get(key), undefined);

  mock.timers.reset();
});
