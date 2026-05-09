import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const productsTable = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  genericName: text("generic_name"),
  barcode: text("barcode"),
  category: text("category").notNull(),
  manufacturer: text("manufacturer"),
  dosage: text("dosage"),
  unit: text("unit").notNull().default("un"),
  costPrice: real("cost_price").notNull().default(0),
  salePrice: real("sale_price").notNull().default(0),
  minStock: integer("min_stock").notNull().default(10),
  currentStock: integer("current_stock").notNull().default(0),
  isControlled: integer("is_controlled", { mode: "boolean" }).notNull().default(false),
  anvisaCode: text("anvisa_code"),
  requiresPrescription: integer("requires_prescription", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;
