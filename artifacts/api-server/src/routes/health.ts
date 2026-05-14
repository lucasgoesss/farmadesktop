import { Router } from "express";

const router = Router();

type JsonLikeResponse = {
  send: (body: unknown) => unknown;
};

const healthHandler = (_req: unknown, res: JsonLikeResponse): void => {
  res.send({ status: "ok" });
};

router.get("/healthz", healthHandler);

export default router;
