import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const syncOutboxTable = sqliteTable("sync_outbox", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entityTable: text("entity_table").notNull(),
  entityId: integer("entity_id").notNull(),
  operation: text("operation").notNull(),
  payload: text("payload", { mode: "json" }).notNull(),
  status: text("status").notNull().default("pending"),
  attempts: integer("attempts").notNull().default(0),
  lastError: text("last_error"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  sentAt: text("sent_at"),
});

export const insertSyncOutboxSchema = createInsertSchema(syncOutboxTable).omit({ id: true, createdAt: true });
export type InsertSyncOutbox = z.infer<typeof insertSyncOutboxSchema>;
export type SyncOutbox = typeof syncOutboxTable.$inferSelect;
