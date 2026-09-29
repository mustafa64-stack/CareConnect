import math
import os
import json
import joblib
import time
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "ranking_model.joblib")
metrics_path = os.path.join(current_dir, "metrics.json")

artifacts = None
metrics = {}

def load_artifacts():
    global artifacts, metrics
    if os.path.exists(model_path):
        artifacts = joblib.load(model_path)
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            metrics = json.load(f)

load_artifacts()

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(R * c, 2)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "service": "Emergency Resource ML Ranking Service",
        "model_loaded": artifacts is not None,
        "metrics": metrics
    })

@app.route("/metrics", methods=["GET"])
def get_metrics():
    return jsonify(metrics)

@app.route("/rank", methods=["POST"])
def rank_hospitals():
    try:
        body = request.get_json(force=True)
        incident = body.get("incident", {})
        hospitals = body.get("hospitals", [])
        
        inc_lat = float(incident.get("latitude", 18.6508))
        inc_lon = float(incident.get("longitude", 73.7629))
        req_type = incident.get("requiredResourceType", "ICU Bed")
        emerg_type = incident.get("emergencyType", "")
        urgency = incident.get("urgencyLevel", "Immediate")
        
        urgency_weight = 1.0 if urgency == "Immediate" else (0.75 if urgency == "Very Urgent" else 0.5)
        
        results = []
        X_batch = []
        meta_items = []
        
        now_ms = body.get("current_time_ms")
        now_time = (now_ms / 1000.0) if now_ms else time.time()
        
        for h in hospitals:
            h_road_dist = h.get("roadDistanceKm")
            if h_road_dist is not None:
                dist_km = float(h_road_dist)
            else:
                dist_km = haversine_km(inc_lat, inc_lon, float(h["latitude"]), float(h["longitude"]))
            
            specialties = h.get("specialties", [])
            if isinstance(specialties, str):
                try:
                    specialties = json.loads(specialties)
                except:
                    specialties = [specialties]
                    
            specialty_match = 0.0
            emerg_lower = emerg_type.lower()
            if any(s.lower() in emerg_lower or emerg_lower in s.lower() for s in specialties):
                specialty_match = 1.0
            elif "cardiac" in emerg_lower and any("cardio" in s.lower() or "cath" in s.lower() for s in specialties):
                specialty_match = 1.0
            elif "trauma" in emerg_lower and any("trauma" in s.lower() or "ortho" in s.lower() for s in specialties):
                specialty_match = 1.0
            elif "stroke" in emerg_lower and any("neuro" in s.lower() for s in specialties):
                specialty_match = 1.0
            elif "respiratory" in emerg_lower and any("ventilator" in s.lower() or "respiratory" in s.lower() for s in specialties):
                specialty_match = 1.0
            elif "burn" in emerg_lower and any("burn" in s.lower() for s in specialties):
                specialty_match = 1.0
            else:
                specialty_match = 0.5 if len(specialties) > 0 else 0.0
                
            icu_avail = int(h.get("icuBedsAvailable", 0))
            gen_avail = int(h.get("generalBedsAvailable", 0))
            icu_total = max(1, int(h.get("icuBedsTotal", 1)))
            gen_total = max(1, int(h.get("generalBedsTotal", 1)))
            
            if "icu" in req_type.lower():
                resource_match = 1.0 if icu_avail > 0 else 0.0
            else:
                resource_match = 1.0 if gen_avail > 0 else 0.0
                
            last_up = h.get("lastUpdated")
            age_minutes = 1.0
            if last_up:
                try:
                    if isinstance(last_up, (int, float)):
                        up_time = last_up / 1000.0 if last_up > 1e11 else float(last_up)
                    else:
                        from datetime import datetime
                        iso_str = str(last_up).replace("Z", "+00:00")
                        dt = datetime.fromisoformat(iso_str)
                        up_time = dt.timestamp()
                    age_minutes = max(0.0, (now_time - up_time) / 60.0)
                except:
                    age_minutes = 2.0
                    
            freshness_decay = math.exp(-age_minutes / 30.0)
            
            total_beds = icu_total + gen_total
            total_avail = icu_avail + gen_avail
            hospital_load_ratio = max(0.0, min(1.0, 1.0 - (total_avail / total_beds)))
            
            o2_pct = float(h.get("o2SupplyPercent", 90)) / 100.0
            blood_status_str = str(h.get("bloodBankStatus", "Optimal")).lower()
            blood_bank_score = 1.0 if "opt" in blood_status_str else (0.7 if "mod" in blood_status_str else (0.3 if "crit" in blood_status_str else 0.0))
            
            feats = [
                dist_km,
                resource_match,
                specialty_match,
                round(freshness_decay, 3),
                round(hospital_load_ratio, 3),
                round(o2_pct, 2),
                blood_bank_score,
                urgency_weight
            ]
            X_batch.append(feats)
            
            dist_score = max(0.0, round(100.0 * (1.0 - (dist_km / 25.0)), 1))
            match_score = (60.0 if resource_match > 0 else 0.0) + (40.0 if specialty_match > 0.8 else (20.0 if specialty_match > 0.3 else 5.0))
            freshness_score = round(freshness_decay * 100.0, 1)
            capacity_score = round((1.0 - hospital_load_ratio) * 100.0, 1)
            
            baseline = (
                0.35 * dist_score +
                0.30 * match_score +
                0.20 * freshness_score +
                0.15 * capacity_score
            )
            
            if resource_match == 0:
                baseline = baseline * 0.15
                
            baseline = round(baseline, 1)
            
            meta_items.append({
                "hospital": h,
                "dist_km": dist_km,
                "age_minutes": round(age_minutes, 1),
                "baseline_score": baseline,
                "dist_score": dist_score,
                "match_score": match_score,
                "freshness_score": freshness_score,
                "capacity_score": capacity_score,
                "resource_match": resource_match,
                "specialty_match": specialty_match
            })
            
        if artifacts and artifacts.get("gb_model"):
            gb = artifacts["gb_model"]
            probs = gb.predict_proba(np.array(X_batch))[:, 1]
        else:
            probs = [m["baseline_score"] / 100.0 for m in meta_items]
            
        ranked_list = []
        for idx, item in enumerate(meta_items):
            ml_prob = float(probs[idx])
            ml_score = round(ml_prob * 100.0, 1)
            baseline = item["baseline_score"]
            blended = round(0.55 * ml_score + 0.45 * baseline, 1)
            
            explanations = []
            dist_km = item["dist_km"]
            age_m = item["age_minutes"]
            
            if dist_km <= 3.5:
                explanations.push = None
                explanations.append({"factor": "Rapid Transit", "impact": "+High", "detail": f"{dist_km} km (Immediate vicinity)"})
            elif dist_km <= 8.0:
                explanations.append({"factor": "Travel Corridor", "impact": "+Moderate", "detail": f"{dist_km} km"})
            else:
                explanations.append({"factor": "Extended Transit", "impact": "-Delay", "detail": f"{dist_km} km"})
                
            if item["specialty_match"] > 0.8:
                explanations.append({"factor": "Specialty Fit", "impact": "+Confirmed", "detail": f"Matched for {emerg_type}"})
            elif item["specialty_match"] > 0.3:
                explanations.append({"factor": "Partial Care", "impact": "~General", "detail": "General triage and stabilization"})
            else:
                explanations.append({"factor": "Specialty Gap", "impact": "-Mismatch", "detail": "May require secondary transfer"})
                
            if age_m < 2.0:
                explanations.append({"factor": "Live Telemetry", "impact": "+Verified", "detail": f"Synced {int(age_m * 60)}s ago"})
            elif age_m < 20.0:
                explanations.append({"factor": "Recent Telemetry", "impact": "~Standard", "detail": f"Synced {int(age_m)}m ago"})
            else:
                explanations.append({"factor": "Stale Data Decay", "impact": "-Risk", "detail": f"Unverified for {int(age_m)} min (Penalty applied)"})
                
            h_obj = item["hospital"]
            req_bed_avail = int(h_obj.get("icuBedsAvailable", 0)) if "icu" in req_type.lower() else int(h_obj.get("generalBedsAvailable", 0))
            if req_bed_avail == 0:
                explanations.append({"factor": "Zero Beds", "impact": "-Critical", "detail": f"0 {req_type}s available"})
            elif req_bed_avail == 1:
                explanations.append({"factor": "Scarcity Alert", "impact": "!Contention", "detail": f"Only 1 {req_type} remaining"})
            else:
                explanations.append({"factor": "Bed Headroom", "impact": "+Available", "detail": f"{req_bed_avail} {req_type}s confirmed"})
                
            hosp_raw = item["hospital"]
            ranked_list.append({
                "hospital": hosp_raw,
                "distanceKm": dist_km,
                "roadDistanceKm": hosp_raw.get("roadDistanceKm", dist_km),
                "etaMinutes": hosp_raw.get("etaMinutes"),
                "trafficCondition": hosp_raw.get("trafficCondition", "Normal"),
                "trafficDelayMinutes": hosp_raw.get("trafficDelayMinutes", 0),
                "routeCorridor": hosp_raw.get("routeCorridor", "Regional Road Network"),
                "dataAgeMinutes": age_m,
                "scores": {
                    "baseline": baseline,
                    "ml": ml_score,
                    "blended": blended,
                    "distanceScore": item["dist_score"],
                    "matchScore": item["match_score"],
                    "freshnessScore": item["freshness_score"],
                    "capacityScore": item["capacity_score"],
                },
                "matches": {
                    "resource": item["resource_match"],
                    "specialty": item["specialty_match"]
                },
                "explanations": explanations
            })
            
        ranked_list.sort(key=lambda x: x["scores"]["blended"], reverse=True)
        
        for rank_idx, r in enumerate(ranked_list):
            r["rank"] = rank_idx + 1
            
        return jsonify({
            "status": "success",
            "model_version": "GradientBoosting-v1.0",
            "incident": incident,
            "ranked_hospitals": ranked_list
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=False)
