import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const controlledDispensationsTable = sqliteTable("controlled_dispensations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull(),
  customerCpf: text("customer_cpf").notNull(),
  productId: integer("product_id").notNull(),
  prescriptionId: integer("prescription_id"),
  quantity: integer("quantity").notNull().default(1),
  anvisaClass: text("anvisa_class").notNull(),
  notificationNumber: text("notification_number"),
  retentionRequired: integer("retention_required", { mode: "boolean" }).notNull().default(false),
  retained: integer("retained", { mode: "boolean" }).notNull().default(false),
  dispensedBy: text("dispensed_by").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertControlledDispensationSchema = createInsertSchema(controlledDispensationsTable).omit({ id: true, createdAt: true });
export type InsertControlledDispensation = z.infer<typeof insertControlledDispensationSchema>;
export type ControlledDispensation = typeof controlledDispensationsTable.$inferSelect;
