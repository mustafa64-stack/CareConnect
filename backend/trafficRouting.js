const axios = require('axios');

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const dLat = (lat2 - lat1) * Math.PI / 180.0;
  const dLon = (lon2 - lon1) * Math.PI / 180.0;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function getPuneCorridor(hospital) {
  const code = (hospital.code || '').toUpperCase();
  const name = (hospital.name || '').toLowerCase();
  
  if (code.includes('LOK') || name.includes('lokmanya') || name.includes('nigdi')) {
    return { name: 'Old NH48 / Nigdi Pradhikaran Corridor', baseSpeedKmh: 38, congestionMultiplier: 1.25 };
  }
  if (code.includes('ABM') || name.includes('aditya birla') || name.includes('chinchwad')) {
    return { name: 'Thergaon / Chinchwad Link Road', baseSpeedKmh: 35, congestionMultiplier: 1.30 };
  }
  if (code.includes('DYP') || name.includes('patil') || name.includes('pimpri')) {
    return { name: 'Pimpri Central / Sant Tukaram Nagar Corridor', baseSpeedKmh: 32, congestionMultiplier: 1.35 };
  }
  if (code.includes('YCM') || name.includes('ycm')) {
    return { name: 'Pimpri Municipal Medical Arterial', baseSpeedKmh: 34, congestionMultiplier: 1.28 };
  }
  if (code.includes('RUBY') || name.includes('hinjawadi')) {
    return { name: 'Hinjawadi IT Corridor (Bridge Bottleneck)', baseSpeedKmh: 28, congestionMultiplier: 1.55 };
  }
  if (code.includes('JUPITER') || name.includes('baner')) {
    return { name: 'Mumbai-Pune Expressway / Baner Bypass', baseSpeedKmh: 45, congestionMultiplier: 1.20 };
  }
  if (code.includes('SAHYADRI') || name.includes('deccan')) {
    return { name: 'Old Mumbai-Pune Highway / Shivajinagar Arterial', baseSpeedKmh: 30, congestionMultiplier: 1.45 };
  }
  return { name: 'Pune Northwest Arterial', baseSpeedKmh: 35, congestionMultiplier: 1.25 };
}

function getTrafficConditions(corridor) {
  let istHour = 12;
  try {
    const istTimeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false
    }).format(new Date());
    istHour = parseInt(istTimeStr, 10);
  } catch {
    const d = new Date();
    istHour = (d.getUTCHours() + 5.5) % 24;
  }

  let trafficCondition = 'Normal';
  let timeMultiplier = 1.0;

  if (istHour >= 8 && istHour <= 11) {
    trafficCondition = 'Heavy Morning Rush';
    timeMultiplier = 1.40;
  } else if (istHour >= 17 && istHour <= 21) {
    trafficCondition = 'Heavy Evening Peak';
    timeMultiplier = 1.50;
  } else if (istHour >= 12 && istHour < 17) {
    trafficCondition = 'Moderate Congestion';
    timeMultiplier = 1.20;
  } else {
    trafficCondition = 'Low Off-Peak';
    timeMultiplier = 0.95;
  }

  const combinedMultiplier = Math.max(1.0, (corridor.congestionMultiplier * timeMultiplier) * 0.82);

  return {
    trafficCondition,
    combinedMultiplier,
    istHour
  };
}

async function resolveRoadRouting(incLat, incLon, hospital) {
  const straightKm = haversineKm(incLat, incLon, hospital.latitude, hospital.longitude);
  const corridor = getPuneCorridor(hospital);
  const { trafficCondition, combinedMultiplier } = getTrafficConditions(corridor);

  let roadDistanceKm = Math.round(straightKm * 1.30 * 10) / 10;
  let source = 'Pune Regional Corridor Model';

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${incLon},${incLat};${hospital.longitude},${hospital.latitude}?overview=false`;
    const res = await axios.get(osrmUrl, { timeout: 750 });
    if (res.data?.routes?.[0]) {
      const route = res.data.routes[0];
      roadDistanceKm = Math.round((route.distance / 1000.0) * 10) / 10;
      source = 'OSRM Road Network';
    }
  } catch {
    // Falls back to calibrated corridor circuity model
  }

  const effectiveSpeedKmh = Math.max(18, corridor.baseSpeedKmh / combinedMultiplier);
  const rawMinutes = (roadDistanceKm / effectiveSpeedKmh) * 60;
  const etaMinutes = Math.max(2, Math.round(rawMinutes));
  
  const freeFlowMinutes = Math.max(2, Math.round((roadDistanceKm / corridor.baseSpeedKmh) * 60));
  const trafficDelayMinutes = Math.max(0, etaMinutes - freeFlowMinutes);

  return {
    roadDistanceKm,
    haversineDistanceKm: straightKm,
    etaMinutes,
    trafficCondition,
    trafficDelayMinutes,
    routeCorridor: corridor.name,
    routingSource: source
  };
}

async function enrichHospitalsWithTraffic(incident, hospitals) {
  const incLat = Number(incident.latitude || 18.6508);
  const incLon = Number(incident.longitude || 73.7629);

  return Promise.all(
    hospitals.map(async (h) => {
      const routing = await resolveRoadRouting(incLat, incLon, h);
      return {
        ...h,
        roadDistanceKm: routing.roadDistanceKm,
        distanceKm: routing.roadDistanceKm,
        haversineDistanceKm: routing.haversineDistanceKm,
        etaMinutes: routing.etaMinutes,
        trafficCondition: routing.trafficCondition,
        trafficDelayMinutes: routing.trafficDelayMinutes,
        routeCorridor: routing.routeCorridor,
        routingSource: routing.routingSource
      };
    })
  );
}

module.exports = {
  haversineKm,
  enrichHospitalsWithTraffic,
  resolveRoadRouting,
  getPuneCorridor,
  getTrafficConditions
};
