import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Manually parse .env.local to get Supabase credentials in standalone script environment
const envPath = path.resolve(process.cwd(), ".env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith("#")) continue;
    
    const equalIdx = cleanLine.indexOf("=");
    if (equalIdx > 0) {
      const key = cleanLine.substring(0, equalIdx).trim();
      const val = cleanLine.substring(equalIdx + 1).trim();
      if (key === "VITE_SUPABASE_URL") supabaseUrl = val;
      if (key === "VITE_SUPABASE_ANON_KEY") supabaseAnonKey = val;
    }
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Could not load Supabase environment variables from .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mock data options
const DESTINATIONS = [
  "Tokyo, Japan", "Paris, France", "New York, USA", "Rome, Italy", 
  "London, UK", "Sydney, Australia", "Cape Town, South Africa", 
  "Rio de Janeiro, Brazil", "Reykjavik, Iceland", "Bangkok, Thailand",
  "Kyoto, Japan", "Barcelona, Spain", "Cairo, Egypt", "Machu Picchu, Peru",
  "Amsterdam, Netherlands"
];

const INTERESTS = [
  "culture", "food", "adventure", "history", "nature", 
  "shopping", "art", "beach", "nightlife", "wellness"
];

const STYLES = ["LUXURY", "BOUTIQUE", "BUDGET", "ADVENTURE", "BACKPACKING", "RELAXING"];

const FOOD_PREFERENCES = ["VEGETARIAN", "VEGAN", "GLUTEN_FREE", "HALAL", "NO_RESTRICTIONS"];

const ACCOMMODATIONS = ["HOTEL", "HOSTEL", "RESORT", "VILLA", "RYOKAN"];

// Helpers to generate random choices
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomSubarray<T>(arr: T[], maxItems = 3): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * maxItems) + 1);
}

function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Rule-based daily activities generator based on interests and day
function generateActivitiesForDay(
  dayNumber: number, 
  interests: string[], 
  destination: string,
  style: string
): any[] {
  const activities: any[] = [];
  const primaryInterest = getRandomElement(interests);

  // Activity 1: Morning Sightseeing
  let cost1 = style === "LUXURY" ? getRandomNumber(80, 200) : style === "BUDGET" ? 0 : getRandomNumber(15, 50);
  activities.push({
    id: `act-synth-morn-${dayNumber}-${crypto.randomUUID().slice(0, 8)}`,
    title: `Morning ${primaryInterest} Tour of ${destination.split(',')[0]}`,
    description: `A guided tour exploring local spots highlighting the region's ${primaryInterest}.`,
    timeSlot: "09:00",
    durationMinutes: 180,
    costEstimate: cost1,
    locationName: `${destination.split(',')[0]} Central`,
    category: "sightseeing"
  });

  // Activity 2: Lunch/Dining
  let cost2 = style === "LUXURY" ? getRandomNumber(60, 150) : style === "BUDGET" ? getRandomNumber(8, 20) : getRandomNumber(25, 60);
  activities.push({
    id: `act-synth-lunch-${dayNumber}-${crypto.randomUUID().slice(0, 8)}`,
    title: `Local ${getRandomElement(interests)} Themed Lunch`,
    description: `Savoring regional specialties and locally sourced gourmet delicacies.`,
    timeSlot: "13:00",
    durationMinutes: 90,
    costEstimate: cost2,
    locationName: `Gourmet Quarter`,
    category: "dining"
  });

  // Activity 3: Afternoon/Evening activity
  const secondaryInterest = interests[1] || primaryInterest;
  let cost3 = style === "LUXURY" ? getRandomNumber(100, 300) : style === "BUDGET" ? 0 : getRandomNumber(20, 80);
  activities.push({
    id: `act-synth-aft-${dayNumber}-${crypto.randomUUID().slice(0, 8)}`,
    title: `Afternoon ${secondaryInterest} Workshop`,
    description: `An interactive, hands-on workshop tailored for travelers interested in ${secondaryInterest}.`,
    timeSlot: "15:30",
    durationMinutes: 120,
    costEstimate: cost3,
    locationName: `Artisan District`,
    category: secondaryInterest === "nature" || secondaryInterest === "adventure" ? "sightseeing" : "other"
  });

  return activities;
}

// Generate a single synthetic record
function generateSyntheticRecord(index: number): any {
  const destination = getRandomElement(DESTINATIONS);
  const duration = getRandomElement([3, 5, 7, 10, 14]);
  const style = getRandomElement(STYLES);
  
  // Calculate budget limit based on duration and style
  const dailyBudget = style === "LUXURY" ? getRandomNumber(400, 1000) : style === "BUDGET" ? getRandomNumber(30, 80) : getRandomNumber(120, 350);
  const budget = dailyBudget * duration;
  
  const interests = getRandomSubarray(INTERESTS, 3);
  const travelersCount = getRandomNumber(1, 5);

  const traveler_profile = {
    uid: `synthetic-user-${getRandomNumber(1000, 9999)}`,
    email: `synthetic.traveler.${index}@example.com`,
    displayName: `Synthetic Traveler ${index}`,
    preferences: {
      styles: [style],
      food: [getRandomElement(FOOD_PREFERENCES)],
      accommodation: [getRandomElement(ACCOMMODATIONS)],
      currency: "USD",
      maxDailyBudget: dailyBudget
    }
  };

  // Generate synthetic itinerary days
  const days = Array.from({ length: duration }, (_, i) => {
    const dayNumber = i + 1;
    return {
      dayNumber,
      theme: `${interests.join(" & ")} exploration`,
      activities: generateActivitiesForDay(dayNumber, interests, destination, style)
    };
  });

  const generated_itinerary = {
    days,
    version: 1,
    isCurrent: true
  };

  const rating = getRandomNumber(3, 5);

  return {
    id: crypto.randomUUID(),
    traveler_profile,
    destination,
    duration,
    budget,
    interests,
    generated_itinerary,
    user_edits: [],
    rating,
    created_at: new Date(Date.now() - getRandomNumber(0, 30) * 24 * 60 * 60 * 1000).toISOString(),
    data_source: "synthetic"
  };
}

async function startGeneration() {
  console.log("--------------------------------------------------");
  console.log("Starting Synthetic Travel Dataset Generator...");
  console.log("Generating 1050 records to write to ml_trip_dataset...");

  const records: any[] = [];
  for (let i = 1; i <= 1050; i++) {
    records.push(generateSyntheticRecord(i));
  }

  // Insert in batches of 350 to prevent payload size limits
  const batchSize = 350;
  console.log(`Dividing 1050 records into ${records.length / batchSize} batches...`);

  try {
    for (let j = 0; j < records.length; j += batchSize) {
      const batch = records.slice(j, j + batchSize);
      console.log(`Inserting batch ${j / batchSize + 1} (${batch.length} records)...`);
      
      const { error } = await supabase
        .from("ml_trip_dataset")
        .insert(batch);

      if (error) {
        throw error;
      }
    }
    console.log("Successfully inserted 1050 synthetic training examples!");
    console.log("--------------------------------------------------");
  } catch (err) {
    console.error("Insertion failed with error:", err);
    process.exit(1);
  }
}

startGeneration();
