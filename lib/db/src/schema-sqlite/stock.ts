import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stockLotsTable = sqliteTable("stock_lots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  lotNumber: text("lot_number").notNull(),
  quantity: integer("quantity").notNull().default(0),
  expirationDate: text("expiration_date").notNull(),
  supplierId: integer("supplier_id"),
  costPrice: real("cost_price").notNull().default(0),
  receivedAt: text("received_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const stockMovementsTable = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  userId: integer("user_id").notNull().default(1),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertStockLotSchema = createInsertSchema(stockLotsTable).omit({ id: true, receivedAt: true });
export type InsertStockLot = z.infer<typeof insertStockLotSchema>;
export type StockLot = typeof stockLotsTable.$inferSelect;

export const insertStockMovementSchema = createInsertSchema(stockMovementsTable).omit({ id: true, createdAt: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovementsTable.$inferSelect;
