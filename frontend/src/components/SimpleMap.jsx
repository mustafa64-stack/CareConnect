import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix default marker icons for Vite bundling
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function SimpleMap({
  hospitals = [],
  incidentLocation = { latitude: 18.6508, longitude: 73.7629 },
  selectedHospitalId,
  onHospitalSelect,
  onLocationSelect,
  height = 320,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const incidentRef = useRef(null);
  const lineRef = useRef(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [18.6508, 73.7629],
      zoom: 12,
      zoomControl: true,
    });

    // OpenStreetMap — completely free, no watermark, works without API key
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Click to reposition incident
    map.on('click', (e) => {
      if (onLocationSelect) {
        onLocationSelect({
          latitude: Math.round(e.latlng.lat * 10000) / 10000,
          longitude: Math.round(e.latlng.lng * 10000) / 10000,
        });
      }
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Incident marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !incidentLocation) return;

    if (incidentRef.current) incidentRef.current.remove();

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width: 36px; height: 36px;
        background: #DC2626;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: 16px; margin-left: -1px; margin-top: -1px;">🚑</span>
      </div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    });

    incidentRef.current = L.marker(
      [incidentLocation.latitude, incidentLocation.longitude],
      { icon, zIndexOffset: 1000 }
    )
      .addTo(map)
      .bindPopup('<b style="color:#DC2626">📍 Emergency here</b><br><small>Click map to move</small>');

    map.setView([incidentLocation.latitude, incidentLocation.longitude], map.getZoom());
  }, [incidentLocation]);

  // Hospital markers + route line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (lineRef.current) { lineRef.current.remove(); lineRef.current = null; }

    hospitals.forEach((h, idx) => {
      const icuAvail = Number(h.icuBedsAvailable || 0);
      const ageMin = h.lastUpdated
        ? Math.max(0, (Date.now() - new Date(h.lastUpdated).getTime()) / 60000)
        : 0;
      const isStale = ageMin > 20;
      const isFull = icuAvail === 0;
      const isSelected = h.id === selectedHospitalId;

      // Color coding
      const bgColor = isFull ? '#DC2626' : isStale ? '#D97706' : '#059669';
      const border = isSelected ? '3px solid #2563EB' : `2px solid ${bgColor}`;

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background: white;
          border: ${border};
          border-radius: 10px;
          padding: 4px 8px;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: #111827;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          ${isSelected ? 'transform: scale(1.1); box-shadow: 0 4px 16px rgba(37,99,235,0.3);' : ''}
        ">
          <span style="
            width: 8px; height: 8px; border-radius: 50%;
            background: ${bgColor}; flex-shrink: 0;
          "></span>
          ${h.name.split(' ').slice(0, 2).join(' ')}
          <span style="
            background: ${bgColor}1A;
            color: ${bgColor};
            padding: 1px 5px;
            border-radius: 4px;
            font-size: 10px;
          ">${icuAvail} ICU</span>
        </div>`,
        iconSize: [130, 28],
        iconAnchor: [65, 14],
      });

      const marker = L.marker([h.latitude, h.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; min-width: 180px;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${h.name}</div>
            <div style="font-size: 11px; color: #6B7280; margin-bottom: 8px;">${h.address}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px;">
              <div>ICU: <strong style="color:${isFull ? '#DC2626' : '#059669'}">${icuAvail}/${h.icuBedsTotal}</strong></div>
              <div>General: <strong>${h.generalBedsAvailable}/${h.generalBedsTotal}</strong></div>
              <div>O₂: <strong>${h.o2SupplyPercent}%</strong></div>
              <div>Blood: <strong>${h.bloodBankStatus}</strong></div>
            </div>
            ${isStale ? `<div style="color:#D97706;font-size:11px;margin-top:6px;">⚠ Data ${Math.round(ageMin)}m old</div>` : ''}
          </div>
        `);

      marker.on('click', () => { if (onHospitalSelect) onHospitalSelect(h.id); });
      markersRef.current.push(marker);

      // Route line to selected hospital
      if (isSelected && incidentLocation) {
        lineRef.current = L.polyline(
          [
            [incidentLocation.latitude, incidentLocation.longitude],
            [h.latitude, h.longitude],
          ],
          { color: '#2563EB', weight: 3, dashArray: '8, 6', opacity: 0.8 }
        ).addTo(map);
      }
    });
  }, [hospitals, selectedHospitalId, incidentLocation]);

  return (
    <div className="glass-panel" style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', padding: 4 }}>
      <div style={{ borderRadius: 12, overflow: 'hidden' }}>
        <div ref={containerRef} style={{ height, width: '100%' }} />
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', top: 14, left: 14, zIndex: 400,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: 10, padding: '8px 14px',
        fontSize: 11, display: 'flex', gap: 12, alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
      }}>
        {[
          { color: '#059669', label: 'Available' },
          { color: '#D97706', label: 'Stale data' },
          { color: '#DC2626', label: 'Full' },
        ].map(({ color, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0F172A', fontWeight: 500 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {/* Tap hint */}
      <div style={{
        position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
        zIndex: 400, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,0.6)', borderRadius: 99,
        padding: '6px 14px', fontSize: 11, color: '#475569', fontWeight: 500,
        pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
      }}>
        Tap a hospital to select · Tap map to move incident
      </div>
    </div>
  );
}
