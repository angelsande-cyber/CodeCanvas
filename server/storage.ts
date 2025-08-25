import { type User, type InsertUser, type MessageHistory, type InsertMessageHistory, type Favorite, type InsertFavorite } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Message History
  saveMessageToHistory(message: InsertMessageHistory): Promise<MessageHistory>;
  getMessageHistory(limit?: number, offset?: number): Promise<MessageHistory[]>;
  searchMessageHistory(query: string): Promise<MessageHistory[]>;
  toggleMessageFavorite(id: string): Promise<MessageHistory | undefined>;
  
  // Favorites
  addToFavorites(favorite: InsertFavorite): Promise<Favorite>;
  getFavorites(): Promise<Favorite[]>;
  deleteFavorite(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private messageHistory: Map<string, MessageHistory>;
  private favorites: Map<string, Favorite>;

  constructor() {
    this.users = new Map();
    this.messageHistory = new Map();
    this.favorites = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Message History methods
  async saveMessageToHistory(insertMessage: InsertMessageHistory): Promise<MessageHistory> {
    const id = randomUUID();
    const message: MessageHistory = {
      ...insertMessage,
      id,
      createdAt: new Date(),
      isFavorite: insertMessage.isFavorite ?? false,
    };
    this.messageHistory.set(id, message);
    return message;
  }

  async getMessageHistory(limit = 50, offset = 0): Promise<MessageHistory[]> {
    const messages = Array.from(this.messageHistory.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
    return messages;
  }

  async searchMessageHistory(query: string): Promise<MessageHistory[]> {
    const messages = Array.from(this.messageHistory.values())
      .filter(message => 
        message.naturalInput.toLowerCase().includes(query.toLowerCase()) ||
        message.spanishMessage.toLowerCase().includes(query.toLowerCase()) ||
        message.englishMessage.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return messages;
  }

  async toggleMessageFavorite(id: string): Promise<MessageHistory | undefined> {
    const message = this.messageHistory.get(id);
    if (message) {
      message.isFavorite = !message.isFavorite;
      this.messageHistory.set(id, message);
      return message;
    }
    return undefined;
  }

  // Favorites methods
  async addToFavorites(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = randomUUID();
    const favorite: Favorite = {
      ...insertFavorite,
      id,
      createdAt: new Date(),
    };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async getFavorites(): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteFavorite(id: string): Promise<boolean> {
    return this.favorites.delete(id);
  }
}

export const storage = new MemStorage();
