// Pre-built pipeline templates.
// Each template is a complete store snapshot: nodes, edges, and nodeIDs counters
// so newly-dropped nodes after loading won't collide with existing IDs.

const EDGE_DEFAULTS = {
  type: 'smoothstep',
  animated: true,
  markerEnd: { type: 'arrowclosed', width: 16, height: 16 },
};

export const TEMPLATES = [
  // ── 1. Text Summarizer ────────────────────────────────────────────────────
  {
    id: 'summarizer',
    name: 'Text Summarizer',
    description: 'Feed in a document, get a clean summary back.',
    accent: '#8b5cf6',
    preview: [
      { label: 'Input',  color: '#34d399' },
      { label: 'LLM',    color: '#8b5cf6' },
      { label: 'Output', color: '#38bdf8' },
    ],
    nodes: [
      {
        id: 'customInput-1',
        type: 'customInput',
        position: { x: 80, y: 210 },
        data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'document', inputType: 'Text' },
      },
      {
        id: 'llm-1',
        type: 'llm',
        position: { x: 370, y: 170 },
        data: { id: 'llm-1', nodeType: 'llm', model: 'gpt-4.1-mini', temperature: 0.3 },
      },
      {
        id: 'customOutput-1',
        type: 'customOutput',
        position: { x: 670, y: 210 },
        data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'summary', outputType: 'Text' },
      },
    ],
    edges: [
      { id: 'e1', source: 'customInput-1', sourceHandle: 'customInput-1-value', target: 'llm-1',        targetHandle: 'llm-1-prompt',         ...EDGE_DEFAULTS },
      { id: 'e2', source: 'llm-1',        sourceHandle: 'llm-1-response',       target: 'customOutput-1', targetHandle: 'customOutput-1-value', ...EDGE_DEFAULTS },
    ],
    nodeIDs: { customInput: 1, llm: 1, customOutput: 1 },
  },

  // ── 2. Q&A Chain ──────────────────────────────────────────────────────────
  {
    id: 'qa-chain',
    name: 'Q&A Chain',
    description: 'Ask a question with supporting context, get a grounded answer.',
    accent: '#22d3ee',
    preview: [
      { label: 'Question', color: '#34d399' },
      { label: 'Context',  color: '#34d399' },
      { label: 'LLM',      color: '#8b5cf6' },
      { label: 'Answer',   color: '#38bdf8' },
    ],
    nodes: [
      {
        id: 'customInput-1',
        type: 'customInput',
        position: { x: 80, y: 120 },
        data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'question', inputType: 'Text' },
      },
      {
        id: 'customInput-2',
        type: 'customInput',
        position: { x: 80, y: 310 },
        data: { id: 'customInput-2', nodeType: 'customInput', inputName: 'context', inputType: 'Text' },
      },
      {
        id: 'llm-1',
        type: 'llm',
        position: { x: 380, y: 195 },
        data: { id: 'llm-1', nodeType: 'llm', model: 'gpt-4.1-mini', temperature: 0.5 },
      },
      {
        id: 'customOutput-1',
        type: 'customOutput',
        position: { x: 680, y: 210 },
        data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'answer', outputType: 'Text' },
      },
    ],
    edges: [
      { id: 'e1', source: 'customInput-1', sourceHandle: 'customInput-1-value', target: 'llm-1',         targetHandle: 'llm-1-prompt',         ...EDGE_DEFAULTS },
      { id: 'e2', source: 'customInput-2', sourceHandle: 'customInput-2-value', target: 'llm-1',         targetHandle: 'llm-1-system',         ...EDGE_DEFAULTS },
      { id: 'e3', source: 'llm-1',         sourceHandle: 'llm-1-response',      target: 'customOutput-1', targetHandle: 'customOutput-1-value', ...EDGE_DEFAULTS },
    ],
    nodeIDs: { customInput: 2, llm: 1, customOutput: 1 },
  },

  // ── 3. HTTP Fetch + Parse ─────────────────────────────────────────────────
  {
    id: 'http-parse',
    name: 'HTTP Fetch + Parse',
    description: 'Hit an API endpoint and extract what you need with an LLM.',
    accent: '#fb923c',
    preview: [
      { label: 'Input', color: '#34d399' },
      { label: 'HTTP',  color: '#fb923c' },
      { label: 'LLM',   color: '#8b5cf6' },
      { label: 'Output', color: '#38bdf8' },
    ],
    nodes: [
      {
        id: 'customInput-1',
        type: 'customInput',
        position: { x: 60, y: 200 },
        data: { id: 'customInput-1', nodeType: 'customInput', inputName: 'url', inputType: 'Text' },
      },
      {
        id: 'httpRequest-1',
        type: 'httpRequest',
        position: { x: 310, y: 155 },
        data: { id: 'httpRequest-1', nodeType: 'httpRequest', url: 'https://api.example.com', method: 'GET', headers: '{}', streaming: false },
      },
      {
        id: 'llm-1',
        type: 'llm',
        position: { x: 620, y: 140 },
        data: { id: 'llm-1', nodeType: 'llm', model: 'gpt-4.1-mini', temperature: 0.2 },
      },
      {
        id: 'customOutput-1',
        type: 'customOutput',
        position: { x: 910, y: 185 },
        data: { id: 'customOutput-1', nodeType: 'customOutput', outputName: 'result', outputType: 'Text' },
      },
    ],
    edges: [
      { id: 'e1', source: 'customInput-1',  sourceHandle: 'customInput-1-value',    target: 'httpRequest-1', targetHandle: 'httpRequest-1-body',   ...EDGE_DEFAULTS },
      { id: 'e2', source: 'httpRequest-1',  sourceHandle: 'httpRequest-1-success',  target: 'llm-1',         targetHandle: 'llm-1-prompt',         ...EDGE_DEFAULTS },
      { id: 'e3', source: 'llm-1',          sourceHandle: 'llm-1-response',         target: 'customOutput-1', targetHandle: 'customOutput-1-value', ...EDGE_DEFAULTS },
    ],
    nodeIDs: { customInput: 1, httpRequest: 1, llm: 1, customOutput: 1 },
  },
];
