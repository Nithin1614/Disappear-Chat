import { useState, useEffect, useRef } from 'react';
import { Lock, Shield, Check, Flame, Zap } from 'lucide-react';

export default function VisualTransmission3D() {
  // Steps: 1: Lock on Device A, 2: Flight in 3D Transit, 3: Decrypt on Device B & Countdown, 4: Explode & Wipe
  const [step, setStep] = useState(1);
  const [countdown, setCountdown] = useState(3);
  const canvasRef = useRef(null);
  const mobileCanvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Auto-run continuous transmission loop
  useEffect(() => {
    let t;
    if (step === 1) {
      // Step 1: Encrypting on Sender (lasts 2s)
      t = setTimeout(() => setStep(2), 2000);
    } else if (step === 2) {
      // Step 2: Flying in Transit (lasts 2.2s)
      t = setTimeout(() => {
        setStep(3);
        setCountdown(3);
      }, 2200);
    } else if (step === 3) {
      // Step 3: Countdown on Receiver
      const cdInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(cdInterval);
            setStep(4);
            triggerExplosion();
            return 0;
          }
          return prev - 1;
        });
      }, 800);
      return () => clearInterval(cdInterval);
    } else if (step === 4) {
      // Step 4: Disintegrated & Clean (lasts 2.5s then loop)
      t = setTimeout(() => {
        setStep(1);
      }, 2500);
    }
    return () => clearTimeout(t);
  }, [step]);

  // Particle explosion on canvas
  const triggerExplosion = () => {
    // Desktop canvas
    const canvas = canvasRef.current;
    const mCanvas = mobileCanvasRef.current;
    const targets = [];

    if (canvas && canvas.offsetWidth > 0) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      targets.push({ canvas, ctx: canvas.getContext('2d'), x: canvas.width * 0.78, y: canvas.height * 0.48 });
    }
    if (mCanvas && mCanvas.offsetWidth > 0) {
      mCanvas.width = mCanvas.offsetWidth;
      mCanvas.height = mCanvas.offsetHeight;
      targets.push({ canvas: mCanvas, ctx: mCanvas.getContext('2d'), x: mCanvas.width * 0.5, y: mCanvas.height * 0.48 });
    }

    if (targets.length === 0) return;

    const particles = [];
    const count = 110;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4.5 + 2;
      particles.push({
        relX: (Math.random() - 0.5) * 60,
        relY: (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 2,
        size: Math.random() * 3.5 + 1.5,
        color: Math.random() > 0.4 ? '#6D4AFF' : '#FF4747',
        alpha: 1,
        decay: Math.random() * 0.03 + 0.015,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    const render = () => {
      let alive = false;
      targets.forEach(({ canvas: c, ctx }) => ctx.clearRect(0, 0, c.width, c.height));

      for (let p of particles) {
        if (p.alpha <= 0) continue;
        alive = true;
        p.relX += p.vx;
        p.relY += p.vy;
        p.vy -= 0.03;
        p.alpha -= p.decay;
        p.rotation += p.rotSpeed;

        targets.forEach(({ ctx, x, y }) => {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.translate(x + p.relX, y + p.relY);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        });
      }
      if (alive) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    render();
  };

  return (
    <div style={{
      width: '100%',
      padding: '16px 0 28px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* ======================================================== */}
      {/* 1. DESKTOP VIEWPORT: DUAL-PHONE 3D FLIGHT TRANSMISSION    */}
      {/* ======================================================== */}
      <div className="desktop-flex" style={{
        position: 'relative',
        height: '420px',
        alignItems: 'center',
        justifyContent: 'center',
        perspective: '1200px',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(109, 74, 255, 0.14) 0%, var(--surface) 80%)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
      }}>
        {/* Canvas Particle Layer (Desktop) */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 40
          }}
        />

        {/* Transmission Stage Container */}
        <div style={{
          width: '100%',
          maxWidth: '860px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          position: 'relative',
          zIndex: 10
        }}>
          {/* DEVICE A (SENDER) */}
          <div style={{
            width: '200px',
            height: '320px',
            background: 'var(--bg)',
            border: step === 1 ? '2px solid var(--accent)' : '1px solid var(--border)',
            borderRadius: '28px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: step === 1
              ? '0 20px 40px rgba(109, 74, 255, 0.35), 0 0 25px rgba(109, 74, 255, 0.25)'
              : '0 15px 35px rgba(0,0,0,0.5)',
            transform: 'rotateY(16deg) rotateX(4deg)',
            transition: 'all 0.5s ease',
            position: 'relative'
          }}>
            <div style={{ width: '54px', height: '5px', borderRadius: '9999px', background: 'var(--border)', margin: '2px auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 10px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Sender</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px', padding: '10px 4px' }}>
              <div style={{
                background: step === 1
                  ? 'linear-gradient(135deg, rgba(109, 74, 255, 0.3) 0%, rgba(109, 74, 255, 0.15) 100%)'
                  : 'var(--surface-2)',
                border: step === 1 ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: '14px',
                padding: '10px 12px',
                transition: 'all 0.4s ease',
                opacity: step === 4 ? 0.3 : 1
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  {step === 1 ? <Lock size={12} color="var(--accent)" /> : <Shield size={12} color="var(--success)" />}
                  <span style={{ fontSize: '10px', fontWeight: 700, color: step === 1 ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {step === 1 ? 'Locking on Device' : 'Sent · Encrypted'}
                  </span>
                </div>
                <div style={{
                  height: '24px',
                  borderRadius: '6px',
                  background: step === 1 ? 'rgba(109, 74, 255, 0.35)' : 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 8px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#FFFFFF'
                }}>
                  {step === 1 ? '🔒 [AES-256 Encrypted]' : '••••••••••••'}
                </div>
              </div>
            </div>
            <div style={{ width: '60px', height: '4px', borderRadius: '9999px', background: 'var(--border)', margin: 'auto auto 4px' }} />
          </div>

          {/* FLIGHT PATH (3D TRANSIT SPACE) */}
          <div style={{
            flex: 1,
            height: '140px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 20px'
          }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              <path
                d="M 10 70 Q 150 15, 300 70"
                fill="none"
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="2"
                strokeDasharray="6 6"
              />
              <path
                d="M 10 70 Q 150 15, 300 70"
                fill="none"
                stroke="url(#flyBeam)"
                strokeWidth="3"
                strokeDasharray="40 160"
                strokeDashoffset={step === 2 ? '0' : '200'}
                style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
              />
              <defs>
                <linearGradient id="flyBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6D4AFF" />
                  <stop offset="50%" stopColor="#00C48C" />
                  <stop offset="100%" stopColor="#FF4747" />
                </linearGradient>
              </defs>
            </svg>

            {/* Flying 3D Cipher Cube */}
            <div style={{
              position: 'absolute',
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6D4AFF 0%, #4925D4 100%)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 0 25px rgba(109, 74, 255, 0.8), 0 0 10px #00C48C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              zIndex: 30,
              transform: step === 1
                ? 'translateX(-120px) translateY(10px) scale(0.6)'
                : step === 2
                  ? 'translateX(0px) translateY(-30px) scale(1.1) rotate(180deg)'
                  : 'translateX(120px) translateY(10px) scale(0.6)',
              opacity: step === 2 ? 1 : 0,
              transition: 'all 1.8s cubic-bezier(0.25, 1, 0.5, 1)'
            }}>
              <Lock size={20} color="#FFFFFF" strokeWidth={2.5} />
            </div>

            <div style={{ position: 'absolute', bottom: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0, 196, 140, 0.15)', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={12} color="var(--success)" />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                Zero-Knowledge Transit
              </span>
            </div>
          </div>

          {/* DEVICE B (RECEIVER) */}
          <div style={{
            width: '200px',
            height: '320px',
            background: 'var(--bg)',
            border: step === 3
              ? '2px solid var(--warning)'
              : step === 4
                ? '2px solid var(--danger)'
                : '1px solid var(--border)',
            borderRadius: '28px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: step === 3
              ? '0 20px 40px rgba(245, 158, 11, 0.3), 0 0 25px rgba(245, 158, 11, 0.2)'
              : step === 4
                ? '0 20px 40px rgba(255, 71, 71, 0.3)'
                : '0 15px 35px rgba(0,0,0,0.5)',
            transform: 'rotateY(-16deg) rotateX(4deg)',
            transition: 'all 0.5s ease',
            position: 'relative'
          }}>
            <div style={{ width: '54px', height: '5px', borderRadius: '9999px', background: 'var(--border)', margin: '2px auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 10px', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>Receiver</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px 4px', position: 'relative' }}>
              {/* Step 3: Message Opened & Countdown */}
              {step === 3 && (
                <div style={{
                  width: '100%',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  animation: 'scale-in 0.3s ease forwards'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--warning)' }}>
                      Expires in:
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: 'var(--warning)',
                      background: 'rgba(245, 158, 11, 0.25)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      0{countdown}s
                    </span>
                  </div>
                  <div style={{
                    height: '24px',
                    borderRadius: '6px',
                    background: 'var(--surface-2)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    fontSize: '11px',
                    color: 'var(--text)'
                  }}>
                    Message Opened
                  </div>
                </div>
              )}

              {/* Step 4: Disintegrated / Wiped */}
              {step === 4 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  animation: 'fade-in 0.3s ease forwards'
                }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(0, 196, 140, 0.15)',
                    border: '1px solid var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={20} color="var(--success)" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)' }}>
                    Wiped from Memory
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                    0 bytes stored
                  </span>
                </div>
              )}

              {(step === 1 || step === 2) && (
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', fontStyle: 'italic' }}>
                  Waiting for incoming private message...
                </div>
              )}
            </div>

            <div style={{ width: '60px', height: '4px', borderRadius: '9999px', background: 'var(--border)', margin: 'auto auto 4px' }} />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MOBILE VIEWPORT: SLEEK SINGLE 3D DEVICE VIEWPORT       */}
      {/* ======================================================== */}
      <div className="mobile-flex" style={{
        position: 'relative',
        minHeight: '380px',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 50%, rgba(109, 74, 255, 0.16) 0%, var(--surface) 80%)',
        borderRadius: '20px',
        border: '1px solid var(--border)',
        padding: '24px 16px',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Mobile Particle Canvas */}
        <canvas
          ref={mobileCanvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 40
          }}
        />

        {/* Dynamic Mobile 3D Phone Screen */}
        <div style={{
          width: '100%',
          maxWidth: '260px',
          height: '290px',
          background: 'var(--bg)',
          border: step === 1
            ? '2px solid var(--accent)'
            : step === 2
              ? '2px solid var(--success)'
              : step === 3
                ? '2px solid var(--warning)'
                : '2px solid var(--danger)',
          borderRadius: '24px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
          position: 'relative',
          zIndex: 10,
          transition: 'border-color 0.4s ease'
        }}>
          {/* Notch */}
          <div style={{ width: '48px', height: '4px', borderRadius: '9999px', background: 'var(--border)', margin: '2px auto 12px' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px', borderBottom: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>
              {step === 1 ? '1. Sender' : step === 2 ? '2. Transit' : '3. Receiver'}
            </span>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: step === 1 ? 'var(--accent)' : step === 2 ? 'var(--success)' : step === 3 ? 'var(--warning)' : 'var(--danger)'
            }} />
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '8px 4px' }}>
            {step === 1 && (
              <div style={{ width: '100%', background: 'rgba(109, 74, 255, 0.15)', border: '1px solid var(--accent)', borderRadius: '12px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Lock size={12} color="var(--accent)" />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)' }}>Locking on Device</span>
                </div>
                <div style={{ fontSize: '12px', color: '#FFFFFF', fontFamily: 'monospace' }}>
                  🔒 [AES-256 Encrypted]
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(109, 74, 255, 0.7)' }}>
                  <Zap size={18} color="#FFFFFF" />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--success)' }}>Zero-Knowledge Transit</span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Zero plaintext stored on servers</span>
              </div>
            )}

            {step === 3 && (
              <div style={{ width: '100%', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid var(--warning)', borderRadius: '12px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--warning)' }}>Expires in:</span>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--warning)' }}>0{countdown}s</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                  Message Opened
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0, 196, 140, 0.2)', border: '1px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={18} color="var(--success)" strokeWidth={3} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--success)' }}>Wiped from Memory</span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>0 bytes stored</span>
              </div>
            )}
          </div>

          <div style={{ width: '54px', height: '4px', borderRadius: '9999px', background: 'var(--border)', margin: 'auto auto 2px' }} />
        </div>
      </div>

      {/* Clean Timeline Tracker Below (Responsive) */}
      <div style={{
        marginTop: '18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(8px, 3vw, 20px)',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 600,
          color: step === 1 ? 'var(--accent)' : 'var(--text-muted)',
          transition: 'color 0.3s'
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: step === 1 ? 'var(--accent)' : 'var(--border)' }} />
          <span>1. Locks on Device</span>
        </div>

        <span style={{ color: 'var(--border)' }}>➔</span>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 600,
          color: step === 2 ? '#00C48C' : 'var(--text-muted)',
          transition: 'color 0.3s'
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: step === 2 ? '#00C48C' : 'var(--border)' }} />
          <span>2. Scrambled in Transit</span>
        </div>

        <span style={{ color: 'var(--border)' }}>➔</span>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: 600,
          color: (step === 3 || step === 4) ? '#FF4747' : 'var(--text-muted)',
          transition: 'color 0.3s'
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: (step === 3 || step === 4) ? '#FF4747' : 'var(--border)' }} />
          <span>3. Expires at Zero</span>
        </div>
      </div>
    </div>
  );
}
