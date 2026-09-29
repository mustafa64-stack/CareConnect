import React, { useState } from 'react';
import {
  Activity, RefreshCw, SplitSquareVertical,
  BookOpen, BrainCircuit, ChevronDown, Radio, Ambulance, Building2
} from 'lucide-react';

const VIEWS = [
  { id: 'dispatcher', label: 'Dispatcher', icon: Ambulance, desc: 'Route incoming emergencies' },
  { id: 'hospital', label: 'Hospital', icon: Building2, desc: 'Manage beds & accept patients' },
  { id: 'split', label: 'Split view', icon: SplitSquareVertical, desc: 'Both consoles side-by-side', accent: true },
];

const SCENARIOS = [
  { id: 'normal', label: 'Normal assignment', color: 'available', hotkey: '1' },
  { id: 'stale-data', label: 'Stale telemetry', color: 'warning', hotkey: '2' },
  { id: 'double-booking', label: 'Double-booking conflict', color: 'critical', hotkey: '3' },
];

const STATUS_COLORS = {
  available: 'text-status-available border-status-available/40 bg-status-available/10',
  warning: 'text-status-warning border-status-warning/40 bg-status-warning/10',
  critical: 'text-status-critical border-status-critical/40 bg-status-critical/10',
};

export default function HeaderBar({
  currentView, setCurrentView,
  lastSyncTime, isSyncing,
  activeScenario, onTriggerScenario, onResetData,
  rankingMode, setRankingMode,
  onShowWalkthrough, onShowMLMetrics,
}) {
  const [scenariosOpen, setScenariosOpen] = useState(false);
  const syncSecondsAgo = Math.max(0, Math.floor((Date.now() - (lastSyncTime || Date.now())) / 1000));

  const activeScenarioMeta = SCENARIOS.find(s => s.id === activeScenario);

  return (
    <header className="bg-console-surface border-b border-console-border flex flex-col">
      {/* ── Row 1: Brand + View switcher + Actions ────────────────── */}
      <div className="px-4 h-11 flex items-center justify-between gap-4">

        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-6 h-6 rounded bg-status-available/20 border border-status-available/40 flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-status-available" />
          </div>
          <span className="font-semibold text-console-text text-sm tracking-tight">
            Emergency Resource Allocator
          </span>
          <span className="hidden sm:block text-[10px] bg-console-border px-1.5 py-0.5 rounded text-console-muted font-mono">
            #include&lt;tech_squad&gt;
          </span>
        </div>

        {/* Center: View Switcher Tabs */}
        <div className="flex items-center gap-0.5 bg-console-bg border border-console-border rounded p-0.5">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setCurrentView(v.id)}
              title={v.desc}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs transition-colors font-medium ${
                currentView === v.id
                  ? v.accent
                    ? 'bg-console-accent/20 text-console-accent'
                    : 'bg-console-surface text-console-text shadow-sm'
                  : 'text-console-muted hover:text-console-text'
              }`}
            >
              <v.icon className="w-3 h-3" />
              {v.label}
            </button>
          ))}
        </div>

        {/* Right: Status + Utility buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Live sync dot */}
          <div className="flex items-center gap-1.5 text-[11px] text-console-muted">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSyncing ? 'bg-status-warning animate-pulse' : 'bg-status-available'}`} />
            <span className="hidden sm:inline tabular-nums">{syncSecondsAgo}s ago</span>
          </div>

          {/* ML mode toggle */}
          <div className="flex rounded overflow-hidden border border-console-border text-[11px] bg-console-bg">
            <button
              onClick={() => setRankingMode('ml')}
              className={`px-2 py-1 font-mono ${rankingMode === 'ml' ? 'bg-console-accent text-white' : 'text-console-muted hover:text-console-text'}`}
              title="GradientBoosting ML + SHAP explainability"
            >
              ML+SHAP
            </button>
            <button
              onClick={() => setRankingMode('baseline')}
              className={`px-2 py-1 font-mono ${rankingMode === 'baseline' ? 'bg-console-border-light text-console-text' : 'text-console-muted hover:text-console-text'}`}
              title="Hand-tuned heuristic formula"
            >
              Formula
            </button>
          </div>

          {/* ML Stats */}
          <button
            onClick={onShowMLMetrics}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-console-muted border border-console-border hover:text-console-text hover:bg-console-surface-hover transition-colors"
          >
            <BrainCircuit className="w-3 h-3" />
            <span className="hidden sm:inline">ML Stats</span>
          </button>

          {/* Guide */}
          <button
            onClick={onShowWalkthrough}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-console-accent/10 text-console-accent border border-console-accent/30 hover:bg-console-accent/20 transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            <span className="hidden sm:inline">Guide</span>
          </button>
        </div>
      </div>

      {/* ── Row 2: Scenario runner (slimmer, collapsible on mobile) ── */}
      <div className="px-4 h-8 flex items-center gap-3 border-t border-console-border bg-console-bg/50">
        <span className="text-[11px] text-console-muted flex items-center gap-1 flex-shrink-0">
          <Radio className="w-3 h-3" />
          Demo:
        </span>

        <div className="flex items-center gap-1">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => onTriggerScenario(s.id)}
              className={`px-2.5 py-0.5 rounded text-[11px] border transition-colors font-medium ${
                activeScenario === s.id
                  ? STATUS_COLORS[s.color]
                  : 'text-console-muted border-transparent hover:border-console-border hover:text-console-text'
              }`}
            >
              <span className="text-console-muted mr-1">{s.hotkey}.</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Divider + Reset */}
        <div className="flex-1" />
        {activeScenario && (
          <button
            onClick={onResetData}
            className="flex items-center gap-1 text-[11px] text-console-muted hover:text-console-text transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>
    </header>
  );
}
