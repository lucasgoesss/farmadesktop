import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import productsRouter from "./products";
import stockRouter from "./stock";
import salesRouter from "./sales";
import customersRouter from "./customers";
import suppliersRouter from "./suppliers";
import prescriptionsRouter from "./prescriptions";
import controlledRouter from "./controlled";
import purchasesRouter from "./purchases";
import financialRouter from "./financial";
import usersRouter from "./users";

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
