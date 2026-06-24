# Python script to train an XGBoost regressor on exported learning/budget datasets
# and serialize the model to a JSON tree model for TypeScript inference.
import json
import numpy as np
try:
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
except ImportError:
    # Fallback placeholders if python packages are not installed in the workspace environment
    xgb = None

def train_and_export_model(csv_path, export_json_path):
    if xgb is None:
        print("XGBoost/scikit-learn not installed. Generating dummy serialized tree configuration.")
        # Generate dummy tree structure matching our JS interpreter for testing
        dummy_model = {
            "model_type": "GradientBoostedTrees",
            "version": "1.0.0",
            "base_score": 150.0,
            "trees": [
                {
                    "split_feature": "travelerStyleEncoded",
                    "split_threshold": 1.5,
                    "left_value": 80.0,
                    "right_value": 250.0
                },
                {
                    "split_feature": "durationDays",
                    "split_threshold": 5.5,
                    "left_value": 0.9,
                    "right_value": 1.2
                }
            ]
        }
        with open(export_json_path, 'w') as f:
            json.dump(dummy_model, f, indent=2)
        return

    # In a real environment, load data
    data = np.genfromtxt(csv_path, delimiter=',', skip_header=1)
    X = data[:, 1:-2] # features
    y = data[:, -2]   # target budget

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    model = xgb.XGBRegressor(n_estimators=50, max_depth=3, learning_rate=0.1)
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    # Dump booster to json tree structures
    booster = model.get_booster()
    dump_list = booster.get_dump(dump_format='json')

    serialized_trees = [json.loads(d) for d in dump_list]

    model_artifact = {
        "model_type": "XGBRegressor",
        "version": "1.0.0",
        "base_score": float(model.intercept_ if hasattr(model, 'intercept_') else 0.5),
        "trees": serialized_trees
    }

    with open(export_json_path, 'w') as f:
        json.dump(model_artifact, f, indent=2)
    print(f"Model successfully trained and exported to {export_json_path}")

if __name__ == "__main__":
    train_and_export_model("artifacts/ml_dataset.csv", "artifacts/xgboost_model.json")
