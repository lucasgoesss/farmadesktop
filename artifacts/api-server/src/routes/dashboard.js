import { Router } from "express";
import * as dbModule from "@workspace/db";
import { sql, lte, desc, eq, gte, and } from "drizzle-orm";
const { db, salesTable, productsTable, saleItemsTable, stockLotsTable, financialTransactionsTable, customersTable, } = dbModule;
const router = Router();
router.get("/dashboard/summary", async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [dailySalesRows] = await db
            .select({ count: sql `count(*)`, total: sql `coalesce(sum(${salesTable.total}),0)` })
            .from(salesTable)
            .where(and(gte(salesTable.createdAt, today), eq(salesTable.status, "concluida")));
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const [monthlySalesRow] = await db
            .select({ total: sql `coalesce(sum(${salesTable.total}),0)` })
            .from(salesTable)
            .where(and(gte(salesTable.createdAt, thirtyDaysAgo), eq(salesTable.status, "concluida")));
        const lowStockRows = await db
            .select({ id: productsTable.id })
            .from(productsTable)
            .where(sql `${productsTable.currentStock} <= ${productsTable.minStock}`);
        const thirtyDays = new Date();
        thirtyDays.setDate(thirtyDays.getDate() + 30);
        const thirtyDaysStr = thirtyDays.toISOString().split("T")[0];
        const expiringRows = await db
            .select({ id: stockLotsTable.id })
            .from(stockLotsTable)
            .where(lte(stockLotsTable.expirationDate, thirtyDaysStr));
        const [pendingPurchaseRow] = await db
            .select({ count: sql `count(*)` })
            .from(financialTransactionsTable)
            .where(eq(financialTransactionsTable.status, "pendente"));
        const [activeCustomerRow] = await db
            .select({ count: sql `count(*)` })
            .from(customersTable);
        const controlledRows = await db
            .select({ id: productsTable.id })
            .from(productsTable)
            .where(and(eq(productsTable.isControlled, true), lte(productsTable.currentStock, productsTable.minStock)));
        res.json({
            dailyRevenue: parseFloat(String(dailySalesRows?.total ?? 0)),
            dailySales: Number(dailySalesRows?.count ?? 0),
            lowStockCount: lowStockRows.length,
            expiringCount: expiringRows.length,
            monthlyRevenue: parseFloat(String(monthlySalesRow?.total ?? 0)),
            pendingPurchases: Number(pendingPurchaseRow?.count ?? 0),
            activeCustomers: Number(activeCustomerRow?.count ?? 0),
            anvisaAlerts: controlledRows.length,
        });
    }
    catch (err) {
        req.log.error({ err }, "Error fetching dashboard summary");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/dashboard/recent-sales", async (req, res) => {
    try {
        const sales = await db
            .select()
            .from(salesTable)
            .orderBy(desc(salesTable.createdAt))
            .limit(10);
        const result = await Promise.all(sales.map(async (sale) => {
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
                subtotal: parseFloat(String(sale.subtotal)),
                discount: parseFloat(String(sale.discount)),
                total: parseFloat(String(sale.total)),
                customerName: customer?.name ?? null,
                userName: "Admin",
                items: items.map((i) => ({
                    ...i,
                    productName: i.productName ?? "Produto",
                    unitPrice: parseFloat(String(i.unitPrice)),
                    discount: parseFloat(String(i.discount)),
                    total: parseFloat(String(i.total)),
                })),
            };
        }));
        res.json(result);
    }
    catch (err) {
        req.log.error({ err }, "Error fetching recent sales");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/dashboard/top-products", async (req, res) => {
    try {
        const rows = await db
            .select({
            productId: saleItemsTable.productId,
            productName: productsTable.name,
            quantitySold: sql `sum(${saleItemsTable.quantity})`,
            revenue: sql `sum(${saleItemsTable.total})`,
        })
            .from(saleItemsTable)
            .leftJoin(productsTable, eq(saleItemsTable.productId, productsTable.id))
            .groupBy(saleItemsTable.productId, productsTable.name)
            .orderBy(desc(sql `sum(${saleItemsTable.quantity})`))
            .limit(10);
        res.json(rows.map((r) => ({
            productId: r.productId,
            productName: r.productName ?? "Produto",
            quantitySold: Number(r.quantitySold),
            revenue: parseFloat(String(r.revenue)),
        })));
    }
    catch (err) {
        req.log.error({ err }, "Error fetching top products");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/dashboard/low-stock", async (req, res) => {
    try {
        const rows = await db
            .select()
            .from(productsTable)
            .where(sql `${productsTable.currentStock} <= ${productsTable.minStock}`)
            .orderBy(productsTable.currentStock)
            .limit(20);
        res.json(rows.map((p) => ({
            ...p,
            costPrice: parseFloat(String(p.costPrice)),
            salePrice: parseFloat(String(p.salePrice)),
        })));
    }
    catch (err) {
        req.log.error({ err }, "Error fetching low stock");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/dashboard/expiring-products", async (req, res) => {
    try {
        const ninetyDays = new Date();
        ninetyDays.setDate(ninetyDays.getDate() + 90);
        const ninetyDaysStr = ninetyDays.toISOString().split("T")[0];
        const rows = await db
            .select({
            id: stockLotsTable.id,
            productId: stockLotsTable.productId,
            productName: productsTable.name,
            lotNumber: stockLotsTable.lotNumber,
            quantity: stockLotsTable.quantity,
            expirationDate: stockLotsTable.expirationDate,
            supplierId: stockLotsTable.supplierId,
            supplierName: sql `null`,
            receivedAt: stockLotsTable.receivedAt,
            costPrice: stockLotsTable.costPrice,
        })
            .from(stockLotsTable)
            .leftJoin(productsTable, eq(stockLotsTable.productId, productsTable.id))
            .where(lte(stockLotsTable.expirationDate, ninetyDaysStr))
            .orderBy(stockLotsTable.expirationDate)
            .limit(20);
        res.json(rows.map((r) => ({
            ...r,
            productName: r.productName ?? "Produto",
            costPrice: parseFloat(String(r.costPrice)),
        })));
    }
    catch (err) {
        req.log.error({ err }, "Error fetching expiring products");
        res.status(500).json({ error: "Internal server error" });
    }
});
router.get("/dashboard/monthly-sales", async (req, res) => {
    try {
        const rows = await db
            .select({
            createdAt: salesTable.createdAt,
            total: salesTable.total,
        })
            .from(salesTable)
            .where(eq(salesTable.status, "concluida"));
        const monthly = new Map();
        for (const row of rows) {
            const dateValue = row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt));
            if (Number.isNaN(dateValue.getTime())) {
                continue;
            }
            const month = dateValue.toISOString().slice(0, 7);
            const current = monthly.get(month) ?? { revenue: 0, salesCount: 0 };
            current.revenue += parseFloat(String(row.total));
            current.salesCount += 1;
            monthly.set(month, current);
        }
        const result = Array.from(monthly.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, values]) => ({
            month,
            revenue: Number(values.revenue.toFixed(2)),
            salesCount: values.salesCount,
        }));
        res.json(result);
    }
    catch (err) {
        req.log.error({ err }, "Error fetching monthly sales");
        res.status(500).json({ error: "Internal server error" });
    }
});
export default router;
