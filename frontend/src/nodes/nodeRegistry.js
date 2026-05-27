/**
 * nodeRegistry — the single source of truth for every node type.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ADDING A NEW NODE
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Add one entry to NODE_DEFINITIONS below.
 * 2. Done. The registry automatically derives:
 *    • The React component (BaseNode wired to your definition)
 *    • The toolbar chip (label, icon, accent color)
 *    • Default node data (field values initialised from `default` / `defaultFn`)
 *    • The ReactFlow `nodeTypes` map
 *
 * Nodes with special runtime behaviour (e.g. TextNode's dynamic handles) can
 * opt out of auto-generation by supplying a `component` override — they still
 * appear in the toolbar and get default-data support, but render themselves.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Field schema
 * ────────────
 * {
 *   key:          string       — data key stored in node.data
 *   type:         'text' | 'textarea' | 'select' | 'number' | 'checkbox'
 *   label:        string       — shown above the control
 *   default:      any          — static default value
 *   defaultFn:    (id) => any  — computed default from node id (overrides default)
 *   options:      string[] | { value, label }[]   — for 'select'
 *   min/max/step: number       — for 'number'
 *   rows:         number       — for 'textarea'
 *   checkboxLabel: string      — for 'checkbox'
 * }
 *
 * Handle schema
 * ─────────────
 * {
 *   id:       string            — suffix; full ReactFlow handle id = `${nodeId}-${id}`
 *   type:     'source'|'target' — defaults to: left→target, right→source
 *   position: 'left'|'right'   — which side of the node
 *   label:    string            — small uppercase label drawn near the dot
 *   color:    string            — hex override (defaults to node accentColor)
 * }
 */

import { BaseNode } from './BaseNode';
import { TextNode } from './textNode';

// ── Lucide icons (tree-shaken) ──────────────────────────────────────────────
import {
  LogIn,
  LogOut,
  Sparkles,
  Type,
  Globe,
  GitBranch,
  Calculator,
  StickyNote,
  Layers,
} from 'lucide-react';

// ── Node definitions ────────────────────────────────────────────────────────

