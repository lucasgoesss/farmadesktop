import { Router, type RequestHandler } from "express";

const router = Router();

const healthHandler: RequestHandler = (_req, res) => {
  res.send({ status: "ok" });
};

router.get("/healthz", healthHandler);

export default router;
