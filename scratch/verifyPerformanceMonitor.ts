import { mlPerformanceMonitor } from "../src/services/mlPerformanceMonitor";

async function verify() {
  console.log("==================================================");
  console.log("Verifying ML Performance Monitoring System in TS");
  console.log("==================================================");

  console.log("Attempting to log user feedback...");
  await mlPerformanceMonitor.logFeedback(
    "trip",
    "trip-123-uuid",
    "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1", // Valid user UUID
    5,
    "Absolutely loved the generated itinerary, very well paced!"
  );

  console.log("Attempting to log performance comparison...");
  await mlPerformanceMonitor.logPerformanceCompare({
    modelName: "Budget",
    predictionId: "b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1",
    version: "1.0.2",
    ruleOutput: { total: 1500 },
    mlOutput: { total: 1420 },
    actualOutput: { total: 1450 },
    difference: { diff: 30 }
  });

  console.log("Fetching dashboard data...");
  const dashboard = await mlPerformanceMonitor.getDashboardData();

  console.log("\nDashboard Operational Status Summary:");
  console.log(`  - Active Alerts Count: ${dashboard.alerts.length}`);
  dashboard.alerts.forEach((alert) => {
    console.log(`    [Alert] ${alert.model} (${alert.metric}) -> baseline: ${alert.baseline}, current: ${alert.current}, change: ${alert.change}`);
  });

  console.log("\nActive Model Versions Registry:");
  dashboard.versions.forEach((version) => {
    console.log(`  - Model: ${version.modelName}, version: ${version.modelVersion}, dataset: ${version.trainingDatasetVersion}`);
  });

  console.log("\n[Success] ML Performance Monitoring System verification completed.");
  console.log("==================================================");
}

verify();
