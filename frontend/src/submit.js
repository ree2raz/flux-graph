// submit.js
// Reads the current pipeline from the store, POSTs to /pipelines/parse,
// then stores the result so <ResultModal /> can display it.

import { useState, useCallback } from 'react';
import { Play, Loader } from 'lucide-react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';

// In production (Vercel multi-service) backend is at the /_/backend routePrefix.
// Locally the FastAPI dev server runs on port 8000.
const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? '/_/backend/pipelines/parse'
  : 'http://localhost:8000/pipelines/parse';

const selector = (s) => ({
  nodes: s.nodes,
  getCycleEdgeIds: s.getCycleEdgeIds,
  setPipelineResult: s.setPipelineResult,
});

export const SubmitButton = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { nodes, getCycleEdgeIds, setPipelineResult } = useStore(selector, shallow);

  // Live DAG indicator (client-side, before the request is sent).
  const cycleEdgeIds = getCycleEdgeIds();
  const liveIsDAG = cycleEdgeIds.size === 0;

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Read fresh state at click time — avoids stale closure from render capture.
    const { nodes: currentNodes, edges: currentEdges } = useStore.getState();

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: currentNodes, edges: currentEdges }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setPipelineResult(data);
    } catch (err) {
      const msg = err?.message?.includes('Failed to fetch')
        ? 'Cannot reach backend — is it running on :8000?'
        : (err.message || 'Network error. Is the backend running?');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [setPipelineResult]);

  return (
    <div
      style={{
        background: '#0e1828',
        borderTop: '1px solid #1e2d47',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexShrink: 0,
      }}
    >
      {/* Live DAG indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: nodes.length === 0
              ? '#5b6b8c'
              : liveIsDAG
                ? '#34d399'
                : '#fb7185',
            boxShadow: nodes.length > 0
              ? `0 0 6px ${liveIsDAG ? '#34d399' : '#fb7185'}`
              : 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11.5,
            color: '#5b6b8c',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {nodes.length === 0
            ? 'Empty pipeline'
            : liveIsDAG
              ? 'Valid DAG'
              : 'Cycle detected'}
        </span>
      </div>

      <span style={{ flex: 1 }} />

      {/* Error message */}
      {error && (
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11.5,
            color: '#fb7185',
            background: '#fb718518',
            border: '1px solid #fb718540',
            borderRadius: 6,
            padding: '4px 10px',
            maxWidth: 360,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
          title="Click to dismiss"
          onClick={() => setError(null)}
        >
          ⚠ {error}
        </span>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={loading || nodes.length === 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 18px',
          background: loading || nodes.length === 0
            ? '#1c2536'
            : 'linear-gradient(135deg, #6366f1, #818cf8)',
          border: '1px solid ' + (loading || nodes.length === 0 ? '#283452' : 'transparent'),
          borderRadius: 8,
          color: loading || nodes.length === 0 ? '#5b6b8c' : '#fff',
          fontSize: 13,
          fontWeight: 600,
          cursor: loading || nodes.length === 0 ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.15s, transform 0.1s',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.02em',
        }}
        onMouseEnter={(e) => {
          if (!loading && nodes.length > 0) e.currentTarget.style.opacity = '0.88';
        }}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        {loading ? (
          <Loader
            size={13}
            style={{ animation: 'spin-slow 1.2s linear infinite' }}
          />
        ) : (
          <Play size={13} />
        )}
        {loading ? 'Analysing…' : 'Submit Pipeline'}
      </button>
    </div>
  );
};
