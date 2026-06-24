export enum TravelStyle {
  LUXURY = "LUXURY",
  BOUTIQUE = "BOUTIQUE",
  BUDGET = "BUDGET",
  ADVENTURE = "ADVENTURE",
  BACKPACKING = "BACKPACKING",
  RELAXING = "RELAXING",
  CULTURAL = "CULTURAL",
}

export enum FoodPreference {
  VEGETARIAN = "VEGETARIAN",
  VEGAN = "VEGAN",
  GLUTEN_FREE = "GLUTEN_FREE",
  HALAL = "HALAL",
  KOSHER = "KOSHER",
  NO_RESTRICTIONS = "NO_RESTRICTIONS",
}

export enum AccommodationType {
  HOTEL = "HOTEL",
  HOSTEL = "HOSTEL",
  RESORT = "RESORT",
  VILLA = "VILLA",
  RYOKAN = "RYOKAN",
  APARTMENT = "APARTMENT",
}

export interface TravelerProfile {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth?: string;
  passportNumber?: string;
  nationality?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  preferences: {
    styles: TravelStyle[];
    food: FoodPreference[];
    accommodation: AccommodationType[];
    currency: string;
    maxDailyBudget: number;
  };
  isPro: boolean;
  proExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Destination {
  id: string;
  name: string;
  region: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  timezone: string;
  currency: string;
  bestTimeToVisit: string[];
}

export interface HiddenGem {
  id: string;
  destinationId: string;
  name: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category: string;
  recommendedDurationMinutes: number;
  costEstimate: number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  timeSlot: string; // e.g., "08:00"
  durationMinutes: number;
  costEstimate: number;
  locationName: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category: "sightseeing" | "dining" | "transport" | "accommodation" | "other";
}

export interface DailyItinerary {
  dayNumber: number;
  date?: string;
  theme?: string;
  activities: Activity[];
}

export interface Itinerary {
  id: string;
  tripId: string;
  days: DailyItinerary[];
  version: number;
  isCurrent: boolean;
  createdAt: string;
}

export interface BudgetBreakdown {
  flights: number;
  accommodation: number;
  activities: number;
  dining: number;
  transport: number;
  other: number;
  total: number;
}

export interface BudgetResult {
  breakdown: BudgetBreakdown;
  currency: string;
  exchangeRate?: number;
  isWithinBudget: boolean;
  savingsOpportunities: string[];
}

export interface FeasibilityResult {
  isFeasible: boolean;
  warnings: string[];
  travelTimeOptimized: boolean;
  paceDescription: "relaxed" | "moderate" | "fast-paced";
}

export interface DestinationRecommendation {
  destination: Destination;
  matchScore: number; // 0 to 100
  matchingReasons: string[];
  estimatedCostRange: {
    min: number;
    max: number;
  };
}

export interface DailyExpense {
  id: string;
  date: string;
  amount: number;
  category: keyof Omit<BudgetBreakdown, "total">;
  description: string;
  receiptUrl?: string;
}

export interface TripAnalytics {
  tripId: string;
  totalDistanceKm: number;
  co2OffsetTons: number;
  activitiesCompleted: number;
  budgetUtilizationPercentage: number;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  travelersCount: number;
  status: "planning" | "confirmed" | "completed";
  budgetLimit: number;
  budgetBreakdown: BudgetBreakdown;
  itineraryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "aria";
  content: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}
