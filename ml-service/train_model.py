import json
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, roc_auc_score, f1_score, precision_score, recall_score,
    confusion_matrix, brier_score_loss
)

FEATURE_NAMES = [
    "distance_km",
    "resource_match",
    "specialty_match",
    "freshness_decay",
    "hospital_load_ratio",
    "o2_supply_ratio",
    "blood_bank_status",
    "urgency_weight"
]

def train():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "synthetic_emergency_data.json")
    
    # Always regenerate with updated realistic distribution if needed
    from generate_dataset import generate_synthetic_data
    generate_synthetic_data(5000, data_path)
        
    with open(data_path, "r") as f:
        raw_data = json.load(f)
        
    X = []
    y = []
    for item in raw_data:
        feats = item["features"]
        X.append([feats[col] for col in FEATURE_NAMES])
        y.append(item["successful_outcome"])
        
    X = np.array(X)
    y = np.array(y)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train Gradient Boosting with tuned regularization to reflect robust clinical generalization
    gb_model = GradientBoostingClassifier(
        n_estimators=120,
        learning_rate=0.06,
        max_depth=3,
        subsample=0.85,
        random_state=42
    )
    gb_model.fit(X_train, y_train)
    
    # 5-Fold Stratified Cross Validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(gb_model, X_train, y_train, cv=cv, scoring='accuracy')
    cv_roc = cross_val_score(gb_model, X_train, y_train, cv=cv, scoring='roc_auc')
    
    # Also train Logistic Regression as linear explainability baseline
    lr_model = LogisticRegression(max_iter=1000, random_state=42)
    lr_model.fit(X_train, y_train)
    
    # Evaluate on held-out test set
    y_pred = gb_model.predict(X_test)
    y_prob = gb_model.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    f1 = f1_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    brier = brier_score_loss(y_test, y_prob)
    
    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    # Feature importances
    importances = gb_model.feature_importances_
    feat_imp = {
        name: round(float(imp), 4)
        for name, imp in zip(FEATURE_NAMES, importances)
    }
    sorted_feat_imp = dict(sorted(feat_imp.items(), key=lambda item: item[1], reverse=True))
    
    artifacts = {
        "gb_model": gb_model,
        "lr_model": lr_model,
        "feature_names": FEATURE_NAMES
    }
    
    model_path = os.path.join(current_dir, "ranking_model.joblib")
    joblib.dump(artifacts, model_path)
    
    metrics = {
        "accuracy": round(float(acc), 4),
        "roc_auc": round(float(roc_auc), 4),
        "f1_score": round(float(f1), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "brier_score": round(float(brier), 4),
        "cv_accuracy_mean": round(float(np.mean(cv_scores)), 4),
        "cv_accuracy_std": round(float(np.std(cv_scores)), 4),
        "cv_roc_mean": round(float(np.mean(cv_roc)), 4),
        "confusion_matrix": {
            "true_positives": int(tp),
            "false_positives": int(fp),
            "true_negatives": int(tn),
            "false_negatives": int(fn)
        },
        "feature_importances": sorted_feat_imp,
        "samples_trained": len(X_train),
        "samples_tested": len(X_test),
        "lr_coefficients": {
            name: round(float(coef), 4)
            for name, coef in zip(FEATURE_NAMES, lr_model.coef_[0])
        }
    }
    
    metrics_path = os.path.join(current_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"Model trained successfully! Test Accuracy: {acc:.4f}, 5-Fold CV: {np.mean(cv_scores):.4f} (+/- {np.std(cv_scores):.4f}), ROC-AUC: {roc_auc:.4f}")
    print(f"Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")
    print(f"Top features: {sorted_feat_imp}")
    return metrics

if __name__ == "__main__":
    train()
