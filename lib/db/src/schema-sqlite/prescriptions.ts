import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const prescriptionsTable = sqliteTable("prescriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id"),
  doctorName: text("doctor_name").notNull(),
  doctorCrm: text("doctor_crm").notNull(),
  prescriptionDate: text("prescription_date").notNull(),
  expirationDate: text("expiration_date"),
  items: text("items", { mode: "json" }).notNull().default([]),
  status: text("status").notNull().default("pendente"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptionsTable).omit({ id: true, createdAt: true });
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptionsTable.$inferSelect;
