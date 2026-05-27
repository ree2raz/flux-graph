import { useState } from 'react';
import { Workflow, Trash2 } from 'lucide-react';
import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { SubmitButton } from './submit';
import { ResultModal } from './components/ResultModal';
import { useStore } from './store';

function App() {
  const [confirmClear, setConfirmClear] = useState(false);
  const clearPipeline = useStore((s) => s.clearPipeline);
  const nodeCount = useStore((s) => s.nodes.length);

  const handleClear = () => {
    if (nodeCount === 0) return;           // nothing to clear
    if (confirmClear) {
      clearPipeline();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      // Auto-cancel confirmation after 3 s if user doesn't follow through.
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: '#0b1120',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        color: '#e6edf7',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          background: '#0e1828',
          borderBottom: '1px solid #1e2d47',
          padding: '0 20px',
          height: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <Workflow size={18} style={{ color: '#6366f1' }} />
        <span
          style={{
            fontWeight: 700,
            fontSize: 15,
            background: 'linear-gradient(90deg, #818cf8, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.01em',
          }}
        >
          VectorShift
        </span>
        <span
          style={{
            fontSize: 13,
            color: '#5b6b8c',
            fontWeight: 400,
          }}
        >
          Pipeline Builder
        </span>

        <div style={{ flex: 1 }} />

        <span
          style={{
            fontSize: 11,
            color: '#5b6b8c',
            background: '#16223c',
            border: '1px solid #283452',
            borderRadius: 5,
            padding: '3px 8px',
          }}
        >
          Drag nodes → Connect handles → Submit
        </span>

        {/* Clear board button */}
        <button
          onClick={handleClear}
          disabled={nodeCount === 0}
          title={confirmClear ? 'Click again to confirm' : 'Clear the entire board'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 11px',
            background: confirmClear ? '#fb718520' : 'transparent',
            border: `1px solid ${confirmClear ? '#fb7185' : '#283452'}`,
            borderRadius: 6,
            color: confirmClear ? '#fb7185' : (nodeCount === 0 ? '#374869' : '#5b6b8c'),
            fontSize: 11.5,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            cursor: nodeCount === 0 ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (nodeCount > 0 && !confirmClear) {
              e.currentTarget.style.borderColor = '#fb7185';
              e.currentTarget.style.color = '#fb7185';
            }
          }}
          onMouseLeave={(e) => {
            if (!confirmClear) {
              e.currentTarget.style.borderColor = '#283452';
              e.currentTarget.style.color = nodeCount === 0 ? '#374869' : '#5b6b8c';
            }
          }}
        >
          <Trash2 size={12} strokeWidth={2} />
          {confirmClear ? 'Confirm clear?' : 'Clear board'}
        </button>
      </header>

      {/* ── Node toolbar ── */}
      <PipelineToolbar />

      {/* ── Canvas (fills remaining space) ── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <PipelineUI />
      </div>

      {/* ── Bottom status / submit bar ── */}
      <SubmitButton />

      {/* ── Result modal (portal-equivalent, renders above everything) ── */}
      <ResultModal />
    </div>
  );
}

export default App;
