import { Router, type IRouter } from "express";
import { db, controlledDispensationsTable, customersTable, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const toDispensation = async (d: typeof controlledDispensationsTable.$inferSelect) => {
  const customer = await db.select().from(customersTable).where(eq(customersTable.id, d.customerId)).then((r) => r[0]);
  const product = await db.select().from(productsTable).where(eq(productsTable.id, d.productId)).then((r) => r[0]);
  return {
    ...d,
    customerName: customer?.name ?? "Cliente",
    productName: product?.name ?? "Produto",
  };
};

router.get("/controlled", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(controlledDispensationsTable).orderBy(desc(controlledDispensationsTable.createdAt));
    const result = await Promise.all(rows.map(toDispensation));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing controlled dispensations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/controlled", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const customer = await db.select().from(customersTable).where(eq(customersTable.id, body.customerId)).then((r) => r[0]);
    const [dispensation] = await db
      .insert(controlledDispensationsTable)
      .values({
        customerId: body.customerId,
        customerCpf: customer?.cpf ?? body.customerCpf ?? "",
        productId: body.productId,
        prescriptionId: body.prescriptionId ?? null,
        quantity: body.quantity,
        anvisaClass: body.anvisaClass,
        notificationNumber: body.notificationNumber ?? null,
        retentionRequired: body.retentionRequired,
        retained: body.retained,
        dispensedBy: "Admin",
      })
      .returning();
    res.status(201).json(await toDispensation(dispensation));
  } catch (err) {
    req.log.error({ err }, "Error creating controlled dispensation");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/controlled/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [d] = await db.select().from(controlledDispensationsTable).where(eq(controlledDispensationsTable.id, id));
    if (!d) {
      res.status(404).json({ error: "Dispensation not found" });
      return;
    }
    res.json(await toDispensation(d));
  } catch (err) {
    req.log.error({ err }, "Error fetching controlled dispensation");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
