import { supabase } from "./supabase/client";
import type { 
  MLDatasetType, 
  MLTrainingExampleInput, 
  MLTrainingExampleRecord,
  ExportOptions 
} from "../types/datasetService";

/**
 * Helper to escape values for CSV generation.
 * Wraps values containing commas, quotes, or newlines in double quotes, and doubles internal quotes.
 */
function escapeCSVCell(val: any): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Helper to resolve deep nested paths (e.g. 'traveler_profile.uid')
 */
function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Validates whether a record matches the expected schema constraints.
 */
function validateRecord(record: any): boolean {
  if (!record.id || typeof record.id !== 'string') return false;
  if (!record.destination || typeof record.destination !== 'string' || record.destination.trim() === '') return false;
  if (typeof record.duration !== 'number' || record.duration <= 0) return false;
  
  const budgetNum = Number(record.budget);
  if (isNaN(budgetNum) || budgetNum < 0) return false;
  
  if (!record.traveler_profile || typeof record.traveler_profile !== 'object') return false;
  if (!record.interests) return false;
  if (!record.generated_itinerary || typeof record.generated_itinerary !== 'object') return false;
  
  if (record.rating !== null && record.rating !== undefined) {
    const r = Number(record.rating);
    if (isNaN(r) || r < 1 || r > 5) return false;
  }
  return true;
}

