import fs from 'fs';
import path from 'path';

// Load .env.local if it exists
if (fs.existsSync('.env.local')) {
  const env = fs.readFileSync('.env.local', 'utf8');
  const lines = env.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value.trim();
    }
  }
}

async function runTest() {
  console.log("=== Testing AI Router ===");
  console.log("Gemini API Key configured:", !!process.env.GEMINI_API_KEY);
  console.log("Grok API Key configured:", !!process.env.GROK_API_KEY);

  const { aiRouter } = await import('../src/services/ai-router.ts');

  const mockContext = {
    travelerProfile: { styles: ["BUDGET"], food: [], accommodation: [], currency: "USD", maxDailyBudget: 150 },
    budgetResult: { dining: 100, activities: 50, transport: 30, total: 180 },
    feasibilityResult: { isFeasible: true, warnings: [] },
    recommendedDestinations: ["Kozhikode"],
    prompt: "A cultural trip to Kozhikode highlighting local history, beaches, and Malabar cuisine",
  };

  try {
    // 1. Attempt generation (will route to Gemini first)
    console.log("\n--- Executing Router (Gemini Primary) ---");
    const result = await aiRouter.generateItinerary(mockContext, null);
    console.log("Itinerary generated successfully:", result.title);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Router call failed:", err.message);
  }
}

runTest().catch(console.error);
