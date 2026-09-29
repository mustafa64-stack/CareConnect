import numpy as np
import json
import os

np.random.seed(42)

def generate_synthetic_data(num_samples=5000, output_path="synthetic_emergency_data.json"):
    """
    Generates realistic emergency hospital assignment scenarios with authentic clinical noise,
    non-linear clinical interactions, and probabilistic outcome sampling (avoiding synthetic threshold overfitting).
    
    Features:
    - distance_km: Real road network travel distance (0.8 to 35.0 km)
    - resource_match: Exact resource available (0.0 to 1.0)
    - specialty_match: 1 if hospital has relevant specialty, 0 otherwise
    - freshness_decay: Exponential decay exp(-age_minutes / 30.0), 0.0 to 1.0
    - hospital_load_ratio: Occupied beds / Total beds (0.3 to 1.0)
    - o2_supply_ratio: O2 capacity (0.5 to 1.0)
    - blood_bank_status: 1.0 (Optimal), 0.7 (Moderate), 0.3 (Critical), 0.0 (Depleted)
    - urgency_weight: 1.0 (Immediate), 0.75 (Very Urgent), 0.5 (Urgent)
    
    Target:
    - successful_outcome: 1 if successful timely handoff with zero complications, 0 if diverted/delayed
    - outcome_score: Continuous calibrated score 0-100
    """
    data = []
    
    for i in range(num_samples):
        distance_km = float(np.random.exponential(scale=6.5) + 0.8)
        distance_km = min(distance_km, 35.0)
        
        resource_match = float(np.random.choice([0.0, 0.4, 0.8, 1.0], p=[0.08, 0.12, 0.25, 0.55]))
        specialty_match = float(np.random.choice([0.0, 1.0], p=[0.22, 0.78]))
        
        # Age in minutes: mix of fresh (0-15m), moderate (15-35m), and stale (35-120m)
        age_minutes = float(np.random.choice([
            np.random.uniform(0.1, 12.0),
            np.random.uniform(12.0, 35.0),
            np.random.uniform(35.0, 120.0)
        ], p=[0.68, 0.22, 0.10]))
        freshness_decay = float(np.exp(-age_minutes / 30.0))
        
        hospital_load_ratio = float(np.random.uniform(0.30, 0.98))
        o2_supply_ratio = float(np.random.uniform(0.65, 1.0))
        blood_bank_status = float(np.random.choice([1.0, 0.7, 0.3, 0.0], p=[0.52, 0.30, 0.13, 0.05]))
        urgency_weight = float(np.random.choice([1.0, 0.75, 0.5], p=[0.45, 0.35, 0.20]))
        
        # Realistic clinical factors & non-linear clinical interactions:
        # 1. Distance penalty steepens significantly under high clinical urgency
        dist_factor = max(0.0, 1.0 - (distance_km / 22.0))
        dist_impact = dist_factor * (0.75 + 0.5 * urgency_weight)
        
        # 2. Compound risk: High urgency + Stale data creates elevated divert hazard
        stale_risk = (1.0 - freshness_decay) * (1.2 + 0.8 * urgency_weight)
        
        # 3. Non-linear capacity cliff: At >85% load, ambulance offload delays surge non-linearly
        load_penalty = 0.0
        if hospital_load_ratio > 0.82:
            load_penalty = ((hospital_load_ratio - 0.82) / 0.18) ** 1.6 * 2.2
            
        # 4. Mandatory resource constraint: missing ICU bed is a major barrier
        resource_impact = 2.4 * resource_match if resource_match > 0.3 else -2.5
        
        # 5. Stochastic real-world clinical confounder (e.g. unexpected ER surge, staff changeover)
        clinical_confounder = np.random.normal(0, 0.55)
        
        base_log_odds = (
            resource_impact +
            1.6 * specialty_match +
            1.8 * dist_impact +
            1.4 * freshness_decay -
            stale_risk -
            load_penalty +
            0.6 * o2_supply_ratio +
            0.5 * blood_bank_status +
            clinical_confounder -
            1.1 # intercept
        )
        
        # Logistic sigmoid probability
        prob = 1.0 / (1.0 + np.exp(-base_log_odds))
        prob = max(0.02, min(0.98, prob))
        
        # PROBABILISTIC SAMPLING: In real clinical medicine, a patient with 85% success probability
        # still has a 15% true stochastic complication / diversion risk.
        # This replaces the synthetic hard-cutoff (prob >= 0.55) with authentic Bernoulli trial.
        label = int(np.random.binomial(1, prob))
        outcome_score = round(float(prob * 100), 2)
        
        data.append({
            "id": i,
            "features": {
                "distance_km": round(distance_km, 2),
                "resource_match": round(resource_match, 2),
                "specialty_match": round(specialty_match, 2),
                "freshness_decay": round(freshness_decay, 3),
                "hospital_load_ratio": round(hospital_load_ratio, 3),
                "o2_supply_ratio": round(o2_supply_ratio, 3),
                "blood_bank_status": round(blood_bank_status, 2),
                "urgency_weight": round(urgency_weight, 2)
            },
            "prob": round(float(prob), 4),
            "outcome_score": outcome_score,
            "successful_outcome": label
        })
        
    with open(output_path, "w") as f:
        json.dump(data, f, indent=2)
        
    print(f"Generated {num_samples} scenarios saved to {output_path}")
    return output_path

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(current_dir, "synthetic_emergency_data.json")
    generate_synthetic_data(5000, out)
