import { TravelStyle } from "../types/travel";

export interface DestinationRecommendationInput {
  maxBudget: number;
  preferredStyle: TravelStyle;
  interests: string[];
}

export interface RecommendationResult {
  id: string;
  name: string;
  region: string;
  country: string;
  matchScore: number; // 0 to 100
  estimatedBudget: {
    min: number;
    max: number;
  };
  bestSeason: string;
  difficultyScore: number; // 1 to 5
  highlights: string[];
}

interface CatalogDestination {
  id: string;
  name: string;
  region: string;
  country: string;
  styles: TravelStyle[];
  interests: string[];
  budgetRange: { min: number; max: number };
  bestSeason: string;
  difficultyScore: number;
  highlights: string[];
}

const DESTINATION_CATALOG: CatalogDestination[] = [
  {
    id: "dest-bali",
    name: "Bali",
    region: "Southeast Asia",
    country: "Indonesia",
    styles: [TravelStyle.ADVENTURE, TravelStyle.RELAXING, TravelStyle.BUDGET],
    interests: ["beaches", "nature", "wellness", "diving", "culture"],
    budgetRange: { min: 800, max: 2000 },
    bestSeason: "May to September (Dry season)",
    difficultyScore: 2,
    highlights: ["Ubud Sacred Monkey Forest", "Uluwatu Sunset Temple", "Nusa Penida Cliffs"],
  },
  {
    id: "dest-kyoto",
    name: "Kyoto",
    region: "East Asia",
    country: "Japan",
    styles: [TravelStyle.CULTURAL, TravelStyle.BOUTIQUE, TravelStyle.RELAXING],
    interests: ["history", "food", "temples", "shopping", "gardens"],
    budgetRange: { min: 1500, max: 3500 },
    bestSeason: "April to May (Cherry blossom) & October to November (Autumn leaves)",
    difficultyScore: 1,
    highlights: ["Fushimi Inari Shrine Gates", "Arashiyama Bamboo Grove", "Kinkaku-ji (Golden Pavilion)"],
  },
  {
    id: "dest-swiss-alps",
    name: "Swiss Alps",
    region: "Europe",
    country: "Switzerland",
    styles: [TravelStyle.LUXURY, TravelStyle.ADVENTURE],
    interests: ["nature", "hiking", "skiing", "mountains", "scenery"],
    budgetRange: { min: 2500, max: 6000 },
    bestSeason: "December to March (Winter sports) & June to August (Summer hiking)",
    difficultyScore: 3,
    highlights: ["Matterhorn viewpoints", "Jungfraujoch Sphinx Observatory", "Lake Geneva vineyards"],
  },
  {
    id: "dest-iceland",
    name: "Reykjavik & Ring Road",
    region: "Nordic",
    country: "Iceland",
    styles: [TravelStyle.ADVENTURE, TravelStyle.BACKPACKING],
    interests: ["nature", "roadtrips", "aurora", "volcanoes", "hotsprings"],
    budgetRange: { min: 1800, max: 4000 },
    bestSeason: "September to March (Northern Lights) & June to August (Midnight Sun)",
    difficultyScore: 4,
    highlights: ["The Golden Circle waterfalls", "Blue Lagoon geothermal spa", "Jökulsárlón Glacier Lagoon"],
  },
  {
    id: "dest-santorini",
    name: "Santorini",
    region: "Mediterranean",
    country: "Greece",
    styles: [TravelStyle.LUXURY, TravelStyle.RELAXING, TravelStyle.BOUTIQUE],
    interests: ["beaches", "sunsets", "views", "history", "wine"],
    budgetRange: { min: 2000, max: 5000 },
    bestSeason: "May to October",
    difficultyScore: 2,
    highlights: ["Oia sunset viewpoints", "Akrotiri prehistoric town archeology", "Red Beach volcanic sands"],
  },
];

export const recommendationEngine = {
  recommend(input: DestinationRecommendationInput): RecommendationResult[] {
    const { maxBudget, preferredStyle, interests } = input;
    const normalizedInterests = interests.map((i) => i.toLowerCase().trim());

    const recommendations: RecommendationResult[] = [];

    for (const dest of DESTINATION_CATALOG) {
      // 1. Calculate match score base
      let score = 50;

      // Style compatibility: +20 points
      if (dest.styles.includes(preferredStyle)) {
        score += 20;
      }

      // Interest overlap: +8 points per matching interest (up to 24 points max)
      const matchingInterests = dest.interests.filter((interest) =>
        normalizedInterests.some((userInt) => userInt.includes(interest) || interest.includes(userInt))
      );
      score += Math.min(24, matchingInterests.length * 8);

      // Budget check: Deduct points if budget is tight
      if (maxBudget > 0) {
        if (maxBudget < dest.budgetRange.min) {
          // Exceeds minimal cost boundaries: deduct heavily
          score -= 35;
        } else if (maxBudget >= dest.budgetRange.min && maxBudget <= dest.budgetRange.max) {
          // Fits within budget range: slight bonus
          score += 6;
        } else {
          // Well over maximum cost constraints: perfect budget fit
          score += 10;
        }
      }

      // Clamp score between 0 and 100
      const finalScore = Math.min(100, Math.max(0, score));

      recommendations.push({
        id: dest.id,
        name: dest.name,
        region: dest.region,
        country: dest.country,
        matchScore: finalScore,
        estimatedBudget: dest.budgetRange,
        bestSeason: dest.bestSeason,
        difficultyScore: dest.difficultyScore,
        highlights: dest.highlights,
      });
    }

    // Sort by match score descending
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  },
};
