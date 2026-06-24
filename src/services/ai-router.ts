import { geminiService, type GeminiItinerary } from "./gemini.server";
import { grokService } from "./grok.server";
import { supabase } from "./supabase/client";

// Estimate tokens if not returned by API
function estimateTokens(text: string): number {
  return Math.ceil((text || "").length / 4);
}

// Compress and prune prompt context to minimize token usage with text summaries
function compressContext(context: {
  travelerProfile: any;
  budgetResult: any;
  feasibilityResult: any;
  recommendedDestinations: any[];
  prompt: string;
}): any {
  // 1. Traveler Profile Summary
  let travelerProfile = "Style: Mid-range; Dietary: No Restrictions; Lodging: Hotel";
  if (context.travelerProfile) {
    const styles = (context.travelerProfile.styles || []).join(", ") || "Standard";
    const dietary = context.travelerProfile.dietaryPreferences || "No Restrictions";
    const lodging = context.travelerProfile.lodgingPreferences || "Hotel";
    const interests = (context.travelerProfile.interests || []).join(", ") || "General Sightseeing";
    travelerProfile = `Style preferences: [${styles}]; Dietary: ${dietary}; Lodging: ${lodging}; Interests: [${interests}].`;
  }

  // 2. Budget Summary
  let budgetResult = "No specific budget constraints.";
  if (context.budgetResult) {
    const flights = context.budgetResult.flights || 0;
    const accommodation = context.budgetResult.accommodation || 0;
    const dining = context.budgetResult.dining || 0;
    const activities = context.budgetResult.activities || 0;
    const transport = context.budgetResult.transport || 0;
    const total = context.budgetResult.total || 0;
    budgetResult = `Estimated total trip budget: $${total} USD. Breakdown: Flights=$${flights}, Lodging=$${accommodation}, Dining=$${dining}, Activities=$${activities}, Transit=$${transport}.`;
  }

  // 3. Feasibility Summary
  let feasibilityResult = "Status: Feasible.";
  if (context.feasibilityResult) {
    const isFeasible = context.feasibilityResult.isFeasible ? "Feasible" : "Requires Adjustments";
    const warnings = (context.feasibilityResult.warnings || []).join("; ") || "None";
    feasibilityResult = `Safety/feasibility status: ${isFeasible}. Alerts/Warnings: ${warnings}.`;
  }

  // 4. Destination Summary
  let recommendedDestinations = "Target destination requested.";
  if (context.recommendedDestinations && context.recommendedDestinations.length > 0) {
    const dest = context.recommendedDestinations[0];
    const name = typeof dest === 'string' ? dest : (dest.name || dest.destination || "Destination");
    recommendedDestinations = `Primary Destination: ${name}.`;
  }

  return {
    travelerProfile,
    budgetResult,
    feasibilityResult,
    recommendedDestinations,
    prompt: context.prompt
  };
}

