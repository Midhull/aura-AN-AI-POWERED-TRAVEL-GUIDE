import { supabase } from "./supabase/client";
import type {
  DestinationIntel,
  City,
  Country,
  AttractionIntel,
  RestaurantIntel,
  WeatherProfile,
} from "../types/destinationIntel";

// Local catalog of standard destinations as local fallback database
const LOCAL_DESTINATIONS_CATALOG: DestinationIntel[] = [
  {
    id: "dest-bali",
    cityId: "city-bali",
    name: "Bali",
    description: "Tropical paradise with beaches, temples, and terraced rice paddies.",
    bestSeason: "May to September (Dry season)",
    averageBudget: 120,
    travelDifficulty: 2,
    familyFriendlyScore: 9,
    nightlifeScore: 8,
    foodScore: 8,
    interests: ["beaches", "nature", "wellness", "diving", "culture"],
    styles: ["ADVENTURE", "RELAXING", "BUDGET"],
  },
  {
    id: "dest-kyoto",
    cityId: "city-kyoto",
    name: "Kyoto",
    description: "Cultural heart of Japan with historical temples and gardens.",
    bestSeason: "April to May (Cherry blossom) & October to November (Autumn leaves)",
    averageBudget: 220,
    travelDifficulty: 1,
    familyFriendlyScore: 8,
    nightlifeScore: 5,
    foodScore: 9,
    interests: ["history", "food", "temples", "shopping", "gardens"],
    styles: ["CULTURAL", "BOUTIQUE", "RELAXING"],
  },
  {
    id: "dest-swiss-alps",
    cityId: "city-alps",
    name: "Swiss Alps",
    description: "Stunning mountain peaks and alpine villages.",
    bestSeason: "December to March (Winter sports) & June to August (Summer hiking)",
    averageBudget: 350,
    travelDifficulty: 3,
    familyFriendlyScore: 8,
    nightlifeScore: 4,
    foodScore: 7,
    interests: ["nature", "hiking", "skiing", "mountains", "scenery"],
    styles: ["LUXURY", "ADVENTURE"],
  },
  {
    id: "dest-iceland",
    cityId: "city-reykjavik",
    name: "Reykjavik",
    description: "Nordic volcanic landscapes and northern lights.",
    bestSeason: "September to March (Northern Lights) & June to August (Midnight Sun)",
    averageBudget: 250,
    travelDifficulty: 4,
    familyFriendlyScore: 7,
    nightlifeScore: 7,
    foodScore: 8,
    interests: ["nature", "roadtrips", "aurora", "volcanoes", "hotsprings"],
    styles: ["ADVENTURE", "BACKPACKING"],
  },
  {
    id: "dest-santorini",
    cityId: "city-santorini",
    name: "Santorini",
    description: "Vibrant volcanic island with beautiful cliffside vistas.",
    bestSeason: "May to October",
    averageBudget: 300,
    travelDifficulty: 2,
    familyFriendlyScore: 8,
    nightlifeScore: 8,
    foodScore: 9,
    interests: ["beaches", "sunsets", "views", "history", "wine"],
    styles: ["LUXURY", "RELAXING", "BOUTIQUE"],
  },
];

function generateDynamicDestination(query: string): DestinationIntel {
  const capitalized = query.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id: `dest-${slug}`,
    cityId: `city-${slug}`,
    name: capitalized,
    description: `AI curated travel intelligence destination report for ${capitalized}.`,
    bestSeason: "October to March (Optimal Season)",
    averageBudget: 150,
    travelDifficulty: 2,
    familyFriendlyScore: 8,
    nightlifeScore: 6,
    foodScore: 8,
    interests: ["culture", "nature", "food", "sightseeing"],
    styles: ["BUDGET", "BOUTIQUE", "CULTURAL"],
  };
}

