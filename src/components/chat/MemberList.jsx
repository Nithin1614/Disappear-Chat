import { Users, User, X } from 'lucide-react';

export default function MemberList({ members, isOpen, onToggle }) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        title="Members"
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 10px', borderRadius: '8px', cursor: 'pointer',
          background: isOpen ? 'var(--accent-dim)' : 'var(--surface-2)',
          border: `1px solid ${isOpen ? 'var(--accent-border)' : 'var(--border)'}`,
          color: isOpen ? 'var(--accent)' : 'var(--text-muted)',
          fontSize: '13px', fontWeight: 500, transition: 'all 0.15s',
        }}
      >
        <Users size={14} />
        <span>{members.length}</span>
      </button>

      {/* Sidebar panel */}
      {isOpen && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '240px',
          background: 'var(--surface)', borderLeft: '1px solid var(--border)',
          zIndex: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Members ({members.length})</span>
            <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div style={{ padding: '8px 0' }}>
            {members.map(m => (
              <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={14} color="#fff" />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2, width: 9, height: 9, borderRadius: '50%',
                    background: m.is_online ? 'var(--success)' : 'var(--text-dim)',
                    border: '2px solid var(--surface)',
                  }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user_id}</p>
                  {m.display_name && <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.display_name}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