export const aiRouter = {
  async generateItinerary(
    context: {
      travelerProfile: any;
      budgetResult: any;
      feasibilityResult: any;
      recommendedDestinations: any[];
      prompt: string;
    },
    userId: string | null = null
  ): Promise<GeminiItinerary> {
    const startTime = Date.now();
    let selectedProvider = "gemini";
    let selectedModel = "gemini-2.5-flash";
    let status = "success";
    let errorMessage: string | null = null;
    let inputTokens = 0;
    let outputTokens = 0;
    let estimatedCost = 0;
    let itineraryResult: GeminiItinerary | null = null;

    // Apply context compression before API calls
    const compressedContext = compressContext(context);

    // Retry configurations (1 retry to quickly fall back when rate-limited/down)
    const maxRetries = 1;
    let attempt = 0;

    while (attempt <= maxRetries) {
      const attemptStartTime = Date.now();
      try {
        console.log(`[AI Router] Attempting itinerary generation with Gemini (Attempt ${attempt + 1}/${maxRetries + 1})...`);
        itineraryResult = await geminiService.generateItinerary(compressedContext);
        const attemptEndTime = Date.now();
        const latency = attemptEndTime - attemptStartTime;

        // Gemini 2.5 Flash pricing estimates (input: $0.075 / 1M, output: $0.30 / 1M)
        // Estimate token counts based on prompt and response size
        const serializedContext = JSON.stringify(compressedContext);
        const serializedResult = JSON.stringify(itineraryResult);
        inputTokens = estimateTokens(serializedContext);
        outputTokens = estimateTokens(serializedResult);
        estimatedCost = (inputTokens * 0.000075 / 1000) + (outputTokens * 0.0003 / 1000);

        // Log this successful provider attempt
        await this.logProviderAttempt({
          userId,
          provider: "gemini",
          model: "gemini-2.5-flash",
          status: "success",
          responseTimeMs: latency,
          inputTokens,
          outputTokens,
        });

        break; // Success, exit retry loop
      } catch (err: any) {
        const attemptEndTime = Date.now();
        const latency = attemptEndTime - attemptStartTime;
        console.warn(`[AI Router] Gemini attempt ${attempt + 1} failed: ${err.message}`);

        await this.logProviderAttempt({
          userId,
          provider: "gemini",
          model: "gemini-2.5-flash",
          status: "failed",
          responseTimeMs: latency,
          errorMessage: err.message,
        });

        attempt++;
        if (attempt <= maxRetries) {
          const backoffDelay = Math.pow(2, attempt) * 1000;
          console.log(`[AI Router] Retrying Gemini in ${backoffDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }

    // Fallback path
    if (!itineraryResult) {
      const fallbackStartTime = Date.now();
      selectedProvider = "grok";
      selectedModel = "grok-2";
      console.log("[AI Router] Gemini exhausted all retries. Falling back to Grok...");

      try {
        itineraryResult = await grokService.generateItinerary(compressedContext);
        const fallbackEndTime = Date.now();
        const latency = fallbackEndTime - fallbackStartTime;

        // Grok 2 pricing estimates (input: $2.00 / 1M, output: $10.00 / 1M)
        const serializedContext = JSON.stringify(compressedContext);
        const serializedResult = JSON.stringify(itineraryResult);
        inputTokens = estimateTokens(serializedContext);
        outputTokens = estimateTokens(serializedResult);
        estimatedCost = (inputTokens * 0.002 / 1000) + (outputTokens * 0.01 / 1000);

        await this.logProviderAttempt({
          userId,
          provider: "grok",
          model: "grok-2",
          status: "success",
          responseTimeMs: latency,
          inputTokens,
          outputTokens,
        });
      } catch (err: any) {
        const fallbackEndTime = Date.now();
        const latency = fallbackEndTime - fallbackStartTime;
        status = "failed";
        errorMessage = err.message;
        console.error(`[AI Router] Fallback to Grok failed: ${err.message}`);

        await this.logProviderAttempt({
          userId,
          provider: "grok",
          model: "grok-2",
          status: "failed",
          responseTimeMs: latency,
          errorMessage: err.message,
        });

        throw new Error(`AI Generation failed on primary and fallback providers. Last error: ${err.message}`);
      }
    }

    const totalLatency = Date.now() - startTime;

    // Log overall usage telemetry
    await this.logOverallUsage({
      userId,
      endpoint: "generateItinerary",
      provider: selectedProvider,
      modelName: selectedModel,
      promptTemplate: "concierge_itinerary_v1",
      inputTokens,
      outputTokens,
      estimatedCost,
      latencyMs: totalLatency,
      status,
      errorMessage,
    });

    return itineraryResult;
  },

  async logProviderAttempt(metrics: {
    userId: string | null;
    provider: string;
    model: string;
    status: string;
    responseTimeMs: number;
    inputTokens?: number;
    outputTokens?: number;
    errorMessage?: string;
  }) {
    if (!metrics.userId) {
      console.log(`[AI Router] Bypassing provider log for guest user (${metrics.provider}/${metrics.model}: ${metrics.status})`);
      return;
    }
    try {
      const { error } = await supabase.from("ai_provider_logs").insert({
        user_id: metrics.userId,
        provider: metrics.provider,
        model: metrics.model,
        status: metrics.status,
        response_time_ms: metrics.responseTimeMs,
        input_tokens: metrics.inputTokens || 0,
        output_tokens: metrics.outputTokens || 0,
        error_message: metrics.errorMessage || null,
      });
      if (error) console.error("[AI Router] Failed to insert provider log:", error.message);
    } catch (e) {
      console.error("[AI Router] Error logging provider attempt:", e);
    }
  },

  async logOverallUsage(metrics: {
    userId: string | null;
    endpoint: string;
    provider: string;
    modelName: string;
    promptTemplate: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCost: number;
    latencyMs: number;
    status: string;
    errorMessage: string | null;
  }) {
    if (!metrics.userId) {
      console.log(`[AI Router] Bypassing overall usage log for guest user`);
      return;
    }
    try {
      const { error } = await supabase.from("ai_usage_logs").insert({
        user_id: metrics.userId,
        endpoint: metrics.endpoint,
        provider: metrics.provider,
        model_name: metrics.modelName,
        prompt_template: metrics.promptTemplate,
        input_tokens: metrics.inputTokens,
        output_tokens: metrics.outputTokens,
        estimated_cost: metrics.estimatedCost,
        latency_ms: metrics.latencyMs,
        status: metrics.status,
        error_message: metrics.errorMessage,
      });
      if (error) console.error("[AI Router] Failed to insert overall usage log:", error.message);
    } catch (e) {
      console.error("[AI Router] Error logging overall usage:", e);
    }
  }
};
