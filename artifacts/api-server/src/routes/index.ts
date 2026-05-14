import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import dashboardRouter from "./dashboard.js";
import productsRouter from "./products.js";
import stockRouter from "./stock.js";
import salesRouter from "./sales.js";
import customersRouter from "./customers.js";
import suppliersRouter from "./suppliers.js";
import prescriptionsRouter from "./prescriptions.js";
import controlledRouter from "./controlled.js";
import purchasesRouter from "./purchases.js";
import financialRouter from "./financial.js";
import usersRouter from "./users.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(productsRouter);
router.use(stockRouter);
router.use(salesRouter);
router.use(customersRouter);
router.use(suppliersRouter);
router.use(prescriptionsRouter);
router.use(controlledRouter);
router.use(purchasesRouter);
router.use(financialRouter);
router.use(usersRouter);

export default router;
