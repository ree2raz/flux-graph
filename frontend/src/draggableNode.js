// draggableNode.js

export const DraggableNode = ({ type, label, Icon, accentColor = '#6366f1' }) => {
  const onDragStart = (event) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ nodeType: type })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      title={`Drag to canvas to add ${label}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        cursor: 'grab',
        padding: '8px 14px',
        minWidth: 72,
        borderRadius: 8,
        background: '#16223c',
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 ${accentColor}18`,
        userSelect: 'none',
        transition: 'transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 20px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor}60`;
        e.currentTarget.style.borderColor = `${accentColor}70`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 ${accentColor}18`;
        e.currentTarget.style.borderColor = `${accentColor}30`;
      }}
    >
      {Icon && (
        <Icon
          size={15}
          style={{ color: accentColor, strokeWidth: 2 }}
        />
      )}
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#cdd8ee',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
};
