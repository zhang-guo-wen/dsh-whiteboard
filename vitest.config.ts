/**
 * Vitest owns the `*.spec.ts`/`*.spec.tsx` browser/host specs only. The Node-test
 * smoke suite (`tests/plugin-metadata.test.mjs`) is not a Vitest file and runs
 * through `npm run test:metadata`; without this include, `vitest run` collects it
 * and fails with "No test suite found in file". A jsdom spec opts in with a
 * `// @vitest-environment jsdom` pragma on its first line; the rest keep the
 * default Node environment.
 */
export default {
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
  },
}
