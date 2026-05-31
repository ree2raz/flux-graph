/**
 * BaseNode — the single presentational shell for every node in the graph.
 *
 * It is responsible for:
 *   • The accent-tinted header (icon + title + indicator dot)
 *   • Rendering FieldRenderer instances from a `fields` array  OR  custom `children`
 *   • Auto-spacing multiple handles on the same side evenly
 *   • Selection highlighting via box-shadow / border-color
 *
 * Node authors never touch layout, handle spacing, or styling. They provide:
 *   title, Icon, accentColor, fields, handles — and optionally children.
 *
 * Usage (config-driven, via nodeRegistry):
 *   <BaseNode id={id} data={data} selected={selected}
 *             title="LLM" Icon={Sparkles} accentColor="#8b5cf6"
 *             fields={[...]} handles={[...]} />
 *
 * Usage (custom body, e.g. TextNode):
 *   <BaseNode id={id} data={data} selected={selected}
 *             title="Text" Icon={Type} accentColor="#38bdf8"
 *             handles={computedHandles}>
 *     <AutosizeTextarea ... />
 *   </BaseNode>
 */

import { Fragment } from 'react';
import { Handle, Position } from 'reactflow';
import { X } from 'lucide-react';
import { useStore } from '../store';
import { FieldRenderer } from './FieldRenderer';
import { handleTop } from '../lib/variables';

const POSITION_MAP = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

/** Group handles by their `position` string and compute evenly-spaced tops. */
function positionHandles(handles) {
  const groups = {};
  for (const h of handles) {
    const pos = h.position ?? 'right';
    if (!groups[pos]) groups[pos] = [];
    groups[pos].push(h);
  }

  const result = [];
  for (const [pos, group] of Object.entries(groups)) {
    group.forEach((h, i) => {
      result.push({ ...h, pos, top: handleTop(i, group.length) });
    });
  }
  return result;
}

export function BaseNode({
  id,
  data,
  selected = false,
  title,
  Icon,
  accentColor = '#6366f1',
  handles = [],
  fields = [],
  children,
  style: extraStyle = {},
}) {
  const updateNodeField = useStore((s) => s.updateNodeField);
  const removeNode = useStore((s) => s.removeNode);
  const positionedHandles = positionHandles(handles);

  const containerStyle = {
    minWidth: 220,
    background: '#111a2e',
    borderRadius: 10,
    border: `1.5px solid ${selected ? accentColor : '#283452'}`,
    boxShadow: selected
      ? `0 0 0 3px ${accentColor}40, 0 12px 32px -8px ${accentColor}60`
      : `0 0 18px ${accentColor}1a, 0 8px 24px -8px rgba(0,0,0,0.65), 0 0 0 1px rgba(20,30,50,0.8)`,
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize: 13,
    color: '#e6edf7',
    position: 'relative',
    transition: 'box-shadow 0.18s ease, border-color 0.18s ease',
    animation: 'node-enter 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
    ...extraStyle,
  };

  const headerStyle = {
    background: `linear-gradient(135deg, ${accentColor}28 0%, ${accentColor}0c 100%)`,
    borderBottom: `1px solid ${accentColor}28`,
    borderRadius: '8px 8px 0 0',
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 7,
  };

  return (
    <div style={containerStyle}>
      {/* ── Header ── */}
      <div style={headerStyle}>
        {Icon && (
          <Icon
            size={13}
            style={{ color: accentColor, flexShrink: 0, strokeWidth: 2.2 }}
          />
        )}
        <span
          style={{
            fontWeight: 600,
            fontSize: 11.5,
            letterSpacing: '0.04em',
            color: '#dde6f5',
            flexGrow: 1,
          }}
        >
          {title}
        </span>
        {/* Accent status dot */}
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: accentColor,
            boxShadow: `0 0 5px ${accentColor}`,
            flexShrink: 0,
          }}
        />

        {/* Delete button */}
        <button
          className="nodrag"
          onClick={(e) => { e.stopPropagation(); removeNode(id); }}
          title="Delete node"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            padding: 0,
            background: 'transparent',
            border: 'none',
            borderRadius: 3,
            color: '#5b6b8c',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fb7185';
            e.currentTarget.style.background = '#fb718520';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#5b6b8c';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children != null
          ? children
          : fields.map((field) => (
              <FieldRenderer
                key={field.key}
                id={id}
                data={data}
                field={field}
                updateNodeField={updateNodeField}
              />
            ))}
      </div>

      {/* ── Handles + labels ── */}
      {positionedHandles.map((h) => {
        const isLeft = h.pos === 'left';
        return (
          <Fragment key={h.id}>
            <Handle
              id={`${id}-${h.id}`}
              type={h.type ?? (isLeft ? 'target' : 'source')}
              position={POSITION_MAP[h.pos]}
              style={{
                top: h.top,
                width: 10,
                height: 10,
                background: h.color ?? accentColor,
                border: '2px solid #111a2e',
                borderRadius: '50%',
                cursor: 'crosshair',
              }}
            />
            {h.label && (
              <span
                style={{
                  position: 'absolute',
                  top: h.top,
                  // Place label pill OUTSIDE the node so it never overlaps
                  // field inputs, and give it a dark background so it sits
                  // above any edge line that passes nearby.
                  ...(isLeft
                    ? { left: -6, transform: 'translateY(-50%) translateX(-100%)' }
                    : { right: -6, transform: 'translateY(-50%) translateX(100%)' }
                  ),
                  fontSize: 9,
                  fontWeight: 600,
                  color: '#94a3c4',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  // Pill background ensures text is always readable above edges.
                  background: '#111a2e',
                  border: '1px solid #1e2d47',
                  borderRadius: 4,
                  padding: '1px 5px',
                  lineHeight: '14px',
                  zIndex: 10,
                }}
              >
                {h.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
