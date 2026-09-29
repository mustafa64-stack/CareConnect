import React, { useState, useEffect } from 'react';
import SimpleMap from '../components/SimpleMap';
import { apiUrl } from '../apiConfig';

const EMERGENCY_TYPES = [
  'Heart attack',
  'Road accident / trauma',
  'Breathing difficulty',
  'Stroke',
  'Severe burn',
  'Pregnancy emergency',
  'Other emergency',
];

const URGENCY = [
  { value: 'Immediate', label: '🔴 Critical — life threatening', sublabel: 'Needs immediate care' },
  { value: 'Very Urgent', label: '🟡 Serious — needs care soon', sublabel: 'Stable but worsening' },
  { value: 'Urgent', label: '🟢 Stable — needs attention', sublabel: 'Not immediately life-threatening' },
];

const PRESETS = [
  {
    name: 'Acute Cardiac (Nigdi)',
    data: {
      emergencyType: 'Heart attack',
      urgencyLevel: 'Immediate',
      patientAge: '52',
      patientGender: 'Male',
      requiresBlood: true,
      bloodTypeNeeded: 'B+',
      callerName: 'Ambulance 108',
      latitude: 18.6508,
      longitude: 73.7629
    }
  },
  {
    name: 'Highway Crash at Akurdi',
    data: {
      emergencyType: 'Road accident / trauma',
      urgencyLevel: 'Immediate',
      patientAge: '28',
      patientGender: 'Female',
      requiresBlood: true,
      bloodTypeNeeded: 'O-',
      callerName: 'Ambulance 102',
      latitude: 18.6480,
      longitude: 73.7650
    }
  },
  {
    name: 'Breathing Distress at Chinchwad',
    data: {
      emergencyType: 'Breathing difficulty',
      urgencyLevel: 'Very Urgent',
      patientAge: '64',
      patientGender: 'Male',
      requiresBlood: false,
      bloodTypeNeeded: '',
      callerName: 'Ambulance 104',
      latitude: 18.6298,
      longitude: 73.7820
    }
  }
];

