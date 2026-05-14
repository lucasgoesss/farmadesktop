import { createServer } from "node:http";
import app from "./app.js";
import { logger } from "./lib/logger.js";

const rawPort = process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = createServer(app);

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});

server.on("error", (err: unknown) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
