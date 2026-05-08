import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const stockLotsTable = pgTable("stock_lots", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  lotNumber: text("lot_number").notNull(),
  quantity: integer("quantity").notNull().default(0),
  expirationDate: text("expiration_date").notNull(),
  supplierId: integer("supplier_id"),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull().default("0"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export const stockMovementsTable = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  userId: integer("user_id").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStockLotSchema = createInsertSchema(stockLotsTable).omit({ id: true, receivedAt: true });
export type InsertStockLot = z.infer<typeof insertStockLotSchema>;
export type StockLot = typeof stockLotsTable.$inferSelect;

export const insertStockMovementSchema = createInsertSchema(stockMovementsTable).omit({ id: true, createdAt: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovementsTable.$inferSelect;