function HospitalCard({ item, rank, onSelect, highlighted }) {
  const h = item.hospital;
  const icuAvail = Number(h.icuBedsAvailable || 0);
  const ageMin = item.dataAgeMinutes || 0;
  const isStale = ageMin >= 20;
  const isFull = icuAvail === 0;
  const roadDist = item.roadDistanceKm || item.distanceKm;
  const eta = item.etaMinutes || Math.max(2, Math.round((roadDist / 25) * 60));
  const trafficDelay = item.trafficDelayMinutes || 0;
  const trafficCondition = item.trafficCondition || 'Normal';
  const corridor = item.routeCorridor;

  const borderColor = highlighted
    ? '#2563EB'
    : rank === 1 && !isFull
    ? '#2563EB'
    : 'var(--border)';

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 12,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: highlighted
          ? '0 4px 16px rgba(37,99,235,0.15)'
          : rank === 1 && !isFull
          ? '0 4px 16px rgba(37,99,235,0.1)'
          : 'var(--shadow-sm)',
        opacity: isFull ? 0.65 : 1,
        transition: 'all 0.15s ease',
        cursor: isFull ? 'default' : 'pointer',
      }}
      className={!isFull ? "hover-lift glass-panel" : "glass-panel"}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: rank === 1 && !isFull ? '#2563EB' : 'var(--bg)',
        color: rank === 1 && !isFull ? 'white' : 'var(--text-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>
        {rank}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
            {h.name}
          </span>
          {rank === 1 && !isFull && (
            <span style={{
              background: '#EFF6FF', color: '#2563EB',
              fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: 99, border: '1px solid #BFDBFE'
            }}>
              Top Recommendation
            </span>
          )}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>{roadDist} km road dist · ~{eta} min ETA</span>
          {trafficDelay > 0 ? (
            <span style={{ color: '#E85C4A', background: '#FEF2F2', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
              +{trafficDelay}m delay ({trafficCondition})
            </span>
          ) : (
            <span style={{ color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
              {trafficCondition} corridor
            </span>
          )}
          {corridor && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.85 }}>
              via {corridor}
            </span>
          )}
          {isStale && (
            <span style={{ color: '#B45309', fontWeight: 600, background: '#FFFBEB', padding: '1px 6px', borderRadius: 4 }}>
              Stale telemetry ({Math.round(ageMin)}m old)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 12, fontWeight: 500,
            color: icuAvail > 0 ? 'var(--green)' : 'var(--red)',
          }}>
            {icuAvail > 0 ? `${icuAvail} ICU beds available` : 'ICU capacity full'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {h.generalBedsAvailable} general beds
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            O2: {h.o2SupplyPercent}%
          </span>
        </div>
      </div>

      <button
        disabled={isFull}
        onClick={() => onSelect(h)}
        style={{
          background: isFull ? 'var(--bg)' : '#2563EB',
          color: isFull ? 'var(--text-muted)' : 'white',
          border: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          cursor: isFull ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { if (!isFull) e.currentTarget.style.background = '#1D4ED8'; }}
        onMouseLeave={e => { if (!isFull) e.currentTarget.style.background = '#2563EB'; }}
      >
        {isFull ? 'Saturated' : 'Dispatch Here →'}
      </button>
    </div>
  );
}

export default function DispatcherPage({ hospitals, requests, onBack, onRefresh, sseConnected }) {
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({
    emergencyType: 'Heart attack',
    urgencyLevel: 'Immediate',
    patientAge: '52',
    patientGender: 'Male',
    requiresBlood: false,
    bloodTypeNeeded: '',
    callerName: 'Ambulance 108',
    latitude: 18.6508,
    longitude: 73.7629,
  });
  const [ranked, setRanked] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [sentRequestId, setSentRequestId] = useState(null);
  const [mapHospId, setMapHospId] = useState(null);
  const [locSearch, setLocSearch] = useState('');
  const [locSearching, setLocSearching] = useState(false);

  const applyPreset = (preset) => {
    setForm(preset.data);
    fetchRankingsForData(preset.data);
  };

  const handleSearchLoc = async () => {
    if (!locSearch.trim()) return;
    setLocSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locSearch)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setForm(f => ({ ...f, latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) }));
        setLocSearch(data[0].display_name.split(',')[0]);
      } else {
        alert("Location not found.");
      }
    } catch {
      alert("Location lookup failed.");
    } finally {
      setLocSearching(false);
    }
  };

  const fetchRankingsForData = async (formData = form) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/rank'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, requiredResourceType: 'ICU Bed' }),
      });
      const data = await res.json();
      if (data.rankedHospitals) {
        setRanked(data.rankedHospitals);
        const top = data.rankedHospitals.find(r => r.hospital.icuBedsAvailable > 0);
        if (top) setMapHospId(top.hospital.id);
        setStep('results');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (hospital) => {
    try {
      const res = await fetch(apiUrl('/api/requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requiredResourceType: 'ICU Bed',
          assignedHospitalId: hospital.id,
          patientAge: Number(form.patientAge) || 45,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setSentRequestId(created.id);
        setSentTo(hospital);
        setStep('sent');
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (step === 'form') {
    return (
      <div className="page-enter mesh-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', padding: '24px 20px' }}>
        <div style={{ maxWidth: 600, width: '100%', margin: '0 auto' }}>
          
          <div style={{ marginBottom: 20 }}>
            <h2 className="brand-font" style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>
              Dispatch Emergency Unit
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Input incident symptoms or pick a quick regional preset to run route matching.
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Presets
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#2563EB',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  ⚡ {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Clinical Category</label>
              <select
                value={form.emergencyType}
                onChange={e => setForm({ ...form, emergencyType: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#FFF' }}
              >
                {EMERGENCY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Clinical Urgency</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {URGENCY.map(u => (
                  <label
                    key={u.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      borderRadius: 8, border: `1.5px solid ${form.urgencyLevel === u.value ? '#2563EB' : 'var(--border)'}`,
                      background: form.urgencyLevel === u.value ? '#EFF6FF' : '#FFF',
                      cursor: 'pointer'
                    }}
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={u.value}
                      checked={form.urgencyLevel === u.value}
                      onChange={() => setForm({ ...form, urgencyLevel: u.value })}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.sublabel}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Patient Age</label>
                <input
                  type="number"
                  placeholder="52"
                  value={form.patientAge}
                  onChange={e => setForm({ ...form, patientAge: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#FFF' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Gender</label>
                <select
                  value={form.patientGender}
                  onChange={e => setForm({ ...form, patientGender: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#FFF' }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={form.requiresBlood}
                  onChange={e => setForm({ ...form, requiresBlood: e.target.checked })}
                />
                <span>Requires Blood Transfusion</span>
              </label>
              {form.requiresBlood && (
                <input
                  type="text"
                  placeholder="Blood type (e.g. B+)"
                  value={form.bloodTypeNeeded}
                  onChange={e => setForm({ ...form, bloodTypeNeeded: e.target.value })}
                  style={{ marginTop: 8, width: 140, padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 6, fontSize: 13 }}
                />
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Emergency Location</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Search landmark or area (e.g., Nigdi, Baner)"
                  value={locSearch}
                  onChange={e => setLocSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchLoc()}
                  style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                />
                <button
                  onClick={handleSearchLoc}
                  disabled={locSearching}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 13, fontWeight: 600 }}
                >
                  {locSearching ? '...' : 'Search'}
                </button>
              </div>
            </div>

            <button
              onClick={() => fetchRankingsForData()}
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? '#93C5FD' : '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                marginTop: 6
              }}
            >
              {loading ? 'Evaluating Facilities...' : 'Find Optimal Hospitals →'}
            </button>
          </div>

          {requests && requests.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Recent Dispatches ({requests.length})
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Real-time telemetry</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {requests.slice(0, 4).map(req => {
                  const reqHosp = (hospitals || []).find(h => h.id === req.assignedHospitalId) || req.assignedHospital;
                  const isAccepted = req.status === 'ACCEPTED';
                  const isEnRoute = req.status === 'EN_ROUTE';
                  const isArrived = req.status === 'ARRIVED';
                  const isDone = req.status === 'HANDED_OVER';
                  const isPending = req.status === 'PENDING';
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <div
                      key={req.id}
                      className="glass-panel"
                      style={{
                        borderRadius: 12,
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                            {req.emergencyType}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                            {req.incidentNumber}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          Unit: <strong>{req.callerName}</strong> → {reqHosp?.name || 'Assigned Facility'}
                        </div>
                      </div>

                      <div style={{ flexShrink: 0 }}>
                        {isPending && (
                          <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                            ● Pending
                          </span>
                        )}
                        {isAccepted && (
                          <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                            ✓ Bed Locked
                          </span>
                        )}
                        {isEnRoute && (
                          <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                            🚑 En Route
                          </span>
                        )}
                        {isArrived && (
                          <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 99 }}>
                            🏥 In Bay
                          </span>
                        )}
                        {isDone && (
                          <span style={{ background: '#F1F5F9', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>
                            Handed Over
                          </span>
                        )}
                        {isRejected && (
                          <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99 }}>
                            Declined
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'results') {
    return (
      <div className="page-enter mesh-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '24px 20px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <button
                onClick={() => setStep('form')}
                style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', padding: 0, marginBottom: 4 }}
              >
                ← Edit Incident Details
              </button>
              <h2 className="brand-font" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)' }}>
                {ranked.filter(r => r.hospital.icuBedsAvailable > 0).length} Available Regional Facilities
              </h2>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                {form.emergencyType}
              </span>
              <span style={{
                background: form.urgencyLevel === 'Immediate' ? '#FEF2F2' : '#FFFBEB',
                color: form.urgencyLevel === 'Immediate' ? '#DC2626' : '#D97706',
                padding: '4px 10px',
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 600
              }}>
                {form.urgencyLevel}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ranked.map((item, i) => (
                <div key={item.hospital.id} onClick={() => setMapHospId(item.hospital.id)}>
                  <HospitalCard
                    item={item}
                    rank={i + 1}
                    onSelect={handleSendRequest}
                    highlighted={mapHospId === item.hospital.id}
                  />
                </div>
              ))}
            </div>

            <div style={{ position: 'sticky', top: 76 }}>
              <div className="glass-panel" style={{ borderRadius: 16, overflow: 'hidden', padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Regional GIS Corridor
                </div>
                <SimpleMap
                  hospitals={ranked.map(r => r.hospital)}
                  incidentLocation={{ latitude: form.latitude, longitude: form.longitude }}
                  selectedHospitalId={mapHospId}
                  onHospitalSelect={id => setMapHospId(id)}
                  onLocationSelect={loc => setForm(f => ({ ...f, ...loc }))}
                  height={380}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (step === 'sent') {
    const liveReq = (requests || []).find(r => r.id === sentRequestId) || {
      status: 'PENDING',
      incidentNumber: 'INC-...',
      assignedHospital: sentTo
    };
    const isPending = liveReq.status === 'PENDING';
    const isAccepted = liveReq.status === 'ACCEPTED';
    const isEnRoute = liveReq.status === 'EN_ROUTE';
    const isArrived = liveReq.status === 'ARRIVED';
    const isDone = liveReq.status === 'HANDED_OVER';
    const isRejected = liveReq.status === 'REJECTED';

    return (
      <div className="page-enter mesh-bg" style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="glass-panel" style={{ borderRadius: 20, padding: '36px 32px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>
            {isRejected ? '❌' : isDone ? '🎉' : isArrived ? '🏥' : isEnRoute ? '🚑' : isAccepted ? '🔒' : '📡'}
          </div>
          <h2 className="brand-font" style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
            {isRejected ? 'Hospital Capacity Saturated' : isAccepted ? 'Bed Confirmed & Locked!' : isEnRoute ? 'Ambulance En Route' : isArrived ? 'Arrived at Bay' : isDone ? 'Care Handoff Complete' : 'Dispatch Transmitted'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
            {isRejected
              ? `The emergency department at ${sentTo?.name} is currently full: ${liveReq.rejectionReason || 'No capacity available'}.`
              : isAccepted
              ? `Bed successfully reserved at ${sentTo?.name} via atomic lock. The medical team is standing by.`
              : `Incident queued for ${sentTo?.name}. Live synchronization is active across emergency channels.`}
          </p>

          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px', textAlign: 'left', marginBottom: 24, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Incident ID</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{liveReq.incidentNumber || 'INC-PENDING'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Assigned Facility</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{sentTo?.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Live Status</span>
              <div>
                {isPending && (
                  <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                    ● Awaiting Review
                  </span>
                )}
                {isAccepted && (
                  <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                    ✓ Bed Locked
                  </span>
                )}
                {isEnRoute && (
                  <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                    🚑 En Route
                  </span>
                )}
                {isArrived && (
                  <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                    🏥 In Bay
                  </span>
                )}
                {isDone && (
                  <span style={{ background: '#F1F5F9', color: 'var(--text)', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                    ✅ Handed Over
                  </span>
                )}
                {isRejected && (
                  <span style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>
                    ✕ Declined
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {isRejected && (
              <button
                onClick={() => setStep('results')}
                style={{ width: '100%', padding: '12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                ← Re-Route to Alternate Facility
              </button>
            )}
            <button
              onClick={() => { setStep('form'); setSentTo(null); setSentRequestId(null); }}
              style={{ width: '100%', padding: '12px', background: isRejected ? '#F1F5F9' : '#2563EB', color: isRejected ? 'var(--text)' : 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Dispatch Another Emergency
            </button>
            <button
              onClick={onBack}
              style={{ width: '100%', padding: '10px', background: 'transparent', color: 'var(--text-muted)', border: 'none', fontSize: 13, cursor: 'pointer' }}
            >
              Return to Operations Portal
            </button>
          </div>
        </div>
      </div>
    );
  }
}
