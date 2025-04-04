import { 
  users, type User, type InsertUser, 
  budgets, type Budget, type InsertBudget, 
  monthlyData, type MonthlyData, type InsertMonthlyData,
  monthlyActuals, type MonthlyActual, type InsertMonthlyActual
} from "@shared/schema";

// Storage interface with CRUD methods for all entities
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Budget methods
  getBudgets(userId: number): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Monthly Data methods
  getMonthlyDataForBudget(budgetId: number): Promise<MonthlyData[]>;
  createMonthlyData(data: InsertMonthlyData): Promise<MonthlyData>;
  updateMonthlyData(id: number, data: Partial<InsertMonthlyData>): Promise<MonthlyData | undefined>;
  deleteMonthlyDataForBudget(budgetId: number): Promise<boolean>;
  
  // Monthly Actuals methods
  getMonthlyActualsForBudget(budgetId: number): Promise<MonthlyActual[]>;
  getMonthlyActualByMonth(budgetId: number, month: number): Promise<MonthlyActual | undefined>;
  createMonthlyActual(data: InsertMonthlyActual): Promise<MonthlyActual>;
  updateMonthlyActual(id: number, data: Partial<InsertMonthlyActual>): Promise<MonthlyActual | undefined>;
  deleteMonthlyActual(id: number): Promise<boolean>;
  deleteMonthlyActualsForBudget(budgetId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private budgets: Map<number, Budget>;
  private monthlyData: Map<number, MonthlyData>;
  private monthlyActuals: Map<number, MonthlyActual>;
  private userId: number;
  private budgetId: number;
  private monthlyDataId: number;
  private monthlyActualId: number;

  constructor() {
    this.users = new Map();
    this.budgets = new Map();
    this.monthlyData = new Map();
    this.monthlyActuals = new Map();
    this.userId = 1;
    this.budgetId = 1;
    this.monthlyDataId = 1;
    this.monthlyActualId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Budget methods
  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(
      (budget) => budget.userId === userId
    );
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    return this.budgets.get(id);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.budgetId++;
    const createdAt = new Date().toISOString(); // Store as ISO string
    const budget: Budget = { 
      ...insertBudget, 
      id, 
      createdAt,
      savedBudget: insertBudget.savedBudget || false,
      userId: insertBudget.userId || null,
      rmPercent: insertBudget.rmPercent || null,
      currency: insertBudget.currency || "$"
    };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudget(id: number, updateData: Partial<InsertBudget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget: Budget = { ...budget, ...updateData };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }

  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }

  // Monthly Data methods
  async getMonthlyDataForBudget(budgetId: number): Promise<MonthlyData[]> {
    return Array.from(this.monthlyData.values())
      .filter(data => data.budgetId === budgetId)
      .sort((a, b) => a.month - b.month);
  }

  async createMonthlyData(insertData: InsertMonthlyData): Promise<MonthlyData> {
    const id = this.monthlyDataId++;
    const data: MonthlyData = { 
      ...insertData, 
      id,
      isActual: insertData.isActual || false,
      budgetId: insertData.budgetId || null
    };
    this.monthlyData.set(id, data);
    return data;
  }

  async updateMonthlyData(id: number, updateData: Partial<InsertMonthlyData>): Promise<MonthlyData | undefined> {
    const data = this.monthlyData.get(id);
    if (!data) return undefined;
    
    const updatedData: MonthlyData = { ...data, ...updateData };
    this.monthlyData.set(id, updatedData);
    return updatedData;
  }

  async deleteMonthlyDataForBudget(budgetId: number): Promise<boolean> {
    let success = true;
    
    // Find all monthly data for this budget
    const dataToDelete = Array.from(this.monthlyData.values())
      .filter(data => data.budgetId === budgetId);
    
    // Delete each one
    for (const data of dataToDelete) {
      const result = this.monthlyData.delete(data.id);
      if (!result) success = false;
    }
    
    return success;
  }

  // Monthly Actuals methods
  async getMonthlyActualsForBudget(budgetId: number): Promise<MonthlyActual[]> {
    return Array.from(this.monthlyActuals.values())
      .filter(data => data.budgetId === budgetId)
      .sort((a, b) => a.month - b.month);
  }

  async getMonthlyActualByMonth(budgetId: number, month: number): Promise<MonthlyActual | undefined> {
    return Array.from(this.monthlyActuals.values())
      .find(data => data.budgetId === budgetId && data.month === month);
  }

  async createMonthlyActual(insertData: InsertMonthlyActual): Promise<MonthlyActual> {
    const id = this.monthlyActualId++;
    const recordedAt = new Date().toISOString(); // Store as ISO string
    const data: MonthlyActual = { 
      ...insertData, 
      id, 
      recordedAt,
      budgetId: insertData.budgetId || null
    };
    this.monthlyActuals.set(id, data);
    return data;
  }

  async updateMonthlyActual(id: number, updateData: Partial<InsertMonthlyActual>): Promise<MonthlyActual | undefined> {
    const data = this.monthlyActuals.get(id);
    if (!data) return undefined;
    
    const updatedData: MonthlyActual = { ...data, ...updateData };
    this.monthlyActuals.set(id, updatedData);
    return updatedData;
  }

  async deleteMonthlyActual(id: number): Promise<boolean> {
    return this.monthlyActuals.delete(id);
  }

  async deleteMonthlyActualsForBudget(budgetId: number): Promise<boolean> {
    let success = true;
    
    // Find all monthly actuals for this budget
    const dataToDelete = Array.from(this.monthlyActuals.values())
      .filter(data => data.budgetId === budgetId);
    
    // Delete each one
    for (const data of dataToDelete) {
      const result = this.monthlyActuals.delete(data.id);
      if (!result) success = false;
    }
    
    return success;
  }
}

export const storage = new MemStorage();
