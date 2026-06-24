export type MLDatasetType = 'trip' | 'budget' | 'activity';

export interface MLTrainingExampleInput {
  traveler_profile: any;
  destination: string;
  duration: number;
  budget: number;
  interests: any;
  generated_itinerary: any;
  rating?: number;
  data_source?: string; // 'user' | 'synthetic'
}

export interface MLTrainingExampleRecord {
  id: string;
  traveler_profile: any;
  destination: string;
  duration: number;
  budget: number;
  interests: any;
  generated_itinerary: any;
  user_edits: any[];
  rating?: number;
  created_at: string;
  data_source: string; // 'user' | 'synthetic'
}

export interface ExportFilterOptions {
  startDate?: string;
  endDate?: string;
  minRating?: number;
  maxRating?: number;
  destination?: string;
  minDuration?: number;
  maxDuration?: number;
  dataSource?: string; // Filter by 'user' or 'synthetic'
}

export interface ExportOptions {
  datasetType: MLDatasetType;
  format: 'csv' | 'jsonl' | 'parquet';
  filters?: ExportFilterOptions;
  deduplicate?: boolean;
  deduplicateKey?: string; // e.g., 'traveler_profile.uid' or 'destination'
  validate?: boolean; // Whether to run validation checks on records before export
}
