import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  console.warn("[db] DATABASE_URL is not set. DB-backed routes will return errors until it is configured.");
}

export const pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : undefined;

const dbProxy = new Proxy(
  {},
  {
    get() {
      throw new Error("DATABASE_URL must be set. Configure it in environment variables.");
    },
  },
);

export const db = (pool ? drizzle(pool, { schema }) : dbProxy) as any;

export * from "./schema";
