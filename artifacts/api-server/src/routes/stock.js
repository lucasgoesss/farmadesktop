import { Router } from "express";
import { db, stockLotsTable, stockMovementsTable, productsTable, suppliersTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sql } from "drizzle-orm";
const router = Router();
router.get("/stock", async (req, res) => {
    try {
        const rows = await db
            .select({
            id: stockLotsTable.id,
            productId: stockLotsTable.productId,
            productName: productsTable.name,
            lotNumber: stockLotsTable.lotNumber,
            quantity: stockLotsTable.quantity,
            expirationDate: stockLotsTable.expirationDate,
            supplierId: stockLotsTable.supplierId,
            supplierName: suppliersTable.name,
            receivedAt: stockLotsTable.receivedAt,
            costPrice: stockLotsTable.costPrice,
        })
            .from(stockLotsTable)
            .leftJoin(productsTable, eq(stockLotsTable.productId, productsTable.id))
            .leftJoin(suppliersTable, eq(stockLotsTable.supplierId, suppliersTable.id))
            .orderBy(desc(stockLotsTable.receivedAt));
        res.json(rows.map((r) => ({
            ...r,
            productName: r.productName ?? "Produto",
            costPrice: parseFloat(String(r.costPrice)),
        })));
    }
    catch (err) {
        req.log.error({ err }, "Error listing stock");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/stock", async (req, res) => {
    try {
        const body = req.body;
        const [lot] = await db
            .insert(stockLotsTable)
            .values({
            productId: body.productId,
            lotNumber: body.lotNumber,
            quantity: body.quantity,
            expirationDate: body.expirationDate,
            supplierId: body.supplierId ?? null,
            costPrice: String(body.costPrice ?? 0),
        })
            .returning();
        await db
            .update(productsTable)
            .set({ currentStock: sql `${productsTable.currentStock} + ${body.quantity}` })
            .where(eq(productsTable.id, body.productId));
        await db.insert(stockMovementsTable).values({
            productId: body.productId,
            type: "entrada",
            quantity: body.quantity,
            reason: `Entrada lote ${body.lotNumber}`,
            userId: 1,
        });
        const product = await db.select().from(productsTable).where(eq(productsTable.id, body.productId)).then((r) => r[0]);
        res.status(201).json({
            ...lot,
            productName: product?.name ?? "Produto",
            costPrice: parseFloat(String(lot.costPrice)),
            supplierName: null,
        });
    }
    catch (err) {
        req.log.error({ err }, "Error creating stock entry");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/stock/movements", async (req, res) => {
    try {
        const productIdQ = req.query.productId;
        const productId = productIdQ ? parseInt(String(productIdQ), 10) : null;
        let rows = await db
            .select({
            id: stockMovementsTable.id,
            productId: stockMovementsTable.productId,
            productName: productsTable.name,
            type: stockMovementsTable.type,
            quantity: stockMovementsTable.quantity,
            reason: stockMovementsTable.reason,
            userId: stockMovementsTable.userId,
            userName: usersTable.name,
            createdAt: stockMovementsTable.createdAt,
        })
            .from(stockMovementsTable)
            .leftJoin(productsTable, eq(stockMovementsTable.productId, productsTable.id))
            .leftJoin(usersTable, eq(stockMovementsTable.userId, usersTable.id))
            .orderBy(desc(stockMovementsTable.createdAt));
        if (productId)
            rows = rows.filter((r) => r.productId === productId);
        res.json(rows.map((r) => ({
            ...r,
            productName: r.productName ?? "Produto",
            userName: r.userName ?? "Admin",
        })));
    }
    catch (err) {
        req.log.error({ err }, "Error listing stock movements");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/stock/adjust", async (req, res) => {
    try {
        const body = req.body;
        const [movement] = await db
            .insert(stockMovementsTable)
            .values({
            productId: body.productId,
            type: "ajuste",
            quantity: body.quantity,
            reason: body.reason,
            userId: 1,
        })
            .returning();
        await db
            .update(productsTable)
            .set({ currentStock: sql `${productsTable.currentStock} + ${body.quantity}` })
            .where(eq(productsTable.id, body.productId));
        res.json({
            ...movement,
            productName: "Produto",
            userName: "Admin",
        });
    }
    catch (err) {
        req.log.error({ err }, "Error adjusting stock");
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
