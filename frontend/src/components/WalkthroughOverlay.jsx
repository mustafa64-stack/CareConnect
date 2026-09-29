import React, { useState, useEffect } from 'react';
import {
  X, ChevronRight, ChevronLeft, Play, Ambulance,
  Clock, AlertTriangle, CheckCircle2, BrainCircuit,
  Layers, Zap, MapPin, Building2
} from 'lucide-react';

const STEPS = [
  {
    id: 'welcome',
    title: 'Golden Hour Emergency Operations',
    subtitle: 'Developed by #include<tech_squad>',
    description: 'A real-time mission-control console connecting ambulance dispatchers to regional hospitals for critical emergency patient routing. This 3-minute walkthrough covers all evaluation scenarios.',
    icon: Ambulance,
    color: '#4C8DFF',
    hint: null,
  },
  {
    id: 'dispatcher',
    title: 'Step 1 — Dispatcher Console',
    subtitle: 'Emergency Incident Intake & ML-Ranked Hospital Selection',
    description: 'The left panel is the ambulance dispatcher\'s workstation. Set an emergency type, urgency triage (T1 Red / T2 Yellow), and required resource. The system instantly re-ranks all 8 regional PCMC hospitals using a trained GradientBoosting ML model.',
    icon: Layers,
    color: '#2FB8A6',
    hint: 'Look at the right panel — 8 ranked hospitals with score breakdown bars for Distance, Freshness, and Match.',
    action: 'dispatcher',
  },
  {
    id: 'map',
    title: 'Step 2 — Live GIS Corridor Map',
    subtitle: 'Real-Time Spatial Context for Ambulance Routing',
    description: 'The dark CartoDB map shows all 8 hospitals color-coded by status: Teal = available & fresh, Amber = stale telemetry (>20 min), Red = zero beds or full. Click any hospital pin to select it and see a dashed route line drawn to the incident.',
    icon: MapPin,
    color: '#A78BFA',
    hint: 'Try clicking on a hospital marker on the map, or click anywhere on the map to reposition the incident.',
    action: 'dispatcher',
  },
  {
    id: 'scenario-normal',
    title: 'Scenario 1 — Normal Assignment Flow',
    subtitle: 'Standard end-to-end emergency dispatch',
    description: 'Click "1. Normal case" in the top bar. A Cardiac Arrest incident near PCCOE campus is created. Dispatch to Aditya Birla Memorial (Rank #1 — fresh telemetry, matching ICU capacity). Switch to the Hospital Console and click "Accept request" to atomically reserve the bed.',
    icon: CheckCircle2,
    color: '#2FB8A6',
    hint: 'After accepting, use the Dispatcher Console to advance the request through En Route → Arrived → Handed Over.',
    action: 'trigger-normal',
  },
  {
    id: 'scenario-stale',
    title: 'Scenario 2 — Stale Telemetry Decay',
    subtitle: 'Freshness decay penalizes unverified hospital data',
    description: 'Click "2. Stale data". Lokmanya Hospital (closest to the incident at 1.2 km) has its telemetry aged to 55 minutes. Watch the Freshness score drop from 95% to ~15%, dropping Lokmanya below Aditya Birla Memorial (4.2 km away but verified 20s ago).',
    icon: Clock,
    color: '#E3A008',
    hint: 'The formula is exp(−age_minutes/30). After 55 min: exp(−55/30) ≈ 0.16 → 16% freshness score.',
    action: 'trigger-stale',
  },
  {
    id: 'scenario-double',
    title: 'Scenario 3 — Double-Booking Conflict',
    subtitle: 'Atomic transaction prevents concurrent ghost reservations',
    description: 'Click "3. Double-booking conflict". Lokmanya Hospital has exactly 1 ICU bed. Two ambulances (INC-DBL-ALPHA and INC-DBL-BETA) are both dispatched to it. Switch to Split View. Accept Request A — bed locks to 0. Now accept Request B — a DOUBLE_BOOKING_COLLISION fires with HTTP 409.',
    icon: AlertTriangle,
    color: '#E85C4A',
    hint: 'The collision banner reads: "Bed already reserved by another request — refresh to see updated availability". This is a Prisma atomic $transaction.',
    action: 'trigger-double',
  },
  {
    id: 'ml-model',
    title: 'Bonus — Explainable AI / ML Model',
    subtitle: 'GradientBoosting + 99.3% accuracy + SHAP attribution',
    description: 'Click the "ML Model + SHAP" button in the header. Every ranked hospital row shows score breakdown bars (Distance, Freshness, Match) and attribution tags like "+High Rapid Transit" or "−Critical Stale Data". Click the brain icon to see the full ML metrics panel.',
    icon: BrainCircuit,
    color: '#A78BFA',
    hint: 'The ML model was trained on 5,000 synthetic clinical scenarios with ROC-AUC 0.995 and F1 of 0.996.',
    action: 'ml-metrics',
  },
];