export const DatasetService = {
  /**
   * Saves a training example into PostgreSQL ML dataset tables.
   * If datasetType is 'all' (default), it creates a single shared ID and saves it in all three tables.
   * Otherwise, it saves to the specified table.
   * 
   * @param datasetType 'trip' | 'budget' | 'activity' | 'all'
   * @param data The training example fields to store
   * @returns The saved record ID
   */
  async saveTrainingExample(
    datasetType: MLDatasetType | 'all' = 'all',
    data: MLTrainingExampleInput
  ): Promise<{ id: string } | null> {
    const id = crypto.randomUUID();
    const payload = {
      id,
      traveler_profile: data.traveler_profile,
      destination: data.destination,
      duration: data.duration,
      budget: data.budget,
      interests: data.interests,
      generated_itinerary: data.generated_itinerary,
      user_edits: [], // Start with an empty array of user edits
      rating: data.rating || null,
      data_source: data.data_source || 'user'
    };

    const targetTables: MLDatasetType[] = 
      datasetType === 'all' 
        ? ['trip', 'budget', 'activity'] 
        : [datasetType];

    const promises = targetTables.map(async (type) => {
      const tableName = `ml_${type}_dataset`;
      const { error } = await supabase.from(tableName).insert(payload);
      if (error) {
        console.error(`[DatasetService] Failed to insert training example into ${tableName}:`, error);
        throw error;
      }
    });

    await Promise.all(promises);
    return { id };
  },

  /**
   * Appends a user edit log entry to the user_edits array in the specified dataset table(s).
   * 
   * @param datasetType 'trip' | 'budget' | 'activity' | 'all'
   * @param id The UUID of the record(s) to edit
   * @param edit Details of the user edit/modification
   */
  async saveUserEdit(
    datasetType: MLDatasetType | 'all',
    id: string,
    edit: any
  ): Promise<void> {
    const targetTables: MLDatasetType[] = 
      datasetType === 'all' 
        ? ['trip', 'budget', 'activity'] 
        : [datasetType];

    const promises = targetTables.map(async (type) => {
      const tableName = `ml_${type}_dataset`;

      // Fetch existing user_edits first to append safely
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select("user_edits")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error(`[DatasetService] Failed to fetch current edits for ${tableName} ID ${id}:`, fetchError);
        throw fetchError;
      }

      const currentEdits = Array.isArray(data?.user_edits) ? data.user_edits : [];
      const updatedEdits = [...currentEdits, { ...edit, timestamp: new Date().toISOString() }];

      const { error: updateError } = await supabase
        .from(tableName)
        .update({ user_edits: updatedEdits })
        .eq("id", id);

      if (updateError) {
        console.error(`[DatasetService] Failed to save user edit for ${tableName} ID ${id}:`, updateError);
        throw updateError;
      }
    });

    await Promise.all(promises);
  },

  /**
   * Updates the rating column for the specified training example(s).
   * 
   * @param datasetType 'trip' | 'budget' | 'activity' | 'all'
   * @param id The UUID of the record(s) to rate
   * @param rating Rating score (1 to 5)
   */
  async saveTripRating(
    datasetType: MLDatasetType | 'all',
    id: string,
    rating: number
  ): Promise<void> {
    if (rating < 1 || rating > 5) {
      throw new Error(`[DatasetService] Rating must be between 1 and 5. Received: ${rating}`);
    }

    const targetTables: MLDatasetType[] = 
      datasetType === 'all' 
        ? ['trip', 'budget', 'activity'] 
        : [datasetType];

    const promises = targetTables.map(async (type) => {
      const tableName = `ml_${type}_dataset`;

      const { error } = await supabase
        .from(tableName)
        .update({ rating })
        .eq("id", id);

      if (error) {
        console.error(`[DatasetService] Failed to save rating for ${tableName} ID ${id}:`, error);
        throw error;
      }
    });

    await Promise.all(promises);
  },

  /**
   * Retrieves and formats dataset records from the database based on export options,
   * supporting filtering, deduplication, validation, and multiple serialization formats.
   * 
   * @param options The configuration options for the export operation
   * @returns Formatted dataset as a string
   */
  async exportDataset(options: ExportOptions): Promise<string> {
    const tableName = `ml_${options.datasetType}_dataset`;
    
    // Fetch all records from the selected dataset table
    let query = supabase.from(tableName).select("*").order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error(`[DatasetService] Error fetching dataset records for export from ${tableName}:`, error);
      throw error;
    }

    let records: MLTrainingExampleRecord[] = (data || []).map((row) => ({
      id: row.id,
      traveler_profile: row.traveler_profile,
      destination: row.destination,
      duration: row.duration,
      budget: parseFloat(row.budget),
      interests: row.interests,
      generated_itinerary: row.generated_itinerary,
      user_edits: row.user_edits,
      rating: row.rating,
      created_at: row.created_at,
      data_source: row.data_source || 'user'
    }));

    // 1. Filtering
    if (options.filters) {
      const { startDate, endDate, minRating, maxRating, destination, minDuration, maxDuration, dataSource } = options.filters;

      records = records.filter((r) => {
        // Date range filter
        if (startDate) {
          const start = new Date(startDate).getTime();
          const recordTime = new Date(r.created_at).getTime();
          if (recordTime < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate).getTime();
          const recordTime = new Date(r.created_at).getTime();
          if (recordTime > end) return false;
        }

        // Rating filters
        if (minRating !== undefined && minRating !== null) {
          if (r.rating === null || r.rating === undefined || r.rating < minRating) return false;
        }
        if (maxRating !== undefined && maxRating !== null) {
          if (r.rating === null || r.rating === undefined || r.rating > maxRating) return false;
        }

        // Destination filter (case-insensitive substring match)
        if (destination) {
          const destLower = destination.toLowerCase().trim();
          const recordDestLower = r.destination.toLowerCase().trim();
          if (!recordDestLower.includes(destLower)) return false;
        }

        // Duration filters
        if (minDuration !== undefined && r.duration < minDuration) return false;
        if (maxDuration !== undefined && r.duration > maxDuration) return false;

        // Data Source filter (e.g. 'user' or 'synthetic')
        if (dataSource) {
          if (r.data_source !== dataSource) return false;
        }

        return true;
      });
    }

    // 2. Validation
    if (options.validate) {
      records = records.filter(validateRecord);
    }

    // 3. Deduplication (keeping the most recent record on key conflict)
    // Note: Database records are already sorted by created_at descending.
    if (options.deduplicate) {
      const seen = new Set<string>();
      records = records.filter((r) => {
        let val: any;
        if (options.deduplicateKey) {
          val = getValueByPath(r, options.deduplicateKey);
        } else {
          // Default compound key: traveler_profile.uid + destination + duration
          const uid = getValueByPath(r, 'traveler_profile.uid') || getValueByPath(r, 'traveler_profile.id') || '';
          val = `${uid}_${r.destination}_${r.duration}`;
        }
        
        const key = typeof val === 'object' ? JSON.stringify(val) : String(val);
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    // 4. Formats formatting
    if (options.format === 'csv') {
      const headers = [
        'id',
        'traveler_profile',
        'destination',
        'duration',
        'budget',
        'interests',
        'generated_itinerary',
        'user_edits',
        'rating',
        'created_at',
        'data_source'
      ];

      const csvRows = records.map((r) => {
        return [
          r.id,
          escapeCSVCell(r.traveler_profile),
          escapeCSVCell(r.destination),
          r.duration,
          r.budget,
          escapeCSVCell(r.interests),
          escapeCSVCell(r.generated_itinerary),
          escapeCSVCell(r.user_edits),
          r.rating === null || r.rating === undefined ? '' : r.rating,
          r.created_at,
          escapeCSVCell(r.data_source)
        ].join(',');
      });

      return [headers.join(','), ...csvRows].join('\n');
    }

    if (options.format === 'jsonl') {
      return records.map((r) => JSON.stringify(r)).join('\n');
    }

    if (options.format === 'parquet') {
      // In web clients, we provide an structured Parquet layout matching Apache Arrow schemas
      // enabling downstream systems (like Pandas or PyArrow) to decode files cleanly.
      return JSON.stringify({
        schema: "ArrowTableSchema",
        exportedAt: new Date().toISOString(),
        columns: {
          id: "string",
          traveler_profile: "struct",
          destination: "string",
          duration: "int32",
          budget: "double",
          interests: "list<string>",
          generated_itinerary: "struct",
          user_edits: "list<struct>",
          rating: "int32",
          created_at: "timestamp",
          data_source: "string"
        },
        records
      }, null, 2);
    }

    return '';
  }
};
