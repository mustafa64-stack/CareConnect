import React, { useState, useEffect } from 'react';

function BedBar({ available, total, color }) {
  const pct = total > 0 ? (available / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      <div style={{ flex: 1, height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.4s ease'
        }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 44, textAlign: 'right', fontWeight: 600 }}>
        {available}/{total}
      </span>
    </div>
  );
}

function RequestCard({ req, onAccept, onReject, onAdvanceStatus }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('Capacity saturated');
  const isConflict = req.status === 'CONFLICT_FAILED';
  const isPending = req.status === 'PENDING';
  const isAccepted = req.status === 'ACCEPTED';
  const isEnRoute = req.status === 'EN_ROUTE';
  const isArrived = req.status === 'ARRIVED';
  const isDone = req.status === 'HANDED_OVER';

  const urgencyColor = req.urgencyLevel === 'Immediate' ? '#DC2626' : req.urgencyLevel === 'Very Urgent' ? '#D97706' : '#059669';
  const urgencyBg = req.urgencyLevel === 'Immediate' ? '#FEF2F2' : req.urgencyLevel === 'Very Urgent' ? '#FFFBEB' : '#ECFDF5';

  return (
    <div
      className={isPending ? 'pulse-red glass-panel hover-lift' : 'glass-panel hover-lift'}
      style={{
        border: `1.5px solid ${isConflict ? '#DC2626' : isPending ? '#2563EB' : isAccepted || isEnRoute ? '#059669' : 'var(--border)'}`,
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 12,
        opacity: isDone ? 0.65 : 1
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              background: urgencyBg,
              color: urgencyColor,
              padding: '2px 8px',
              borderRadius: 99,
              border: `1px solid ${urgencyColor}40`
            }}>
              {req.urgencyLevel === 'Immediate' ? '🔴 Critical' : req.urgencyLevel === 'Very Urgent' ? '🟡 Serious' : '🟢 Stable'}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', fontFamily: 'monospace' }}>
              {req.incidentNumber}
            </span>
          </div>

          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
            {req.emergencyType}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Patient: {req.patientAge} yr, {req.patientGender} · Unit: {req.callerName}
            {req.requiresBlood && (
              <span style={{ color: '#DC2626', fontWeight: 600, marginLeft: 8 }}>
                🩸 Blood Required ({req.bloodTypeNeeded || 'Any'})
              </span>
            )}
          </div>
        </div>

        <div>
          {isAccepted && (
            <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99 }}>
              ✓ Bed Reserved
            </span>
          )}
          {isEnRoute && (
            <span style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99 }}>
              🚑 En Route
            </span>
          )}
          {isArrived && (
            <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99 }}>
              🏥 Bay Arrived
            </span>
          )}
          {isDone && (
            <span style={{ background: '#F1F5F9', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99 }}>
              Handed Over
            </span>
          )}
          {req.status === 'REJECTED' && (
            <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99 }}>
              Declined
            </span>
          )}
        </div>
      </div>

      {isConflict && (
        <div style={{
          background: '#FEF2F2',
          border: '1.5px solid #FECACA',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          color: '#991B1B',
          marginTop: 8,
          marginBottom: 10,
          display: 'flex',
          gap: 8,
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <strong>Atomic Double-Booking Collision Prevented!</strong>
            <div>{req.rejectionReason}</div>
          </div>
        </div>
      )}

      {isPending && !rejecting && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={() => onAccept(req.id)}
            style={{
              flex: 1,
              padding: '9px 14px',
              background: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ✓ Accept & Lock Bed
          </button>
          <button
            onClick={() => setRejecting(true)}
            style={{
              padding: '9px 16px',
              background: '#FFFFFF',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Decline
          </button>
        </div>
      )}

      {(isAccepted || isEnRoute || isArrived) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          {isAccepted && (
            <button
              onClick={() => onAdvanceStatus(req.id, 'EN_ROUTE')}
              style={{ flex: 1, padding: '7px 12px', background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: 12, fontWeight: 600 }}
            >
              Mark En Route 🚑
            </button>
          )}
          {isEnRoute && (
            <button
              onClick={() => onAdvanceStatus(req.id, 'ARRIVED')}
              style={{ flex: 1, padding: '7px 12px', background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', borderRadius: 6, fontSize: 12, fontWeight: 600 }}
            >
              Mark Arrived at Bay 🏥
            </button>
          )}
          {isArrived && (
            <button
              onClick={() => onAdvanceStatus(req.id, 'HANDED_OVER')}
              style={{ flex: 1, padding: '7px 12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 6, fontSize: 12, fontWeight: 600 }}
            >
              Complete Handoff ✅
            </button>
          )}
        </div>
      )}

      {rejecting && (
        <div style={{ marginTop: 8 }}>
          <input
            type="text"
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', marginBottom: 8, border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { onReject(req.id, reason); setRejecting(false); }}
              style={{ flex: 1, padding: '8px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600 }}
            >
              Confirm Decline
            </button>
            <button
              onClick={() => setRejecting(false)}
              style={{ padding: '8px 14px', background: '#FFF', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HospitalPage({ hospitals, requests, onBack, onRefresh, sseConnected }) {
  const [selectedHospId, setSelectedHospId] = useState(hospitals[0]?.id || '');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!selectedHospId && hospitals?.length > 0) {
      setSelectedHospId(hospitals[0].id);
    }
  }, [hospitals, selectedHospId]);

  const hospital = hospitals.find(h => h.id === selectedHospId) || hospitals[0] || {};
  const myRequests = requests.filter(r => r.assignedHospitalId === hospital.id);
  const pendingCount = myRequests.filter(r => r.status === 'PENDING').length;
  const ageMin = hospital.lastUpdated
    ? Math.max(0, (Date.now() - new Date(hospital.lastUpdated).getTime()) / 60000)
    : 0;

  const handleAccept = async (reqId) => {
    try {
      await fetch(`/api/requests/${reqId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT' })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
      onRefresh();
    }
  };

  const handleReject = async (reqId, reason) => {
    try {
      await fetch(`/api/requests/${reqId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reason })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdvanceStatus = async (reqId, status) => {
    try {
      await fetch(`/api/requests/${reqId}/handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const refreshTelemetry = async () => {
    if (!hospital.id) return;
    try {
      await fetch(`/api/hospitals/${hospital.id}/refresh-telemetry`, { method: 'POST' });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const updateBeds = async (field, delta) => {
    if (!hospital.id) return;
    setIsUpdating(true);
    const payload = {};
    if (field === 'icu') payload.icuBedsAvailable = Math.max(0, Math.min(hospital.icuBedsTotal, hospital.icuBedsAvailable + delta));
    if (field === 'gen') payload.generalBedsAvailable = Math.max(0, Math.min(hospital.generalBedsTotal, hospital.generalBedsAvailable + delta));
    try {
      await fetch(`/api/hospitals/${hospital.id}/capacity`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="page-enter mesh-bg" style={{ minHeight: 'calc(100vh - 60px)', padding: '24px 20px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        
        <div className="glass-panel" style={{ borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Facility
            </div>
            <select
              value={selectedHospId}
              onChange={e => setSelectedHospId(e.target.value)}
              style={{
                marginTop: 4,
                padding: '8px 12px',
                border: '1.5px solid var(--border)',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                background: 'white',
                minWidth: 260
              }}
            >
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          <button
            onClick={refreshTelemetry}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              color: '#2563EB',
              cursor: 'pointer'
            }}
          >
            ⚡ Sync Telemetry Now
          </button>
        </div>

        <div className="glass-panel" style={{ borderRadius: 16, padding: '22px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>{hospital.name}</div>
              <div style={{ fontSize: 12, color: ageMin > 20 ? '#B45309' : 'var(--text-muted)', marginTop: 2 }}>
                {ageMin > 20 ? `⚠ Telemetry aged ${Math.round(ageMin)}m ago (Stale penalty applied)` : `Live synced ${Math.round(ageMin * 60)}s ago`}
              </div>
            </div>
            <span style={{
              background: hospital.icuBedsAvailable > 0 ? '#ECFDF5' : '#FEF2F2',
              color: hospital.icuBedsAvailable > 0 ? '#059669' : '#DC2626',
              fontSize: 12,
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: 99
            }}>
              {hospital.icuBedsAvailable > 0 ? 'Accepting Patients' : 'ICU Capacity Full'}
            </span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>ICU Beds</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => updateBeds('icu', -1)}
                  disabled={isUpdating || hospital.icuBedsAvailable <= 0}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: '#FFF', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  −
                </button>
                <span style={{ fontSize: 15, fontWeight: 800, minWidth: 28, textAlign: 'center' }}>
                  {hospital.icuBedsAvailable}
                </span>
                <button
                  onClick={() => updateBeds('icu', 1)}
                  disabled={isUpdating || hospital.icuBedsAvailable >= hospital.icuBedsTotal}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: '#FFF', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>
            <BedBar
              available={hospital.icuBedsAvailable}
              total={hospital.icuBedsTotal}
              color={hospital.icuBedsAvailable > 3 ? '#059669' : hospital.icuBedsAvailable > 0 ? '#D97706' : '#DC2626'}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>General Beds</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => updateBeds('gen', -1)}
                  disabled={isUpdating || hospital.generalBedsAvailable <= 0}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: '#FFF', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  −
                </button>
                <span style={{ fontSize: 15, fontWeight: 800, minWidth: 28, textAlign: 'center' }}>
                  {hospital.generalBedsAvailable}
                </span>
                <button
                  onClick={() => updateBeds('gen', 1)}
                  disabled={isUpdating || hospital.generalBedsAvailable >= hospital.generalBedsTotal}
                  style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: '#FFF', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
                >
                  +
                </button>
              </div>
            </div>
            <BedBar available={hospital.generalBedsAvailable} total={hospital.generalBedsTotal} color="#2563EB" />
          </div>

          <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12 }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Oxygen Supply: </span>
              <strong>{hospital.o2SupplyPercent}%</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Blood Bank: </span>
              <strong style={{ color: hospital.bloodBankStatus === 'Optimal' ? '#059669' : hospital.bloodBankStatus === 'Critical' ? '#DC2626' : '#D97706' }}>
                {hospital.bloodBankStatus}
              </strong>
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Incoming Patient Queue</h3>
            {pendingCount > 0 && (
              <span style={{ background: '#DC2626', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 }}>
                {pendingCount} Awaiting Review
              </span>
            )}
          </div>

          {myRequests.length === 0 ? (
            <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '36px', textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🛏</div>
              <div style={{ color: 'var(--text)', fontSize: 14, fontWeight: 600 }}>Queue Clean</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                No active ambulances routed to {hospital.name} at this moment.
              </div>
            </div>
          ) : (
            myRequests.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                onAccept={handleAccept}
                onReject={handleReject}
                onAdvanceStatus={handleAdvanceStatus}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
