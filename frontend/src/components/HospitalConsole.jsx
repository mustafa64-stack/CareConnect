import React, { useState } from 'react';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Layers,
  Flame,
  Droplet,
  RefreshCw,
  Minus,
  Plus
} from 'lucide-react';
import { apiUrl } from '../apiConfig';

export default function HospitalConsole({
  hospitals = [],
  requests = [],
  onRefreshData,
  selectedHospId,
  setSelectedHospId
}) {
  const currentHospital = hospitals.find(h => h.id === selectedHospId) || hospitals[0] || {};
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectingReqId, setRejectingReqId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Critical ICU staff at emergency capacity');

  // Filter requests targeting this hospital
  const incomingRequests = requests.filter(r => r.assignedHospitalId === currentHospital.id);

  // Handle capacity changes
  const updateCapacity = async (deltaField, deltaValue) => {
    if (!currentHospital.id) return;
    setIsUpdating(true);

    const updatedData = {
      icuBedsAvailable: currentHospital.icuBedsAvailable,
      generalBedsAvailable: currentHospital.generalBedsAvailable,
      o2SupplyPercent: currentHospital.o2SupplyPercent,
      bloodBankStatus: currentHospital.bloodBankStatus
    };

    if (deltaField === 'icu') {
      updatedData.icuBedsAvailable = Math.max(0, currentHospital.icuBedsAvailable + deltaValue);
    } else if (deltaField === 'gen') {
      updatedData.generalBedsAvailable = Math.max(0, currentHospital.generalBedsAvailable + deltaValue);
    } else if (deltaField === 'o2') {
      updatedData.o2SupplyPercent = Math.max(0, Math.min(100, currentHospital.o2SupplyPercent + deltaValue));
    } else if (deltaField === 'blood') {
      updatedData.bloodBankStatus = deltaValue;
    }

    try {
      await fetch(apiUrl(`/api/hospitals/${currentHospital.id}/capacity`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      onRefreshData();
    } catch (err) {
      console.error('Error updating capacity:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Simulate stale data
  const handleSimulateStale = async () => {
    if (!currentHospital.id) return;
    try {
      await fetch(apiUrl(`/api/hospitals/${currentHospital.id}/simulate-stale`), { method: 'POST' });
      onRefreshData();
    } catch (err) {
      console.error('Error simulating stale telemetry:', err);
    }
  };

  // Audit / Refresh telemetry
  const handleRefreshTelemetry = async () => {
    if (!currentHospital.id) return;
    try {
      await fetch(apiUrl(`/api/hospitals/${currentHospital.id}/refresh-telemetry`), { method: 'POST' });
      onRefreshData();
    } catch (err) {
      console.error('Error refreshing telemetry:', err);
    }
  };

  // Handle Accept Request (Atomic Lock)
  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await fetch(apiUrl(`/api/requests/${requestId}/respond`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT' })
      });
      onRefreshData();
    } catch (err) {
      console.error('Error responding to request:', err);
      onRefreshData();
    }
  };

  // Handle Reject Request
  const handleRejectRequest = async (requestId) => {
    try {
      await fetch(apiUrl(`/api/requests/${requestId}/respond`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reason: rejectReason })
      });
      setRejectingReqId(null);
      onRefreshData();
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const ageMinutes = currentHospital.lastUpdated
    ? Math.max(0, (Date.now() - new Date(currentHospital.lastUpdated).getTime()) / 60000)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 min-h-[calc(100vh-50px)]">
      {/* LEFT COLUMN: Hospital Identity & Live Capacity Controls (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        {/* Hospital Selector */}
        <div className="bg-console-surface border border-console-border rounded p-3 text-xs">
          <label className="text-[11px] text-console-muted block mb-1 font-medium">Select Hospital Terminal:</label>
          <select
            value={currentHospital.id || ''}
            onChange={(e) => setSelectedHospId(e.target.value)}
            className="w-full bg-console-bg border border-console-border rounded p-2 text-console-text font-semibold text-xs focus:border-console-accent"
          >
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.code})
              </option>
            ))}
          </select>
          <div className="text-[11px] text-console-muted mt-1.5 flex items-center justify-between">
            <span className="truncate">{currentHospital.address}</span>
            <span className="font-mono text-console-accent">Level {currentHospital.traumaLevel || 1} Trauma</span>
          </div>
        </div>

        {/* Real-Time Capacity Management Panel */}
        <div className="bg-console-surface border border-console-border rounded p-3 text-xs flex-1 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-console-border">
            <span className="font-semibold text-console-text flex items-center gap-1.5 text-sm">
              <Building2 className="w-4 h-4 text-console-accent" />
              Live capacity management
            </span>
            <span className="text-[10px] text-console-muted font-mono">
              Terminal ID: {currentHospital.code}
            </span>
          </div>

          {/* ICU Beds Stepper */}
          <div className="bg-console-bg border border-console-border rounded p-2.5 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-console-text text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-status-available"></span>
                ICU beds available
              </span>
              <span className="text-console-muted text-[11px] tabular-nums">
                Total: {currentHospital.icuBedsTotal}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xl font-mono font-bold text-console-text tabular-nums">
                {currentHospital.icuBedsAvailable}
                <span className="text-xs font-normal text-console-muted ml-1">beds</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateCapacity('icu', -1)}
                  disabled={isUpdating || currentHospital.icuBedsAvailable <= 0}
                  className="w-7 h-7 rounded bg-console-surface border border-console-border text-console-text flex items-center justify-center hover:bg-console-surface-hover disabled:opacity-40"
                  title="Decrement ICU Bed"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateCapacity('icu', 1)}
                  disabled={isUpdating || currentHospital.icuBedsAvailable >= currentHospital.icuBedsTotal}
                  className="w-7 h-7 rounded bg-console-surface border border-console-border text-console-text flex items-center justify-center hover:bg-console-surface-hover disabled:opacity-40"
                  title="Increment ICU Bed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* General Beds Stepper */}
          <div className="bg-console-bg border border-console-border rounded p-2.5 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-medium text-console-text text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-console-accent"></span>
                General emergency beds
              </span>
              <span className="text-console-muted text-[11px] tabular-nums">
                Total: {currentHospital.generalBedsTotal}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xl font-mono font-bold text-console-text tabular-nums">
                {currentHospital.generalBedsAvailable}
                <span className="text-xs font-normal text-console-muted ml-1">beds</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateCapacity('gen', -1)}
                  disabled={isUpdating || currentHospital.generalBedsAvailable <= 0}
                  className="w-7 h-7 rounded bg-console-surface border border-console-border text-console-text flex items-center justify-center hover:bg-console-surface-hover disabled:opacity-40"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => updateCapacity('gen', 1)}
                  disabled={isUpdating || currentHospital.generalBedsAvailable >= currentHospital.generalBedsTotal}
                  className="w-7 h-7 rounded bg-console-surface border border-console-border text-console-text flex items-center justify-center hover:bg-console-surface-hover disabled:opacity-40"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Oxygen Supply */}
          <div className="bg-console-bg border border-console-border rounded p-2.5 mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] text-console-muted flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-console-accent" />
                Central O2 reservoir
              </span>
              <span className="font-mono text-console-text tabular-nums">{currentHospital.o2SupplyPercent}%</span>
            </div>
            <div className="w-full bg-console-surface h-2 rounded overflow-hidden">
              <div
                className={`h-full ${currentHospital.o2SupplyPercent > 80 ? 'bg-status-available' : 'bg-status-warning'}`}
                style={{ width: `${currentHospital.o2SupplyPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Blood Bank Status */}
          <div className="bg-console-bg border border-console-border rounded p-2.5 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-console-muted flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-status-critical" />
                Blood bank inventory
              </span>
              <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                currentHospital.bloodBankStatus === 'Optimal' ? 'bg-status-available/20 text-status-available' :
                currentHospital.bloodBankStatus === 'Moderate' ? 'bg-status-warning/20 text-status-warning' :
                'bg-status-critical/20 text-status-critical'
              }`}>
                {currentHospital.bloodBankStatus}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              {['Optimal', 'Moderate', 'Critical'].map((st) => (
                <button
                  key={st}
                  onClick={() => updateCapacity('blood', st)}
                  className={`py-1 rounded border text-center font-medium ${
                    currentHospital.bloodBankStatus === st
                      ? 'border-console-accent bg-console-accent/20 text-console-accent'
                      : 'border-console-border bg-console-surface text-console-muted hover:text-console-text'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Freshness & Simulator Buttons */}
          <div className="mt-auto pt-2 border-t border-console-border space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-console-muted">Telemetry state:</span>
              <span className={`font-mono tabular-nums ${ageMinutes > 20 ? 'text-status-warning font-semibold' : 'text-status-available'}`}>
                {ageMinutes > 20 ? `Stale (${Math.round(ageMinutes)}m ago)` : `Live (${Math.round(ageMinutes * 60)}s ago)`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleSimulateStale}
                className="px-2 py-1.5 rounded bg-status-warning/15 border border-status-warning/30 text-status-warning hover:bg-status-warning/25 text-[11px] font-medium"
                title="Ages telemetry to 55 minutes to test decay scoring"
              >
                Simulate stale data
              </button>
              <button
                onClick={handleRefreshTelemetry}
                className="px-2 py-1.5 rounded bg-status-available/15 border border-status-available/30 text-status-available hover:bg-status-available/25 text-[11px] font-medium flex items-center justify-center gap-1"
                title="Sync and audit telemetry to current timestamp"
              >
                <RefreshCw className="w-3 h-3" />
                Audit & sync
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Incoming Request Queue (Rows, NOT cards!) (8 cols) */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        <div className="bg-console-surface border border-console-border rounded p-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-console-border">
            <div>
              <div className="font-semibold text-console-text flex items-center gap-2 text-sm">
                <span>Incoming patient queue</span>
                <span className="bg-console-bg px-2 py-0.5 rounded text-xs font-mono text-console-text border border-console-border">
                  {incomingRequests.length} queued
                </span>
              </div>
              <div className="text-[11px] text-console-muted">
                Hospital emergency triage reception desk for {currentHospital.name}
              </div>
            </div>

            {/* Live Bed Count readout */}
            <div className="text-right text-xs">
              <span className="text-console-muted">Remaining beds: </span>
              <strong className={`font-mono text-sm ${currentHospital.icuBedsAvailable > 0 ? 'text-status-available' : 'text-status-critical'}`}>
                {currentHospital.icuBedsAvailable} ICU
              </strong>
              <span className="text-console-muted mx-1">·</span>
              <span className="font-mono text-console-text">{currentHospital.generalBedsAvailable} Gen</span>
            </div>
          </div>

          {/* Empty state (Section 6.5: instructions, not decoration) */}
          {incomingRequests.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-console-muted">
              <Building2 className="w-10 h-10 mb-2 opacity-30 text-console-muted" />
              <div className="text-sm font-medium text-console-text">No incoming requests yet</div>
              <div className="text-xs text-console-muted mt-1 max-w-sm">
                Use the Dispatcher Console to route an emergency incident to {currentHospital.name}, or trigger a test scenario from the top bar.
              </div>
            </div>
          )}

          {/* Incoming Request Rows */}
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {incomingRequests.map((req) => {
              const isPending = req.status === 'PENDING';
              const isAccepted = req.status === 'ACCEPTED' || req.status === 'EN_ROUTE' || req.status === 'ARRIVED';
              const isConflict = req.status === 'CONFLICT_FAILED';
              const isRejected = req.status === 'REJECTED';

              return (
                <div
                  key={req.id}
                  className={`p-3 rounded border transition-colors ${
                    isPending
                      ? 'border-status-warning/60 bg-status-warning/5 request-pulse'
                      : isConflict
                      ? 'border-status-critical/60 bg-status-critical/10'
                      : isAccepted
                      ? 'border-status-available/40 bg-status-available/5'
                      : 'border-console-border bg-console-bg opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-console-text text-sm">
                          {req.incidentNumber}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          req.urgencyLevel === 'Immediate' ? 'bg-status-critical/20 text-status-critical border border-status-critical/30' :
                          'bg-status-warning/20 text-status-warning border border-status-warning/30'
                        }`}>
                          {req.urgencyLevel}
                        </span>
                        <span className="text-[11px] text-console-muted font-mono">
                          {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <div className="font-semibold text-console-text text-xs mt-1">
                        {req.emergencyType}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-console-muted mt-1">
                        <span>Caller: <strong className="text-console-text">{req.callerName}</strong></span>
                        <span>Patient: <strong className="text-console-text">{req.patientAge}y {req.patientGender}</strong></span>
                        <span>Resource: <strong className="text-console-accent">{req.requiredResourceType}</strong></span>
                        {req.requiresBlood && (
                          <span className="text-status-critical font-medium">Blood needed: {req.bloodTypeNeeded || 'Yes'}</span>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
                        isAccepted ? 'bg-status-available/20 text-status-available border border-status-available/30' :
                        isConflict ? 'bg-status-critical/20 text-status-critical border border-status-critical/60 font-bold' :
                        isRejected ? 'bg-status-critical/20 text-status-critical border border-status-critical/30' :
                        'bg-status-warning/20 text-status-warning border border-status-warning/30'
                      }`}>
                        {isAccepted && <CheckCircle2 className="w-3 h-3 text-status-available" />}
                        {isConflict && <AlertTriangle className="w-3 h-3 text-status-critical" />}
                        {isRejected && <XCircle className="w-3 h-3 text-status-critical" />}
                        {isPending && <Clock className="w-3 h-3 text-status-warning" />}
                        <span>
                          {isAccepted ? (req.status === 'ACCEPTED' ? 'Request accepted · Bed locked' : req.status) :
                           isConflict ? 'Double-booking conflict' :
                           isRejected ? 'Rejected' :
                           'Awaiting staff confirmation'}
                        </span>
                      </span>

                      {/* Inline Accept / Reject buttons (Immediate visual feedback, Section 6.3) */}
                      {isPending && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="px-3 py-1 rounded bg-status-available text-console-bg text-xs font-semibold hover:opacity-90 transition-opacity"
                          >
                            Accept request
                          </button>
                          <button
                            onClick={() => setRejectingReqId(req.id)}
                            className="px-2.5 py-1 rounded bg-console-border text-console-text text-xs hover:bg-console-surface-hover"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Explicit Conflict Banner (Section 6.3 & Section 6.5) */}
                  {isConflict && (
                    <div className="mt-2 p-2 rounded bg-status-critical/20 border border-status-critical/50 text-xs text-console-text flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-status-critical flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-status-critical font-bold">Double-Booking Collision Handled: </strong>
                        <span>{req.rejectionReason || 'Bed already reserved by another request — refresh to see updated availability'}</span>
                        <div className="text-[11px] text-console-muted mt-0.5">
                          Atomic transaction intercepted concurrent request. Diverting paramedic dispatch to alternate destination.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reject Reason Modal / Inline */}
                  {rejectingReqId === req.id && (
                    <div className="mt-2 pt-2 border-t border-console-border flex items-center gap-2 text-xs">
                      <span className="text-console-muted">Reason:</span>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="flex-1 bg-console-bg border border-console-border rounded px-2 py-1 text-console-text"
                      />
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="px-2.5 py-1 rounded bg-status-critical text-white text-xs font-medium"
                      >
                        Confirm reject
                      </button>
                      <button
                        onClick={() => setRejectingReqId(null)}
                        className="px-2 py-1 rounded text-console-muted hover:text-console-text text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
