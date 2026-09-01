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

    // One module registry across files, so they share a single pg pool instead
    // of each opening its own connections to Neon.
    //
    // The corollary is that no test file may call closePool(): the pool's
    // lifetime belongs to the run, not to any one file. When files each closed
    // it in afterAll, the first to finish tore it down underneath the rest and
    // every later query failed with "Connection terminated due to connection
    // timeout" — passing alone, failing together. The pool is left to the
    // process exit.
    isolate: false,
  },
});
