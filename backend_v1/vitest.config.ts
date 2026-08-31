import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Neon is a network hop away and cold starts are slow; a flow test doing a
    // dozen round trips needs more than the 5s default.
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // These tests share rate-limiter state and a database, so they must not
    // interleave.
    fileParallelism: false,
    sequence: { concurrent: false },
  },
});
