import { destinationMatchEngine } from "../src/services/destinationMatchEngine";
import type { DestinationIntel } from "../src/types/destinationIntel";
import type { UserProfile } from "../src/types/travel";

async function verify() {
  console.log("==================================================");
  console.log("Verifying Destination Ranking Shadow Model in TS");
  console.log("==================================================");

  // Mock traveler profile
  const mockProfile: UserProfile = {
    uid: "3b2e59df-7d1a-4c22-9218-1b2585f67a21", // Valid UUID
    email: "traveler@example.com",
    displayName: "Jane Doe",
    preferences: {
      styles: ["CULTURAL", "BOUTIQUE"] as any,
      food: ["VEGETARIAN"] as any,
      accommodation: ["HOTEL"] as any,
      currency: "USD",
      maxDailyBudget: 250,
    },
    isPro: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mock destinations
  const mockDestinations: DestinationIntel[] = [
    {
      id: "44444444-4444-4444-4444-444444444444",
      cityId: "11111111-1111-1111-1111-111111111111",
      name: "Tokyo, Japan",
      description: "An ultra-modern metropolis blended with ancient tradition.",
      bestSeason: "Spring",
      averageBudget: 180,
      travelDifficulty: 1,
      familyFriendlyScore: 9,
      nightlifeScore: 8,
      foodScore: 10,
      interests: ["History", "Food", "Technology"],
      styles: ["CULTURAL", "BOUTIQUE"],
    },
    {
      id: "55555555-5555-5555-5555-555555555555",
      cityId: "22222222-2222-2222-2222-222222222222",
      name: "Reykjavik, Iceland",
      description: "Gateway to Iceland's dramatic volcanic landscape.",
      bestSeason: "Summer",
      averageBudget: 280, // Exceeds budget limit
      travelDifficulty: 3,
      familyFriendlyScore: 7,
      nightlifeScore: 6,
      foodScore: 7,
      interests: ["Nature", "Adventure", "Hiking"],
      styles: ["ADVENTURE", "RELAXING"],
    },
  ];

  console.log("Calling destinationMatchEngine.rank in shadow mode...");
  const rankedRule = destinationMatchEngine.rank(mockDestinations, mockProfile);

  console.log("\nRule-Based Recommendation Outputs (Primary):");
  rankedRule.forEach((r, idx) => {
    console.log(`  [Rank ${idx + 1}] ${r.destination.name}: score = ${r.overallScore}`);
  });

  // Verify that target output counts match input count
  if (rankedRule.length === mockDestinations.length) {
    console.log("\n[Success] Output destination count matches input count.");
  } else {
    console.error("\n[Error] Output count mismatch!");
  }

  // Wait a moment for async DB logging
  console.log("\nWaiting 2 seconds for background shadow database log attempt...");
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log("==================================================");
  console.log("Shadow Mode Destination Ranking Verification Done!");
  console.log("==================================================");
}

verify();
