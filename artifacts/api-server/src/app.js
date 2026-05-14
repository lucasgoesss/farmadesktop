import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
const app = express();
console.log("[api] app loaded", {
    nodeEnv: process.env["NODE_ENV"] ?? null,
    vercelEnv: process.env["VERCEL_ENV"] ?? null,
    vercelUrl: process.env["VERCEL_URL"] ?? null,
    region: process.env["VERCEL_REGION"] ?? null,
});
const pinoHttpMiddleware = pinoHttp;
app.use(pinoHttpMiddleware({
    logger,
    serializers: {
        req(req) {
            return {
                id: req.id,
                method: req.method,
                url: String(req.url ?? "").split("?")[0],
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => {
    console.log("[api] incoming request", {
        method: req.method,
        path: req.originalUrl,
        host: req.headers["host"] ?? null,
    });
    next();
});
const rootHandler = (_req, res) => {
    console.log("[api] root handler reached");
    res.send({ service: "api-server", status: "ok" });
};
app.get("/", rootHandler);
app.use("/api", router);
app.use((req, res) => {
    console.log("[api] route not found", {
        method: req.method,
        path: req.originalUrl,
    });
    res.status(404).send({ error: "Not found", path: req.originalUrl ?? null });
});
export default app;
