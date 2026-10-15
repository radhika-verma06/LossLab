import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * ESLint 9 flat config. `eslint-config-next@16` ships a native flat preset, so no
 * `FlatCompat` shim is needed. Flat config does not ignore dot-directories the way
 * the legacy `.eslintrc` loader did, so build output is listed explicitly.
 */
const config = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-playwright/**",
      ".diag/**",
      ".shots/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "venv/**",
      "LossLab/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
];

export default config;
