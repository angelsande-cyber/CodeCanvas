import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
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

export const messageHistory = pgTable("message_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  naturalInput: text("natural_input").notNull(),
  spanishMessage: text("spanish_message").notNull(),
  englishMessage: text("english_message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  naturalInput: text("natural_input").notNull(),
  spanishMessage: text("spanish_message").notNull(),
  englishMessage: text("english_message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageHistorySchema = createInsertSchema(messageHistory).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export type MessageHistory = typeof messageHistory.$inferSelect;
export type InsertMessageHistory = z.infer<typeof insertMessageHistorySchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

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
