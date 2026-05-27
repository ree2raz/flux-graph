// toolbar.js
// Reads toolbarEntries from nodeRegistry — the toolbar automatically lists
// every node type in the registry with no manual wiring required.

import { DraggableNode } from './draggableNode';
import { toolbarEntries } from './nodes/nodeRegistry';

export const PipelineToolbar = () => (
  <div
    style={{
      background: '#0e1828',
      borderBottom: '1px solid #1e2d47',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      overflowX: 'auto',
      flexShrink: 0,
    }}
  >
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: '#5b6b8c',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        marginRight: 6,
      }}
    >
      Nodes
    </span>

    {toolbarEntries.map(({ type, label, Icon, accentColor }) => (
      <DraggableNode
        key={type}
        type={type}
        label={label}
        Icon={Icon}
        accentColor={accentColor}
      />
    ))}
  </div>
);
