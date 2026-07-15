import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createSupabaseServerClient } from "./supabase/server";
import type { TravelOSInput } from "./travelOS";

export const generateTripPlan = createServerFn({ method: "POST" })
  .validator(
    z.object({
      destination: z.string().min(1),
      prompt: z.string().min(1),
      durationDays: z.number().int().positive().default(5),
      userId: z.string().uuid(),
    })
  )
  .handler(async ({ data }) => {
    // 1. Initialize server-side Supabase client (cookie & headers context)
    const supabaseServer = createSupabaseServerClient();

    // Verify session
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized request to generate trip plans.");
    }

    // 2. Production AI Travel Generation Core Simulation
    // In actual production, this would make calls to OpenAI, Gemini, or a proprietary itinerary model.
    // For architecture readiness, we return structured objects fitting our schema.
    const estimatedTotal = data.durationDays * 220;

    const mockResult = {
      title: `AI Journey to ${data.destination}`,
      destination: data.destination,
      budgetBreakdown: {
        flights: 450,
        accommodation: data.durationDays * 110,
        activities: data.durationDays * 40,
        dining: data.durationDays * 50,
        transport: 80,
        other: 40,
        total: 450 + (data.durationDays * 200) + 120,
      },
      itineraryDays: Array.from({ length: data.durationDays }, (_, i) => ({
        dayNumber: i + 1,
        theme: `Explore local hidden gems of ${data.destination}`,
        activities: [
          {
            id: `act-1-${i}`,
            title: "Morning Local Food Walk",
            description: "Sample traditional breakfast recipes curated by local reviews.",
            timeSlot: "09:00",
            durationMinutes: 120,
            costEstimate: 25,
            locationName: `${data.destination} Central Market`,
            category: "dining" as const,
          },
          {
            id: `act-2-${i}`,
            title: "Cultural Landmark Tour",
            description: "Guided architectural walkthrough of historical monuments.",
            timeSlot: "14:00",
            durationMinutes: 180,
            costEstimate: 35,
            locationName: `Historical Center`,
            category: "sightseeing" as const,
          },
        ],
      })),
    };

    // Store a log of this interaction in the learning_data table for personalization models
    try {
      await supabaseServer.from("learning_data").insert({
        user_id: data.userId,
        interaction_type: "generate_trip_plan",
        metadata: {
          destination: data.destination,
          promptLength: data.prompt.length,
          durationDays: data.durationDays,
        },
      });
    } catch (dbErr) {
      console.error("Could not write analytical learning event:", dbErr);
    }

    return mockResult;
  });

export const orchestrateTripPlan = createServerFn({ method: "POST" })
  .validator(
    z.object({
      userProfile: z.any(),
      destinationQuery: z.string().min(1),
      durationDays: z.number().int().positive(),
      travelersCount: z.number().int().positive(),
      budgetLimitINR: z.number().positive(),
      pastTrips: z.array(z.any()).default([]),
    })
  )
  .handler(async ({ data }) => {
    const { travelOS } = await import("./travelOS");
    const result = await travelOS.runOrchestrator(data as TravelOSInput);
    try {
      // Force complete DTO serialization to prevent any non-serializable fields
      return JSON.parse(JSON.stringify(result));
    } catch (e: any) {
      console.error("[orchestrateTripPlan] Return serialization failed:", e);
      throw new Error(`Failed to serialize orchestrator result: ${e.message}`);
    }
  });
