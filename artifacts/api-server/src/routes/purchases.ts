import { Router, type IRouter } from "express";
import { db, purchasesTable, suppliersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const toPurchase = async (p: typeof purchasesTable.$inferSelect) => {
  const supplier = await db.select().from(suppliersTable).where(eq(suppliersTable.id, p.supplierId)).then((r) => r[0]);
  return {
    ...p,
    supplierName: supplier?.name ?? "Fornecedor",
    total: parseFloat(String(p.total)),
    items: Array.isArray(p.items) ? p.items : [],
  };
};

router.get("/purchases", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(purchasesTable).orderBy(desc(purchasesTable.createdAt));
    const result = await Promise.all(rows.map(toPurchase));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing purchases");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/purchases", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const items = body.items ?? [];
    const total = items.reduce((sum: number, i: { total?: number; quantity?: number; unitCost?: number }) => sum + (i.total ?? (i.quantity ?? 0) * (i.unitCost ?? 0)), 0);

    const [purchase] = await db
      .insert(purchasesTable)
      .values({
        supplierId: body.supplierId,
        items: items,
        total: String(total),
        status: "pendente",
        expectedDate: body.expectedDate ?? null,
        notes: body.notes ?? null,
      })
      .returning();
    res.status(201).json(await toPurchase(purchase));
  } catch (err) {
    req.log.error({ err }, "Error creating purchase");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/purchases/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [purchase] = await db.select().from(purchasesTable).where(eq(purchasesTable.id, id));
    if (!purchase) {
      res.status(404).json({ error: "Purchase not found" });
      return;
    }
    res.json(await toPurchase(purchase));
  } catch (err) {
    req.log.error({ err }, "Error fetching purchase");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/purchases/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const body = req.body;
    const update: Partial<typeof purchasesTable.$inferInsert> = {};
    if (body.status !== undefined) update.status = body.status;
    if (body.receivedDate !== undefined) update.receivedDate = body.receivedDate;
    if (body.notes !== undefined) update.notes = body.notes;

    const [purchase] = await db.update(purchasesTable).set(update).where(eq(purchasesTable.id, id)).returning();
    if (!purchase) {
      res.status(404).json({ error: "Purchase not found" });
      return;
    }
    res.json(await toPurchase(purchase));
  } catch (err) {
    req.log.error({ err }, "Error updating purchase");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
