/**
 * Vitest owns the `*.spec.ts` browser/host specs only. The Node-test smoke suite
 * (`tests/plugin-metadata.test.mjs`) is not a Vitest file and runs through
 * `npm run test:metadata`; without this include, `vitest run` collects it and
 * fails with "No test suite found in file".
 */
export default {
  test: {
    include: ['tests/**/*.spec.ts'],
  },
}
