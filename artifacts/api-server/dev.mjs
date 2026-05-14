import { spawn } from "node:child_process";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
const script = hasDatabaseUrl ? "dev:pg" : "dev:sqlite";
const mode = hasDatabaseUrl ? "postgres" : "sqlite";

console.log(`[api-server] starting ${mode} dev mode (${script})`);

const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const child = spawn(pnpmBin, ["run", script], {
  shell: true,
  stdio: "inherit",
  env: process.env,
});

child.on("error", (err) => {
  console.error("[api-server] failed to start dev process", err);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
