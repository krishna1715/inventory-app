import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { insertBudgetSchema, insertMonthlyDataSchema, insertMonthlyActualsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix

  // Get all budgets (placeholder for future user authentication)
  app.get("/api/budgets", async (req, res) => {
    try {
      // In a real app, we'd get the userId from the authenticated user
      // For now, we'll use a default userId of 1
      const userId = 1;
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  // Get a single budget
  app.get("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      const budget = await storage.getBudget(id);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.json(budget);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budget" });
    }
  });

  // Create a new budget
  app.post("/api/budgets", async (req, res) => {
    try {
      const result = insertBudgetSchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const budget = await storage.createBudget(result.data);
      res.status(201).json(budget);
    } catch (error) {
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  // Update a budget
  app.patch("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      const budget = await storage.getBudget(id);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      // Validate only the fields that are being updated
      const updateSchema = insertBudgetSchema.partial();
      const result = updateSchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedBudget = await storage.updateBudget(id, result.data);
      res.json(updatedBudget);
    } catch (error) {
      res.status(500).json({ message: "Failed to update budget" });
    }
  });

  // Delete a budget
  app.delete("/api/budgets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      const budget = await storage.getBudget(id);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      // First delete all monthly data for this budget
      await storage.deleteMonthlyDataForBudget(id);
      
      // Then delete the budget itself
      const success = await storage.deleteBudget(id);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete budget" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete budget" });
    }
  });

  // Get all monthly data for a budget
  app.get("/api/budgets/:id/monthly-data", async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      if (isNaN(budgetId)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      const budget = await storage.getBudget(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      const monthlyData = await storage.getMonthlyDataForBudget(budgetId);
      res.json(monthlyData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly data" });
    }
  });

  // Save monthly data for a budget
  app.post("/api/budgets/:id/monthly-data", async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      if (isNaN(budgetId)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      const budget = await storage.getBudget(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      // First delete any existing monthly data for this budget
      await storage.deleteMonthlyDataForBudget(budgetId);
      
      // Validate the monthly data array
      const monthlyDataArraySchema = z.array(insertMonthlyDataSchema);
      const result = monthlyDataArraySchema.safeParse(req.body);
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Create each monthly data record
      const savedData = await Promise.all(
        result.data.map(data => storage.createMonthlyData({
          ...data,
          budgetId: budgetId
        }))
      );
      
      res.status(201).json(savedData);
    } catch (error) {
      res.status(500).json({ message: "Failed to save monthly data" });
    }
  });
  
  // Get monthly actuals for a budget
  app.get("/api/budgets/:id/monthly-actuals", async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      if (isNaN(budgetId)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      const budget = await storage.getBudget(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      const monthlyActuals = await storage.getMonthlyActualsForBudget(budgetId);
      res.json(monthlyActuals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly actuals" });
    }
  });
  
  // Get monthly actual by month for a budget
  app.get("/api/budgets/:id/monthly-actuals/:month", async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const month = parseInt(req.params.month);
      
      if (isNaN(budgetId)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      if (isNaN(month) || month < 0 || month > 11) {
        return res.status(400).json({ message: "Invalid month (must be 0-11)" });
      }
      
      const budget = await storage.getBudget(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      const monthlyActual = await storage.getMonthlyActualByMonth(budgetId, month);
      if (!monthlyActual) {
        return res.status(404).json({ message: "Monthly actual not found" });
      }
      
      res.json(monthlyActual);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch monthly actual" });
    }
  });
  
  // Create or update monthly actual
  app.post("/api/budgets/:id/monthly-actuals", async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      if (isNaN(budgetId)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      const budget = await storage.getBudget(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      // Validate the monthly actual
      const result = insertMonthlyActualsSchema.safeParse({
        ...req.body,
        budgetId
      });
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Check if an actuals record for this month already exists
      const existingActual = await storage.getMonthlyActualByMonth(
        budgetId, 
        result.data.month
      );
      
      let savedActual;
      if (existingActual) {
        // Update existing record
        savedActual = await storage.updateMonthlyActual(
          existingActual.id, 
          {
            cogs: result.data.cogs,
            closingInventory: result.data.closingInventory
          }
        );
      } else {
        // Create new record
        savedActual = await storage.createMonthlyActual(result.data);
      }
      
      res.status(201).json(savedActual);
    } catch (error) {
      res.status(500).json({ message: "Failed to save monthly actual" });
    }
  });
  
  // Delete a monthly actual
  app.delete("/api/budgets/:id/monthly-actuals/:month", async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      const month = parseInt(req.params.month);
      
      if (isNaN(budgetId)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      if (isNaN(month) || month < 0 || month > 11) {
        return res.status(400).json({ message: "Invalid month (must be 0-11)" });
      }
      
      const budget = await storage.getBudget(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      const monthlyActual = await storage.getMonthlyActualByMonth(budgetId, month);
      if (!monthlyActual) {
        return res.status(404).json({ message: "Monthly actual not found" });
      }
      
      const success = await storage.deleteMonthlyActual(monthlyActual.id);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete monthly actual" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete monthly actual" });
    }
  });
  
  // Delete all monthly actuals for a budget
  app.delete("/api/budgets/:id/monthly-actuals", async (req, res) => {
    try {
      const budgetId = parseInt(req.params.id);
      if (isNaN(budgetId)) {
        return res.status(400).json({ message: "Invalid budget ID" });
      }
      
      const budget = await storage.getBudget(budgetId);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      const success = await storage.deleteMonthlyActualsForBudget(budgetId);
      
      if (success) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete monthly actuals" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete monthly actuals" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
