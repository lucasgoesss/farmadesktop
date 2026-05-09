/**
 * Desktop API server build.
 * Identical to artifacts/api-server/build.mjs but aliases @workspace/db
 * to the SQLite entry point so the bundled server uses better-sqlite3
 * instead of Postgres — no DATABASE_URL required at runtime.
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const desktopDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(desktopDir, "../..");
const apiServerDir = path.resolve(repoRoot, "artifacts/api-server");
const dbSqliteEntry = path.resolve(repoRoot, "lib/db/src/index-sqlite.ts");
const distDir = path.resolve(apiServerDir, "dist-desktop");

await rm(distDir, { recursive: true, force: true });

await esbuild({
  entryPoints: [path.resolve(apiServerDir, "src/index.ts")],
  platform: "node",
  bundle: true,
  format: "esm",
  outdir: distDir,
  outExtension: { ".js": ".mjs" },
  logLevel: "info",
  alias: {
    "@workspace/db": dbSqliteEntry,
  },
  external: [
    "*.node",
    "sharp",
    "canvas",
    "bcrypt",
    "argon2",
    "fsevents",
    "pg",
    "pg-native",
    "electron",
  ],
  sourcemap: "linked",
  plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
  banner: {
    js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`,
  },
});

console.log("[build-api-desktop] Desktop API server built to:", distDir);
