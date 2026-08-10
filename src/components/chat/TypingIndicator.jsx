export default function TypingIndicator({ typingUsers }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.display_name || u.user_id);
  const text = names.length === 1
    ? `${names[0]} is typing`
    : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : `${names[0]} and ${names.length - 1} others are typing`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 16px 0' }}>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
            background: 'var(--accent)', opacity: 0.7,
            animation: `bounce-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{text}</span>
      <style>{`
        @keyframes bounce-dot {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
