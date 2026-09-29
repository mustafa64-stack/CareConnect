import React, { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AuditFeed({ logs = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-console-bg text-xs">
      {/* Collapsed Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-1.5 flex items-center justify-between cursor-pointer hover:bg-console-surface/60 transition-colors"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <Terminal className="w-3.5 h-3.5 text-console-accent flex-shrink-0" />
          <span className="font-mono text-[11px] font-semibold text-console-muted">AUDIT STREAM:</span>
          {logs.length > 0 ? (
            <span className="font-mono text-[11px] text-console-text truncate">
              <span className="text-console-accent">[{new Date(logs[0].timestamp).toLocaleTimeString()}]</span>{' '}
              <span className={logs[0].eventType.includes('COLLISION') ? 'text-status-critical font-bold' : 'text-console-text'}>
                {logs[0].eventType}
              </span>{' '}
              — {logs[0].details}
            </span>
          ) : (
            <span className="text-console-muted text-[11px]">System ready. Monitoring events...</span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 text-console-muted text-[11px]">
          <span>{logs.length} logged events</span>
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Expanded Logs Drawer */}
      {isExpanded && (
        <div className="max-h-48 overflow-y-auto p-3 bg-console-surface border-t border-console-border space-y-1 font-mono text-[11px]">
          {logs.map((log) => {
            const isCollision = log.eventType.includes('COLLISION');
            const isLock = log.eventType.includes('BED_LOCKED');

            return (
              <div
                key={log.id}
                className={`py-1 px-2 rounded flex items-start gap-2 ${
                  isCollision ? 'bg-status-critical/15 text-status-critical font-semibold' :
                  isLock ? 'bg-status-available/10 text-status-available' :
                  'text-console-muted hover:bg-console-bg'
                }`}
              >
                <span className="text-console-muted flex-shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="font-bold flex-shrink-0 px-1 rounded bg-console-bg border border-console-border">
                  {log.eventType}
                </span>
                <span className="text-console-text truncate">{log.details}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
