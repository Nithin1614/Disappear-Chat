import { useEffect, useState, useRef } from 'react';

const PARTICLE_COUNT = 120;

function randomBetween(a, b) {
  return a + Math.random() * (b - a);
}

/**
 * Fullscreen Thanos disintegration overlay.
 * Fires immediately when isExpired=true. Runs CSS particle animation,
 * then calls onRedirect after 3.2 seconds — no html2canvas dependency.
 */
export default function ThanosSnap({ isExpired, onRedirect }) {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState([]);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!isExpired) return;

    // Show immediately
    setShow(true);

    // Generate particle positions
    const pts = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      size: randomBetween(2, 7),
      x: randomBetween(0, 100),  // % from left
      y: randomBetween(0, 100),  // % from top
      tx: randomBetween(-40, 40),  // drift vw
      ty: randomBetween(-60, 10),  // drift vh
      delay: randomBetween(0, 1.2),
      duration: randomBetween(1.2, 2.8),
      hue: randomBetween(140, 200),
    }));
    setParticles(pts);

    // Redirect after animation completes
    const timer = setTimeout(() => {
      if (!redirectedRef.current && onRedirect) {
        redirectedRef.current = true;
        onRedirect();
      }
    }, 3200);

    return () => clearTimeout(timer);
  }, [isExpired, onRedirect]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Particle field */}
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `hsl(${p.hue}, 70%, 60%)`,
            boxShadow: `0 0 ${p.size * 2}px hsl(${p.hue}, 80%, 55%)`,
            animation: `thanos-particle ${p.duration}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}

      {/* Center text */}
      <div style={{ textAlign: 'center', zIndex: 1, animation: 'thanos-text 0.6s ease 0.3s both' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.8))' }}>
          💀
        </div>
        <h2 style={{
          fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 800, color: '#fff',
          letterSpacing: '-0.02em', marginBottom: '10px',
          textShadow: '0 0 30px rgba(16,185,129,0.6)'
        }}>
          This room has vanished
        </h2>
        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.7 }}>
          All messages permanently destroyed.<br />No trace remains.
        </p>
        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: '#10b981',
            animation: 'thanos-pulse 0.8s ease-in-out infinite'
          }} />
          <span style={{ fontSize: '13px', color: '#374151' }}>Returning to dashboard…</span>
        </div>
      </div>

      <style>{`
        @keyframes thanos-particle {
          0%   { opacity: 1; transform: translate(0,0) scale(1); }
          100% { opacity: 0; transform: translate(var(--tx, 30vw), var(--ty, -40vh)) scale(0.1); }
        }
        @keyframes thanos-text {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes thanos-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.3; transform: scale(0.7); }
        }
      `}</style>
    </div>
  );
}
