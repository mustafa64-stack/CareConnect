import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Ambulance,
  HeartPulse,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  BrainCircuit,
  Info,
  ChevronRight,
  ShieldCheck,
  Send,
  Navigation,
  Timer
} from 'lucide-react';
import { apiUrl } from '../apiConfig';

// Animated progress bar — transitions from 0 to target width on mount
function AnimatedScoreBar({ value, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  const prevValue = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => setWidth(Math.min(100, Math.max(0, value))), delay + 60);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="flex-1 h-1.5 bg-console-bg rounded overflow-hidden">
      <div
        className="h-full rounded"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          transition: 'width 0.65s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
    </div>
  );
}

// ETA estimator: city ambulance average 25 km/h (includes traffic signals)
function etaMinutes(distKm) {
  const avgSpeedKmh = 25;
  return Math.max(2, Math.round((distKm / avgSpeedKmh) * 60));
}
import MapView from './MapView';

const INCIDENT_PRESETS = [
  {
    name: 'Cardiac Emergency (Nigdi)',
    emergencyType: 'Acute STEMI / Cardiac Arrest',
    urgencyLevel: 'Immediate',
    requiredResourceType: 'ICU Bed',
    requiresBlood: true,
    bloodTypeNeeded: 'B+',
    patientAge: 56,
    patientGender: 'Male',
    latitude: 18.6508,
    longitude: 73.7629,
    callerName: 'Ambulance 104 (Nigdi Pradhikaran)'
  },
  {
    name: 'Highway Crash (Dehu Road / PCMC)',
    emergencyType: 'Severe Polytrauma & Crush Injury',
    urgencyLevel: 'Immediate',
    requiredResourceType: 'ICU Bed',
    requiresBlood: true,
    bloodTypeNeeded: 'O-',
    patientAge: 32,
    patientGender: 'Female',
    latitude: 18.6470,
    longitude: 73.7680,
    callerName: 'Ambulance 108 (Highway Patrol)'
  },
  {
    name: 'Respiratory Distress (Chinchwad)',
    emergencyType: 'Acute Respiratory Failure',
    urgencyLevel: 'Very Urgent',
    requiredResourceType: 'ICU Bed',
    requiresBlood: false,
    bloodTypeNeeded: '',
    patientAge: 68,
    patientGender: 'Male',
    latitude: 18.6290,
    longitude: 73.7850,
    callerName: 'Ambulance 102 (Chinchwad Station)'
  }
];

