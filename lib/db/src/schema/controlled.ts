import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const controlledDispensationsTable = pgTable("controlled_dispensations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  customerCpf: text("customer_cpf").notNull(),
  productId: integer("product_id").notNull(),
  prescriptionId: integer("prescription_id"),
  quantity: integer("quantity").notNull().default(1),
  anvisaClass: text("anvisa_class").notNull(),
  notificationNumber: text("notification_number"),
  retentionRequired: boolean("retention_required").notNull().default(false),
  retained: boolean("retained").notNull().default(false),
  dispensedBy: text("dispensed_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertControlledDispensationSchema = createInsertSchema(controlledDispensationsTable).omit({ id: true, createdAt: true });
export type InsertControlledDispensation = z.infer<typeof insertControlledDispensationSchema>;
export type ControlledDispensation = typeof controlledDispensationsTable.$inferSelect;
