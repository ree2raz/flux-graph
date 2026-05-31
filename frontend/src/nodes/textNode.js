/**
 * TextNode — the special-case node that demonstrates the abstraction's flexibility.
 *
 * It uses BaseNode's shell (same styling, handle system, selection states) but
 * supplies a custom body via `children` instead of the declarative `fields` array.
 *
 * Two features beyond the base spec:
 *
 * 1. Auto-resize
 *    Width and height grow with content so users always see what they typed.
 *    Width is computed from the longest line; height from the line count.
 *
 * 2. Dynamic variable handles
 *    Typing {{ myVar }} creates a target handle on the left named "myVar".
 *    Removing the variable removes the handle AND prunes any connected edges
 *    to avoid dangling wires in the graph.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { NodeResizer } from 'reactflow';
import { Type } from 'lucide-react';
import { BaseNode } from './BaseNode';
import { parseVariables } from '../lib/variables';
import { useStore } from '../store';

// Accent shared with the registry definition.
const ACCENT = '#22d3ee';

// Approximate character width (px) at 13px Inter font.
const CHAR_WIDTH_PX = 7.5;
const MIN_WIDTH = 240;
const MAX_WIDTH = 580;
const PADDING_PX = 80; // horizontal padding + handle clearance

/**
 * Estimate the node width needed to comfortably display the longest text line.
 */
function computeWidth(text) {
  const maxLen = Math.max(...text.split('\n').map((l) => l.length), 20);
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, maxLen * CHAR_WIDTH_PX + PADDING_PX));
}

/**
 * Compute the number of textarea rows from the current text.
 */
function computeRows(text) {
  const lines = text.split('\n').length;
  return Math.min(20, Math.max(3, lines + 1));
}

export function TextNode({ id, data, selected }) {
  const [text, setText] = useState(data?.text ?? '{{input}}');
  const [variables, setVariables] = useState(() => parseVariables(data?.text ?? '{{input}}'));
  const prevVarsRef = useRef(variables);

  const removeEdgesForHandle = useStore((s) => s.removeEdgesForHandle);
  const updateNodeField = useStore((s) => s.updateNodeField);
  const updateNodeStyle = useStore((s) => s.updateNodeStyle);

  // Set initial width once on mount so the ReactFlow wrapper has an explicit size.
  useEffect(() => {
    updateNodeStyle(id, { width: computeWidth(text) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle text changes ────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e) => {
      const newText = e.target.value;
      setText(newText);
      updateNodeField(id, 'text', newText);
      updateNodeStyle(id, { width: computeWidth(newText) });

      const newVars = parseVariables(newText);
      const prevVars = prevVarsRef.current;

      // Prune edges for handles that no longer have a corresponding variable.
      const newVarSet = new Set(newVars);
      for (const v of prevVars) {
        if (!newVarSet.has(v)) {
          removeEdgesForHandle(id, v);
        }
      }

      prevVarsRef.current = newVars;
      setVariables(newVars);
    },
    [id, updateNodeField, removeEdgesForHandle, updateNodeStyle]
  );

  // Sync if data.text changes externally (e.g. hydration from localStorage).
  useEffect(() => {
    if (data?.text !== undefined && data.text !== text) {
      setText(data.text);
      const vars = parseVariables(data.text);
      prevVarsRef.current = vars;
      setVariables(vars);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.text]);

  // ── Derived geometry ───────────────────────────────────────────────────────
  const rows = computeRows(text);

  // ── Dynamic handles ────────────────────────────────────────────────────────
  // Right-side source handle (always present).
  const rightHandle = { id: 'output', type: 'source', position: 'right', label: 'Out' };

  // Left-side target handles, one per unique variable, evenly spaced.
  // BaseNode groups handles by position and spaces them automatically.
  const handles = [
    ...variables.map((v) => ({ id: v, type: 'target', position: 'left', label: v })),
    rightHandle,
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* NodeResizer lets the user drag-resize the entire node. */}
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_WIDTH}
        maxWidth={MAX_WIDTH}
        minHeight={80}
        onResizeEnd={(_, { width }) => updateNodeStyle(id, { width })}
        lineStyle={{ borderColor: ACCENT, borderWidth: 1 }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: '#111a2e',
          border: `1.5px solid ${ACCENT}`,
        }}
      />
      <BaseNode
        id={id}
        data={data}
        selected={selected}
        title="Text"
        Icon={Type}
        accentColor={ACCENT}
        handles={handles}
        style={{ width: '100%', minWidth: MIN_WIDTH }}
      >
        {/* Custom body — a growing textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: '#94a3c4',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Content
          </span>
          <textarea
            className="nodrag"
            value={text}
            rows={rows}
            onChange={handleChange}
            placeholder="Type text… use {{ variable }} to create input handles."
            style={{
              width: '100%',
              background: '#1c2536',
              border: '1px solid #283452',
              borderRadius: 5,
              color: '#e6edf7',
              fontSize: 12,
              padding: '5px 8px',
              outline: 'none',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              lineHeight: 1.55,
              resize: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = ACCENT)}
            onBlur={(e) => (e.target.style.borderColor = '#283452')}
          />
        {variables.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
            {variables.map((v) => (
              <span
                key={v}
                style={{
                  fontSize: 10,
                  background: `${ACCENT}18`,
                  color: ACCENT,
                  border: `1px solid ${ACCENT}40`,
                  borderRadius: 4,
                  padding: '1px 6px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.02em',
                }}
              >
                {`{{${v}}}`}
              </span>
            ))}
          </div>
        )}
        </div>
      </BaseNode>
    </>
  );
}
