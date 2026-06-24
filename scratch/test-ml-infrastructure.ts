import { featureEngineeringService, datasetBuilderService, trainingExportService } from "../src/services/mlDatasetInfrastructure";
import type { UserProfile, Trip, Itinerary, Destination, Activity } from "../src/types/travel";

const mockUser: UserProfile = {
  uid: "user-123",
  email: "test@example.com",
  displayName: "Test Traveler",
  preferences: {
    styles: ["LUXURY" as any],
    food: [],
    accommodation: [],
    currency: "USD",
    maxDailyBudget: 500,
  },
  isPro: false,
  createdAt: "1995-05-15T00:00:00Z",
  updatedAt: "2026-06-22T00:00:00Z",
};

const mockTrip: Trip = {
  id: "trip-456",
  userId: "user-123",
  title: "Vacation in Tokyo",
  destination: "Tokyo",
  startDate: "2026-07-01",
  endDate: "2026-07-10",
  durationDays: 9,
  travelersCount: 2,
  status: "planning",
  budgetLimit: 4500,
  budgetBreakdown: {
    flights: 1500,
    accommodation: 1500,
    activities: 500,
    dining: 500,
    transport: 300,
    other: 200,
    total: 4500
  },
  createdAt: "2026-06-22T00:00:00Z",
  updatedAt: "2026-06-22T00:00:00Z",
};

const mockItinerary: Itinerary = {
  id: "itin-789",
  tripId: "trip-456",
  version: 1,
  isCurrent: true,
  createdAt: "2026-06-22T00:00:00Z",
  days: [
    {
      dayNumber: 1,
      activities: [
        {
          id: "act-1",
          title: "Visit temple",
          description: "Sensoji",
          timeSlot: "09:00",
          durationMinutes: 90,
          costEstimate: 0,
          locationName: "Asakusa",
          category: "sightseeing",
        },
        {
          id: "act-2",
          title: "Sushi Lunch",
          description: "Local shop",
          timeSlot: "12:30",
          durationMinutes: 60,
          costEstimate: 45,
          locationName: "Ginza",
          category: "dining",
        }
      ]
    }
  ]
};

const mockDestination: Destination = {
  id: "dest-1",
  name: "Tokyo",
  region: "Kanto",
  country: "Japan",
  coordinates: { lat: 35.6762, lng: 139.6503 },
  description: "Bustling capital of Japan",
  timezone: "Asia/Tokyo",
  currency: "JPY",
  bestTimeToVisit: ["Spring", "Autumn"],
};

const mockActivity: Activity = {
  id: "act-10",
  title: "Robot Show",
  description: "Fun activity",
  timeSlot: "19:00",
  durationMinutes: 120,
  costEstimate: 80,
  locationName: "Shinjuku",
  category: "sightseeing",
};

console.log("--- STARTING ML INFRASTRUCTURE TESTS ---");

// Test Feature Engineering
console.log("\n1. Testing Feature Engineering Service:");
const tripFeatures = featureEngineeringService.engineerTripFeatures(mockTrip, mockUser, mockItinerary);
console.log("Trip Features:", tripFeatures);
if (tripFeatures.isLuxuryStyle !== 1 || tripFeatures.isBudgetStyle !== 0) {
  console.error("FAIL: Trip style feature engineering is incorrect!");
} else {
  console.log("PASS: Trip style feature engineering.");
}

const budgetFeatures = featureEngineeringService.engineerBudgetFeatures(mockTrip);
console.log("Budget Features:", budgetFeatures);
if (budgetFeatures.estimatedFlights !== 1500) {
  console.error("FAIL: Budget feature engineering estimated flights value is wrong!");
} else {
  console.log("PASS: Budget feature engineering.");
}

const destFeatures = featureEngineeringService.engineerDestinationFeatures(mockUser, mockDestination, 95);
console.log("Destination Features:", destFeatures);
if (destFeatures.matchScore !== 95) {
  console.error("FAIL: Destination matchScore is wrong!");
} else {
  console.log("PASS: Destination feature engineering.");
}

const actFeatures = featureEngineeringService.engineerActivityFeatures(mockUser, mockActivity, 85);
console.log("Activity Features:", actFeatures);
if (actFeatures.costEstimate !== 80) {
  console.error("FAIL: Activity features costEstimate is wrong!");
} else {
  console.log("PASS: Activity feature engineering.");
}

// Test Validation & Cleaning
console.log("\n2. Testing Dataset Builder Validation and Cleaning:");
const isTripValid = datasetBuilderService.validateAndCleanTrip({
  userProfile: mockUser,
  trip: mockTrip,
  itinerary: mockItinerary,
  rating: 5,
});
console.log("Is Trip Valid:", isTripValid);
if (!isTripValid) {
  console.error("FAIL: Valid trip failed validation!");
} else {
  console.log("PASS: Valid trip validation.");
}

const isTripInvalidDuration = datasetBuilderService.validateAndCleanTrip({
  userProfile: mockUser,
  trip: { ...mockTrip, durationDays: 200 },
  itinerary: mockItinerary,
  rating: 5,
});
console.log("Is Outlier Duration Rejected:", !isTripInvalidDuration);
if (isTripInvalidDuration) {
  console.error("FAIL: Invalid trip duration (outlier) was not rejected!");
} else {
  console.log("PASS: Outlier trip duration rejected successfully.");
}

const isInvalidRatingRejected = datasetBuilderService.validateAndCleanTrip({
  userProfile: mockUser,
  trip: mockTrip,
  itinerary: mockItinerary,
  rating: 6,
});
console.log("Is Out-of-bounds Rating Rejected:", !isInvalidRatingRejected);
if (isInvalidRatingRejected) {
  console.error("FAIL: Out-of-bounds rating 6 was not rejected!");
} else {
  console.log("PASS: Out-of-bounds rating rejected successfully.");
}

console.log("\n--- ML INFRASTRUCTURE TESTS COMPLETED ---");
