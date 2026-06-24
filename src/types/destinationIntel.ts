export interface Country {
  id: string;
  name: string;
  code: string;
  safetyScore: number;
}

export interface City {
  id: string;
  countryId: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone: string;
}

export interface DestinationIntel {
  id: string;
  cityId: string;
  name: string;
  description: string;
  bestSeason: string;
  averageBudget: number;
  travelDifficulty: number;
  familyFriendlyScore: number;
  nightlifeScore: number;
  foodScore: number;
  interests: string[];
  styles: string[];
}

export interface AttractionIntel {
  id: string;
  destinationId: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  difficultyLevel?: number;
}

export interface RestaurantIntel {
  id: string;
  destinationId: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  foodScore: number;
  priceRange: string;
}

export interface TransportOption {
  id: string;
  cityId: string;
  type: string;
  description: string;
}

export interface VisaRequirement {
  id: string;
  countryId: string;
  passportCountry: string;
  requirementType: "free" | "visa_on_arrival" | "required";
  notes?: string;
}

export interface WeatherProfile {
  id: string;
  cityId: string;
  month: number;
  avgTempC: number;
  avgRainfallMm: number;
}
