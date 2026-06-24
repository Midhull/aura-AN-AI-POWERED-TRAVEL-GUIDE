import type { Activity } from "../types/travel";

export interface OptimizationInput {
  destinations: string[];
  activities: Activity[];
  budgetLimit: number;
  durationDays: number;
}

export interface OptimizedRouteResult {
  optimizedActivities: Activity[];
  totalCost: number;
  totalDurationMinutes: number;
  efficiencyScore: number; // 0 to 100
  explanations: string[];
}

export const tripOptimizationEngine = {
  optimize(input: OptimizationInput): OptimizedRouteResult {
    const { activities, budgetLimit, durationDays } = input;
    const explanations: string[] = [];

    // 1. Cost Optimization Logic:
    // Sort activities by cost-efficiency (duration / cost) descending to maximize value,
    // then greedily add them until we run out of budget.
    let remainingBudget = budgetLimit || Infinity;
    const withinBudgetActivities: Activity[] = [];

    // Sort: sight-seeing and free ones first, then dining, then expensive items
    const sortedByValue = [...activities].sort((a, b) => {
      const aVal = a.costEstimate === 0 ? 1000 : (a.durationMinutes || 60) / (a.costEstimate || 1);
      const bVal = b.costEstimate === 0 ? 1000 : (b.durationMinutes || 60) / (b.costEstimate || 1);
      return bVal - aVal;
    });

    for (const act of sortedByValue) {
      if (act.costEstimate <= remainingBudget) {
        withinBudgetActivities.push(act);
        remainingBudget -= act.costEstimate;
      } else {
        explanations.push(`Omitted "${act.title}" to prevent exceeding your budget limit by $${act.costEstimate}.`);
      }
    }

    // 2. Time & Route Optimization Logic:
    // Sort selected activities chronologically by timeSlot.
    // If multiple activities are in the same slot or close, group them by location to minimize travel time overhead.
    const optimizedActivities = [...withinBudgetActivities].sort((a, b) => {
      // First sort by time slot
      const timeCompare = a.timeSlot.localeCompare(b.timeSlot);
      if (timeCompare !== 0) return timeCompare;
      
      // If time slots are identical, group by location alphabetically to keep them close
      return a.locationName.localeCompare(b.locationName);
    });

    // 3. Compute Aggregates
    const totalCost = optimizedActivities.reduce((sum, a) => sum + a.costEstimate, 0);
    const totalDurationMinutes = optimizedActivities.reduce((sum, a) => sum + (a.durationMinutes || 120), 0);

    // 4. Scoring Algorithm (0 - 100)
    // High score if budget is respected, and we fit a reasonable number of activities per day (e.g. 2-3 per day)
    const idealDailyCount = 2.5;
    const actualDailyCount = optimizedActivities.length / (durationDays || 1);
    
    let timeEfficiency = 100;
    if (actualDailyCount < idealDailyCount) {
      timeEfficiency = Math.round((actualDailyCount / idealDailyCount) * 100);
      explanations.push("Recommendation: Add more local activities to optimize your day-to-day timeline.");
    } else if (actualDailyCount > 4) {
      timeEfficiency = 80; // slightly docked for over-scheduling (fatigue risk)
      explanations.push("Warning: Schedule is highly packed. Consider removing 1-2 activities to prevent travel fatigue.");
    }

    const costEfficiency = budgetLimit > 0 ? Math.round((totalCost / budgetLimit) * 100) : 100;
    const efficiencyScore = Math.round(timeEfficiency * 0.6 + (100 - Math.abs(100 - costEfficiency)) * 0.4);

    return {
      optimizedActivities,
      totalCost,
      totalDurationMinutes,
      efficiencyScore,
      explanations,
    };
  },
};
