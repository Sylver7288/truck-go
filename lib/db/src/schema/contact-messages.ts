import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type NewContactMessage = typeof contactMessages.$inferInsert;
