document.addEventListener('DOMContentLoaded', function () {

  var photo = document.querySelector('.profile-wrapper');
  var heroSection = document.querySelector('.hero-section');
  var heroBackground = document.querySelector('.hero-background');
  var osRoot = document.getElementById('geeoohOs');

  if (!photo || !heroSection || !osRoot) return;

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function shouldSimplify() {
    return !!(reduceMotion ||
      (window.matchMedia && window.matchMedia('(max-width: 760px)').matches) ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));
  }

  /* ── FONTS ── */
  (function ensureFonts() {
    if (document.getElementById('idl-fonts')) return;
    var link = document.createElement('link');
    link.id = 'idl-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@300;400;500&family=JetBrains+Mono:wght@300;400&display=swap';
    document.head.appendChild(link);
  })();

  /* ── STYLES ── */
  var style = document.createElement('style');
  style.textContent = `
    :root {
      --idl-bg: #050407;
      --idl-bg-deep: #020203;
      --idl-ink: #F4EFE9;
      --idl-ink-dim: #9D9AA3;
      --idl-ink-ghost: #4a4852;
      --idl-accent: #FF6B00;
      --idl-accent-soft: #FF9A52;
      --idl-violet: #7C3AED;
      --idl-cyan: #06B6D4;
      --idl-ease: cubic-bezier(.16,1,.3,1);
      --idl-ease-in: cubic-bezier(.7,0,.84,0);
      --idl-ease-photo: cubic-bezier(.22,1.12,.36,1);
    }

    /* ── veil ── */
    .idl-veil {
      position: absolute; inset: 0; pointer-events: none; opacity: 0; z-index: 1;
      background:
        radial-gradient(ellipse 70% 50% at 50% 28%, rgba(255,107,0,0.14), transparent 60%),
        linear-gradient(180deg, rgba(2,2,4,0) 0%, rgba(2,2,3,0.92) 100%);
      transition: opacity 1300ms var(--idl-ease);
    }
    .hero-section.idl-dissolve .idl-veil { opacity: 1; }

    /* ── hero dissolve ── */
    .hero-text > * {
      transition: opacity 600ms var(--idl-ease-in), transform 600ms var(--idl-ease-in), filter 600ms ease;
    }
    .hero-section.idl-freeze .hero-text > * {
      opacity: .5; filter: grayscale(.5) brightness(.7);
    }
    .hero-section.idl-dissolve .hero-text > * {
      opacity: 0; transform: translateY(14px); filter: blur(6px); pointer-events: none;
    }
    .hero-section.idl-dissolve .hero-text > .hero-badge    { transition-delay: 0ms; }
    .hero-section.idl-dissolve .hero-text > .hero-title    { transition-delay: 50ms; }
    .hero-section.idl-dissolve .hero-text > .hero-description { transition-delay: 110ms; }
    .hero-section.idl-dissolve .hero-text > .hero-cta      { transition-delay: 170ms; }
    .hero-section.idl-dissolve .hero-text > .social-links  { transition-delay: 230ms; }
    .hero-section.idl-dissolve .hero-text > .email-badge   { transition-delay: 290ms; }

    /* ── KEEP PHOTO VISIBLE DURING DISSOLVE ── */
    .hero-section.idl-dissolve .profile-wrapper,
    .hero-section.idl-dissolve .profile-wrapper.idl-photo-anchor,
    .hero-section.idl-dissolve .profile-wrapper.idl-photo-zoom,
    .hero-section.idl-freeze .profile-wrapper {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      z-index: 61 !important;
      filter: none !important;
    }

    /* ── portal ring ── */
    .idl-portal-ring {
      position: absolute; width: 10px; height: 10px; border-radius: 50%;
      top: var(--idl-iy, 50%); left: var(--idl-ix, 50%);
      transform: translate(-50%,-50%) scale(1);
      border: 2px solid rgba(255,107,0,0.9);
      box-shadow: 0 0 24px rgba(255,107,0,0.5);
      opacity: 0; pointer-events: none; z-index: 45;
    }
    .idl-portal-ring.idl-ring-play {
      animation: idlPortalRing 1300ms cubic-bezier(.22,.61,.36,1) forwards;
    }
    @keyframes idlPortalRing {
      0%   { transform: translate(-50%,-50%) scale(1); opacity: 0; }
      15%  { opacity: 1; }
      70%  { opacity: .4; }
      100% { transform: translate(-50%,-50%) scale(170); opacity: 0; }
    }
    @media (prefers-reduced-motion: reduce) { .idl-portal-ring { display: none; } }

    /* ── burst ── */
    .idl-burst {
      position: absolute; top: var(--idl-iy,50%); left: var(--idl-ix,50%);
      width: 0; height: 0; pointer-events: none; z-index: 46;
    }
    .idl-burst-dot {
      position: absolute; top: 0; left: 0; width: 4px; height: 4px; border-radius: 50%;
      background: var(--idl-accent-soft); box-shadow: 0 0 10px rgba(255,107,0,.8);
      opacity: 0; transform: translate(-50%,-50%);
    }
    .idl-burst.idl-burst-play .idl-burst-dot {
      animation: idlBurstFly 620ms cubic-bezier(.16,1,.3,1) forwards;
    }
    @keyframes idlBurstFly {
      0%   { opacity: 0; transform: translate(-50%,-50%) scale(1); }
      20%  { opacity: 1; }
      100% { opacity: 0; transform: translate(calc(-50% + var(--bx)), calc(-50% + var(--by))) scale(.3); }
    }
    @media (prefers-reduced-motion: reduce) { .idl-burst { display: none; } }

    /* ── portrait ── */
    .profile-wrapper.idl-photo-zoom {
      transition: transform 480ms var(--idl-ease), filter 480ms ease;
      transform: scale(1.15);
      filter: drop-shadow(0 20px 50px rgba(255,107,0,0.35));
    }
    .profile-wrapper.idl-photo-flicker { animation: idlPhotoFlicker 420ms ease-in-out; }
    @keyframes idlPhotoFlicker {
      0%   { opacity: 1; filter: blur(0) brightness(1); }
      35%  { opacity: .22; filter: blur(7px) brightness(1.8); }
      62%  { opacity: .72; filter: blur(2px) brightness(1.3); }
      100% { opacity: 1; filter: blur(0) brightness(1); }
    }
    .profile-wrapper.idl-photo-anchor {
      transition: transform 1050ms var(--idl-ease-photo), filter 900ms var(--idl-ease);
      transform: translate(var(--idl-px,0px), var(--idl-py,0px)) scale(var(--idl-ps,1));
      filter: drop-shadow(0 30px 70px rgba(255,107,0,0.4));
    }
    .profile-wrapper.idl-photo-anchor .profile-image-container {
      box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 20px 60px -8px rgba(255,107,0,0.4);
      transition: box-shadow 900ms ease;
    }
    .profile-wrapper.idl-photo-anchor .profile-ring {
      animation: idlRingPulse 2.6s ease-in-out infinite;
    }
    @keyframes idlRingPulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }

    /* beat-synced portrait reactions */
    .profile-wrapper.idl-photo-anchor.idl-beat-silence .profile-image-container {
      box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 0 80px 6px rgba(255,107,0,0.12), 0 20px 60px -8px rgba(255,107,0,0.28);
    }
    .profile-wrapper.idl-photo-anchor.idl-beat-silence .profile-ring {
      animation: idlRingPulse 4s ease-in-out infinite;
    }
    .profile-wrapper.idl-photo-anchor.idl-beat-confession .profile-image-container {
      box-shadow: 0 0 0 1px rgba(255,255,255,0.14), 0 0 50px 4px rgba(255,107,0,0.22), 0 20px 60px -8px rgba(255,107,0,0.4);
    }
    .profile-wrapper.idl-photo-anchor.idl-beat-question .profile-image-container {
      box-shadow: 0 0 0 1px rgba(255,255,255,0.10), 0 0 30px 2px rgba(255,107,0,0.14), 0 16px 50px -8px rgba(255,107,0,0.24);
      transition: box-shadow 1400ms ease;
    }
    .profile-wrapper.idl-photo-anchor.idl-beat-question .profile-ring {
      animation: idlRingPulse 5s ease-in-out infinite; opacity: .4;
    }
    .profile-wrapper.idl-photo-anchor.idl-beat-answer .profile-image-container {
      box-shadow: 0 0 0 1.5px rgba(255,107,0,0.5), 0 0 60px 8px rgba(255,107,0,0.22), 0 20px 60px -8px rgba(255,107,0,0.5);
      transition: box-shadow 1200ms ease;
    }
    .profile-wrapper.idl-photo-anchor.idl-beat-answer .profile-ring {
      animation: idlRingPulse 1.8s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .profile-wrapper.idl-photo-zoom,
      .profile-wrapper.idl-photo-flicker { transition: none; animation: none; transform: none; filter: none; }
      .profile-wrapper.idl-photo-anchor { transition: transform 350ms ease, filter 350ms ease; }
      .profile-wrapper.idl-photo-anchor .profile-ring { animation: none; opacity: .85; }
    }

   #geeoohOs {
      position: absolute; 
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 50; 
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--idl-bg);
      opacity: 0; visibility: hidden; pointer-events: none;
      transition: opacity 850ms var(--idl-ease);
      font-family: 'Inter', sans-serif; color: var(--idl-ink);
      -webkit-font-smoothing: antialiased;
    }
    #geeoohOs.idl-active { opacity: 1; visibility: visible; pointer-events: auto; }
    #geeoohOs * { box-sizing: border-box; }

    .idl-iris {
      position: absolute; inset: 0; z-index: 1; pointer-events: none;
      background: radial-gradient(circle at var(--idl-ix,50%) var(--idl-iy,50%), var(--idl-bg) 0%, var(--idl-bg) 30%, var(--idl-bg-deep) 100%);
      clip-path: circle(0% at var(--idl-ix,50%) var(--idl-iy,50%));
      transition: clip-path 1000ms var(--idl-ease);
    }
    #geeoohOs.idl-active .idl-iris { clip-path: circle(140% at var(--idl-ix,50%) var(--idl-iy,50%)); }

    .idl-orbfield { position: absolute; inset: 0; z-index: 1; overflow: hidden; pointer-events: none; }
    .idl-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: .4; }
    .idl-orb--a { width: 50%; height: 50%; max-width: 480px; max-height: 480px; background: rgba(255,107,0,0.13); top: -12%; right: -8%; }
    .idl-orb--b { width: 42%; height: 42%; max-width: 420px; max-height: 420px; background: rgba(124,58,237,0.10); bottom: -14%; left: -10%; }
    .idl-orb--c { width: 28%; height: 28%; max-width: 300px; max-height: 300px; background: rgba(6,182,212,0.07); top: 48%; left: 58%; }
    #geeoohOs.idl-simplify .idl-orbfield { display: none; }

    .idl-spotlight {
      position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: 0;
      background: radial-gradient(circle at var(--mx,50%) var(--my,40%), rgba(255,107,0,0.08), transparent 32%);
      transition: opacity 600ms ease;
    }
    #geeoohOs.idl-active .idl-spotlight { opacity: 1; }
    #geeoohOs.idl-simplify .idl-spotlight { display: none; }

    /* ── return button ── */
    .idl-return {
      position: absolute; top: 20px; left: 24px; z-index: 60;
      display: inline-flex; align-items: center; gap: 8px;
      background: none; border: none; cursor: pointer;
      font-family: 'Space Grotesk', sans-serif; font-size: .7rem; font-weight: 600;
      letter-spacing: .08em; text-transform: uppercase; color: var(--idl-ink-dim);
      opacity: 0; transition: opacity 700ms var(--idl-ease) 400ms, color 300ms ease;
      padding: 6px 2px; pointer-events: none;
    }
    #geeoohOs.idl-active .idl-return { opacity: 1; pointer-events: auto; }
    .idl-return:hover { color: var(--idl-accent); }
    .idl-return svg { width: 13px; height: 13px; transition: transform 300ms var(--idl-ease); }
    .idl-return:hover svg { transform: translateX(-3px); }

    /* ── beats container ── */
    .idl-beats { position: absolute; inset: 0; z-index: 10; }
    .idl-beat {
      position: absolute; inset: 0; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      opacity: 0; transform: scale(0.97); filter: blur(4px);
      transition: opacity 800ms var(--idl-ease), transform 800ms var(--idl-ease), filter 800ms ease;
      pointer-events: none; padding: 0 6vw 56px;
    }
    .idl-beat.idl-beat-active { 
      opacity: 1; transform: none; filter: none; 
      pointer-events: auto;
    }
    .idl-beat.idl-beat-exit {
      opacity: 0; transform: scale(1.02); filter: blur(3px);
      transition: opacity 600ms var(--idl-ease-in), transform 600ms var(--idl-ease-in), filter 600ms ease;
    }
    @media (prefers-reduced-motion: reduce) { .idl-beat { display: none !important; } }

    .idl-scenecopy {
      padding-top: var(--idl-photo-clearance, 200px);
      display: flex; flex-direction: column; align-items: center;
      max-width: 640px; width: 100%;
    }

    /* ── BEAT 0: Silence ── just the portrait, a heartbeat pulse ── */
    .idl-silence-hint {
      font-family: 'Inter', sans-serif; font-size: .65rem; font-weight: 400;
      letter-spacing: .18em; text-transform: uppercase; color: var(--idl-ink-ghost);
      opacity: 0; transition: opacity 1200ms ease 800ms;
    }
    .idl-beat.idl-beat-active .idl-silence-hint { opacity: 1; }

    /* ── BEAT 1: Confession — typewriter with deliberate pause ── */
    .idl-confession {
      text-align: center; font-family: 'Fraunces', serif; font-style: italic;
      font-weight: 320; font-size: clamp(1.5rem, 4.2vw, 2.4rem); line-height: 1.4;
      color: var(--idl-ink); min-height: 3.2em;
    }
    .idl-confession-cursor {
      display: inline-block; width: 2px; height: 1.1em; background: var(--idl-accent);
      vertical-align: middle; margin-left: 2px; border-radius: 1px;
      box-shadow: 0 0 10px rgba(255,107,0,.7);
    }
    .idl-confession-cursor.idl-cursor-blink {
      animation: idlCursorBlink 900ms steps(1) infinite;
    }
    .idl-confession-cursor.idl-cursor-pause {
      animation: idlCursorBlink 260ms steps(1) infinite;
      background: var(--idl-ink-dim);
      box-shadow: none;
    }
    @keyframes idlCursorBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }

    /* ── BEAT 2: System (code reveals in reverse logic) ── */
    .idl-sculpt-wrap { align-items: flex-start; }
    .idl-sculpt-line {
      font-family: 'JetBrains Mono', monospace; font-weight: 300;
      font-size: clamp(.82rem, 2.2vw, 1.08rem); line-height: 1.95;
      color: var(--idl-ink); margin: 0; white-space: pre;
      opacity: 0; transform: translateY(6px);
      transition: opacity 480ms var(--idl-ease), transform 480ms var(--idl-ease);
    }
    .idl-sculpt-line.idl-line-visible { opacity: 1; transform: none; }
    .idl-sculpt-line.idl-line-anchor {
      opacity: 1; transform: none;
      transition: color 600ms ease;
    }
    .idl-sculpt-line.idl-line-anchor.idl-line-settled { color: var(--idl-ink-dim); }
    .idl-indent1 { padding-left: 1.4em; }
    .idl-indent2 { padding-left: 2.8em; }
    .idl-kw  { color: var(--idl-accent-soft); }
    .idl-cls { color: var(--idl-cyan); }
    .idl-prop { color: var(--idl-ink-dim); }
    .idl-fn  { color: var(--idl-violet); }

    /* the anchor line (return statement) starts bright, then settles */
    .idl-anchor-line { color: var(--idl-ink); font-weight: 400; }

    /* ── BEAT 3: The Question ── */
    .idl-question {
      font-family: 'Fraunces', serif; font-style: italic; font-weight: 300;
      font-size: clamp(1.1rem, 3.2vw, 1.7rem); color: var(--idl-ink-dim);
      text-align: center; line-height: 1.5;
      opacity: 0; transform: translateY(8px);
      transition: opacity 1100ms var(--idl-ease) 300ms, transform 1100ms var(--idl-ease) 300ms;
    }
    .idl-beat.idl-beat-active .idl-question { opacity: 1; transform: none; }

    /* ── BEAT 4: The Answer — name as signature, not logo ── */
    .idl-answer-wrap {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      width: 100%; height: 100%; gap: clamp(10px, 2vh, 24px);
      padding-top: var(--idl-photo-clearance, 0px);
      margin-top: clamp(-80px);
    }
    .idl-signature {
      font-family: 'Space Grotesk', sans-serif; font-weight: 700;
      font-size: clamp(2rem, 8vw, 4.4rem); letter-spacing: .14em;
      color: var(--idl-ink);
      opacity: 0;
      transition: opacity 1400ms var(--idl-ease) 200ms;
    }
    .idl-beat.idl-beat-active .idl-signature { opacity: 1; }
    .idl-testimonial {
      font-family: 'Fraunces', serif; font-style: italic; font-weight: 300;
      font-size: clamp(.85rem, 2.2vw, 1.1rem); color: var(--idl-ink-dim);
      letter-spacing: .02em; text-align: center;
      opacity: 0;
      transition: opacity 1200ms var(--idl-ease) 900ms;
    }
    .idl-beat.idl-beat-active .idl-testimonial { opacity: 1; }
    .idl-accent-dot {
      width: 4px; height: 4px; border-radius: 50%; background: var(--idl-accent);
      box-shadow: 0 0 16px rgba(255,107,0,.9);
      opacity: 0; transition: opacity 600ms ease 1800ms;
    }
    .idl-beat.idl-beat-active .idl-accent-dot { opacity: 1; }

    /* ── reduced-motion static fallback ── */
    .idl-static-fallback {
      display: none;
      position: absolute;
      inset: 0;
      z-index: 10;
      padding: 40px 7vw;
      text-align: center;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow-y: auto;
    }
    #geeoohOs.idl-reduced .idl-static-fallback { 
      display: flex;
    }
    #geeoohOs.idl-reduced .idl-beats { display: none; }
    #geeoohOs.idl-reduced {
      --idl-photo-clearance: 0px;
    }
    #geeoohOs.idl-reduced .idl-static-fallback {
      padding-top: 20px !important;
      margin-top: 0;
      justify-content: flex-start;
    }
    .idl-static-line {
      font-family: 'Fraunces', serif; font-style: italic;
      font-size: clamp(1.1rem, 3.4vw, 1.5rem); color: var(--idl-ink); margin: 0 0 28px;
      line-height: 1.5;
      max-width: 640px;
    }
    .idl-static-code {
      font-family: 'JetBrains Mono', monospace; font-size: .8rem; line-height: 1.8;
      color: var(--idl-ink-dim); text-align: left; white-space: pre; margin: 0 auto 28px;
      max-width: fit-content;
    }
    .idl-static-brand {
      font-family: 'Space Grotesk', sans-serif; font-weight: 700;
      letter-spacing: .14em; font-size: 1.6rem; color: var(--idl-ink); margin: 0 0 16px;
    }
    .idl-static-quote {
      font-family: 'Fraunces', serif; font-style: italic;
      font-size: clamp(1rem, 3vw, 1.3rem); color: var(--idl-ink-dim); line-height: 1.6;
      max-width: 640px;
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 480px) {
      .idl-beat { padding: 0 5vw 32px; }
      .idl-scenecopy { max-width: 100%; padding-left: 8px; padding-right: 8px; }
      .idl-answer-wrap { gap: 8px; justify-content: center; }
      .idl-signature { font-size: clamp(1.6rem, 7vw, 2.4rem); }
      .idl-confession { font-size: clamp(1.2rem, 4vw, 1.6rem); }
      .idl-sculpt-line { font-size: clamp(.7rem, 2vw, .85rem); }
      .idl-question { font-size: clamp(.9rem, 3vw, 1.3rem); }
      .idl-testimonial { font-size: clamp(.75rem, 2vw, .9rem); }
      .idl-static-fallback { padding: 12px 5vw 24px; }
      .idl-static-line { font-size: clamp(.9rem, 3vw, 1.1rem); margin-bottom: 18px; }
      .idl-static-code { font-size: .7rem; margin-bottom: 18px; }
      .idl-static-brand { font-size: 1.3rem; margin-bottom: 10px; }
      .idl-static-quote { font-size: clamp(.8rem, 2.5vw, 1rem); }
    }

    @media (min-width: 481px) and (max-width: 760px) {
      .idl-beat { padding: 0 6vw 40px; }
      .idl-scenecopy { max-width: 90%; }
      .idl-answer-wrap { justify-content: center; }
      .idl-signature { font-size: clamp(1.8rem, 7vw, 3rem); }
      .idl-confession { font-size: clamp(1.3rem, 4vw, 1.8rem); }
      .idl-static-fallback { padding: 20px 6vw 32px; }
      .idl-static-line { font-size: clamp(1rem, 3.2vw, 1.3rem); margin-bottom: 22px; }
      .idl-static-code { font-size: .75rem; margin-bottom: 22px; }
      .idl-static-brand { font-size: 1.4rem; margin-bottom: 12px; }
      .idl-static-quote { font-size: clamp(.9rem, 2.8vw, 1.1rem); }
    }

    @media (min-width: 761px) and (max-width: 1024px) {
      .idl-beat { padding: 0 7vw 48px; }
      .idl-scenecopy { max-width: 600px; }
    }

    @media (min-width: 1025px) {
      .idl-beat { padding: 0 8vw 56px; }
      .idl-scenecopy { max-width: 640px; }
    }
  `;
  document.head.appendChild(style);

  /* ── INJECT VEIL + PORTAL ── */
  if (heroBackground && !heroBackground.querySelector('.idl-veil')) {
    var veil = document.createElement('div');
    veil.className = 'idl-veil';
    heroBackground.appendChild(veil);
  }

  var ringEl = document.createElement('div');
  ringEl.className = 'idl-portal-ring';
  ringEl.setAttribute('aria-hidden', 'true');
  heroSection.appendChild(ringEl);

  var burstEl = document.createElement('div');
  burstEl.className = 'idl-burst';
  burstEl.setAttribute('aria-hidden', 'true');
  for (var bi = 0; bi < 10; bi++) {
    var ang = (bi / 10) * Math.PI * 2;
    var dist = 55 + Math.random() * 45;
    var dot = document.createElement('span');
    dot.className = 'idl-burst-dot';
    dot.style.setProperty('--bx', (Math.cos(ang) * dist) + 'px');
    dot.style.setProperty('--by', (Math.sin(ang) * dist) + 'px');
    dot.style.transitionDelay = (bi * 12) + 'ms';
    burstEl.appendChild(dot);
  }
  heroSection.appendChild(burstEl);

  /* ── BUILD LAYER ── */
  osRoot.innerHTML = `
    <div class="idl-orbfield">
      <div class="idl-orb idl-orb--a"></div>
      <div class="idl-orb idl-orb--b"></div>
      <div class="idl-orb idl-orb--c"></div>
    </div>
    <div class="idl-spotlight" id="idlSpotlight"></div>
    <div class="idl-iris" id="idlIris"></div>

    <button class="idl-return" id="idlReturn" type="button" aria-label="Return to the portfolio">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 12H5M12 19l-7-7 7-7"/>
      </svg>
      Return
    </button>

    <div class="idl-beats" id="idlBeats">

      <section class="idl-beat" data-beat="silence">
        <div class="idl-scenecopy">
          <span class="idl-silence-hint" aria-hidden="true">click anywhere to continue</span>
        </div>
      </section>

      <section class="idl-beat" data-beat="confession">
        <div class="idl-scenecopy">
          <div class="idl-confession" id="idlConfession" aria-live="polite">
            <span id="idlConfessionText"></span><span class="idl-confession-cursor" id="idlCursor"></span>
          </div>
        </div>
      </section>

      <section class="idl-beat" data-beat="system">
        <div class="idl-scenecopy idl-sculpt-wrap">
          <p class="idl-sculpt-line" id="sc0"><span class="idl-kw">class</span> <span class="idl-cls">Ganiyu</span> {</p>
          <p class="idl-sculpt-line idl-indent1" id="sc1"><span class="idl-kw">constructor</span>() {</p>
          <p class="idl-sculpt-line idl-indent2" id="sc2"><span class="idl-prop">this</span>.empathy    = <span class="idl-fn">required</span>;</p>
          <p class="idl-sculpt-line idl-indent2" id="sc3"><span class="idl-prop">this</span>.curiosity  = <span class="idl-fn">Infinity</span>;</p>
          <p class="idl-sculpt-line idl-indent2" id="sc4"><span class="idl-prop">this</span>.ego        = <span class="idl-fn">false</span>;</p>
          <p class="idl-sculpt-line idl-indent1" id="sc5">}</p>
          <p class="idl-sculpt-line idl-indent1" id="sc6"><span class="idl-kw">build</span>() {</p>
          <p class="idl-sculpt-line idl-indent2 idl-anchor-line" id="sc7"><span class="idl-kw">return</span> experiences.<span class="idl-fn">peopleRemember</span>();</p>
          <p class="idl-sculpt-line idl-indent1" id="sc8">}</p>
          <p class="idl-sculpt-line" id="sc9">}</p>
        </div>
      </section>

      <section class="idl-beat" data-beat="question">
        <div class="idl-scenecopy">
          <p class="idl-question">"What will they <em>feel</em><br>when they leave?"</p>
        </div>
      </section>

      <section class="idl-beat" data-beat="answer">
        <div class="idl-answer-wrap">
          <div class="idl-signature">GEEOOH</div>
          <div class="idl-accent-dot"></div>
          <div class="idl-testimonial">He already thought about you.</div>
        </div>
      </section>

    </div>

    <div class="idl-static-fallback" id="idlStaticFallback">
      <p class="idl-static-line">
        "I got into this because—<br>
        I wanted to make things that felt like they cared."
      </p>
      <pre class="idl-static-code">class Ganiyu {
  constructor() {
    this.empathy   = required;
    this.curiosity = Infinity;
    this.ego       = false;
  }
  build() {
    return experiences.peopleRemember();
  }
}</pre>
      <p class="idl-static-brand">GEEOOH</p>
      <p class="idl-static-quote">He already thought about you.</p>
    </div>
  `;

  /* ── STATE ── */
  var state = {
    isOpen: false, isAnimating: false, simplify: false,
    heroPosWasStatic: false, heroOverflowPrev: '',
    heroOriginalHeight: '',
    heroOriginalMinHeight: ''
  };
  var beats = Array.prototype.slice.call(osRoot.querySelectorAll('.idl-beat'));
  var beatPhotoClasses = ['idl-beat-silence', 'idl-beat-confession', 'idl-beat-system', 'idl-beat-question', 'idl-beat-answer'];
  var spotlightEl = document.getElementById('idlSpotlight');
  var confessionTextEl = document.getElementById('idlConfessionText');
  var cursorEl = document.getElementById('idlCursor');

  function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  function showBeat(i) {
    beats.forEach(function (b, idx) { b.classList.toggle('idl-beat-active', idx === i); });
    beatPhotoClasses.forEach(function (c) { photo.classList.remove(c); });
    if (beatPhotoClasses[i]) photo.classList.add(beatPhotoClasses[i]);
  }

  function exitBeat(i) {
    if (beats[i]) beats[i].classList.add('idl-beat-exit');
    setTimeout(function () {
      if (beats[i]) {
        beats[i].classList.remove('idl-beat-active', 'idl-beat-exit');
      }
    }, 650);
  }

  async function typeConfession() {
    if (!confessionTextEl || !cursorEl) return;
    var part1 = 'I got into this because\u2014';
    var part2 = 'I wanted to make things\nthat felt like they cared.';

    cursorEl.className = 'idl-confession-cursor idl-cursor-blink';

    for (var i = 0; i < part1.length; i++) {
      if (!state.isOpen) return;
      confessionTextEl.textContent = part1.slice(0, i + 1);
      var delay = 42 + Math.random() * 28;
      if (part1[i] === ',') delay += 120;
      if (part1[i] === '\u2014') delay += 80;
      await sleep(delay);
    }

    cursorEl.className = 'idl-confession-cursor idl-cursor-pause';
    await sleep(920);
    if (!state.isOpen) return;
    cursorEl.className = 'idl-confession-cursor idl-cursor-blink';
    await sleep(180);
    if (!state.isOpen) return;

    var lines = part2.split('\n');
    var fullText = part1;
    for (var li = 0; li < lines.length; li++) {
      if (li === 0) fullText += '\n';
      for (var ci = 0; ci < lines[li].length; ci++) {
        if (!state.isOpen) return;
        fullText += lines[li][ci];
        confessionTextEl.textContent = fullText;
        confessionTextEl.style.whiteSpace = 'pre-wrap';
        var d = 36 + Math.random() * 24;
        if (lines[li][ci] === ' ') d += 18;
        await sleep(d);
      }
      if (li < lines.length - 1) { fullText += '\n'; }
    }

    await sleep(600);
    if (cursorEl) cursorEl.style.opacity = '0';
  }

  async function revealSystem() {
    var anchorEl = document.getElementById('sc7');
    if (!anchorEl) return;

    anchorEl.classList.add('idl-line-anchor');
    await sleep(700);
    if (!state.isOpen) return;

    anchorEl.classList.add('idl-line-settled');
    await sleep(300);

    var order = [0, 1, 2, 3, 4, 5, 6, 8, 9];
    for (var i = 0; i < order.length; i++) {
      if (!state.isOpen) return;
      var el = document.getElementById('sc' + order[i]);
      if (el) el.classList.add('idl-line-visible');
      await sleep(130);
    }
  }

  function onPointerMove(e) {
    if (!spotlightEl) return;
    spotlightEl.style.setProperty('--mx', (e.clientX / window.innerWidth) * 100 + '%');
    spotlightEl.style.setProperty('--my', (e.clientY / window.innerHeight) * 100 + '%');
  }

  function pauseTilt() {
    try { if (photo.vanillaTilt && typeof photo.vanillaTilt.destroy === 'function') photo.vanillaTilt.destroy(); } catch (e) {}
  }
  function resumeTilt() {
    try { if (window.VanillaTilt && photo.hasAttribute('data-tilt') && !photo.vanillaTilt) window.VanillaTilt.init(photo); } catch (e) {}
  }

  async function playBeats() {
    if (!state.isOpen) return;

    showBeat(0);
    await sleep(1800);
    if (!state.isOpen) return;

    exitBeat(0);
    await sleep(700);
    if (!state.isOpen) return;

    showBeat(1);
    await typeConfession();
    if (!state.isOpen) return;
    await sleep(1400);
    if (!state.isOpen) return;

    exitBeat(1);
    await sleep(700);
    if (!state.isOpen) return;

    showBeat(2);
    await revealSystem();
    if (!state.isOpen) return;
    await sleep(3000);
    if (!state.isOpen) return;

    exitBeat(2);
    await sleep(700);
    if (!state.isOpen) return;

    showBeat(3);
    await sleep(3800);
    if (!state.isOpen) return;

    exitBeat(3);
    await sleep(700);
    if (!state.isOpen) return;

    showBeat(4);
  }

  /* ── OPEN / CLOSE ── */
  async function openLayer() {
    if (state.isAnimating || state.isOpen) return;
    state.isAnimating = true;

    // Save and shrink hero to viewport height
    state.heroOriginalHeight = heroSection.style.height;
    state.heroOriginalMinHeight = heroSection.style.minHeight;
    heroSection.style.height = '100vh';
    heroSection.style.height = '100dvh';
    heroSection.style.minHeight = '100vh';
    heroSection.style.minHeight = '100dvh';

    state.simplify = shouldSimplify();
    osRoot.classList.toggle('idl-simplify', state.simplify);
    osRoot.classList.toggle('idl-reduced', reduceMotion);

    var heroComputedPos = window.getComputedStyle(heroSection).position;
    state.heroPosWasStatic = heroComputedPos === 'static';
    if (state.heroPosWasStatic) heroSection.style.position = 'relative';
    state.heroOverflowPrev = heroSection.style.overflow;
    heroSection.style.overflow = 'hidden';

    pauseTilt();

    var heroRect = heroSection.getBoundingClientRect();
    var photoRect = photo.getBoundingClientRect();
    var targetSize = Math.max(140, Math.min(heroRect.height * 0.34, heroRect.width * 0.28, 220));
    var targetCenterX = heroRect.left + heroRect.width / 2;
    var targetCenterY = heroRect.top + heroRect.height * 0.30;
    var curCenterX = photoRect.left + photoRect.width / 2;
    var curCenterY = photoRect.top + photoRect.height / 2;
    var dx = targetCenterX - curCenterX;
    var dy = targetCenterY - curCenterY;
    var scale = targetSize / Math.max(photoRect.width, 1);

    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight;
    var baseClearance = (targetSize / 2);

    if (viewportWidth <= 480) {
      var clearance = baseClearance + 8;
    } else if (viewportWidth <= 760) {
      var clearance = baseClearance + 14;
    } else if (viewportHeight <= 800) {
      var clearance = baseClearance + 30;
    } else if (viewportWidth <= 1024) {
      var clearance = baseClearance + 36;
    } else {
      var clearance = baseClearance + 44;
    }

    var ix = ((photoRect.left + photoRect.width / 2 - heroRect.left) / Math.max(heroRect.width, 1)) * 100;
    var iy = ((photoRect.top + photoRect.height / 2 - heroRect.top) / Math.max(heroRect.height, 1)) * 100;
    heroSection.style.setProperty('--idl-ix', ix + '%');
    heroSection.style.setProperty('--idl-iy', iy + '%');
    osRoot.style.setProperty('--idl-photo-clearance', clearance + 'px');

    photo.style.setProperty('--idl-px', dx + 'px');
    photo.style.setProperty('--idl-py', dy + 'px');
    photo.style.setProperty('--idl-ps', scale);
    photo.style.position = 'relative';
    photo.style.zIndex = '60';

    if (reduceMotion) {
      heroSection.classList.add('idl-dissolve');
      photo.classList.add('idl-photo-anchor');
      osRoot.classList.add('idl-active');
    } else {
      heroSection.classList.add('idl-freeze');
      await sleep(260);

      heroSection.classList.add('idl-dissolve');
      ringEl.classList.add('idl-ring-play');
      await sleep(900);

      photo.classList.add('idl-photo-zoom');
      await sleep(480);

      burstEl.classList.add('idl-burst-play');
      photo.classList.add('idl-photo-flicker');
      await sleep(420);

      photo.classList.remove('idl-photo-zoom', 'idl-photo-flicker');
      photo.classList.add('idl-photo-anchor');
      osRoot.classList.add('idl-active');
      await sleep(550);
    }

    if (!state.simplify) document.addEventListener('pointermove', onPointerMove);

    state.isOpen = true;
    state.isAnimating = false;
    var returnBtn = document.getElementById('idlReturn');
    if (returnBtn) returnBtn.focus({ preventScroll: true });

    if (!reduceMotion) playBeats();
  }

  async function closeLayer() {
    if (state.isAnimating || !state.isOpen) return;
    state.isAnimating = true;
    state.isOpen = false;

    document.removeEventListener('pointermove', onPointerMove);
    osRoot.classList.remove('idl-active');
    photo.classList.remove('idl-photo-anchor', 'idl-photo-zoom', 'idl-photo-flicker');
    beatPhotoClasses.forEach(function (c) { photo.classList.remove(c); });
    heroSection.classList.remove('idl-dissolve', 'idl-freeze');
    ringEl.classList.remove('idl-ring-play');
    burstEl.classList.remove('idl-burst-play');
    beats.forEach(function (b) { b.classList.remove('idl-beat-active', 'idl-beat-exit'); });

    if (confessionTextEl) confessionTextEl.textContent = '';
    if (cursorEl) { cursorEl.style.opacity = ''; cursorEl.className = 'idl-confession-cursor'; }

    ['sc0','sc1','sc2','sc3','sc4','sc5','sc6','sc7','sc8','sc9'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('idl-line-visible', 'idl-line-anchor', 'idl-line-settled');
    });

    await sleep(reduceMotion ? 0 : 1000);

    photo.style.position = '';
    photo.style.zIndex = '';
    photo.style.removeProperty('--idl-px');
    photo.style.removeProperty('--idl-py');
    photo.style.removeProperty('--idl-ps');

    if (state.heroPosWasStatic) heroSection.style.position = '';

    // Restore original hero height
    if (state.heroOriginalHeight !== undefined) {
      heroSection.style.height = state.heroOriginalHeight;
    }
    if (state.heroOriginalMinHeight !== undefined) {
      heroSection.style.minHeight = state.heroOriginalMinHeight;
    }
    heroSection.style.overflow = state.heroOverflowPrev || '';

    resumeTilt();
    state.isAnimating = false;
    photo.focus && photo.focus({ preventScroll: true });
  }

  function toggle(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (state.isOpen) closeLayer(); else openLayer();
  }

  /* ── EVENTS ── */
  photo.style.cursor = 'pointer';
  if (!photo.hasAttribute('tabindex')) photo.setAttribute('tabindex', '-1');
  photo.addEventListener('click', toggle);

  var returnBtn = document.getElementById('idlReturn');
  if (returnBtn) returnBtn.addEventListener('click', function (e) { e.stopPropagation(); closeLayer(); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && state.isOpen) closeLayer();
  });
});