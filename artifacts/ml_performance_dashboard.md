# ML Model Accuracy Dashboard

This dashboard tracks and compares shadow-mode ML model predictions against deterministic rules and actual user behavior across 7-day, 30-day, and 90-day windows.

## Operational Status

### active alerts 🚨

> [CAUTION]
> **Budget Prediction Model Performance Degraded (MAE)**
> - **Metric**: MAE
> - **Baseline**: $44.80 (90-day)
> - **Current (7-day)**: $53.20 (7-day)
> - **Difference**: +18.8% (Degraded)
> - **Urgency**: Immediate training dataset refresh or feature review recommended.

## Model Comparison Metrics

### 1. Budget Model Performance
Tracks budget estimates against actual expenditures. Lower error is better.

| Timeframe | Sample Count | ML Model MAE | Rule Engine MAE | ML Model RMSE | Rule Engine RMSE | ML Model MAPE | Rule Engine MAPE |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **7 Days** | 18 | $53.20 | $76.50 | $74.30 | $97.20 | 10.4% | 14.1% |
| **30 Days** | 92 | $45.10 | $78.20 | $62.50 | $99.10 | 8.3% | 14.4% |
| **90 Days** | 240 | $44.80 | $78.50 | $62.10 | $99.40 | 8.2% | 14.5% |

---

### 2. Destination Ranking Model Performance
Evaluates rankings against user selected destination. Higher metric value is better.

| Timeframe | Sample Count | ML Model Precision@1 | Rule Engine Precision@1 | ML Model NDCG@2 | Rule Engine NDCG@2 | ML Model MAP | Rule Engine MAP |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **7 Days** | 22 | 0.73 | 0.60 | 0.86 | 0.78 | 0.81 | 0.73 |
| **30 Days** | 115 | 0.75 | 0.61 | 0.89 | 0.78 | 0.83 | 0.73 |
| **90 Days** | 310 | 0.74 | 0.62 | 0.88 | 0.79 | 0.82 | 0.74 |

---

### 3. Activity Recommendation Model Performance
Evaluates candidate rankings against selected activities. Higher metric value is better.

| Timeframe | Sample Count | ML Model Precision@2 | Rule Engine Precision@2 | ML Model Recall@2 | Rule Engine Recall@2 | ML Model NDCG@2 | Rule Engine NDCG@2 | ML Model MAP | Rule Engine MAP |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **7 Days** | 35 | 0.81 | 0.71 | 0.75 | 0.65 | 0.82 | 0.71 | 0.80 | 0.70 |
| **30 Days** | 165 | 0.83 | 0.72 | 0.76 | 0.65 | 0.84 | 0.71 | 0.82 | 0.70 |
| **90 Days** | 480 | 0.84 | 0.72 | 0.77 | 0.66 | 0.85 | 0.72 | 0.83 | 0.71 |

---

## Active Model Versions

| Model | Latest Active Version | Training Dataset Version | Last Evaluated | Status |
| :--- | :--- | :--- | :--- | :--- |
| **XGBoost Budget Predictor** | `v1.0.2` | `ml_budget_dataset.csv` | 2026-06-22 15:34:34 UTC | Shadow Mode |
| **LightGBM Destination Ranker** | `v1.0.0` | `ml_trip_dataset.csv` | 2026-06-22 15:34:34 UTC | Shadow Mode |
| **LightGBM Activity Recommender** | `v1.0.0` | `activity_training_dataset` | 2026-06-22 15:34:34 UTC | Shadow Mode |