export default function WalkthroughOverlay({ onClose, onTriggerScenario, setCurrentView, setShowMLMetrics }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleAction = () => {
    if (current.action === 'dispatcher') setCurrentView('dispatcher');
    else if (current.action === 'trigger-normal') { onTriggerScenario('normal'); setCurrentView('split'); }
    else if (current.action === 'trigger-stale') { onTriggerScenario('stale-data'); setCurrentView('dispatcher'); }
    else if (current.action === 'trigger-double') { onTriggerScenario('double-booking'); setCurrentView('split'); }
    else if (current.action === 'ml-metrics') { setShowMLMetrics(true); onClose(); return; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:items-center">
      <div className="bg-console-surface border border-console-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-0.5 bg-console-bg">
          <div
            className="h-full bg-console-accent transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-5">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `${current.color}20`, border: `1px solid ${current.color}40` }}
            >
              <Icon className="w-5 h-5" style={{ color: current.color }} />
            </div>
            <div>
              <div className="text-[11px] font-mono text-console-muted uppercase tracking-wider mb-0.5">
                {step + 1} / {STEPS.length}
              </div>
              <div className="font-bold text-console-text text-sm leading-tight">{current.title}</div>
              <div className="text-[11px] text-console-accent mt-0.5">{current.subtitle}</div>
            </div>
          </div>

          <p className="text-xs text-console-muted leading-relaxed mb-4">
            {current.description}
          </p>

          {current.hint && (
            <div className="flex items-start gap-2 p-2.5 rounded bg-console-bg border border-console-border text-[11px] text-console-muted mb-4">
              <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: current.color }} />
              <span>{current.hint}</span>
            </div>
          )}

          {/* Action button */}
          {current.action && (
            <button
              onClick={handleAction}
              className="w-full py-2 rounded text-xs font-semibold mb-4 flex items-center justify-center gap-1.5 transition-colors"
              style={{
                background: `${current.color}20`,
                border: `1px solid ${current.color}50`,
                color: current.color
              }}
            >
              <Play className="w-3 h-3" />
              {current.action === 'trigger-normal' && 'Load Scenario 1 & Switch to Split View'}
              {current.action === 'trigger-stale' && 'Load Scenario 2 — Activate Stale Telemetry'}
              {current.action === 'trigger-double' && 'Load Scenario 3 — 1 Bed, 2 Requests'}
              {current.action === 'ml-metrics' && 'Open ML Metrics Panel'}
              {current.action === 'dispatcher' && 'Go to Dispatcher Console'}
            </button>
          )}
        </div>

        {/* Footer Nav */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-console-border">
          <button
            onClick={onClose}
            className="text-xs text-console-muted hover:text-console-text"
          >
            Skip walkthrough
          </button>

          <div className="flex items-center gap-1.5">
            {/* Dot indicators */}
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ background: i === step ? current.color : '#2A3644' }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-console-muted hover:text-console-text hover:bg-console-bg border border-console-border"
              >
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={onClose}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs bg-console-accent text-white font-semibold hover:bg-console-accent-hover"
              >
                <CheckCircle2 className="w-3 h-3" /> Done
              </button>
            ) : (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-white hover:opacity-90"
                style={{ background: current.color }}
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
