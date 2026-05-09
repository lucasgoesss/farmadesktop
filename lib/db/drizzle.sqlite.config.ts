import { defineConfig } from "drizzle-kit";
import path from "path";
import os from "os";

const rawPath =
  process.env["SQLITE_PATH"] ??
  `file:${path.join(os.homedir(), ".farmasystem", "farmasystem.db")}`;

const url = rawPath.startsWith("file:") ? rawPath : `file:${rawPath}`;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema-sqlite/index.ts"),
  dialect: "turso",
  dbCredentials: {
    url,
  },
  out: path.join(__dirname, "./drizzle/sqlite"),
});
