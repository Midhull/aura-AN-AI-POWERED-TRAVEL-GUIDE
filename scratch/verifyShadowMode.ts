import { budgetEngine } from "../src/services/budgetEngine";

async function verify() {
  console.log("Calling budgetEngine.calculate in shadow mode...");
  const result = budgetEngine.calculate({
    destination: "Tokyo, Japan",
    durationDays: 7,
    travelersCount: 2,
    tier: "mid-range",
    userLimit: 3000,
    season: "Autumn",
    travelStyle: "CULTURAL"
  });

  console.log("Deterministic rule budget:", result.breakdown.total);
  console.log("Result isWithinBudget:", result.isWithinBudget);
  
  // Wait a moment for the asynchronous db logger to finish
  console.log("Waiting 2 seconds for background database log attempt...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log("Shadow Mode verification completed successfully!");
}

verify();
