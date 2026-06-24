import { supabase } from "./supabase/client";
import type { Expense, ExpenseAnalytics, ExpenseCategory } from "../types/expenses";
import type { Trip } from "../types/travel";

export const expenseService = {
  async getTripExpenses(tripId: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("trip_id", tripId)
      .order("spent_at", { ascending: false });

    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      tripId: row.trip_id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      category: row.category as ExpenseCategory,
      description: row.description,
      spentAt: row.spent_at,
      createdAt: row.created_at,
    }));
  },

  async addExpense(expense: Omit<Expense, "id" | "createdAt">): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        trip_id: expense.tripId,
        user_id: expense.userId,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        spent_at: expense.spentAt,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      tripId: data.trip_id,
      userId: data.user_id,
      amount: parseFloat(data.amount),
      category: data.category as ExpenseCategory,
      description: data.description,
      spentAt: data.spent_at,
      createdAt: data.created_at,
    };
  },

  async editExpense(expenseId: string, updates: Partial<Omit<Expense, "id" | "createdAt"> >): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .update({
        amount: updates.amount,
        category: updates.category,
        description: updates.description,
        spent_at: updates.spentAt,
      })
      .eq("id", expenseId);

    if (error) throw error;
  },

  async deleteExpense(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId);

    if (error) throw error;
  },

  calculateAnalytics(expenses: Expense[], trip: Trip): ExpenseAnalytics {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingBudget = Math.max(0, trip.budgetLimit - totalSpent);
    const burnRatePercentage = trip.budgetLimit > 0 
      ? Math.round((totalSpent / trip.budgetLimit) * 100) 
      : 0;

    // Calculate days elapsed since trip start (minimum 1 day to prevent division by zero)
    const tripStart = new Date(trip.startDate).getTime();
    const now = Date.now();
    const diffTime = Math.max(0, now - tripStart);
    const daysElapsed = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const dailyBurnRate = Math.round(totalSpent / daysElapsed);
    
    // Project overrun based on current daily rates vs budget limits
    const projectedTotal = dailyBurnRate * trip.durationDays;
    const projectedOverrun = Math.max(0, projectedTotal - trip.budgetLimit);

    return {
      totalSpent,
      remainingBudget,
      burnRatePercentage,
      dailyBurnRate,
      projectedOverrun,
    };
  },
};
