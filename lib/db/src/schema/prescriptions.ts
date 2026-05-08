import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const prescriptionsTable = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  doctorName: text("doctor_name").notNull(),
  doctorCrm: text("doctor_crm").notNull(),
  prescriptionDate: text("prescription_date").notNull(),
  expirationDate: text("expiration_date"),
  items: jsonb("items").notNull().default([]),
  status: text("status").notNull().default("pendente"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPrescriptionSchema = createInsertSchema(prescriptionsTable).omit({ id: true, createdAt: true });
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
export type Prescription = typeof prescriptionsTable.$inferSelect;
