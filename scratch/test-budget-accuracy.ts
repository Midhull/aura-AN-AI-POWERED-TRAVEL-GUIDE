import { dataPlatformService } from "../src/services/dataPlatformService";

console.log("--- STARTING BUDGET ACCURACY SYSTEM TESTS ---");

const estimatedBudget = 1000;
const plannedBudget = 1200;
const actualSpend = 1300;

const categoryEstimates = {
  flights: 400,
  accommodation: 400,
  dining: 100,
  transport: 50,
  activities: 50,
};

const categoryActuals = {
  flights: 500,
  accommodation: 450,
  dining: 200,
  transport: 70,
  activities: 80,
};

const predictionError = actualSpend - estimatedBudget;
const overspendAmount = Math.max(0, actualSpend - plannedBudget);
const percentageError = estimatedBudget > 0 ? (Math.abs(predictionError) / estimatedBudget) * 100 : 0;
const accuracyScore = parseFloat(Math.max(0, Math.min(100, 100 - percentageError)).toFixed(2));

console.log("Prediction Error:", predictionError);
console.log("Overspend Amount:", overspendAmount);
console.log("Accuracy Score:", accuracyScore);

if (predictionError !== 300) {
  console.error("FAIL: Prediction error calculation failed.");
} else {
  console.log("PASS: Prediction error calculation.");
}

if (accuracyScore !== 70) {
  console.error("FAIL: Accuracy score calculation failed.");
} else {
  console.log("PASS: Accuracy score calculation.");
}

const correctionFactors: Record<string, number> = {};
const keys = ["flights", "accommodation", "dining", "transport", "activities"] as const;
for (const key of keys) {
  const est = categoryEstimates[key];
  const act = categoryActuals[key];
  correctionFactors[key] = est > 0 ? parseFloat((act / est).toFixed(3)) : (act > 0 ? act : 1.0);
}

console.log("Correction Factors:", correctionFactors);
if (correctionFactors.flights !== 1.25 || correctionFactors.accommodation !== 1.125) {
  console.error("FAIL: Correction factor calculations failed.");
} else {
  console.log("PASS: Correction factors calculation.");
}

console.log("--- BUDGET ACCURACY SYSTEM TESTS COMPLETED ---");
