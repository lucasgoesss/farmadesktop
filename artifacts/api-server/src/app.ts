import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();
const pinoHttpMiddleware = pinoHttp as unknown as (options: {
  logger: typeof logger;
  serializers: {
    req: (req: { id?: unknown; method?: unknown; url?: unknown }) => {
      id: unknown;
      method: unknown;
      url: string;
    };
    res: (res: { statusCode?: unknown }) => { statusCode: unknown };
  };
}) => ReturnType<Express["use"]>;

app.use(
  pinoHttpMiddleware({
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
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
