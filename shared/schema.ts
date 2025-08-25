import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// SOSGEN Schemas
export const generateMessageSchema = z.object({
  naturalInput: z.string().min(1, "La descripción del socorro no puede estar vacía"),
});

export const generatedMessagesSchema = z.object({
  es: z.string(),
  en: z.string(),
});

export type GenerateMessageRequest = z.infer<typeof generateMessageSchema>;
export type GeneratedMessagesResponse = z.infer<typeof generatedMessagesSchema>;
