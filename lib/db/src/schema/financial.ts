import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const financialTransactionsTable = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  dueDate: text("due_date").notNull(),
  paidDate: text("paid_date"),
  status: text("status").notNull().default("pendente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactionsTable).omit({ id: true, createdAt: true });
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactionsTable.$inferSelect;
