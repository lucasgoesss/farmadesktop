import { pgTable, text, serial, timestamp, integer, numeric, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const purchasesTable = pgTable("purchases", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").notNull(),
  items: jsonb("items").notNull().default([]),
  total: numeric("total", { precision: 10, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("pendente"),
  expectedDate: text("expected_date"),
  receivedDate: text("received_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({ id: true, createdAt: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchasesTable.$inferSelect;
