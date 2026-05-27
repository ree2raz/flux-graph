/**
 * FieldRenderer
 * Renders a single field from a node's field-definition schema.
 *
 * Supported field types:
 *   text      — single-line text input
 *   textarea  — multi-line text input
 *   select    — dropdown; options may be strings or { value, label } objects
 *   number    — numeric input with optional min/max/step
 *   checkbox  — boolean toggle
 */

const baseInputStyle = {
  width: '100%',
  background: '#1c2536',
  border: '1px solid #283452',
  borderRadius: 5,
  color: '#e6edf7',
  fontSize: 12,
  padding: '4px 7px',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 500,
  color: '#94a3c4',
  marginBottom: 3,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

function normalizeOptions(options) {
  return options.map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o
  );
}

export function FieldRenderer({ id, data, field, updateNodeField }) {
  const rawValue = data?.[field.key];
  const value = rawValue !== undefined ? rawValue : (field.default ?? '');

  const update = (val) => updateNodeField(id, field.key, val);

  const sharedProps = {
    style: baseInputStyle,
    className: 'nodrag',        // prevent ReactFlow from treating input drags as node-drags
    onFocus: (e) => (e.target.style.borderColor = '#6366f1'),
    onBlur: (e) => (e.target.style.borderColor = '#283452'),
  };

  let control;

  switch (field.type) {
    case 'textarea':
      control = (
        <textarea
          {...sharedProps}
          value={value}
          rows={field.rows ?? 3}
          onChange={(e) => update(e.target.value)}
          style={{ ...baseInputStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
      );
      break;

    case 'select':
      control = (
        <select
          {...sharedProps}
          value={value}
          onChange={(e) => update(e.target.value)}
          style={{ ...baseInputStyle, cursor: 'pointer' }}
        >
          {normalizeOptions(field.options ?? []).map(({ value: v, label: l }) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      );
      break;

    case 'number':
      control = (
        <input
          {...sharedProps}
          type="number"
          value={value}
          min={field.min}
          max={field.max}
          step={field.step ?? 1}
          onChange={(e) => update(parseFloat(e.target.value))}
        />
      );
      break;

    case 'checkbox':
      control = (
        <label className="nodrag" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => update(e.target.checked)}
            className="nodrag"
            style={{ accentColor: '#6366f1', width: 13, height: 13 }}
          />
          <span style={{ fontSize: 12, color: '#e6edf7' }}>{field.checkboxLabel ?? ''}</span>
        </label>
      );
      // For checkbox we skip the top label and return early.
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {control}
        </div>
      );

    case 'text':
    default:
      control = (
        <input
          {...sharedProps}
          type="text"
          value={value}
          onChange={(e) => update(e.target.value)}
        />
      );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {field.label && <span style={labelStyle}>{field.label}</span>}
      {control}
    </div>
  );
}