export default function DispatcherConsole({
  hospitals = [],
  requests = [],
  onDispatchHospital,
  onUpdateHandoff,
  onRefreshData,
  rankingMode = 'ml'
}) {
  const [formData, setFormData] = useState(INCIDENT_PRESETS[0]);
  const [rankedResults, setRankedResults] = useState([]);
  const [isRanking, setIsRanking] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [submittingId, setSubmittingId] = useState(null);

  // Fetch ranking whenever formData or hospitals change
  useEffect(() => {
    let isMounted = true;
    async function fetchRankings() {
      setIsRanking(true);
      try {
        const res = await fetch(apiUrl('/api/rank'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (isMounted && data.rankedHospitals) {
          setRankedResults(data.rankedHospitals);
          if (data.rankedHospitals.length > 0 && !selectedHospitalId) {
            setSelectedHospitalId(data.rankedHospitals[0].hospital.id);
          }
        }
      } catch (err) {
        console.error('Error fetching rankings:', err);
      } finally {
        if (isMounted) setIsRanking(false);
      }
    }

    const timer = setTimeout(fetchRankings, 250);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [formData, hospitals]);

  const handleLocationSelect = (loc) => {
    setFormData(prev => ({
      ...prev,
      latitude: loc.latitude,
      longitude: loc.longitude
    }));
  };

  const handlePresetChange = (preset) => {
    setFormData(preset);
  };

  const handleReserveBed = async (hospital) => {
    setSubmittingId(hospital.id);
    try {
      // Find matching ranked scores snapshot
      const rankedItem = rankedResults.find(r => r.hospital.id === hospital.id);

      // Create or dispatch emergency request
      const createRes = await fetch(apiUrl('/api/requests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          assignedHospitalId: hospital.id,
          scoreSnapshot: rankedItem ? rankedItem.scores : null
        })
      });

      if (createRes.ok) {
        onRefreshData();
      }
    } catch (err) {
      console.error('Error creating request:', err);
    } finally {
      setSubmittingId(null);
    }
  };

  // Find most recent active requests
  const activeRequests = requests.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-[calc(100vh-50px)]">
      {/* LEFT COLUMN: Request Form & Map (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        {/* Incident Intake Form Panel */}
        <div className="bg-console-surface border border-console-border rounded p-3 text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-console-border">
            <span className="font-semibold text-console-text flex items-center gap-1.5 text-sm">
              <Ambulance className="w-4 h-4 text-console-accent" />
              Emergency dispatch request
            </span>
            <span className="text-[11px] text-console-muted">
              Auto-ranks {hospitals.length} regional hospitals
            </span>
          </div>

          {/* Quick presets */}
          <div className="mb-3">
            <div className="text-[11px] text-console-muted mb-1 font-medium">Quick incident presets:</div>
            <div className="grid grid-cols-3 gap-1">
              {INCIDENT_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePresetChange(p)}
                  className={`px-2 py-1 rounded text-left truncate text-[11px] border ${
                    formData.emergencyType === p.emergencyType
                      ? 'border-console-accent bg-console-accent/10 text-console-accent font-medium'
                      : 'border-console-border bg-console-bg text-console-muted hover:text-console-text'
                  }`}
                >
                  {p.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[11px] text-console-muted block mb-0.5">Emergency condition</label>
              <input
                type="text"
                value={formData.emergencyType}
                onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                className="w-full bg-console-bg border border-console-border rounded px-2 py-1 text-console-text text-xs focus:border-console-accent"
              />
            </div>
            <div>
              <label className="text-[11px] text-console-muted block mb-0.5">Required resource</label>
              <select
                value={formData.requiredResourceType}
                onChange={(e) => setFormData({ ...formData, requiredResourceType: e.target.value })}
                className="w-full bg-console-bg border border-console-border rounded px-2 py-1 text-console-text text-xs focus:border-console-accent"
              >
                <option value="ICU Bed">ICU Bed</option>
                <option value="General Bed">General Bed</option>
                <option value="Trauma Bay">Trauma Bay</option>
                <option value="Ventilator">Ventilator Bed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label className="text-[11px] text-console-muted block mb-0.5">Urgency triage</label>
              <select
                value={formData.urgencyLevel}
                onChange={(e) => setFormData({ ...formData, urgencyLevel: e.target.value })}
                className="w-full bg-console-bg border border-console-border rounded px-2 py-1 text-console-text text-xs focus:border-console-accent"
              >
                <option value="Immediate">Immediate (T1 Red)</option>
                <option value="Very Urgent">Very Urgent (T2 Yellow)</option>
                <option value="Urgent">Urgent (T3 Green)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-console-muted block mb-0.5">Caller / Ambulance</label>
              <input
                type="text"
                value={formData.callerName}
                onChange={(e) => setFormData({ ...formData, callerName: e.target.value })}
                className="w-full bg-console-bg border border-console-border rounded px-2 py-1 text-console-text text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-console-muted block mb-0.5">Blood needed</label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bloodReq"
                  checked={formData.requiresBlood}
                  onChange={(e) => setFormData({ ...formData, requiresBlood: e.target.checked })}
                  className="rounded border-console-border text-console-accent"
                />
                <label htmlFor="bloodReq" className="text-xs text-console-text cursor-pointer">
                  {formData.requiresBlood ? (formData.bloodTypeNeeded || 'Yes') : 'No'}
                </label>
              </div>
            </div>
          </div>

          {/* Coordinates readout */}
          <div className="flex items-center justify-between bg-console-bg p-1.5 rounded border border-console-border text-[11px] text-console-muted font-mono">
            <span className="flex items-center gap-1 text-console-text">
              <MapPin className="w-3.5 h-3.5 text-status-critical" />
              Incident: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
            </span>
            <span className="text-[10px] text-console-muted">Click map to relocate</span>
          </div>
        </div>

        {/* Live Operations Map */}
        <div className="bg-console-surface border border-console-border rounded p-2 flex-1 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-xs font-semibold text-console-text flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-console-accent" />
              Live GIS dispatch corridor
            </span>
            <span className="text-[10px] text-console-muted font-mono">
              PCMC / Pune Metro Area
            </span>
          </div>
          <div className="flex-1 w-full min-h-[280px]">
            <MapView
              hospitals={hospitals}
              incidentLocation={{ latitude: formData.latitude, longitude: formData.longitude }}
              onLocationSelect={handleLocationSelect}
              selectedHospitalId={selectedHospitalId}
              onHospitalSelect={(id) => setSelectedHospitalId(id)}
            />
          </div>
        </div>

        {/* Active Handover Status Pipeline */}
        {activeRequests.length > 0 && (
          <div className="bg-console-surface border border-console-border rounded p-3 text-xs">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-console-border">
              <span className="font-semibold text-console-text flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-status-available" />
                Active dispatch tracker ({activeRequests.length})
              </span>
              <span className="text-[10px] text-console-muted">End-to-end handoff</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeRequests.map((req) => {
                const isConflict = req.status === 'CONFLICT_FAILED';
                const isAccepted = req.status === 'ACCEPTED' || req.status === 'EN_ROUTE' || req.status === 'ARRIVED';
                const isDone = req.status === 'HANDED_OVER';

                return (
                  <div
                    key={req.id}
                    className={`p-2 rounded border transition-colors ${
                      isConflict
                        ? 'border-status-critical/60 bg-status-critical/10 text-console-text'
                        : isDone
                        ? 'border-console-border bg-console-bg opacity-75'
                        : 'border-console-border bg-console-bg'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-console-text">{req.incidentNumber}</span>
                        <span className="text-console-muted text-[11px]">({req.emergencyType})</span>
                      </div>

                      {/* Status chip with Color + Icon together */}
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
                        req.status === 'ACCEPTED' ? 'bg-status-available/20 text-status-available border border-status-available/30' :
                        req.status === 'EN_ROUTE' ? 'bg-console-accent/20 text-console-accent border border-console-accent/30' :
                        req.status === 'ARRIVED' ? 'bg-status-available/20 text-status-available border border-status-available/30' :
                        req.status === 'HANDED_OVER' ? 'bg-console-border text-console-muted border border-console-border' :
                        req.status === 'CONFLICT_FAILED' ? 'bg-status-critical/20 text-status-critical border border-status-critical/50 font-bold' :
                        req.status === 'REJECTED' ? 'bg-status-critical/20 text-status-critical border border-status-critical/30' :
                        'bg-status-warning/20 text-status-warning border border-status-warning/30'
                      }`}>
                        {req.status === 'ACCEPTED' && <CheckCircle2 className="w-3 h-3 text-status-available" />}
                        {req.status === 'EN_ROUTE' && <Ambulance className="w-3 h-3 text-console-accent" />}
                        {req.status === 'ARRIVED' && <CheckCircle2 className="w-3 h-3 text-status-available" />}
                        {req.status === 'HANDED_OVER' && <ShieldCheck className="w-3 h-3 text-console-muted" />}
                        {req.status === 'CONFLICT_FAILED' && <AlertTriangle className="w-3 h-3 text-status-critical" />}
                        {req.status === 'REJECTED' && <XCircle className="w-3 h-3 text-status-critical" />}
                        {req.status === 'PENDING' && <Clock className="w-3 h-3 text-status-warning" />}
                        <span>
                          {req.status === 'ACCEPTED' ? 'Bed reserved' :
                           req.status === 'EN_ROUTE' ? 'En route' :
                           req.status === 'ARRIVED' ? 'At bay' :
                           req.status === 'HANDED_OVER' ? 'Handed over' :
                           req.status === 'CONFLICT_FAILED' ? 'Double-booking conflict' :
                           req.status === 'REJECTED' ? 'Rejected' :
                           'Awaiting hospital'}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-console-muted">
                      <span>Target: <strong className="text-console-text">{req.assignedHospital?.name || 'Unassigned'}</strong></span>
                      <span className="font-mono">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>

                    {/* Conflict Error Message as required by Section 6.5 */}
                    {isConflict && (
                      <div className="mt-1.5 p-1.5 rounded bg-status-critical/20 border border-status-critical/40 text-[11px] text-console-text flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-status-critical flex-shrink-0 mt-0.5" />
                        <div>
                          <strong>Assignment collision: </strong>
                          {req.rejectionReason || 'Bed already reserved by another request — refresh to see updated availability'}
                        </div>
                      </div>
                    )}

                    {/* Workflow progression buttons */}
                    {isAccepted && !isDone && (
                      <div className="mt-2 pt-1.5 border-t border-console-border flex items-center justify-end gap-1.5">
                        {req.status === 'ACCEPTED' && (
                          <button
                            onClick={() => onUpdateHandoff(req.id, 'EN_ROUTE')}
                            className="px-2 py-0.5 rounded bg-console-accent text-white text-[11px] font-medium hover:bg-console-accent-hover"
                          >
                            Mark en route
                          </button>
                        )}
                        {req.status === 'EN_ROUTE' && (
                          <button
                            onClick={() => onUpdateHandoff(req.id, 'ARRIVED')}
                            className="px-2 py-0.5 rounded bg-status-available text-console-bg text-[11px] font-semibold hover:opacity-90"
                          >
                            Mark arrived at bay
                          </button>
                        )}
                        {req.status === 'ARRIVED' && (
                          <button
                            onClick={() => onUpdateHandoff(req.id, 'HANDED_OVER')}
                            className="px-2 py-0.5 rounded bg-console-border text-console-text text-[11px] font-medium hover:bg-console-border-light"
                          >
                            Complete handoff
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Ranked Hospital List (Rows, NOT cards!) (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-3">
        <div className="bg-console-surface border border-console-border rounded p-3 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between pb-2.5 mb-2 border-b border-console-border gap-2">
            <div>
              <div className="font-semibold text-console-text flex items-center gap-2 text-sm">
                <span>Ranked destination hospitals</span>
                <span className="text-[11px] bg-console-bg px-2 py-0.5 rounded font-mono text-console-accent border border-console-border">
                  {rankingMode === 'ml' ? 'GradientBoosting ML + SHAP' : 'Baseline Heuristic'}
                </span>
                {isRanking && <span className="text-[11px] text-console-muted animate-pulse">Calculating scores...</span>}
              </div>
              <div className="text-[11px] text-console-muted">
                Scored by haversine distance, resource fit, clinical specialty, and data freshness decay
              </div>
            </div>

            <div className="text-right text-[11px] text-console-muted">
              <span>Req: <strong className="text-console-text">{formData.requiredResourceType}</strong></span>
              <span className="mx-1.5">·</span>
              <span>Triage: <strong className="text-console-text">{formData.urgencyLevel}</strong></span>
            </div>
          </div>

          {/* Table Header Row */}
          <div className="grid grid-cols-12 gap-2 px-2 py-1 text-[11px] font-medium text-console-muted border-b border-console-border uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Hospital & Status</div>
            <div className="col-span-4">Score Breakdown (Explainable AI)</div>
            <div className="col-span-3 text-right">Capacity & Action</div>
          </div>

          {/* Hospital Rows (Strict adherence: ROWS, not cards!) */}
          <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5 mt-1">
            {rankedResults.map((item) => {
              const h = item.hospital;
              const scores = item.scores || {};
              const isSelected = h.id === selectedHospitalId;
              const icuAvail = Number(h.icuBedsAvailable || 0);
              const genAvail = Number(h.generalBedsAvailable || 0);
              const ageMinutes = item.dataAgeMinutes !== undefined ? item.dataAgeMinutes : 0;
              const isStale = ageMinutes >= 20;
              const isDepleted = icuAvail === 0;

              // Display score based on rankingMode
              const displayScore = rankingMode === 'ml' ? scores.ml : scores.baseline;
              const blendedScore = scores.blended;

              return (
                <div
                  key={h.id}
                  onClick={() => setSelectedHospitalId(h.id)}
                  className={`grid grid-cols-12 gap-2 p-2.5 rounded border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-console-accent bg-console-accent/5'
                      : 'border-console-border bg-console-surface hover:bg-console-surface-hover'
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-1 flex flex-col items-center justify-center border-r border-console-border pr-2">
                    <span className="font-mono text-base font-bold text-console-text">
                      #{item.rank}
                    </span>
                    <span className="text-[10px] font-mono text-console-accent tabular-nums">
                      {Math.round(displayScore)}
                    </span>
                  </div>

                  {/* Hospital Details Column */}
                  <div className="col-span-4 flex flex-col justify-between pr-1">
                    <div>
                      <div className="font-semibold text-console-text text-xs leading-tight flex items-center gap-1.5">
                        <span className="truncate">{h.name}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-console-accent"></span>}
                      </div>
                      <div className="text-[10px] text-console-muted truncate mt-0.5">{h.address}</div>
                    </div>

                    {/* Status with Color + Icon together & Timestamp (Section 6.3) */}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${
                        isDepleted ? 'bg-status-critical/15 text-status-critical border border-status-critical/30' :
                        isStale ? 'bg-status-warning/15 text-status-warning border border-status-warning/30' :
                        'bg-status-available/15 text-status-available border border-status-available/30'
                      }`}>
                        {isDepleted && <XCircle className="w-2.5 h-2.5" />}
                        {!isDepleted && isStale && <Clock className="w-2.5 h-2.5" />}
                        {!isDepleted && !isStale && <CheckCircle2 className="w-2.5 h-2.5" />}
                        <span>{isDepleted ? 'Capacity full' : isStale ? 'Stale data' : 'Verified fresh'}</span>
                      </span>

                      {/* Always visible last_updated timestamp (Section 6.3) */}
                      <span className="text-console-muted tabular-nums">
                        {ageMinutes < 1 ? `Synced ${Math.round(ageMinutes * 60)}s ago` : `Synced ${Math.round(ageMinutes)}m ago`}
                      </span>
                    </div>
                  </div>

                  {/* Score Breakdown Column — Animated bars with per-row stagger delay */}
                  <div className="col-span-4 flex flex-col justify-between border-l border-console-border pl-2">
                    <div className="space-y-1.5 text-[10px]">
                      {/* Distance */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-console-muted w-16 flex-shrink-0">Dist. {item.distanceKm}km</span>
                        <AnimatedScoreBar value={scores.distanceScore} color="#4C8DFF" delay={item.rank * 40} />
                        <span className="font-mono tabular-nums text-console-text w-7 text-right">{Math.round(scores.distanceScore)}</span>
                      </div>

                      {/* Freshness */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-console-muted w-16 flex-shrink-0">Freshness</span>
                        <AnimatedScoreBar
                          value={scores.freshnessScore}
                          color={isStale ? '#E3A008' : '#2FB8A6'}
                          delay={item.rank * 40 + 80}
                        />
                        <span className={`font-mono tabular-nums w-7 text-right ${
                          isStale ? 'text-status-warning font-bold' : 'text-status-available'
                        }`}>{Math.round(scores.freshnessScore)}</span>
                      </div>

                      {/* Match */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-console-muted w-16 flex-shrink-0">Match</span>
                        <AnimatedScoreBar
                          value={scores.matchScore}
                          color={item.matches?.resource ? '#34D399' : '#E85C4A'}
                          delay={item.rank * 40 + 160}
                        />
                        <span className="font-mono tabular-nums text-console-text w-7 text-right">{Math.round(scores.matchScore)}</span>
                      </div>
                    </div>

                    {/* SHAP Attribution Tags — show all 3 */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(item.explanations || []).slice(0, 3).map((exp, expIdx) => (
                        <span
                          key={expIdx}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                            exp.impact.includes('+') ? 'bg-status-available/10 text-status-available border-status-available/20' :
                            exp.impact.includes('!') ? 'bg-status-warning/10 text-status-warning border-status-warning/20' :
                            'bg-status-critical/10 text-status-critical border-status-critical/20'
                          }`}
                          title={exp.detail}
                        >
                          {exp.impact.split('')[0]} {exp.factor}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Capacity & Action Column — with ETA estimator */}
                  <div className="col-span-3 flex flex-col justify-between items-end border-l border-console-border pl-2 text-right">
                    {/* Live Bed Counters */}
                    <div className="text-[11px] space-y-0.5 w-full">
                      <div className="tabular-nums">
                        ICU: <strong className={icuAvail > 0 ? 'text-status-available' : 'text-status-critical'}>{icuAvail}</strong>
                        <span className="text-console-muted">/{h.icuBedsTotal}</span>
                      </div>
                      <div className="text-[10px] text-console-muted tabular-nums">
                        Gen: <strong className="text-console-text">{genAvail}</strong>/{h.generalBedsTotal}
                      </div>
                      <div className="text-[10px] text-console-muted">
                        O2: <span className="text-console-text font-mono">{h.o2SupplyPercent}%</span>
                      </div>
                      {/* ETA Estimator */}
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px]">
                        <Timer className="w-3 h-3 text-console-accent" />
                        <span className="text-console-muted">ETA:</span>
                        <span className={`font-mono tabular-nums font-semibold ${
                          etaMinutes(item.distanceKm) <= 8 ? 'text-status-available' :
                          etaMinutes(item.distanceKm) <= 15 ? 'text-status-warning' :
                          'text-status-critical'
                        }`}>
                          ~{etaMinutes(item.distanceKm)} min
                        </span>
                      </div>
                    </div>

                    {/* Reserve bed button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReserveBed(h);
                      }}
                      disabled={isDepleted || submittingId === h.id}
                      className={`w-full mt-2 py-1 px-2 rounded text-xs font-semibold transition-all ${
                        isDepleted
                          ? 'bg-console-border text-console-muted cursor-not-allowed'
                          : submittingId === h.id
                          ? 'bg-console-accent/70 text-white'
                          : 'bg-console-accent text-white hover:bg-console-accent-hover active:scale-95'
                      }`}
                    >
                      {submittingId === h.id ? 'Reserving...' : isDepleted ? 'No beds' : 'Reserve bed'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
