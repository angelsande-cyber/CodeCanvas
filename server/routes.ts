import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GeminiService } from "./gemini";
import { generateMessageSchema } from "@shared/schema";

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

      res.json(messages);
    } catch (error) {
      console.error("Error generating message:", error);
      const errorMessage = error instanceof Error ? error.message : "Error interno del servidor";
      res.status(500).json({ error: errorMessage });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
