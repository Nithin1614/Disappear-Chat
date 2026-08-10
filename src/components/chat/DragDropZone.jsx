import { Upload } from 'lucide-react';

export default function DragDropZone({ isDragging }) {
  if (!isDragging) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 30,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.75)', pointerEvents: 'none',
    }}>
      <div style={{
        textAlign: 'center', padding: '40px 48px', borderRadius: '16px',
        border: '2px dashed var(--accent)', background: 'var(--accent-dim)',
      }}>
        <Upload size={36} color="var(--accent)" style={{ margin: '0 auto 12px', display: 'block' }} />
        <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Drop to send</p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Images and files up to 10MB</p>
      </div>
    </div>
  );
}
