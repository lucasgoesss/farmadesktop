import { Router, type IRouter } from "express";
import { db, suppliersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/suppliers", async (req, res): Promise<void> => {
  try {
    const rows = await db.select().from(suppliersTable).orderBy(suppliersTable.name);
    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Error listing suppliers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/suppliers", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const [supplier] = await db
      .insert(suppliersTable)
      .values({
        name: body.name,
        cnpj: body.cnpj ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        contact: body.contact ?? null,
        address: body.address ?? null,
      })
      .returning();
    res.status(201).json(supplier);
  } catch (err) {
    req.log.error({ err }, "Error creating supplier");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [supplier] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, id));
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }
    res.json(supplier);
  } catch (err) {
    req.log.error({ err }, "Error fetching supplier");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/suppliers/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const body = req.body;
    const [supplier] = await db
      .update(suppliersTable)
      .set({ name: body.name, cnpj: body.cnpj, email: body.email, phone: body.phone, contact: body.contact, address: body.address })
      .where(eq(suppliersTable.id, id))
      .returning();
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }
    res.json(supplier);
  } catch (err) {
    req.log.error({ err }, "Error updating supplier");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/suppliers/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    await db.delete(suppliersTable).where(eq(suppliersTable.id, id));
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, "Error deleting supplier");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
