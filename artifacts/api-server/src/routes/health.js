import { Router } from "express";
const router = Router();
const healthHandler = (_req, res) => {
    res.send({ status: "ok" });
};
router.get("/healthz", healthHandler);
export default router;
