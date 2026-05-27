/**
 * ResultModal
 * Displays the pipeline analysis response from /pipelines/parse.
 * Reads from and clears the Zustand store — no props needed.
 */

import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Network, GitMerge, Workflow, X } from 'lucide-react';
import { useStore } from '../store';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#16223c',
        border: `1px solid ${color}30`,
        borderRadius: 10,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        minWidth: 100,
      }}
    >
      <Icon size={20} style={{ color }} />
      <span
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#e6edf7',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: '#94a3c4',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function ResultModal() {
  const pipelineResult = useStore((s) => s.pipelineResult);
  const clearPipelineResult = useStore((s) => s.clearPipelineResult);
  const dialogRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') clearPipelineResult(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clearPipelineResult]);

  if (!pipelineResult) return null;

  const { num_nodes, num_edges, is_dag } = pipelineResult;
  const dagColor = is_dag ? '#34d399' : '#fb7185';
  const DagIcon = is_dag ? CheckCircle : XCircle;

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(11,17,32,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fade-in 0.15s ease-out',
      }}
      onClick={clearPipelineResult}
    >
      {/* Card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111a2e',
          border: '1px solid #283452',
          borderRadius: 14,
          boxShadow: '0 24px 64px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)',
          padding: '24px 28px',
          width: '100%',
          maxWidth: 440,
          animation: 'slide-up 0.25s cubic-bezier(0.22,1,0.36,1)',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <Workflow size={18} style={{ color: '#6366f1', marginRight: 10 }} />
          <h2
            id="modal-title"
            style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e6edf7' }}
          >
            Pipeline Analysis
          </h2>
          <button
            onClick={clearPipelineResult}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#5b6b8c',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e6edf7')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5b6b8c')}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <StatCard
            icon={Network}
            label="Nodes"
            value={num_nodes}
            color="#6366f1"
          />
          <StatCard
            icon={GitMerge}
            label="Edges"
            value={num_edges}
            color="#818cf8"
          />
          <StatCard
            icon={DagIcon}
            label="Valid DAG"
            value={is_dag ? 'Yes' : 'No'}
            color={dagColor}
          />
        </div>

        {/* DAG explanation */}
        <div
          style={{
            background: `${dagColor}12`,
            border: `1px solid ${dagColor}30`,
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <DagIcon size={15} style={{ color: dagColor, flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12.5, color: '#cdd8ee', lineHeight: 1.6 }}>
            {is_dag
              ? 'This pipeline is a valid Directed Acyclic Graph. All nodes can be executed in a deterministic topological order.'
              : 'A cycle was detected in this pipeline. Execution order cannot be determined. Check the red edges on the canvas.'}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={clearPipelineResult}
          style={{
            width: '100%',
            padding: '9px 0',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            letterSpacing: '0.02em',
            transition: 'opacity 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
