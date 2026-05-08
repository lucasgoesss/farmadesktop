import { Router, type IRouter } from "express";
import { db, customersTable, salesTable, saleItemsTable, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

const toCustomer = (c: typeof customersTable.$inferSelect) => ({
  ...c,
  totalPurchases: parseFloat(String(c.totalPurchases)),
});

router.get("/customers", async (req, res): Promise<void> => {
  try {
    const { q } = req.query as Record<string, string>;
    let rows = await db.select().from(customersTable).orderBy(customersTable.name);
    if (q) {
      const lower = q.toLowerCase();
      rows = rows.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          (c.cpf ?? "").includes(lower) ||
          (c.phone ?? "").includes(lower)
      );
    }
    res.json(rows.map(toCustomer));
  } catch (err) {
    req.log.error({ err }, "Error listing customers");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/customers", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const [customer] = await db
      .insert(customersTable)
      .values({
        name: body.name,
        cpf: body.cpf ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        birthDate: body.birthDate ?? null,
        address: body.address ?? null,
        loyaltyPoints: 0,
        totalPurchases: "0",
      })
      .returning();
    res.status(201).json(toCustomer(customer));
  } catch (err) {
    req.log.error({ err }, "Error creating customer");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [customer] = await db.select().from(customersTable).where(eq(customersTable.id, id));
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json(toCustomer(customer));
  } catch (err) {
    req.log.error({ err }, "Error fetching customer");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/customers/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const body = req.body;
    const update: Partial<typeof customersTable.$inferInsert> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.cpf !== undefined) update.cpf = body.cpf;
    if (body.email !== undefined) update.email = body.email;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.birthDate !== undefined) update.birthDate = body.birthDate;
    if (body.address !== undefined) update.address = body.address;

    const [customer] = await db.update(customersTable).set(update).where(eq(customersTable.id, id)).returning();
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json(toCustomer(customer));
  } catch (err) {
    req.log.error({ err }, "Error updating customer");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    await db.delete(customersTable).where(eq(customersTable.id, id));
    res.sendStatus(204);
  } catch (err) {
    req.log.error({ err }, "Error deleting customer");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/customers/:id/sales", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const sales = await db
      .select()
      .from(salesTable)
      .where(eq(salesTable.customerId, id))
      .orderBy(desc(salesTable.createdAt));

    const result = await Promise.all(
      sales.map(async (sale) => {
        const items = await db
          .select({
            id: saleItemsTable.id,
            productId: saleItemsTable.productId,
            productName: productsTable.name,
            quantity: saleItemsTable.quantity,
            unitPrice: saleItemsTable.unitPrice,
            discount: saleItemsTable.discount,
            total: saleItemsTable.total,
          })
          .from(saleItemsTable)
          .leftJoin(productsTable, eq(saleItemsTable.productId, productsTable.id))
          .where(eq(saleItemsTable.saleId, sale.id));

        return {
          ...sale,
          customerName: null,
          userName: "Admin",
          subtotal: parseFloat(String(sale.subtotal)),
          discount: parseFloat(String(sale.discount)),
          total: parseFloat(String(sale.total)),
          items: items.map((i) => ({
            ...i,
            productName: i.productName ?? "Produto",
            unitPrice: parseFloat(String(i.unitPrice)),
            discount: parseFloat(String(i.discount)),
            total: parseFloat(String(i.total)),
          })),
        };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error fetching customer sales");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
