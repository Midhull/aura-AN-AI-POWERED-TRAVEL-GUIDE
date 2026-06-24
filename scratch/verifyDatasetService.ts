import { DatasetService } from "../src/services/datasetService";

async function runVerification() {
  console.log("Starting DatasetService verification...");

  // Mock traveler profile
  const traveler_profile = {
    uid: "test-user-999",
    email: "test@example.com",
    displayName: "Test Traveler",
    preferences: {
      styles: ["BUDGET", "ADVENTURE"],
      food: ["VEGETARIAN"],
      accommodation: ["HOSTEL"],
      currency: "USD",
      maxDailyBudget: 100
    }
  };

  // Mock training examples
  const mockTrip1 = {
    traveler_profile,
    destination: "Tokyo, Japan",
    duration: 5,
    budget: 500.00,
    interests: ["temples", "anime"],
    generated_itinerary: { days: [] },
    rating: 5
  };

  const mockTrip2 = {
    traveler_profile,
    destination: "Tokyo, Japan", // Duplicate destination & duration for deduplication test
    duration: 5,
    budget: 550.00,
    interests: ["temples", "anime", "shushi"],
    generated_itinerary: { days: [] },
    rating: 4
  };

  const mockTrip3 = {
    traveler_profile,
    destination: "Paris, France",
    duration: 10,
    budget: 1500.00,
    interests: ["museums", "pastries"],
    generated_itinerary: { days: [] },
    rating: 3
  };

  // Invalid trip for validation test
  const invalidTrip = {
    traveler_profile,
    destination: "", // Empty destination (invalid)
    duration: -3, // Negative duration (invalid)
    budget: -100, // Negative budget (invalid)
    interests: [],
    generated_itinerary: { days: [] },
    rating: 10 // Rating out of bounds (invalid)
  };

  try {
    // 1. Ingest test examples
    console.log("Ingesting test training examples...");
    const res1 = await DatasetService.saveTrainingExample("trip", mockTrip1);
    const res2 = await DatasetService.saveTrainingExample("trip", mockTrip2);
    const res3 = await DatasetService.saveTrainingExample("trip", mockTrip3);
    const resInvalid = await DatasetService.saveTrainingExample("trip", invalidTrip);

    if (!res1 || !res2 || !res3 || !resInvalid) {
      throw new Error("One or more ingestions failed to return an ID.");
    }
    console.log(`Ingested IDs: ${res1.id}, ${res2.id}, ${res3.id}, ${resInvalid.id}`);

    // 2. Add some user edits
    console.log("Adding user edits...");
    await DatasetService.saveUserEdit("trip", res1.id, { action: "changed_hotel", details: "capsule hotel" });

    // 3. Update a rating
    console.log("Updating rating...");
    await DatasetService.saveTripRating("trip", res3.id, 4);

    // 4. Test Export in CSV
    console.log("Exporting to CSV...");
    const csvExport = await DatasetService.exportDataset({
      datasetType: "trip",
      format: "csv"
    });
    console.log("CSV Export Sample (First 200 chars):");
    console.log(csvExport.substring(0, 200) + "...\n");

    // 5. Test Export in JSONL with filters
    console.log("Exporting to JSONL with filters (destination: Paris)...");
    const jsonlExportFiltered = await DatasetService.exportDataset({
      datasetType: "trip",
      format: "jsonl",
      filters: {
        destination: "Paris"
      }
    });
    console.log("JSONL Paris Filter Export:\n", jsonlExportFiltered, "\n");

    // 6. Test Export with validation (excludes invalidTrip)
    console.log("Exporting to JSONL with validation: true...");
    const jsonlExportValidated = await DatasetService.exportDataset({
      datasetType: "trip",
      format: "jsonl",
      validate: true
    });
    const validatedRecordsCount = jsonlExportValidated.split("\n").filter(Boolean).length;
    console.log(`Validated export contains ${validatedRecordsCount} records.\n`);

    // 7. Test Export with deduplication
    console.log("Exporting to JSONL with deduplicate: true...");
    const jsonlExportDeduplicated = await DatasetService.exportDataset({
      datasetType: "trip",
      format: "jsonl",
      deduplicate: true
    });
    const deduplicatedRecordsCount = jsonlExportDeduplicated.split("\n").filter(Boolean).length;
    console.log(`Deduplicated export contains ${deduplicatedRecordsCount} records.\n`);

    // 8. Test Export in Parquet
    console.log("Exporting to Parquet format...");
    const parquetExport = await DatasetService.exportDataset({
      datasetType: "trip",
      format: "parquet"
    });
    console.log("Parquet Export Sample (First 300 chars):");
    console.log(parquetExport.substring(0, 300) + "...\n");

    console.log("DatasetService and Export System verification completed successfully!");
  } catch (error) {
    console.error("Verification failed with error:", error);
  }
}
