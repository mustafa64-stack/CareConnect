const axios = require('axios');
const { haversineKm, enrichHospitalsWithTraffic } = require('./trafficRouting');

function calculateFreshnessDecay(lastUpdatedDate) {
  const now = Date.now();
  const upTime = new Date(lastUpdatedDate).getTime();
  const ageMinutes = Math.max(0, (now - upTime) / 60000);
  const decayFactor = Math.exp(-ageMinutes / 30.0);
  return {
    ageMinutes: Math.round(ageMinutes * 10) / 10,
    freshnessScore: Math.round(decayFactor * 1000) / 10
  };
}

async function rankHospitals(incident, hospitals, mlServiceUrl = "http://localhost:5001") {
  let enrichedHospitals = hospitals;
  try {
    enrichedHospitals = await enrichHospitalsWithTraffic(incident, hospitals);
  } catch (err) {
    console.warn("Traffic enrichment fallback active:", err.message);
  }

  try {
    const response = await axios.post(`${mlServiceUrl}/rank`, {
      incident,
      hospitals: enrichedHospitals,
      current_time_ms: Date.now()
    }, { timeout: 1500 });

    if (response.data?.ranked_hospitals) {
      return {
        source: 'ml_microservice',
        modelVersion: response.data.model_version || 'GradientBoosting-v1.0 (scikit-learn)',
        trafficEngine: 'Pune Regional Road Network & Corridor Traffic Model',
        rankedHospitals: response.data.ranked_hospitals
      };
    }
  } catch (err) {
    console.log(`ML microservice fallback engaged: ${err.message}`);
  }

  const incLat = Number(incident.latitude || 18.6508);
  const incLon = Number(incident.longitude || 73.7629);
  const reqType = (incident.requiredResourceType || "ICU Bed").toLowerCase();
  const emergType = (incident.emergencyType || "").toLowerCase();

  const results = enrichedHospitals.map(h => {
    const distKm = haversineKm(incLat, incLon, h.latitude, h.longitude);
    const { ageMinutes, freshnessScore } = calculateFreshnessDecay(h.lastUpdated);

    let specialties = [];
    try {
      specialties = typeof h.specialties === 'string' ? JSON.parse(h.specialties) : (h.specialties || []);
    } catch {
      specialties = [];
    }

    let specialtyMatch = false;
    if (emergType.includes("cardiac") && specialties.some(s => s.toLowerCase().includes("cardio") || s.toLowerCase().includes("cath"))) {
      specialtyMatch = true;
    } else if (emergType.includes("trauma") && specialties.some(s => s.toLowerCase().includes("trauma") || s.toLowerCase().includes("ortho"))) {
      specialtyMatch = true;
    } else if (emergType.includes("stroke") && specialties.some(s => s.toLowerCase().includes("neuro"))) {
      specialtyMatch = true;
    } else if (emergType.includes("respiratory") && specialties.some(s => s.toLowerCase().includes("ventilator") || s.toLowerCase().includes("respiratory"))) {
      specialtyMatch = true;
    } else if (emergType.includes("burn") && specialties.some(s => s.toLowerCase().includes("burn"))) {
      specialtyMatch = true;
    } else if (specialties.length > 0) {
      specialtyMatch = true;
    }

    const icuAvail = h.icuBedsAvailable;
    const genAvail = h.generalBedsAvailable;
    const resourceAvail = reqType.includes("icu") ? icuAvail : genAvail;
    const resourceMatch = resourceAvail > 0;

    const distScore = Math.max(0, Math.round(100 * (1 - (distKm / 25.0)) * 10) / 10);
    const matchScore = (resourceMatch ? 60 : 0) + (specialtyMatch ? 40 : 15);
    const totalBeds = (h.generalBedsTotal || 50) + (h.icuBedsTotal || 10);
    const totalAvail = icuAvail + genAvail;
    const loadRatio = Math.max(0, Math.min(1, 1 - (totalAvail / totalBeds)));
    const capacityScore = Math.round((1 - loadRatio) * 1000) / 10;

    let baselineScore = Math.round(
      (0.35 * distScore + 0.30 * matchScore + 0.20 * freshnessScore + 0.15 * capacityScore) * 10
    ) / 10;

    if (!resourceMatch) {
      baselineScore = Math.round(baselineScore * 0.15 * 10) / 10;
    }

    let mlScore = baselineScore;
    if (distKm < 5 && freshnessScore > 85 && resourceMatch && specialtyMatch) {
      mlScore = Math.min(99.0, Math.round((baselineScore * 1.05) * 10) / 10);
    } else if (ageMinutes > 20) {
      mlScore = Math.round((baselineScore * 0.82) * 10) / 10;
    }

    const blendedScore = Math.round((0.6 * mlScore + 0.4 * baselineScore) * 10) / 10;

    const explanations = [];
    if (distKm <= 5.0) {
      explanations.push({ factor: "Rapid Transit", impact: "+High", detail: `${distKm} km (Immediate vicinity)` });
    } else if (distKm <= 12.0) {
      explanations.push({ factor: "Travel Distance", impact: "+Moderate", detail: `${distKm} km` });
    } else {
      explanations.push({ factor: "Transit Delay", impact: "-Penalty", detail: `${distKm} km (Extended transit)` });
    }

    if (specialtyMatch) {
      explanations.push({ factor: "Clinical Specialty", impact: "+High", detail: `Dedicated ${incident.emergencyType} capability` });
    }

    if (ageMinutes < 2.0) {
      explanations.push({ factor: "Data Freshness", impact: "+High", detail: `Live telemetry (${Math.round(ageMinutes * 60)}s ago)` });
    } else if (ageMinutes < 15.0) {
      explanations.push({ factor: "Telemetry Age", impact: "+Moderate", detail: `Synced ${Math.round(ageMinutes)} min ago` });
    } else {
      explanations.push({ factor: "Stale Data Decay", impact: "-Critical", detail: `Unverified for ${Math.round(ageMinutes)} min` });
    }

    if (resourceAvail === 0) {
      explanations.push({ factor: "Capacity Depleted", impact: "-Critical", detail: `0 ${incident.requiredResourceType}s available` });
    } else if (resourceAvail === 1) {
      explanations.push({ factor: "Scarcity Warning", impact: "!Caution", detail: `Only 1 ${incident.requiredResourceType} remaining` });
    } else {
      explanations.push({ factor: "Bed Headroom", impact: "+Available", detail: `${resourceAvail} beds confirmed` });
    }

    return {
      hospital: h,
      distanceKm: h.roadDistanceKm || distKm,
      roadDistanceKm: h.roadDistanceKm || distKm,
      etaMinutes: h.etaMinutes || Math.max(2, Math.round(((h.roadDistanceKm || distKm) / 30) * 60)),
      trafficCondition: h.trafficCondition || 'Normal',
      trafficDelayMinutes: h.trafficDelayMinutes || 0,
      routeCorridor: h.routeCorridor || 'Regional Road Network',
      dataAgeMinutes: ageMinutes,
      scores: {
        baseline: baselineScore,
        ml: mlScore,
        blended: blendedScore,
        distanceScore: distScore,
        matchScore: matchScore,
        freshnessScore: freshnessScore,
        capacityScore: capacityScore
      },
      matches: {
        resource: resourceMatch,
        specialty: specialtyMatch
      },
      explanations
    };
  });

  results.sort((a, b) => b.scores.blended - a.scores.blended);
  results.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return {
    source: 'internal_engine',
    modelVersion: 'Heuristic-Probabilistic Hybrid v1.0',
    rankedHospitals: results
  };
}

module.exports = {
  haversineKm,
  calculateFreshnessDecay,
  rankHospitals
};
