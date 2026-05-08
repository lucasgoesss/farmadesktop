import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";

const router: IRouter = Router();

const toProduct = (p: typeof productsTable.$inferSelect) => ({
  ...p,
  costPrice: parseFloat(String(p.costPrice)),
  salePrice: parseFloat(String(p.salePrice)),
});

router.get("/products", async (req, res): Promise<void> => {
  try {
    const { q, category, controlled } = req.query as Record<string, string>;
    let rows = await db.select().from(productsTable);

    if (q) {
      const lower = q.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.barcode ?? "").includes(lower) ||
          (p.genericName ?? "").toLowerCase().includes(lower)
      );
    }
    if (category) rows = rows.filter((p) => p.category === category);
    if (controlled !== undefined) rows = rows.filter((p) => p.isControlled === (controlled === "true"));

    res.json(rows.map(toProduct));
  } catch (err) {
    req.log.error({ err }, "Error listing products");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const [product] = await db
      .insert(productsTable)
      .values({
        name: body.name,
        genericName: body.genericName ?? null,
        barcode: body.barcode ?? null,
        category: body.category,
        manufacturer: body.manufacturer ?? null,
        dosage: body.dosage ?? null,
        unit: body.unit ?? "un",
        costPrice: String(body.costPrice ?? 0),
        salePrice: String(body.salePrice ?? 0),
        minStock: body.minStock ?? 10,
        currentStock: 0,
        isControlled: body.isControlled ?? false,
        anvisaCode: body.anvisaCode ?? null,
        requiresPrescription: body.requiresPrescription ?? false,
      })
      .returning();
    res.status(201).json(toProduct(product));
  } catch (err) {
    req.log.error({ err }, "Error creating product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/barcode/:barcode", async (req, res): Promise<void> => {
  try {
    const barcode = Array.isArray(req.params.barcode) ? req.params.barcode[0] : req.params.barcode;
    const [product] = await db.select().from(productsTable).where(eq(productsTable.barcode, barcode));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(toProduct(product));
  } catch (err) {
    req.log.error({ err }, "Error fetching product by barcode");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(toProduct(product));
  } catch (err) {
    req.log.error({ err }, "Error fetching product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const body = req.body;
    const update: Partial<typeof productsTable.$inferInsert> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.genericName !== undefined) update.genericName = body.genericName;
    if (body.barcode !== undefined) update.barcode = body.barcode;
    if (body.category !== undefined) update.category = body.category;
    if (body.manufacturer !== undefined) update.manufacturer = body.manufacturer;
    if (body.dosage !== undefined) update.dosage = body.dosage;
    if (body.unit !== undefined) update.unit = body.unit;
    if (body.costPrice !== undefined) update.costPrice = String(body.costPrice);
    if (body.salePrice !== undefined) update.salePrice = String(body.salePrice);
    if (body.minStock !== undefined) update.minStock = body.minStock;
    if (body.isControlled !== undefined) update.isControlled = body.isControlled;
    if (body.anvisaCode !== undefined) update.anvisaCode = body.anvisaCode;
    if (body.requiresPrescription !== undefined) update.requiresPrescription = body.requiresPrescription;

    const [product] = await db.update(productsTable).set(update).where(eq(productsTable.id, id)).returning();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(toProduct(product));
  } catch (err) {
    req.log.error({ err }, "Error updating product");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, "Error deleting product");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
