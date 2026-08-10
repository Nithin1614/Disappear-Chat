export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 18, md: 28, lg: 40 };
  const px = sizes[size] || 28;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: px, height: px,
        border: `2px solid var(--surface-3)`,
        borderTop: `2px solid var(--accent)`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      {text && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{text}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
