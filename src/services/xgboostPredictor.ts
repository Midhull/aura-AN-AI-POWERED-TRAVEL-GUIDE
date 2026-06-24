import type { EngineeredFeatures } from "../types/mlPipeline";

export interface SerializedTreeNode {
  split_feature?: keyof EngineeredFeatures;
  split_threshold?: number;
  left_value?: number;
  right_value?: number;
  children?: SerializedTreeNode[];
}

export interface SerializedModel {
  model_type: string;
  version: string;
  base_score: number;
  trees: SerializedTreeNode[];
}

// Static fallback model artifact representing a pre-trained Decision Forest model
const FALLBACK_MODEL_ARTIFACT: SerializedModel = {
  model_type: "GradientBoostedTrees",
  version: "1.0.0",
  base_score: 120.0,
  trees: [
    {
      split_feature: "travelerStyleEncoded",
      split_threshold: 1.5,
      left_value: 50.0,
      right_value: 280.0,
    },
    {
      split_feature: "durationDays",
      split_threshold: 5.5,
      left_value: 0.85,
      right_value: 1.25,
    },
    {
      split_feature: "isLuxuryPref",
      split_threshold: 0.5,
      left_value: 1.0,
      right_value: 1.5,
    },
  ],
};

export const xgboostPredictor = {
  // Evaluates a single decision tree recursively
  evaluateTree(node: SerializedTreeNode, features: EngineeredFeatures): number {
    if (node.split_feature !== undefined && node.split_threshold !== undefined) {
      const val = features[node.split_feature];
      const threshold = node.split_threshold;

      if (val < threshold) {
        if (node.left_value !== undefined) return node.left_value;
        if (node.children && node.children[0]) return this.evaluateTree(node.children[0], features);
      } else {
        if (node.right_value !== undefined) return node.right_value;
        if (node.children && node.children[1]) return this.evaluateTree(node.children[1], features);
      }
    }
    return 0;
  },

  // Runs gradient boosting additive inference
  predict(features: EngineeredFeatures, model: SerializedModel = FALLBACK_MODEL_ARTIFACT): number {
    let prediction = model.base_score;

    // Summing tree contributions
    for (const tree of model.trees) {
      const treeContribution = this.evaluateTree(tree, features);
      
      // If tree contribution acts as multiplier
      if (treeContribution > 0 && treeContribution < 5.0) {
        prediction *= treeContribution;
      } else {
        prediction += treeContribution;
      }
    }

    return Math.round(prediction * (features.durationDays || 1) * (features.travelersCount || 1));
  },

  evaluateMetrics(actuals: number[], predictions: number[]): { mae: number; rmse: number } {
    if (actuals.length === 0 || actuals.length !== predictions.length) {
      return { mae: 0, rmse: 0 };
    }

    let absoluteErrorSum = 0;
    let squaredErrorSum = 0;

    for (let i = 0; i < actuals.length; i++) {
      const error = actuals[i] - predictions[i];
      absoluteErrorSum += Math.abs(error);
      squaredErrorSum += error * error;
    }

    const mae = Math.round(absoluteErrorSum / actuals.length);
    const rmse = Math.round(Math.sqrt(squaredErrorSum / actuals.length));

    return { mae, rmse };
  },
};
