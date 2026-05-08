import { Router, type IRouter } from "express";
import { db, salesTable, saleItemsTable, productsTable, customersTable, stockMovementsTable } from "@workspace/db";
import { eq, desc, gte, lte, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

const toSale = async (sale: typeof salesTable.$inferSelect) => {
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

  const customer = sale.customerId
    ? await db.select().from(customersTable).where(eq(customersTable.id, sale.customerId)).then((r) => r[0])
    : null;

  return {
    ...sale,
    customerName: customer?.name ?? null,
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
};

router.get("/sales", async (req, res): Promise<void> => {
  try {
    const { startDate, endDate } = req.query as Record<string, string>;
    let query = db.select().from(salesTable).orderBy(desc(salesTable.createdAt)).$dynamic();

    if (startDate) query = query.where(gte(salesTable.createdAt, new Date(startDate)));
    if (endDate) query = query.where(lte(salesTable.createdAt, new Date(endDate)));

    const sales = await query.limit(100);
    const result = await Promise.all(sales.map(toSale));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Error listing sales");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/sales", async (req, res): Promise<void> => {
  try {
    const body = req.body;
    const items: Array<{ productId: number; quantity: number; discount?: number }> = body.items ?? [];

    let subtotal = 0;
    const itemDetails: Array<{ productId: number; quantity: number; unitPrice: number; discount: number; total: number }> = [];

    for (const item of items) {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (!product) continue;
      const unitPrice = parseFloat(String(product.salePrice));
      const discount = item.discount ?? 0;
      const total = unitPrice * item.quantity - discount;
      subtotal += total;
      itemDetails.push({ productId: item.productId, quantity: item.quantity, unitPrice, discount, total });
    }

    const discount = parseFloat(String(body.discount ?? 0));
    const total = subtotal - discount;

    const [sale] = await db
      .insert(salesTable)
      .values({
        customerId: body.customerId ?? null,
        customerCpf: body.customerCpf ?? null,
        userId: 1,
        subtotal: String(subtotal),
        discount: String(discount),
        total: String(total),
        paymentMethod: body.paymentMethod ?? "dinheiro",
        status: "concluida",
      })
      .returning();

    for (const item of itemDetails) {
      await db.insert(saleItemsTable).values({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        discount: String(item.discount),
        total: String(item.total),
      });

      await db
        .update(productsTable)
        .set({ currentStock: sql`${productsTable.currentStock} - ${item.quantity}` })
        .where(eq(productsTable.id, item.productId));

      await db.insert(stockMovementsTable).values({
        productId: item.productId,
        type: "saida",
        quantity: -item.quantity,
        reason: `Venda #${sale.id}`,
        userId: 1,
      });
    }

    if (body.customerId) {
      const points = Math.floor(total);
      await db
        .update(customersTable)
        .set({
          loyaltyPoints: sql`${customersTable.loyaltyPoints} + ${points}`,
          totalPurchases: sql`${customersTable.totalPurchases} + ${total}`,
        })
        .where(eq(customersTable.id, body.customerId));
    }

    res.status(201).json(await toSale(sale));
  } catch (err) {
    req.log.error({ err }, "Error creating sale");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sales/:id", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [sale] = await db.select().from(salesTable).where(eq(salesTable.id, id));
    if (!sale) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }
    res.json(await toSale(sale));
  } catch (err) {
    req.log.error({ err }, "Error fetching sale");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/sales/:id/cancel", async (req, res): Promise<void> => {
  try {
    const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const id = parseInt(raw, 10);
    const [sale] = await db
      .update(salesTable)
      .set({ status: "cancelada" })
      .where(eq(salesTable.id, id))
      .returning();
    if (!sale) {
      res.status(404).json({ error: "Sale not found" });
      return;
    }
    res.json(await toSale(sale));
  } catch (err) {
    req.log.error({ err }, "Error cancelling sale");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
