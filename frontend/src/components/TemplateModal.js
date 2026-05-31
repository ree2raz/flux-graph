import { useEffect } from 'react';
import { Workflow, X, ArrowRight } from 'lucide-react';
import { TEMPLATES } from '../templates';
import { useStore } from '../store';

function NodeChip({ label, color }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        borderRadius: 4,
        padding: '2px 7px',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function TemplateCard({ template, onSelect }) {
  return (
    <button
      onClick={() => onSelect(template)}
      style={{
        background: '#0e1828',
        border: '1px solid #1e2d47',
        borderRadius: 10,
        padding: '18px 18px 16px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.15s, background 0.15s',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = template.accent;
        e.currentTarget.style.background = `${template.accent}08`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1e2d47';
        e.currentTarget.style.background = '#0e1828';
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          width: 28,
          height: 3,
          borderRadius: 99,
          background: template.accent,
          marginBottom: 2,
        }}
      />

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf7', marginBottom: 5 }}>
          {template.name}
        </div>
        <div style={{ fontSize: 12, color: '#5b6b8c', lineHeight: 1.5 }}>
          {template.description}
        </div>
      </div>

      {/* Node flow preview */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        {template.preview.map((chip, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <NodeChip label={chip.label} color={chip.color} />
            {i < template.preview.length - 1 && (
              <ArrowRight size={10} style={{ color: '#283452', flexShrink: 0 }} />
            )}
          </span>
        ))}
      </div>
    </button>
  );
}

export function TemplateModal({ onClose }) {
  const loadTemplate = useStore((s) => s.loadTemplate);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSelect = (template) => {
    loadTemplate(template);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(11,17,32,0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fade-in 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-modal-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#111a2e',
          border: '1px solid #283452',
          borderRadius: 14,
          boxShadow: '0 24px 64px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)',
          padding: '24px 24px 20px',
          width: '100%',
          maxWidth: 680,
          animation: 'slide-up 0.25s cubic-bezier(0.22,1,0.36,1)',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <Workflow size={17} style={{ color: '#6366f1', marginRight: 9 }} />
          <h2
            id="template-modal-title"
            style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#e6edf7' }}
          >
            Start from a template
          </h2>
          <button
            onClick={onClose}
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

        <p style={{ margin: '0 0 18px', fontSize: 12, color: '#5b6b8c' }}>
          Pick one to load onto the canvas, or start blank.
        </p>

        {/* Template cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 16,
          }}
        >
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.id} template={t} onSelect={handleSelect} />
          ))}
        </div>

        {/* Start blank */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#5b6b8c',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '4px 8px',
              borderRadius: 5,
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#94a3c4')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#5b6b8c')}
          >
            Start blank →
          </button>
        </div>
      </div>
    </div>
  );
}
