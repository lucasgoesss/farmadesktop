import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const syncOutboxTable = pgTable("sync_outbox", {
  id: serial("id").primaryKey(),
  entityTable: text("entity_table").notNull(),
  entityId: integer("entity_id").notNull(),
  operation: text("operation").notNull(),
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const insertSyncOutboxSchema = createInsertSchema(syncOutboxTable).omit({ id: true, createdAt: true });
export type InsertSyncOutbox = z.infer<typeof insertSyncOutboxSchema>;
export type SyncOutbox = typeof syncOutboxTable.$inferSelect;