const NODE_DEFINITIONS = [
  // ── ORIGINAL NODES ────────────────────────────────────────────────────────

  {
    type: 'customInput',
    label: 'Input',
    title: 'Input',
    Icon: LogIn,
    accentColor: '#34d399',   // emerald
    fields: [
      {
        key: 'inputName',
        type: 'text',
        label: 'Name',
        defaultFn: (id) => id.replace('customInput-', 'input_'),
      },
      {
        key: 'inputType',
        type: 'select',
        label: 'Type',
        default: 'Text',
        options: ['Text', 'File'],
      },
    ],
    handles: [
      { id: 'value', type: 'source', position: 'right', label: 'Value' },
    ],
  },

  {
    type: 'customOutput',
    label: 'Output',
    title: 'Output',
    Icon: LogOut,
    accentColor: '#38bdf8',   // sky
    fields: [
      {
        key: 'outputName',
        type: 'text',
        label: 'Name',
        defaultFn: (id) => id.replace('customOutput-', 'output_'),
      },
      {
        key: 'outputType',
        type: 'select',
        label: 'Type',
        default: 'Text',
        options: ['Text', 'Image'],
      },
    ],
    handles: [
      { id: 'value', type: 'target', position: 'left', label: 'Value' },
    ],
  },

  {
    type: 'llm',
    label: 'LLM',
    title: 'LLM',
    Icon: Sparkles,
    accentColor: '#8b5cf6',   // violet
    fields: [
      {
        key: 'model',
        type: 'select',
        label: 'Model',
        default: 'gpt-4.1-mini',
        options: [
          // OpenAI — current as of 2025
          { value: 'gpt-4.1-mini',    label: 'GPT-4.1 Mini'       },
          { value: 'gpt-4.1',         label: 'GPT-4.1'            },
          { value: 'gpt-4o',          label: 'GPT-4o'             },
          { value: 'gpt-4o-mini',     label: 'GPT-4o Mini'        },
          // Anthropic — current as of 2025
          { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
          { value: 'claude-opus-4-7',   label: 'Claude Opus 4.7'   },
        ],
      },
      {
        key: 'temperature',
        type: 'number',
        label: 'Temperature',
        default: 0.7,
        min: 0,
        max: 2,
        step: 0.1,
      },
    ],
    handles: [
      { id: 'system',   type: 'target', position: 'left',  label: 'System'   },
      { id: 'prompt',   type: 'target', position: 'left',  label: 'Prompt'   },
      { id: 'response', type: 'source', position: 'right', label: 'Response' },
    ],
  },

  {
    // TextNode manages its own dynamic handles and auto-resize body;
    // it uses BaseNode's shell internally. We only declare presentation
    // metadata here so the toolbar and default-data still work.
    type: 'text',
    label: 'Text',
    title: 'Text',
    Icon: Type,
    accentColor: '#22d3ee',   // cyan
    component: TextNode,      // override: skip auto-generation
    fields: [],
    handles: [],
  },

  // ── NEW NODES ──────────────────────────────────────────────────────────────

  {
    type: 'httpRequest',
    label: 'HTTP Request',
    title: 'HTTP Request',
    Icon: Globe,
    accentColor: '#fb923c',   // orange
    fields: [
      { key: 'url',    type: 'text',   label: 'URL',    default: 'https://api.example.com' },
      {
        key: 'method',
        type: 'select',
        label: 'Method',
        default: 'GET',
        options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      },
      { key: 'headers', type: 'textarea', label: 'Headers (JSON)', default: '{}', rows: 2 },
      {
        key: 'streaming',
        type: 'checkbox',
        checkboxLabel: 'Streaming response',
        default: false,
      },
    ],
    handles: [
      { id: 'body',    type: 'target', position: 'left',  label: 'Body'    },
      { id: 'success', type: 'source', position: 'right', label: 'Success' },
      { id: 'error',   type: 'source', position: 'right', label: 'Error'   },
    ],
  },

  {
    type: 'conditional',
    label: 'Conditional',
    title: 'Conditional',
    Icon: GitBranch,
    accentColor: '#fbbf24',   // amber
    fields: [
      { key: 'condition',   type: 'text', label: 'Condition',   default: 'value > 0'  },
      { key: 'trueLabel',  type: 'text', label: 'True label',  default: 'True'        },
      { key: 'falseLabel', type: 'text', label: 'False label', default: 'False'       },
    ],
    handles: [
      { id: 'input', type: 'target', position: 'left',  label: 'Input' },
      { id: 'true',  type: 'source', position: 'right', label: 'True'  },
      { id: 'false', type: 'source', position: 'right', label: 'False' },
    ],
  },

  {
    type: 'math',
    label: 'Math',
    title: 'Math Transform',
    Icon: Calculator,
    accentColor: '#fb7185',   // rose
    fields: [
      {
        key: 'operation',
        type: 'select',
        label: 'Operation',
        default: 'add',
        options: [
          { value: 'add',      label: 'Add (a + b)'      },
          { value: 'subtract', label: 'Subtract (a − b)' },
          { value: 'multiply', label: 'Multiply (a × b)' },
          { value: 'divide',   label: 'Divide (a ÷ b)'   },
          { value: 'custom',   label: 'Custom expression' },
        ],
      },
      { key: 'expression', type: 'text', label: 'Custom expression', default: 'a + b * 2' },
    ],
    handles: [
      { id: 'a',      type: 'target', position: 'left',  label: 'A'      },
      { id: 'b',      type: 'target', position: 'left',  label: 'B'      },
      { id: 'result', type: 'source', position: 'right', label: 'Result' },
    ],
  },

  {
    // Annotation-only node: no I/O handles.
    // Demonstrates the abstraction handles zero-handle nodes cleanly.
    type: 'note',
    label: 'Note',
    title: 'Note',
    Icon: StickyNote,
    accentColor: '#94a3b8',   // slate
    fields: [
      { key: 'noteTitle',   type: 'text',     label: 'Title',   default: 'Note'           },
      { key: 'noteContent', type: 'textarea', label: 'Content', default: '', rows: 4 },
    ],
    handles: [],              // intentionally empty — proof the abstraction composes
  },

  {
    type: 'aggregator',
    label: 'Aggregator',
    title: 'Data Aggregator',
    Icon: Layers,
    accentColor: '#818cf8',   // indigo-soft
    fields: [
      {
        key: 'separator',
        type: 'select',
        label: 'Join separator',
        default: 'newline',
        options: [
          { value: 'newline', label: 'Newline (\\n)'  },
          { value: 'comma',   label: 'Comma (,)'      },
          { value: 'pipe',    label: 'Pipe (|)'       },
          { value: 'space',   label: 'Space'          },
        ],
      },
      {
        key: 'limit',
        type: 'number',
        label: 'Max inputs',
        default: 3,
        min: 2,
        max: 10,
        step: 1,
      },
    ],
    handles: [
      { id: 'in1',    type: 'target', position: 'left',  label: 'In 1'  },
      { id: 'in2',    type: 'target', position: 'left',  label: 'In 2'  },
      { id: 'in3',    type: 'target', position: 'left',  label: 'In 3'  },
      { id: 'output', type: 'source', position: 'right', label: 'Output' },
    ],
  },
];

// ── Derived exports ──────────────────────────────────────────────────────────

/**
 * ReactFlow nodeTypes map.
 * Config-driven nodes get a generated wrapper around BaseNode.
 * Nodes with a `component` override use that component directly.
 */
export const nodeTypes = Object.fromEntries(
  NODE_DEFINITIONS.map((def) => {
    if (def.component) {
      return [def.type, def.component];
    }

    // Generate a ReactFlow-compatible component from the definition.
    // We name the function so React DevTools shows a readable name.
    function ConfigNode({ id, data, selected }) {
      return (
        <BaseNode
          id={id}
          data={data}
          selected={selected}
          title={def.title}
          Icon={def.Icon}
          accentColor={def.accentColor}
          fields={def.fields}
          handles={def.handles}
        />
      );
    }
    ConfigNode.displayName = `${def.title}Node`;

    return [def.type, ConfigNode];
  })
);

/**
 * Toolbar chip data — consumed by <Toolbar /> to render draggable node chips.
 */
export const toolbarEntries = NODE_DEFINITIONS.map(({ type, label, Icon, accentColor }) => ({
  type,
  label,
  Icon,
  accentColor,
}));

/**
 * Build the initial `data` object for a newly-dropped node.
 * Populates field defaults so FieldRenderer always has a value to read.
 */
export function getDefaultData(type, id) {
  const def = NODE_DEFINITIONS.find((d) => d.type === type);
  const base = { id, nodeType: type };
  if (!def) return base;

  const fieldDefaults = Object.fromEntries(
    (def.fields ?? []).map((f) => [
      f.key,
      f.defaultFn ? f.defaultFn(id) : (f.default ?? ''),
    ])
  );

  return { ...base, ...fieldDefaults };
}
