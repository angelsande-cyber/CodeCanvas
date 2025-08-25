import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GeminiService } from "./gemini";
import { generateMessageSchema, insertMessageHistorySchema, insertFavoriteSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // SOSGEN API route
  app.post("/api/generate-message", async (req, res) => {
    try {
      // Validate the request body
      const validationResult = generateMessageSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Datos de entrada inválidos" });
      }

      const { naturalInput } = validationResult.data;

      // Check if API key is available
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Clave de API de Gemini no configurada" });
      }

      // Generate messages using Gemini
      const geminiService = new GeminiService(apiKey);
      const messages = await geminiService.generateMayдayMessages(naturalInput);

      // Save to history
      try {
        await storage.saveMessageToHistory({
          naturalInput,
          spanishMessage: messages.es,
          englishMessage: messages.en,
          isFavorite: false,
        });
      } catch (historyError) {
        console.warn("Failed to save to history:", historyError);
      }

      res.json(messages);
    } catch (error) {
      console.error("Error generating message:", error);
      const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
      res.status(500).json({ error: errorMessage });
    }
  });

  // Message History routes
  app.get("/api/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const query = req.query.q as string;
      
      let messages;
      if (query) {
        messages = await storage.searchMessageHistory(query);
      } else {
        messages = await storage.getMessageHistory(limit, offset);
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Error al obtener el historial" });
    }
  });

  app.patch("/api/history/:id/favorite", async (req, res) => {
    try {
      const { id } = req.params;
      const message = await storage.toggleMessageFavorite(id);
      
      if (!message) {
        return res.status(404).json({ error: "Mensaje no encontrado" });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      res.status(500).json({ error: "Error al actualizar favorito" });
    }
  });

  // Favorites routes
  app.get("/api/favorites", async (req, res) => {
    try {
      const favorites = await storage.getFavorites();
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ error: "Error al obtener favoritos" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const validationResult = insertFavoriteSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ error: "Datos inválidos" });
      }
      
      const favorite = await storage.addToFavorites(validationResult.data);
      res.json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ error: "Error al agregar favorito" });
    }
  });

  app.delete("/api/favorites/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFavorite(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Favorito no encontrado" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting favorite:", error);
      res.status(500).json({ error: "Error al eliminar favorito" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
