import { activityRecommendationEngine } from "../src/services/activityRecommendationEngine";
import type { UserProfile } from "../src/types/travel";

async function verify() {
  console.log("==================================================");
  console.log("Verifying Activity Recommendation Shadow Model in TS");
  console.log("==================================================");

  // Mock traveler profile
  const mockProfile: UserProfile = {
    uid: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1", // Valid UUID
    email: "adventurer@example.com",
    displayName: "John Doe",
    preferences: {
      styles: ["ADVENTURE"] as any,
      food: ["GLUTEN_FREE"] as any,
      accommodation: ["HOSTEL"] as any,
      currency: "USD",
      maxDailyBudget: 150,
    },
    isPro: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  console.log("Calling activityRecommendationEngine.recommendAndRank in shadow mode...");
  const ruleRecs = activityRecommendationEngine.recommendAndRank(
    mockProfile,
    ["Adventure", "Nature"], // filter tags
    28,                      // userAge
    "Bali, Indonesia",       // destination
    "Summer",                // season
    7                        // tripDuration
  );

  console.log("\nRule-Based Recommendation Outputs (Primary):");
  ruleRecs.forEach((r, idx) => {
    console.log(`  [Rank ${idx + 1}] ${r.activity.title}: score = ${r.score.overallScore} (cost = $${r.activity.costEstimate})`);
  });

  // Verify recommendations exist
  if (ruleRecs.length > 0) {
    console.log("\n[Success] Generated activity recommendations successfully.");
  } else {
    console.error("\n[Error] No recommendations generated!");
  }

  // Wait a moment for async DB logging
  console.log("\nWaiting 2 seconds for background shadow database log attempt...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("==================================================");
  console.log("Shadow Mode Activity Recommendation Verification Done!");
  console.log("==================================================");
}

verify();
