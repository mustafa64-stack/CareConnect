import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function MapView({
  hospitals = [],
  incidentLocation = { latitude: 18.6508, longitude: 73.7629 },
  onLocationSelect,
  selectedHospitalId,
  onHospitalSelect
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const incidentMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered on Nigdi / PCCOE corridor
      const map = L.map(mapContainerRef.current, {
        center: [incidentLocation.latitude || 18.6508, incidentLocation.longitude || 73.7629],
        zoom: 12,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Dark Matter tile layer by CartoDB (free, high performance, mission-control dark look)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

      // Allow clicking on map to reposition incident
      map.on('click', (e) => {
        if (onLocationSelect) {
          onLocationSelect({
            latitude: Math.round(e.latlng.lat * 10000) / 10000,
            longitude: Math.round(e.latlng.lng * 10000) / 10000
          });
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup if unmounted
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update incident marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !incidentLocation) return;

    if (incidentMarkerRef.current) {
      incidentMarkerRef.current.remove();
    }

    // Incident ambulance marker (flashing red ring)
    const incidentHtml = `
      <div style="position: relative; width: 34px; height: 34px;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(232, 92, 74, 0.4); animation: alertPulse 1.8s infinite;"></div>
        <div style="position: absolute; inset: 4px; border-radius: 9999px; background: #E85C4A; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
          <svg style="width: 14px; height: 14px; fill: white;" viewBox="0 0 24 24">
            <path d="M19 10.5V8c0-.6-.4-1-1-1h-4V3c0-.6-.4-1-1-1h-2c-.6 0-1 .4-1 1v4H6c-.6 0-1 .4-1 1v2.5L2 14v4c0 .6.4 1 1 1h2.2c.4 1.2 1.5 2 2.8 2s2.4-.8 2.8-2h6.4c.4 1.2 1.5 2 2.8 2s2.4-.8 2.8-2H21c.6 0 1-.4 1-1v-4l-3-3.5zM7.5 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
          </svg>
        </div>
      </div>
    `;

    const incidentIcon = L.divIcon({
      html: incidentHtml,
      className: 'custom-incident-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    incidentMarkerRef.current = L.marker([incidentLocation.latitude, incidentLocation.longitude], {
      icon: incidentIcon,
      zIndexOffset: 1000
    }).addTo(map);

    incidentMarkerRef.current.bindPopup(`
      <div style="font-family: Inter, sans-serif; font-size: 12px; color: #12181F; padding: 4px;">
        <strong style="color: #E85C4A;">EMERGENCY INCIDENT LOCATION</strong><br/>
        <span>Lat: ${incidentLocation.latitude.toFixed(4)}, Lon: ${incidentLocation.longitude.toFixed(4)}</span><br/>
        <span style="font-size: 11px; color: #555;">Click map anywhere to relocate incident</span>
      </div>
    `);
  }, [incidentLocation]);

  // Update hospital markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    hospitals.forEach((h) => {
      const isSelected = h.id === selectedHospitalId;
      const icuAvail = Number(h.icuBedsAvailable || 0);

      // Determine status color and label
      let statusColor = '#2FB8A6'; // teal available
      let statusSymbol = 'H';
      let ageMinutes = 0;

      if (h.lastUpdated) {
        ageMinutes = Math.max(0, (Date.now() - new Date(h.lastUpdated).getTime()) / 60000);
      }

      if (icuAvail === 0) {
        statusColor = '#E85C4A'; // critical/full
        statusSymbol = '!';
      } else if (ageMinutes > 20) {
        statusColor = '#E3A008'; // stale warning
        statusSymbol = 'STALE';
      }

      const markerHtml = `
        <div style="position: relative; cursor: pointer; transition: transform 0.15s ease;">
          <div style="
            background: #1B232C;
            border: 2px solid ${statusColor};
            border-radius: 4px;
            padding: 3px 6px;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.6);
            white-space: nowrap;
            ${isSelected ? 'outline: 2px solid #4C8DFF; transform: scale(1.08); z-index: 500;' : ''}
          ">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></span>
            <span style="font-size: 11px; font-weight: 600; color: #E7EDF3; font-family: Inter, sans-serif;">
              ${h.code || h.name.slice(0, 10)}
            </span>
            <span style="font-size: 10px; font-family: monospace; background: #2A3644; color: ${icuAvail > 0 ? '#2FB8A6' : '#E85C4A'}; padding: 1px 4px; border-radius: 2px;">
              ${icuAvail} ICU
            </span>
          </div>
        </div>
      `;

      const hospIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-hosp-marker',
        iconSize: [100, 26],
        iconAnchor: [50, 13]
      });

      const marker = L.marker([h.latitude, h.longitude], { icon: hospIcon }).addTo(map);

      marker.on('click', () => {
        if (onHospitalSelect) onHospitalSelect(h.id);
      });

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 12px; color: #12181F; min-width: 170px;">
          <div style="font-weight: 700; color: #1B232C; font-size: 13px; margin-bottom: 2px;">${h.name}</div>
          <div style="color: #666; font-size: 11px; margin-bottom: 6px;">${h.address}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 4px;">
            <div>ICU Beds: <strong style="color: ${icuAvail > 0 ? '#2FB8A6' : '#E85C4A'};">${icuAvail} / ${h.icuBedsTotal}</strong></div>
            <div>Gen Beds: <strong>${h.generalBedsAvailable} / ${h.generalBedsTotal}</strong></div>
            <div>O2 Supply: <strong>${h.o2SupplyPercent}%</strong></div>
            <div>Blood: <strong>${h.bloodBankStatus}</strong></div>
          </div>
          <div style="font-size: 10px; color: ${ageMinutes > 20 ? '#E3A008' : '#777'};">
            Telemetry: ${ageMinutes > 20 ? `Stale (${Math.round(ageMinutes)}m ago)` : `Live (${Math.round(ageMinutes * 60)}s ago)`}
          </div>
        </div>
      `);

      markersRef.current.push(marker);

      // Draw route line to selected hospital
      if (isSelected && incidentLocation) {
        routeLineRef.current = L.polyline(
          [
            [incidentLocation.latitude, incidentLocation.longitude],
            [h.latitude, h.longitude]
          ],
          {
            color: '#4C8DFF',
            weight: 3,
            dashArray: '6, 6',
            opacity: 0.85
          }
        ).addTo(map);
      }
    });
  }, [hospitals, selectedHospitalId, incidentLocation]);

  return (
    <div className="relative w-full h-full min-h-[300px] rounded border border-console-border overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '320px' }} />
      {/* Map Legend Overlay */}
      <div className="absolute top-2 left-2 z-[400] bg-console-surface/90 backdrop-blur-sm border border-console-border px-2.5 py-1.5 rounded text-[11px] font-sans text-console-muted flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-console-text">
          <span className="w-2 h-2 rounded-full bg-status-available"></span> Available
        </span>
        <span className="flex items-center gap-1.5 text-console-text">
          <span className="w-2 h-2 rounded-full bg-status-warning"></span> Stale data (&gt;20m)
        </span>
        <span className="flex items-center gap-1.5 text-console-text">
          <span className="w-2 h-2 rounded-full bg-status-critical"></span> Zero beds / Full
        </span>
        <span className="text-[10px] text-console-muted border-l border-console-border pl-2">
          Click map to set incident
        </span>
      </div>
    </div>
  );
}
