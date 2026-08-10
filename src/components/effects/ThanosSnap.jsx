import { useEffect, useState } from 'react';

/**
 * Full-screen overlay shown AFTER the canvas Thanos snap animation completes.
 * The actual disintegration canvas animation runs via useThanosSnap hook.
 */
export default function ThanosSnap({ isExpired, onRedirect }) {
  const [show, setShow] = useState(false);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isExpired) return;
    // Let the canvas particle animation run first (3s), then show this overlay
    const showTimer = setTimeout(() => setShow(true), 3000);
    // Redirect after showing for 3s
    const redirectTimer = setTimeout(() => { if (onRedirect) onRedirect(); }, 6000);
    return () => { clearTimeout(showTimer); clearTimeout(redirectTimer); };
  }, [isExpired, onRedirect]);

  // Animated dots
  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(id);
  }, [show]);

  if (!isExpired || !show) return null;

  return (
    <div className="animate-fade-in" style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px',
    }}>
      {/* Particle canvas overlay hint */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            style={{
              width: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1,
              height: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1,
              borderRadius: '50%',
              background: `hsl(${210 + i * 8}, 80%, ${50 + i * 3}%)`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `particle-fade ${0.8 + i * 0.15}s ease-out forwards`,
            }}
          />
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '8px', letterSpacing: '-0.01em' }}>
          This room has vanished
        </h2>
        <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.6 }}>
          All messages have been permanently destroyed.<br />
          No trace remains.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse-dot 1s ease-in-out infinite' }} />
        <span style={{ fontSize: '13px', color: '#333' }}>Redirecting{dots}</span>
      </div>

      <style>{`
        @keyframes particle-fade {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-20px) scale(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
