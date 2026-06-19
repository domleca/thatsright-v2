/* ───────────────────────────────────────────────────────────────────────────
   That's Right. — V7 orb, ported to <canvas>.

   A stroked wireframe polar curve (NOT a sphere). No fill, no gradient, no glow.
   180 polar points, 5 harmonics (k = 2,3,5,7,11). At rest it reads as a near-
   perfect circle that gently breathes, with faint ripples leaving the edge.
   A "listen" level (0→1) lifts the harmonics so it visibly wobbles and a soft
   deep-ink ground fades up behind it — the iOS "listening" inversion, kept
   contained so the page never flashes.

   Reactivity (set via window.ThatsRightOrb.mount(...).setReactivity):
     'both'      — cursor proximity + CTA hover
     'proximity' — cursor proximity only
     'cta'       — CTA hover only
     'off'       — breathes undisturbed
   ───────────────────────────────────────────────────────────────────────────*/
(function () {
  'use strict';

  const INK = '#2e2e2e';
  const CREAM = '#f4f2ee';
  // ripple shading — a pale crest (lighter than cream) and a warm shadow
  // (darker than cream) give the travelling wave a sense of raised volume.
  const HILITE = '255,255,253';
  const SHADOW = '74,64,52';
  const HARMONICS = [2, 3, 5, 7, 11];
  // Per-harmonic resting amplitude (fraction of radius) and angular speed.
  const REST_AMP = [0.0065, 0.0052, 0.0040, 0.0028, 0.0019];
  const SPEED = [0.34, -0.27, 0.21, -0.17, 0.13];
  const PHASE0 = [0.0, 1.3, 2.6, 0.7, 3.4];
  const N = 180;
  const TAU = Math.PI * 2;
  // Orb radius as a fraction of the (oversized) canvas. The canvas is drawn 2×
  // the visible orb box via CSS, so ripples have room to travel past the box
  // without being clipped; FRAC keeps the orb itself the same visible size.
  const FRAC = 0.21;

  const reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mount(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssW = 0, cssH = 0;

    let reactivity = opts.reactivity || 'both';
    let speed = (opts.speed != null) ? opts.speed : 1;   // <1 slows the breathing + wave cadence
    // volumetric-ripple tunables (overridable via opts / api.setParams)
    let emitEvery = (opts.emitEvery != null) ? opts.emitEvery : 1.4;    // seconds between ripples
    let ridgeWidth = (opts.ridgeWidth != null) ? opts.ridgeWidth : 0.12; // ridge thickness / orb R
    let liftStrength = (opts.lift != null) ? opts.lift : 1.0;            // overall swell strength
    let dotSize = (opts.dotSize != null) ? opts.dotSize : 0.8;           // particle size ref (pt / 140 orb)
    let grainRest = (opts.grain != null) ? opts.grain : 0.0;            // resting particle visibility 0..1
    let ringOpacity = (opts.ringOpacity != null) ? opts.ringOpacity : 0.32; // legacy expanding-ring opacity
    let listen = 0;          // current eased listening level 0..1
    let target = 0;          // target listening level
    let ctaHover = 0;        // 0/1 from CTA hover
    let proximity = 0;       // 0..1 from cursor proximity
    let pointerInside = false;
    let voiceOn = false;     // true while a voice turn is active (listen OR speak)
    const voiceSeed = Math.random() * 1000;

    // A speech-like amplitude envelope (0..1): syllable openings + faster
    // formant flutter, with short phrase-pauses. Used to make the orb read as
    // reacting to a live voice — in both the listening and speaking phases.
    function voiceEnv(t) {
      const syll = Math.pow(Math.abs(Math.sin(t * 5.0 + voiceSeed)), 0.85);
      const fast = 0.5 + 0.5 * Math.sin(t * 12.0 + voiceSeed * 1.7);
      let e = syll * (0.55 + 0.45 * fast);
      if (Math.sin(t * 1.15 + voiceSeed) < -0.55) e *= 0.12; // brief pauses between phrases
      return Math.max(0, Math.min(1, e));
    }

    const ripples = [];      // {age} expanding rings
    let lastRipple = 0;
    let field = null;        // fixed particle field the travelling wave lifts & shadows
    let lastT = 0;           // last animation time, so resize can repaint the pose

    function resize() {
      const r = canvas.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return; // layout not ready yet — try again later
      cssW = r.width; cssH = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildField();
      draw(lastT); // always paint a static frame immediately (rAF may be throttled)
    }

    const ro = ('ResizeObserver' in window) ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    window.addEventListener('resize', resize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
    window.addEventListener('load', resize);

    // ── pointer proximity ────────────────────────────────────────────────
    function onMove(e) {
      if (reactivity === 'off' || reactivity === 'cta') { proximity = 0; return; }
      const r = canvas.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(e.clientX - cx, e.clientY - cy);
      const near = Math.min(r.width, r.height) * FRAC * 1.15;   // touching the orb
      const far = Math.min(r.width, r.height) * FRAC * 4.0;     // influence radius
      const p = 1 - (d - near) / (far - near);
      proximity = Math.max(0, Math.min(1, p));
    }
    function onLeaveWindow() { proximity = 0; }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerout', (e) => { if (!e.relatedTarget) onLeaveWindow(); });

    // ── shape sampling ───────────────────────────────────────────────────
    function radiusAt(theta, t, ampScale) {
      let r = 1;
      for (let i = 0; i < HARMONICS.length; i++) {
        const a = REST_AMP[i] * ampScale;
        r += a * Math.sin(HARMONICS[i] * theta + PHASE0[i] + SPEED[i] * t);
      }
      return r;
    }

    // sample the (lobed) ring outline of a ripple at radius rr
    function ringPath(rr, tEmit, ampEmit, cx, cy) {
      const pts = new Array(N + 1);
      for (let j = 0; j <= N; j++) {
        const theta = (j / N) * Math.PI * 2;
        const radius = rr * radiusAt(theta, tEmit, ampEmit);
        pts[j] = { x: cx + radius * Math.cos(theta), y: cy + radius * Math.sin(theta) };
      }
      return pts;
    }

    // Build the fixed particle field once per resize: a faintly-jittered grid of
    // dots covering the canvas, each carrying its distance & angle from centre so
    // a travelling wave can find the dots it currently crosses. Dots inside the
    // orb are skipped — the wave only ever lives outside the rim.
    function buildField() {
      if (cssW === 0) { field = null; return; }
      const baseR = Math.min(cssW, cssH) * FRAC;
      const cell = Math.max(5, baseR * 0.058);
      const cx = cssW / 2, cy = cssH / 2;
      const cols = Math.ceil(cssW / cell) + 1;
      const rows = Math.ceil(cssH / cell) + 1;
      const inner = baseR * 0.86;
      const cap = 6000;
      const arr = [];
      let seed = 1;
      const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
      for (let r = 0; r < rows && arr.length < cap; r++) {
        for (let c = 0; c < cols && arr.length < cap; c++) {
          const x = c * cell + (rnd() - 0.5) * cell * 0.95;
          const y = r * cell + (rnd() - 0.5) * cell * 0.95;
          const dx = x - cx, dy = y - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < inner) continue;                 // leave the orb interior clean
          arr.push({ x, y, dist, ang: Math.atan2(dy, dx), g: 0.78 + rnd() * 0.44 });
        }
      }
      field = arr;
    }

    function draw(t) {
      ctx.clearRect(0, 0, cssW, cssH);
      const cx = cssW / 2, cy = cssH / 2;
      const baseR = Math.min(cssW, cssH) * FRAC;

      // gentle breathing + a touch of swell while listening
      const breathe = reduceMotion ? 1 : 1 + 0.018 * Math.sin(t * 0.55 * speed);
      const R = baseR * breathe * (1 + 0.02 * listen);

      // harmonics lift 1× → ~6.5× across the listen range; a touch of swell too.
      // No colour change — reaction is purely in the shape's motion.
      const ampScale = 1 + listen * 5.5;

      const strokeMain = INK;

      // volumetric ripples — the orb sheds a wave that rolls outward through a
      // fine particle surface. Where the wave crosses, the grain is lifted and
      // bunched (pushed outward a touch) and lit from above: the upper face of
      // the crest catches a pale highlight, the lower face falls into soft
      // shadow — so the wave reads as a band of raised, shadowed volume moving
      // across the page, then settling back to nothing as it fades.
      if (!reduceMotion && field) {
        const maxR = Math.min(cssW, cssH) * 0.46;
        // advance ripples and collect the ones currently alive
        const active = [];
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.age += 0.0050 * speed;           // constant travel speed
          if (rp.age >= 1) { ripples.splice(i, 1); continue; }
          const reach = 1 - Math.pow(1 - rp.age, 2);          // ease-out travel
          const rrBase = R * 0.99 + (maxR - R * 0.99) * reach;
          const grow = Math.min(1, rp.age / 0.14);            // swell rises after birth
          const fade = Math.pow(1 - rp.age, 1.5);             // …then eases away
          active.push({ rrBase, tEmit: rp.tEmit, ampEmit: rp.ampEmit, lift: grow * fade, age: rp.age });
        }
        if (t - lastRipple > emitEvery / speed) { ripples.push({ age: 0, tEmit: t * speed, ampEmit: ampScale }); lastRipple = t; }

        // the classic ripple — a thin lobed ring, expanding outward and fading.
        if (ringOpacity > 0) {
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.strokeStyle = INK;
          ctx.lineWidth = baseR * (1.6 / 140);
          for (let a = 0; a < active.length; a++) {
            const A = active[a];
            const ringAlpha = ringOpacity * Math.pow(1 - A.age, 1.4);
            if (ringAlpha <= 0.003) continue;
            ctx.globalAlpha = ringAlpha;
            const pts = ringPath(A.rrBase, A.tEmit, A.ampEmit, cx, cy);
            ctx.beginPath();
            for (let k = 0; k < pts.length; k++) {
              if (k === 0) ctx.moveTo(pts[k].x, pts[k].y); else ctx.lineTo(pts[k].x, pts[k].y);
            }
            ctx.closePath();
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
      }

      // the polar curve
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const theta = (i / N) * Math.PI * 2;
        const rr = R * radiusAt(theta, t * speed, ampScale);
        const x = cx + rr * Math.cos(theta);
        const y = cy + rr * Math.sin(theta);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = baseR * (6 / 140); // ~6pt stroke on a 280pt orb
      ctx.strokeStyle = strokeMain;
      ctx.globalAlpha = 1;
      ctx.stroke();
    }

    // ── loop ─────────────────────────────────────────────────────────────
    let raf = null, t0 = null, running = false;
    function frame(now) {
      if (cssW === 0) resize();
      if (t0 == null) t0 = now;
      const t = (now - t0) / 1000;
      lastT = t;

      // resolve target listen level from reactivity sources
      let tgt = 0;
      if (reactivity === 'both') tgt = Math.max(proximity * 0.7, ctaHover);
      else if (reactivity === 'proximity') tgt = proximity * 0.85;
      else if (reactivity === 'cta') tgt = ctaHover;
      else if (reactivity === 'voice') tgt = voiceOn ? (0.32 + 0.68 * voiceEnv(t)) : 0;
      target = tgt;
      // track the voice envelope quickly so the orb visibly speaks; ease gently otherwise
      const k = (reactivity === 'voice') ? (voiceOn ? 0.24 : 0.1) : 0.06;
      listen += (target - listen) * k;
      if (Math.abs(target - listen) < 0.0005) listen = target;

      draw(t);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running || reduceMotion) return; running = true; t0 = null; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    resize();
    requestAnimationFrame(() => { resize(); });
    if (reduceMotion) {
      draw(0);
    } else {
      start();
      // Looping animations should pause when off-screen (saves CPU/GPU).
      if ('IntersectionObserver' in window) {
        const vio = new IntersectionObserver((ents) => {
          ents.forEach((e) => { e.isIntersecting ? start() : stop(); });
        }, { threshold: 0 });
        vio.observe(canvas);
      }
    }

    const api = {
      setReactivity(mode) {
        reactivity = mode || 'off';
        if (reactivity === 'off' || reactivity === 'proximity') ctaHover = 0;
        if (reactivity === 'off' || reactivity === 'cta') proximity = 0;
      },
      setCtaHover(on) {
        if (reactivity === 'both' || reactivity === 'cta') ctaHover = on ? 0.82 : 0;
      },
      setVoice(on) { voiceOn = !!on; },
      setSpeed(s) { speed = (s != null) ? s : 1; },
      _step(t) { draw(t); },   // debug: drive a frame at time t (for headless capture)
      setParams(o) {
        o = o || {};
        if (o.emitEvery != null) emitEvery = o.emitEvery;
        if (o.ridgeWidth != null) ridgeWidth = o.ridgeWidth;
        if (o.lift != null) liftStrength = o.lift;
        if (o.dotSize != null) dotSize = o.dotSize;
        if (o.grain != null) grainRest = o.grain;
        if (o.ringOpacity != null) ringOpacity = o.ringOpacity;
      },
      destroy() {
        if (raf) cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        window.removeEventListener('pointermove', onMove);
      },
    };
    return api;
  }

  // ── small helpers ────────────────────────────────────────────────────────
  function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
  function hexToRgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function lerpColor(a, b, t) {
    const ca = hexToRgb(a), cb = hexToRgb(b);
    const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
    const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
    const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }

  window.ThatsRightOrb = { mount };
})();
