import { Users, User, X } from 'lucide-react';

export default function MemberList({ members, isOpen, onToggle }) {
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        title="Room Members"
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
          zIndex: 40, overflowY: 'auto', display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Room Members ({members.length})</span>
            <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}>
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div style={{ padding: '8px 0' }}>
            {members.map(m => {
              const name = m.display_name || m.user_id;
              return (
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
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.display_name || 'Anonymous'}
                    </p>
                    <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: 'var(--text-dim)', marginTop: '1px' }}>
                      ID: {m.user_id}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