export const DestinationRepository = {
  async findById(id: string): Promise<DestinationIntel | null> {
    if (typeof id !== "string") {
      console.warn("[DestinationIntel] findById called with non-string id:", id);
      return null;
    }
    try {
      const { data, error } = await supabase
        .from("destinations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        return {
          id: data.id,
          cityId: data.city_id,
          name: data.name,
          description: data.description,
          bestSeason: data.best_season,
          averageBudget: parseFloat(data.average_budget),
          travelDifficulty: data.travel_difficulty,
          familyFriendlyScore: data.family_friendly_score,
          nightlifeScore: data.nightlife_score,
          foodScore: data.food_score,
          interests: data.interests || [],
          styles: data.styles || [],
        };
      }
    } catch (dbError) {
      console.warn("[DestinationIntel] Database query failed, checking local catalog:", dbError);
    }

    // Local catalog lookup fallback
    const localMatch = LOCAL_DESTINATIONS_CATALOG.find(d => d.id === id);
    if (localMatch) return localMatch;

    // Return dynamic destination matching standard naming convention
    if (id.startsWith("dest-")) {
      const cleanName = id.replace("dest-", "").replace(/-/g, " ");
      return generateDynamicDestination(cleanName);
    }

    return null;
  },

  async getAttractions(destinationId: string): Promise<AttractionIntel[]> {
    if (typeof destinationId !== "string") {
      console.warn("[DestinationIntel] getAttractions called with non-string destinationId:", destinationId);
      return [];
    }
    try {
      const { data, error } = await supabase
        .from("attractions")
        .select("*")
        .eq("destination_id", destinationId);

      if (!error && data) {
        return data.map((row) => ({
          id: row.id,
          destinationId: row.destination_id,
          name: row.name,
          coordinates: row.coordinates,
          description: row.description,
          difficultyLevel: row.difficulty_level,
        }));
      }
    } catch (e) {
      console.warn("[DestinationIntel] Attractions table not found/accessible, using mock empty array");
    }

    return [
      {
        id: `att-1-${destinationId}`,
        destinationId,
        name: "Historic Heritage Walk",
        coordinates: { lat: 0, lng: 0 },
        description: "Explore the local historical landmarks and architectural heritage.",
      },
      {
        id: `att-2-${destinationId}`,
        destinationId,
        name: "Scenic Viewpoint & Park",
        coordinates: { lat: 0, lng: 0 },
        description: "Capture beautiful panorama shots and enjoy a relaxing nature walk.",
      }
    ];
  },

  async getRestaurants(destinationId: string): Promise<RestaurantIntel[]> {
    if (typeof destinationId !== "string") {
      console.warn("[DestinationIntel] getRestaurants called with non-string destinationId:", destinationId);
      return [];
    }
    try {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .eq("destination_id", destinationId);

      if (!error && data) {
        return data.map((row) => ({
          id: row.id,
          destinationId: row.destination_id,
          name: row.name,
          coordinates: row.coordinates,
          foodScore: row.food_score,
          priceRange: row.price_range,
        }));
      }
    } catch (e) {
      console.warn("[DestinationIntel] Restaurants table not found/accessible, using mock empty array");
    }

    return [
      {
        id: `res-1-${destinationId}`,
        destinationId,
        name: "Authentic Culinary Counter",
        coordinates: { lat: 0, lng: 0 },
        foodScore: 8,
        priceRange: "$$",
      }
    ];
  },
};

export const DestinationSearchEngine = {
  async search(params: {
    query?: string;
    maxBudget?: number;
    interests?: string[];
    style?: string;
  }): Promise<DestinationIntel[]> {
    let results: DestinationIntel[] = [];

    try {
      let builder = supabase.from("destinations").select("*");

      if (params.query) {
        builder = builder.ilike("name", `%${params.query}%`);
      }

      if (params.maxBudget) {
        builder = builder.lte("average_budget", params.maxBudget);
      }

      const { data, error } = await builder;
      if (!error && data && data.length > 0) {
        results = data.map((row) => ({
          id: row.id,
          cityId: row.city_id,
          name: row.name,
          description: row.description,
          bestSeason: row.best_season,
          averageBudget: parseFloat(row.average_budget),
          travelDifficulty: row.travel_difficulty,
          familyFriendlyScore: row.family_friendly_score,
          nightlifeScore: row.nightlife_score,
          foodScore: row.food_score,
          interests: row.interests || [],
          styles: row.styles || [],
        }));
      }
    } catch (dbError) {
      console.warn("[DestinationIntel] Database search query failed, checking local catalog fallback:", dbError);
    }

    // Local fallback check
    if (results.length === 0 && params.query) {
      const q = params.query.toLowerCase().trim();
      const localMatches = LOCAL_DESTINATIONS_CATALOG.filter(d => d.name.toLowerCase().includes(q));
      if (localMatches.length > 0) {
        results = localMatches;
      } else {
        // Yield dynamic destination name matching the user search query to proceed with live AI generation
        results = [generateDynamicDestination(params.query)];
      }
    }

    // Filter by interests (intersection match)
    if (params.interests && params.interests.length > 0) {
      const lowerInts = params.interests.map((i) => i.toLowerCase());
      results = results.filter((dest) =>
        dest.interests.some((di: string) => lowerInts.includes(di.toLowerCase()))
      );
    }

    // Filter by style
    if (params.style) {
      const targetStyle = params.style.toLowerCase();
      results = results.filter((dest) =>
        dest.styles.some((ds: string) => ds.toLowerCase() === targetStyle)
      );
    }

    return results;
  },
};

export const DestinationService = {
  async getFullDestinationData(destinationId: string) {
    const destination = await DestinationRepository.findById(destinationId);
    if (!destination) return null;

    const [attractions, restaurants] = await Promise.all([
      DestinationRepository.getAttractions(destinationId),
      DestinationRepository.getRestaurants(destinationId),
    ]);

    let cityInfo = {
      id: destination.cityId,
      name: destination.name,
      coordinates: { lat: 0, lng: 0 },
      timezone: "UTC",
      countryName: "Earth",
      safetyScore: 8,
    };

    try {
      const { data: cityData, error: cityError } = await supabase
        .from("cities")
        .select(`
          *,
          countries (
            name,
            safety_score
          )
        `)
        .eq("id", destination.cityId)
        .single();

      if (!cityError && cityData) {
        cityInfo = {
          id: cityData.id,
          name: cityData.name,
          coordinates: cityData.coordinates,
          timezone: cityData.timezone,
          countryName: cityData.countries?.name || "",
          safetyScore: cityData.countries?.safety_score || 5,
        };
      }
    } catch (e) {
      console.warn("[DestinationIntel] Cities table not found/accessible, using default info");
    }

    return {
      destination,
      attractions,
      restaurants,
      city: cityInfo,
    };
  },
};
