import { Router, type IRouter } from "express";
import { db, prescriptionsTable, customersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const toPrescription = async (p: typeof prescriptionsTable.$inferSelect) => {
  const customer = p.customerId
    ? await db.select().from(customersTable).where(eq(customersTable.id, p.customerId)).then((r) => r[0])
    : null;
  return {
    ...p,
    customerName: customer?.name ?? null,
    items: Array.isArray(p.items) ? p.items : [],
  };
};

router.get("/prescriptions", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(prescriptionsTable).orderBy(desc(prescriptionsTable.createdAt));
    const result = await Promise.all(rows.map(toPrescription));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing prescriptions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/prescriptions", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const [prescription] = await db
      .insert(prescriptionsTable)
      .values({
        customerId: body.customerId ?? null,
        doctorName: body.doctorName,
        doctorCrm: body.doctorCrm,
        prescriptionDate: body.prescriptionDate,
        expirationDate: body.expirationDate ?? null,
        items: body.items ?? [],
        status: "pendente",
        notes: body.notes ?? null,
      })
      .returning();
    res.status(201).json(await toPrescription(prescription));
  } catch (err) {
    req.log.error({ err }, "Error creating prescription");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/prescriptions/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [prescription] = await db.select().from(prescriptionsTable).where(eq(prescriptionsTable.id, id));
    if (!prescription) {
      res.status(404).json({ error: "Prescription not found" });
      return;
    }
    res.json(await toPrescription(prescription));
  } catch (err) {
    req.log.error({ err }, "Error fetching prescription");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
