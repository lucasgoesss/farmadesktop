import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema-sqlite";
import path from "path";
import os from "os";

const rawPath =
  process.env["SQLITE_PATH"] ??
  path.join(os.homedir(), ".farmasystem", "farmasystem.db");

const url = rawPath.startsWith("file:") ? rawPath : `file:${rawPath}`;

const client = createClient({ url });

export const db = drizzle(client, { schema });
export * from "./schema-sqlite";
