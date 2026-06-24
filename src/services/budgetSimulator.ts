export type SimulationFlightClass = "Economy" | "PremiumEconomy" | "Business" | "FirstClass";
export type SimulationTransportType = "Public" | "PrivateSedan" | "PremiumSUV";
export type SimulationActivityIntensity = "Low" | "Medium" | "High";

export interface SimulationInput {
  hotelStars: number; // 1 to 5
  durationDays: number;
  flightClass: SimulationFlightClass;
  transportType: SimulationTransportType;
  activityIntensity: SimulationActivityIntensity;
  travelersCount: number;
}

export interface SimulationResult {
  newTotalCostINR: number;
  costDifferenceINR: number;
  breakdown: {
    flights: number;
    accommodation: number;
    activities: number;
    transport: number;
    other: number;
  };
  impactAnalysis: string[];
}

export const budgetSimulator = {
  simulate(
    previousTotalINR: number,
    adjustments: SimulationInput,
    destination: string
  ): SimulationResult {
    const { hotelStars, durationDays, flightClass, transportType, activityIntensity, travelersCount } = adjustments;
    const impactAnalysis: string[] = [];

    // Destination baseline costs
    const isExpensive = ["japan", "tokyo", "switzerland", "alps", "iceland"].some(kw => 
      destination.toLowerCase().includes(kw)
    );
    const destMult = isExpensive ? 1.5 : 0.8;

    // 1. Calculate flights based on class
    let flightCostPerHead = 30000; // Base Economy in INR
    if (flightClass === "PremiumEconomy") {
      flightCostPerHead = 45000;
      impactAnalysis.push(`Upgraded Flight class to Premium Economy adds ₹15,000 per head.`);
    } else if (flightClass === "Business") {
      flightCostPerHead = 120000;
      impactAnalysis.push("Upgraded Flight class to Business Class adds ₹90,000 per head.");
    } else if (flightClass === "FirstClass") {
      flightCostPerHead = 250000;
      impactAnalysis.push("Upgraded Flight class to First Class adds ₹220,000 per head.");
    }
    const flights = flightCostPerHead * travelersCount * destMult;

    // 2. Calculate accommodation based on stars
    let hotelDailyRate = 2000; // Base 1 Star in INR
    if (hotelStars === 3) {
      hotelDailyRate = 5000;
      impactAnalysis.push("Upgraded Hotel to 3-Star Mid-Range adds ₹3,000 per day.");
    } else if (hotelStars === 4) {
      hotelDailyRate = 9000;
      impactAnalysis.push("Upgraded Hotel to 4-Star Premium adds ₹7,000 per day.");
    } else if (hotelStars === 5) {
      hotelDailyRate = 22000;
      impactAnalysis.push("Upgraded Hotel to 5-Star Luxury adds ₹20,000 per day.");
    }
    const accommodation = hotelDailyRate * durationDays * destMult * Math.ceil(travelersCount / 2);

    // 3. Calculate activities based on intensity
    let activityDailyRate = 1000; // Low in INR
    if (activityIntensity === "Medium") {
      activityDailyRate = 3000;
      impactAnalysis.push("Increased Activity Intensity to Medium adds ₹2,000 per head per day.");
    } else if (activityIntensity === "High") {
      activityDailyRate = 7000;
      impactAnalysis.push("Increased Activity Intensity to High (excursions/tickets) adds ₹6,000 per head per day.");
    }
    const activities = activityDailyRate * durationDays * travelersCount * destMult;

    // 4. Calculate transport based on type
    let transportDailyRate = 500; // Public transit in INR
    if (transportType === "PrivateSedan") {
      transportDailyRate = 3500;
      impactAnalysis.push("Switched Transport type to Private AC Sedan adds ₹3,000 per day.");
    } else if (transportType === "PremiumSUV") {
      transportDailyRate = 7500;
      impactAnalysis.push("Switched Transport type to Premium SUV chauffeur adds ₹7,000 per day.");
    }
    const transport = transportDailyRate * durationDays * destMult;

    // 5. Other buffer variables
    const other = Math.round((accommodation + activities + transport) * 0.1);

    const newTotalCostINR = Math.round(flights + accommodation + activities + transport + other);
    const costDifferenceINR = newTotalCostINR - previousTotalINR;

    return {
      newTotalCostINR,
      costDifferenceINR,
      breakdown: {
        flights: Math.round(flights),
        accommodation: Math.round(accommodation),
        activities: Math.round(activities),
        transport: Math.round(transport),
        other,
      },
      impactAnalysis,
    };
  },
};
