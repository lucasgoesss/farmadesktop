import { pgTable, text, serial, timestamp, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  barcode: text("barcode"),
  category: text("category").notNull(),
  manufacturer: text("manufacturer"),
  dosage: text("dosage"),
  unit: text("unit").notNull().default("un"),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }).notNull().default("0"),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }).notNull().default("0"),
  minStock: integer("min_stock").notNull().default(10),
  currentStock: integer("current_stock").notNull().default(0),
  isControlled: boolean("is_controlled").notNull().default(false),
  anvisaCode: text("anvisa_code"),
  requiresPrescription: boolean("requires_prescription").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
