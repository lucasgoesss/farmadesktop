import { Router } from "express";
import { db, financialTransactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
const router = Router();
const toTx = (t) => ({
    ...t,
    amount: parseFloat(String(t.amount)),
});
router.get("/financial/transactions", async (req, res) => {
    try {
        const rows = await db.select().from(financialTransactionsTable).orderBy(desc(financialTransactionsTable.createdAt));
        res.json(rows.map(toTx));
    }
    catch (err) {
        req.log.error({ err }, "Error listing financial transactions");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/financial/transactions", async (req, res) => {
    try {
        const body = req.body;
        const [tx] = await db
            .insert(financialTransactionsTable)
            .values({
            type: body.type,
            category: body.category,
            description: body.description,
            amount: String(body.amount),
            dueDate: body.dueDate,
            status: "pendente",
        })
            .returning();
        res.status(201).json(toTx(tx));
    }
    catch (err) {
        req.log.error({ err }, "Error creating financial transaction");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/financial/cashflow", async (req, res) => {
    try {
        const [receivable] = await db
            .select({ total: sql `coalesce(sum(${financialTransactionsTable.amount}),0)` })
            .from(financialTransactionsTable)
            .where(eq(financialTransactionsTable.type, "receita"));
        const [payable] = await db
            .select({ total: sql `coalesce(sum(${financialTransactionsTable.amount}),0)` })
            .from(financialTransactionsTable)
            .where(eq(financialTransactionsTable.type, "despesa"));
        const totalReceivable = parseFloat(String(receivable?.total ?? 0));
        const totalPayable = parseFloat(String(payable?.total ?? 0));
        const [overdueRec] = await db
            .select({ total: sql `coalesce(sum(${financialTransactionsTable.amount}),0)` })
            .from(financialTransactionsTable)
            .where(sql `${financialTransactionsTable.type} = 'receita' AND ${financialTransactionsTable.status} = 'vencido'`);
        const [overduePay] = await db
            .select({ total: sql `coalesce(sum(${financialTransactionsTable.amount}),0)` })
            .from(financialTransactionsTable)
            .where(sql `${financialTransactionsTable.type} = 'despesa' AND ${financialTransactionsTable.status} = 'vencido'`);
        res.json({
            totalReceivable,
            totalPayable,
            balance: totalReceivable - totalPayable,
            overdueReceivable: parseFloat(String(overdueRec?.total ?? 0)),
            overduePayable: parseFloat(String(overduePay?.total ?? 0)),
        });
    }
    catch (err) {
        req.log.error({ err }, "Error fetching cashflow");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/financial/accounts-payable", async (req, res) => {
    try {
        const rows = await db
            .select()
            .from(financialTransactionsTable)
            .where(eq(financialTransactionsTable.type, "despesa"))
            .orderBy(financialTransactionsTable.dueDate);
        res.json(rows.map(toTx));
    }
    catch (err) {
        req.log.error({ err }, "Error fetching accounts payable");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/financial/accounts-receivable", async (req, res) => {
    try {
        const rows = await db
            .select()
            .from(financialTransactionsTable)
            .where(eq(financialTransactionsTable.type, "receita"))
            .orderBy(financialTransactionsTable.dueDate);
        res.json(rows.map(toTx));
    }
    catch (err) {
        req.log.error({ err }, "Error fetching accounts receivable");
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
