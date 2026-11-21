const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function getBase64Image(filePath, maxWidth = 1280) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.svg') {
      const content = fs.readFileSync(filePath, 'utf8');
      return `data:image/svg+xml;utf8,${encodeURIComponent(content)}`;
    }
    const buffer = await sharp(filePath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return '';
  }
}

async function run() {
  console.log('Building 20-slide presentation with Applications, Pros, Cons, and Diverse Page Animations...');
  
  const basePath = 'D:\\minibase';
  const logoSvg = path.join(basePath, 'minibase-logo.svg');
  const ssDir = path.join(basePath, 'screenshots');
  
  const imgLogo = await getBase64Image(logoSvg);
  const imgLogin = await getBase64Image(path.join(ssDir, '01_login_page.png'));
  const imgAdmin = await getBase64Image(path.join(ssDir, '02_admin_studio_dashboard.png'));
  const imgModal = await getBase64Image(path.join(ssDir, '03_admins_modal.png'));
  const imgImport = await getBase64Image(path.join(ssDir, '04_import_export_modal.png'));
  const imgDocs = await getBase64Image(path.join(ssDir, '05_interactive_api_docs.png'));
  const imgAuth = await getBase64Image(path.join(ssDir, '06_user_auth_portal.png'));
  const imgCli = await getBase64Image(path.join(ssDir, '07_terminal_cli_suite.png'));
  const imgDemo = await getBase64Image(path.join(ssDir, '08_wallpaper_app_client.png'));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>MiniBase - Comprehensive Architecture, Pros &amp; Cons Pitch Deck</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }

    :root {
      --bg: #f8f8f8;
      --card-bg: #ffffff;
      --black: #000000;
      --dark-gray: #1a1a1a;
      --mid-gray: #444444;
      --light-gray: #e6e6e6;
    }

    html, body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: var(--bg);
      color: var(--black);
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      -webkit-font-smoothing: antialiased;
      user-select: none;
    }

    /* 3D PERSPECTIVE DECK FOR SLIDE-TO-SLIDE TRANSITIONS */
    .slide-deck {
      width: 100vw;
      height: 100vh;
      position: relative;
      overflow: hidden;
      perspective: 1500px;
      perspective-origin: center center;
    }

    /* ZERO-SCROLL SLIDE CONTAINER */
    .slide {
      position: absolute;
      inset: 0;
      display: none;
      flex-direction: column;
      padding: 22px 42px 54px;
      height: 100vh;
      max-height: 100vh;
      overflow: hidden;
      background: var(--bg);
      opacity: 0;
      pointer-events: none;
      backface-visibility: hidden;
      transform-style: preserve-3d;
      will-change: transform, opacity;
    }

    .slide.active {
      display: flex !important;
      opacity: 1 !important;
      transform: translate3d(0, 0, 0) scale(1) rotate(0deg) !important;
      pointer-events: auto;
      z-index: 2;
    }

    .slide.slide-animating {
      display: flex !important;
      pointer-events: none;
    }

    /* ========================================================
       MULTI-STYLE 3D PAGE TRANSITIONS (GLITCH-FREE & BI-DIRECTIONAL)
       ======================================================== */

    /* 1. CUBE (3D Perspective Rotation) */
    @keyframes cubeInRight {
      from { opacity: 0; transform: translate3d(60%, 0, -250px) rotateY(-28deg); }
      to   { opacity: 1; transform: translate3d(0, 0, 0) rotateY(0deg); }
    }
    @keyframes cubeOutLeft {
      from { opacity: 1; transform: translate3d(0, 0, 0) rotateY(0deg); }
      to   { opacity: 0; transform: translate3d(-60%, 0, -250px) rotateY(28deg); }
    }
    @keyframes cubeInLeft {
      from { opacity: 0; transform: translate3d(-60%, 0, -250px) rotateY(28deg); }
      to   { opacity: 1; transform: translate3d(0, 0, 0) rotateY(0deg); }
    }
    @keyframes cubeOutRight {
      from { opacity: 1; transform: translate3d(0, 0, 0) rotateY(0deg); }
      to   { opacity: 0; transform: translate3d(60%, 0, -250px) rotateY(-28deg); }
    }

    .anim-cube-next { animation: cubeInRight 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 3; }
    .anim-cube-prev { animation: cubeInLeft 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 3; }
    .anim-cube-exit-next { animation: cubeOutLeft 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 1; }
    .anim-cube-exit-prev { animation: cubeOutRight 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 1; }

    /* 2. ZOOM (Cinematic Depth Scale) */
    @keyframes zoomInForward {
      from { opacity: 0; transform: translate3d(0, 0, -320px) scale(0.76); }
      to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
    }
    @keyframes zoomOutForward {
      from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
      to   { opacity: 0; transform: translate3d(0, 0, 220px) scale(1.16); }
    }
    @keyframes zoomInBackward {
      from { opacity: 0; transform: translate3d(0, 0, 220px) scale(1.16); }
      to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
    }
    @keyframes zoomOutBackward {
      from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
      to   { opacity: 0; transform: translate3d(0, 0, -320px) scale(0.76); }
    }

    .anim-zoom-next { animation: zoomInForward 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 3; }
    .anim-zoom-prev { animation: zoomInBackward 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 3; }
    .anim-zoom-exit-next { animation: zoomOutForward 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 1; }
    .anim-zoom-exit-prev { animation: zoomOutBackward 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 1; }

    /* 3. DECK (Vertical Card Flip) */
    @keyframes deckLiftUp {
      from { opacity: 0; transform: translate3d(0, 55%, -120px) rotateX(-16deg); }
      to   { opacity: 1; transform: translate3d(0, 0, 0) rotateX(0deg); }
    }
    @keyframes deckDropOut {
      from { opacity: 1; transform: translate3d(0, 0, 0) rotateX(0deg); }
      to   { opacity: 0; transform: translate3d(0, -45%, -120px) rotateX(16deg); }
    }
    @keyframes deckLiftDown {
      from { opacity: 0; transform: translate3d(0, -55%, -120px) rotateX(16deg); }
      to   { opacity: 1; transform: translate3d(0, 0, 0) rotateX(0deg); }
    }
    @keyframes deckDropBack {
      from { opacity: 1; transform: translate3d(0, 0, 0) rotateX(0deg); }
      to   { opacity: 0; transform: translate3d(0, 45%, -120px) rotateX(-16deg); }
    }

    .anim-deck-next { animation: deckLiftUp 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 3; }
    .anim-deck-prev { animation: deckLiftDown 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 3; }
    .anim-deck-exit-next { animation: deckDropOut 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 1; }
    .anim-deck-exit-prev { animation: deckDropBack 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 1; }

    /* 4. DIAG (Diagonal Glide & Perspective Slice) */
    @keyframes diagInRight {
      from { opacity: 0; transform: translate3d(50%, 25%, -160px) rotate(-4deg); }
      to   { opacity: 1; transform: translate3d(0, 0, 0) rotate(0deg); }
    }
    @keyframes diagOutLeft {
      from { opacity: 1; transform: translate3d(0, 0, 0) rotate(0deg); }
      to   { opacity: 0; transform: translate3d(-50%, -25%, -160px) rotate(4deg); }
    }
    @keyframes diagInLeft {
      from { opacity: 0; transform: translate3d(-50%, -25%, -160px) rotate(4deg); }
      to   { opacity: 1; transform: translate3d(0, 0, 0) rotate(0deg); }
    }
    @keyframes diagOutRight {
      from { opacity: 1; transform: translate3d(0, 0, 0) rotate(0deg); }
      to   { opacity: 0; transform: translate3d(50%, 25%, -160px) rotate(-4deg); }
    }

    .anim-diag-next { animation: diagInRight 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 3; }
    .anim-diag-prev { animation: diagInLeft 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 3; }
    .anim-diag-exit-next { animation: diagOutLeft 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 1; }
    .anim-diag-exit-prev { animation: diagOutRight 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards; z-index: 1; }

    /* CRISP ITEM RENDERING (NO OPACITY FLASH) */
    .anim-item, .anim-scale {
      opacity: 1 !important;
      transform: none !important;
    }
    .d-1, .d-2, .d-3, .d-4, .d-5 {
      opacity: 1 !important;
    }

    /* HEADER */
    .slide-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid var(--black);
      padding-bottom: 6px;
      margin-bottom: 11px;
      flex-shrink: 0;
      height: 36px;
    }

    .slide-title {
      font-size: 22px;
      font-weight: 800;
      color: var(--black);
      display: flex;
      align-items: center;
      gap: 10px;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }

    .slide-num-badge {
      font-size: 11px;
      font-weight: 800;
      color: #fff;
      background: var(--black);
      padding: 3px 10px;
      border-radius: 3px;
      letter-spacing: 0.8px;
    }

    /* SLIDE BODY */
    .slide-body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
    }

    .sub-head {
      font-size: 12.5px;
      font-weight: 800;
      color: var(--black);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* BOLD RETRO CARDS (SHADOW OF 3PX SOLID BLACK) */
    .card {
      background: var(--card-bg);
      border: 2px solid var(--black);
      border-radius: 4px;
      box-shadow: 3px 3px 0px var(--black);
      padding: 11px 14px;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
    }

    .card:hover {
      transform: translate(-3px, -3px);
      box-shadow: 6px 6px 0px var(--black);
    }

    .card-title {
      font-size: 14px;
      font-weight: 800;
      color: var(--black);
      margin-bottom: 3px;
    }

    .card-desc {
      font-size: 12px;
      font-weight: 600;
      color: var(--dark-gray);
      line-height: 1.45;
    }

    /* SCREENSHOT FRAMES */
    .img-frame {
      border: 2px solid var(--black);
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 4px 4px 0px var(--black);
      background: #000;
      display: flex;
      flex-direction: column;
      position: relative;
      cursor: zoom-in;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
      max-height: calc(100vh - 146px);
    }

    .img-frame:hover {
      transform: translate(-3px, -3px);
      box-shadow: 8px 8px 0px var(--black);
    }

    .frame-bar {
      background: var(--black);
      padding: 5px 10px;
      display: flex;
      align-items: center;
      gap: 5px;
      border-bottom: 1px solid #333;
      flex-shrink: 0;
    }

    .frame-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #666;
      border: 1px solid #999;
    }

    .frame-title {
      margin-left: auto;
      font-size: 10.5px;
      font-weight: 700;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zoom-hint {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      background: #fff;
      color: #000;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 2px;
      font-size: 9px;
    }

    .img-frame img {
      width: 100%;
      height: auto;
      max-height: calc(100vh - 184px);
      object-fit: contain;
      display: block;
      background: #111;
    }

    /* CODE BOXES */
    .code-box {
      background: #000000;
      border: 2px solid var(--black);
      border-radius: 4px;
      box-shadow: 3px 3px 0px var(--black);
      padding: 9px 12px;
      font-family: 'JetBrains Mono', Consolas, monospace;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.5;
      color: #ffffff;
      overflow-x: auto;
    }

    .kw { color: #ffffff; font-weight: 800; text-decoration: underline; }
    .str { color: #d0d0d0; }
    .fn { color: #ffffff; font-weight: 700; }
    .cm { color: #777777; font-style: italic; }
    .op { color: #ffffff; }

    /* DATA TABLE */
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      font-weight: 600;
      background: #fff;
      border: 2px solid var(--black);
      box-shadow: 4px 4px 0px var(--black);
      border-radius: 3px;
      overflow: hidden;
    }

    table.data-table th {
      background: var(--black);
      color: #ffffff;
      padding: 7px 11px;
      font-weight: 800;
      font-size: 11.5px;
      text-align: left;
      border-bottom: 2px solid var(--black);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    table.data-table td {
      padding: 6.5px 11px;
      border-bottom: 1px solid #ccc;
      color: var(--black);
    }

    table.data-table tr:nth-child(even) td {
      background: #f2f2f2;
    }

    /* BADGES */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2.5px 8px;
      border-radius: 3px;
      font-size: 10.5px;
      font-weight: 800;
      background: #fff;
      color: var(--black);
      border: 2px solid var(--black);
      box-shadow: 2px 2px 0px var(--black);
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    .arch-card {
      padding: 7px 11px;
      border-radius: 3px;
      text-align: center;
      font-weight: 800;
      font-size: 11.5px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      background: #fff;
      border: 2px solid var(--black);
      box-shadow: 2px 2px 0px var(--black);
      transition: transform 0.15s;
    }

    .arch-card:hover {
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0px var(--black);
    }

    /* NAVIGATION */
    .nav-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 3px 36px 6px;
      background: var(--bg);
      border-top: 2px solid var(--black);
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 4px;
      height: 42px;
    }

    .progress-bar-bg {
      height: 4px;
      background: #ccc;
      border-radius: 2px;
      overflow: hidden;
      border: 1px solid var(--black);
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--black);
      transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .nav-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-btn {
      height: 26px;
      border-radius: 3px;
      border: 2px solid var(--black);
      background: #fff;
      color: var(--black);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 2px 2px 0px var(--black);
      transition: all 0.15s;
    }

    .nav-btn.square {
      width: 26px;
    }

    .auto-play-btn {
      padding: 0 9px;
      gap: 5px;
      font-size: 10.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .auto-play-btn.playing {
      background: var(--black);
      color: #fff;
      border-color: var(--black);
      box-shadow: 2px 2px 0px #555;
    }

    .auto-play-btn.playing svg {
      fill: #fff;
      stroke: #fff;
    }

    .nav-btn:hover {
      background: var(--black);
      color: #fff;
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0px #444;
    }

    .nav-btn:hover svg {
      stroke: #fff;
    }

    .nav-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
      background: #ddd;
      box-shadow: none;
      transform: none;
    }

    .nav-btn svg { width: 13px; height: 13px; stroke-width: 3; }

    .dots-container { display: flex; gap: 3px; }

    .nav-dot {
      width: 7px;
      height: 7px;
      border-radius: 2px;
      background: #fff;
      border: 1.5px solid var(--black);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .nav-dot:hover {
      background: #bbb;
    }

    .nav-dot.active {
      background: var(--black);
      width: 18px;
    }

    .key-tip {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--black);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .kbd {
      padding: 1px 4px;
      border-radius: 2px;
      border: 1.5px solid var(--black);
      background: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9.5px;
      font-weight: 800;
      color: var(--black);
      box-shadow: 1px 1px 0px var(--black);
    }

    .icon-svg {
      width: 17px;
      height: 17px;
      flex-shrink: 0;
      stroke: var(--black);
    }

    .icon-box {
      width: 30px;
      height: 30px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: #f0f0f0;
      border: 2px solid var(--black);
      box-shadow: 2px 2px 0px var(--black);
    }

    .check-icon {
      width: 10px;
      height: 10px;
      flex-shrink: 0;
      stroke: var(--black);
      stroke-width: 3.5;
      display: inline-block;
      vertical-align: middle;
    }

    /* LIGHTBOX MODAL */
    .lightbox-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 1000;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .lightbox-modal.open {
      display: flex;
      opacity: 1;
    }

    .lightbox-header {
      width: 100%;
      max-width: 1200px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      color: #fff;
    }

    .lightbox-title {
      font-size: 15px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
      text-transform: uppercase;
    }

    .lightbox-close {
      background: #fff;
      border: 2px solid #fff;
      color: #000;
      font-weight: 900;
      width: 32px;
      height: 32px;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 17px;
      box-shadow: 3px 3px 0px #666;
      transition: all 0.2s;
    }

    .lightbox-close:hover {
      background: #000;
      color: #fff;
    }

    .lightbox-content {
      max-width: 1200px;
      max-height: 84vh;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 8px 8px 0px #fff;
      border: 2px solid #fff;
      transform: scale(0.96);
      transition: transform 0.25s;
    }

    .lightbox-modal.open .lightbox-content {
      transform: scale(1);
    }

    .lightbox-content img {
      width: 100%;
      height: 100%;
      max-height: 82vh;
      object-fit: contain;
      display: block;
      background: #000;
    }
  </style>
</head>
<body>

<!-- Lightbox Modal -->
<div class="lightbox-modal" id="lightboxModal" onclick="closeLightbox(event)">
  <div class="lightbox-header" onclick="event.stopPropagation()">
    <div class="lightbox-title">
      <svg class="icon-svg" style="stroke:#fff;" fill="none" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span id="lightboxCaption">Screenshot View</span>
    </div>
    <button class="lightbox-close" onclick="closeLightbox(null)" title="Close (Esc)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:13px;height:13px;display:block;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="lightbox-content" onclick="event.stopPropagation()">
    <img id="lightboxImg" src="" alt="Zoomed Screenshot" />
  </div>
</div>

<div class="slide-deck" id="slideDeck">

  <!-- ==================== SLIDE 1: TITLE ==================== -->
  <div class="slide active" id="s-1" style="justify-content:center; align-items:center; text-align:center; background:#000000; color:#ffffff;">
    <div class="anim-scale d-1" style="margin-bottom:12px;">
      <img src="${imgLogo}" alt="MiniBase Logo" style="width:90px; height:90px; border-radius:12px; border:3px solid #ffffff; animation:pulseBlack 3s ease-in-out infinite;" />
    </div>
    <h1 class="anim-item d-2" style="font-size:50px; font-weight:800; color:#ffffff; line-height:1.05; margin-bottom:5px; letter-spacing:-1px; text-transform:uppercase;">
      MINIBASE
    </h1>
    <div class="anim-item d-2" style="width:75px; height:4px; background:#ffffff; margin:6px auto 12px;"></div>
    <p class="anim-item d-3" style="font-size:19px; font-weight:700; color:#ffffff; max-width:660px; line-height:1.35;">
      LIGHTWEIGHT EMBEDDED <span style="background:#fff; color:#000; padding:1px 6px;">BACKEND-AS-A-SERVICE</span> (BAAS)<br>POWERED BY NODE.JS 22 &amp; SQLITE WAL
    </p>
    <p class="anim-item d-3" style="font-size:14px; font-weight:700; color:#cccccc; margin-top:6px;">
      "YOUR DATA, YOUR SERVER, PREDICTABLE $0 HOSTING COST."
    </p>
    <div class="anim-item d-4" style="display:flex; gap:8px; margin-top:18px;">
      <span class="badge" style="background:#fff; color:#000; border:2px solid #fff;">
        <svg class="icon-svg" style="stroke:#000;" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
        NODE.JS 22+ NATIVE
      </span>
      <span class="badge" style="background:#fff; color:#000; border:2px solid #fff;">
        <svg class="icon-svg" style="stroke:#000;" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
        SQLITE WAL ENGINE
      </span>
      <span class="badge" style="background:#fff; color:#000; border:2px solid #fff;">
        <svg class="icon-svg" style="stroke:#000;" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        MIT LICENSE
      </span>
    </div>
    <div class="anim-item d-5" style="margin-top:22px; font-size:13.5px; font-weight:700; color:#ffffff;">
      AUTHORED BY: <span style="border-bottom:2px solid #fff;">KARTIK KOTHALKAR</span> &nbsp;|&nbsp; <code>github.com/kothalkarkkartik/MiniBase</code>
    </div>
  </div>

  <!-- ==================== SLIDE 2: PROBLEM ==================== -->
  <div class="slide" id="s-2">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        THE PROBLEM STATEMENT
      </div>
      <div class="slide-num-badge">SLIDE 02 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="card anim-item d-1">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <h3 class="card-title">1. UNPREDICTABLE &amp; PRICEY CLOUD BILLS</h3>
          </div>
          <p class="card-desc">
            Firebase and Supabase charge for every single read/write operation and outbound bandwidth. A launch surge causes shocking monthly bills.
          </p>
        </div>

        <div class="card anim-item d-2">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <h3 class="card-title">2. SETUP FRICTION &amp; COMPLEX EMULATORS</h3>
          </div>
          <p class="card-desc">
            Downloading secret JSON keys, managing bloated cloud consoles, running memory-heavy emulators, and learning proprietary query APIs stalls shipping.
          </p>
        </div>

        <div class="card anim-item d-3">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <h3 class="card-title">3. LOSS OF DATA OWNERSHIP &amp; VENDOR LOCK-IN</h3>
          </div>
          <p class="card-desc">
            Relational data is trapped inside proprietary cloud storage. Performing raw SQL queries, local migrations, or atomic hot backups is difficult.
          </p>
        </div>

        <div class="card anim-item d-4">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h3 class="card-title">4. INFRASTRUCTURE OVERKILL FOR MVPS</h3>
          </div>
          <p class="card-desc">
            Deploying heavy PostgreSQL clusters, Redis queues, and separate auth proxies just for a side-project introduces massive maintenance overhead.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 3: SOLUTION ==================== -->
  <div class="slide" id="s-3">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        WHAT IS MINIBASE?
      </div>
      <div class="slide-num-badge">SLIDE 03 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1.35fr; gap:18px; align-items:center;">
        <div>
          <p class="anim-item d-1" style="font-size:14.5px; font-weight:700; color:var(--black); line-height:1.5; margin-bottom:9px;">
            <strong>MiniBase</strong> is an embedded, single-binary Backend-as-a-Service built on Node 22's native SQLite engine running in high-concurrency WAL mode.
          </p>
          <div class="card anim-item d-2" style="margin-bottom:9px;">
            <p style="font-size:12.5px; font-weight:700; color:var(--dark-gray); line-height:1.45;">
              Bundles <strong>Automated REST APIs</strong>, <strong>Real-time SSE Streams</strong>, <strong>File Storage</strong>, and a <strong>Visual Admin Studio</strong> into a single process.
            </p>
          </div>
          <ul style="list-style:none; display:flex; flex-direction:column; gap:5px; font-size:12.5px; font-weight:700; color:var(--black);">
            <li class="anim-item d-3" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>Zero External Database:</strong> Everything stored in a single <code>data.db</code> file</span>
            </li>
            <li class="anim-item d-4" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>Microsecond Latency:</strong> In-process synchronous memory execution</span>
            </li>
            <li class="anim-item d-5" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>Ultra-Low Memory:</strong> Runs reliably on ~35MB RAM footprint</span>
            </li>
          </ul>
        </div>
        <div class="img-frame anim-scale d-2" onclick="openLightbox('${imgAdmin}', 'MiniBase Admin Studio Dashboard')">
          <div class="frame-bar">
            <div class="frame-dot"></div><div class="frame-dot"></div><div class="frame-dot"></div>
            <span class="frame-title">
              ADMIN STUDIO DASHBOARD
              <span class="zoom-hint">ZOOM</span>
            </span>
          </div>
          <img src="${imgAdmin}" alt="Admin Studio Dashboard" />
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 4: KEY FEATURES ==================== -->
  <div class="slide" id="s-4">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        KEY ARCHITECTURAL FEATURES
      </div>
      <div class="slide-num-badge">SLIDE 04 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
        <div class="card anim-item d-1">
          <div class="icon-box" style="margin-bottom:5px;">
            <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <h4 class="card-title">1. EMBEDDED SQLITE WAL</h4>
          <p class="card-desc">Node 22 native engine with Write-Ahead Logging for simultaneous reads and fast writes.</p>
        </div>

        <div class="card anim-item d-2">
          <div class="icon-box" style="margin-bottom:5px;">
            <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M4 11a9 9 0 0118 0"/><path d="M4 11V8"/><path d="M20 11V8"/><circle cx="12" cy="14" r="3"/><path d="M12 17v4"/></svg>
          </div>
          <h4 class="card-title">2. DYNAMIC REST APIS</h4>
          <p class="card-desc">Schemas immediately generate full CRUD endpoints with filtering, sorting, and pagination.</p>
        </div>

        <div class="card anim-item d-3">
          <div class="icon-box" style="margin-bottom:5px;">
            <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h4 class="card-title">3. REAL-TIME SSE STREAMS</h4>
          <p class="card-desc">Server-Sent Events stream live record changes instantly without WebSocket heartbeat overhead.</p>
        </div>

        <div class="card anim-item d-2">
          <div class="icon-box" style="margin-bottom:5px;">
            <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </div>
          <h4 class="card-title">4. ADMIN STUDIO CONSOLE</h4>
          <p class="card-desc">Visual web interface to design schema collections, manage permissions, and edit records.</p>
        </div>

        <div class="card anim-item d-3">
          <div class="icon-box" style="margin-bottom:5px;">
            <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          </div>
          <h4 class="card-title">5. LOCAL FILE STORAGE</h4>
          <p class="card-desc">Integrated multipart file uploads with automated high-speed Sharp thumbnail generation.</p>
        </div>

        <div class="card anim-item d-4">
          <div class="icon-box" style="margin-bottom:5px;">
            <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
          </div>
          <h4 class="card-title">6. CLOUDFLARE TUNNEL</h4>
          <p class="card-desc">Single-flag (<code>--tunnel</code>) command exposes localhost to a public HTTPS URL without router ports.</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 5: ARCHITECTURE ==================== -->
  <div class="slide" id="s-5">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><rect x="2" y="2" width="6" height="6" rx="1"/><rect x="16" y="2" width="6" height="6" rx="1"/><rect x="9" y="16" width="6" height="6" rx="1"/><path d="M5 8v3a2 2 0 002 2h10a2 2 0 002-2V8"/><line x1="12" y1="13" x2="12" y2="16"/></svg>
        SYSTEM ARCHITECTURE
      </div>
      <div class="slide-num-badge">SLIDE 05 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:flex; flex-direction:column; gap:9px; max-width:820px; margin:0 auto; width:100%;">
        <!-- Client Layer -->
        <div class="anim-item d-1">
          <div class="sub-head">CLIENT CONSUMER LAYER</div>
          <div style="display:flex; gap:8px;">
            <div class="arch-card" style="flex:1;">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
              WEB (SPA)
            </div>
            <div class="arch-card" style="flex:1;">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              FLUTTER MOBILE
            </div>
            <div class="arch-card" style="flex:1;">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              TERMINAL CLI
            </div>
            <div class="arch-card" style="flex:1;">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              PYTHON / SCRIPTS
            </div>
          </div>
        </div>

        <div class="anim-item d-2" style="text-align:center; font-weight:800; font-size:11.5px; letter-spacing:0.5px;">
          ▼ &nbsp; HTTP REST APIS / SERVER-SENT EVENTS (SSE) &nbsp; ▼
        </div>

        <!-- MiniBase Core -->
        <div class="anim-scale d-3 card" style="background:#000; color:#fff; padding:11px 16px; border:2px solid #000;">
          <div style="font-size:15px; font-weight:800; text-align:center; margin-bottom:7px; display:flex; align-items:center; justify-content:center; gap:8px;">
            <svg class="icon-svg" style="stroke:#fff;" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            MINIBASE CORE SERVER (NODE.JS 22 + EXPRESS)
          </div>
          <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap;">
            <span class="badge" style="background:#fff; color:#000;">AUTH ENGINE (JWT)</span>
            <span class="badge" style="background:#fff; color:#000;">SCHEMA MANAGER</span>
            <span class="badge" style="background:#fff; color:#000;">RULES ENGINE (RBAC)</span>
            <span class="badge" style="background:#fff; color:#000;">STORAGE (SHARP)</span>
            <span class="badge" style="background:#fff; color:#000;">SSE REAL-TIME</span>
          </div>
        </div>

        <div class="anim-item d-3" style="text-align:center; font-weight:800; font-size:11.5px; letter-spacing:0.5px;">
          ▼ &nbsp; IN-PROCESS NATIVE MEMORY IPC (node:sqlite) &nbsp; ▼
        </div>

        <!-- Storage Layer -->
        <div class="anim-item d-4">
          <div class="sub-head">DATA STORAGE LAYER</div>
          <div style="display:flex; gap:10px;">
            <div class="arch-card" style="flex:1; padding:9px;">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              SQLITE WAL DATABASE (<code>data.db</code>)
            </div>
            <div class="arch-card" style="flex:1; padding:9px;">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              LOCAL FILE STORAGE (<code>/storage</code>)
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 6: TECH STACK ==================== -->
  <div class="slide" id="s-6">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        TECHNOLOGY STACK
      </div>
      <div class="slide-num-badge">SLIDE 06 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
        <div>
          <div class="sub-head">
            <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6v6H9z"/></svg>
            BACKEND &amp; DATABASE
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div class="card anim-item d-1" style="display:flex; align-items:center; gap:9px; padding:8px 12px;">
              <div class="icon-box"><svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
              <div>
                <strong style="font-size:13px; font-weight:800;">Node.js 22+ (LTS)</strong>
                <div class="card-desc" style="font-size:11px;">Native <code>node:sqlite</code> module, modern ES Modules.</div>
              </div>
            </div>

            <div class="card anim-item d-2" style="display:flex; align-items:center; gap:9px; padding:8px 12px;">
              <div class="icon-box"><svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg></div>
              <div>
                <strong style="font-size:13px; font-weight:800;">Express.js</strong>
                <div class="card-desc" style="font-size:11px;">Fast HTTP routing and robust middleware pipeline.</div>
              </div>
            </div>

            <div class="card anim-item d-3" style="display:flex; align-items:center; gap:9px; padding:8px 12px;">
              <div class="icon-box"><svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
              <div>
                <strong style="font-size:13px; font-weight:800;">SQLite WAL Mode</strong>
                <div class="card-desc" style="font-size:11px;">ACID-compliant relational engine with microsecond latency.</div>
              </div>
            </div>

            <div class="card anim-item d-4" style="display:flex; align-items:center; gap:9px; padding:8px 12px;">
              <div class="icon-box"><svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
              <div>
                <strong style="font-size:13px; font-weight:800;">Sharp Image Engine</strong>
                <div class="card-desc" style="font-size:11px;">High-speed C++ automated thumbnail generation.</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="sub-head">
            <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            FRONTEND &amp; TOOLING
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <div class="card anim-item d-1" style="display:flex; align-items:center; gap:9px; padding:8px 12px;">
              <div class="icon-box"><svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
              <div>
                <strong style="font-size:13px; font-weight:800;">Admin Studio (SPA)</strong>
                <div class="card-desc" style="font-size:11px;">Framework-free single-page admin console.</div>
              </div>
            </div>

            <div class="card anim-item d-2" style="display:flex; align-items:center; gap:9px; padding:8px 12px;">
              <div class="icon-box"><svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg></div>
              <div>
                <strong style="font-size:13px; font-weight:800;">Scalar OpenAPI 3.0</strong>
                <div class="card-desc" style="font-size:11px;">Interactive REST API explorer at <code>/docs</code>.</div>
              </div>
            </div>

            <div class="card anim-item d-3" style="display:flex; align-items:center; gap:9px; padding:8px 12px;">
              <div class="icon-box"><svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg></div>
              <div>
                <strong style="font-size:13px; font-weight:800;">Docker &amp; Compose</strong>
                <div class="card-desc" style="font-size:11px;">Containerized multi-platform deploy.</div>
              </div>
            </div>

            <div class="card anim-item d-4" style="display:flex; align-items:center; gap:9px; padding:8px 12px;">
              <div class="icon-box"><svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg></div>
              <div>
                <strong style="font-size:13px; font-weight:800;">Cloudflare Tunnel</strong>
                <div class="card-desc" style="font-size:11px;">Instant public HTTPS tunnel for remote testing.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 7: COMPARISON ==================== -->
  <div class="slide" id="s-7">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        FIREBASE VS MINIBASE
      </div>
      <div class="slide-num-badge">SLIDE 07 / 20</div>
    </div>
    <div class="slide-body">
      <table class="data-table anim-scale d-1">
        <thead>
          <tr>
            <th style="width:25%;">DIMENSION</th>
            <th style="width:37%;">FIREBASE (CLOUD)</th>
            <th style="width:38%;">MINIBASE (SELF-HOSTED)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>ARCHITECTURE</strong></td>
            <td>Multi-tenant proprietary cloud</td>
            <td><strong>Single-process self-hosted binary</strong></td>
          </tr>
          <tr>
            <td><strong>DATABASE ENGINE</strong></td>
            <td>Firestore / NoSQL Documents</td>
            <td><strong>SQLite WAL (ACID Relational)</strong></td>
          </tr>
          <tr>
            <td><strong>DATA OWNERSHIP</strong></td>
            <td>Hosted by Google Cloud Platform</td>
            <td><strong>100% Owned (Single <code>data.db</code> file)</strong></td>
          </tr>
          <tr>
            <td><strong>HOSTING COST</strong></td>
            <td>Pay-per-operation &amp; bandwidth</td>
            <td><strong>$0 / Free Lifetime on any VPS</strong></td>
          </tr>
          <tr>
            <td><strong>REAL-TIME PROTOCOL</strong></td>
            <td>Heavy WebSocket state channels</td>
            <td><strong>Native Server-Sent Events (SSE)</strong></td>
          </tr>
          <tr>
            <td><strong>LOCAL WORKFLOW</strong></td>
            <td>Cloud emulators &amp; service keys</td>
            <td><strong>Immediate: <code>minibase serve</code></strong></td>
          </tr>
          <tr>
            <td><strong>MEMORY USAGE</strong></td>
            <td>Cloud-managed (opaque)</td>
            <td><strong>Ultra-low: ~35MB RAM footprint</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- ==================== SLIDE 8: ADMIN STUDIO ==================== -->
  <div class="slide" id="s-8">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        ADMIN STUDIO CONSOLE
      </div>
      <div class="slide-num-badge">SLIDE 08 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1.35fr; gap:18px; align-items:center;">
        <div>
          <p class="anim-item d-1" style="font-size:14px; font-weight:700; color:var(--black); line-height:1.5; margin-bottom:9px;">
            MiniBase includes a visual web management console served automatically at <code>http://localhost:8090/_/</code>.
          </p>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:700; color:var(--dark-gray);">
            <div class="anim-item d-2" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>Visual Schema Designer:</strong> Add fields and constraints without SQL.</span>
            </div>
            <div class="anim-item d-3" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>Inline Record Management:</strong> Spreadsheet-like table with instant edit.</span>
            </div>
            <div class="anim-item d-4" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>Admin Account Controls:</strong> Create admin users and rotate credentials.</span>
            </div>
            <div class="anim-item d-5" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>Instant Search &amp; Filter:</strong> Microsecond client-side pagination.</span>
            </div>
          </div>
        </div>
        <div class="img-frame anim-scale d-2" onclick="openLightbox('${imgModal}', 'Admin Studio - Admin Accounts & Security Modal')">
          <div class="frame-bar">
            <div class="frame-dot"></div><div class="frame-dot"></div><div class="frame-dot"></div>
            <span class="frame-title">
              ADMIN ACCOUNTS MODAL
              <span class="zoom-hint">ZOOM</span>
            </span>
          </div>
          <img src="${imgModal}" alt="Admin Studio Modal" />
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 9: REST API & DOCS ==================== -->
  <div class="slide" id="s-9">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        DYNAMIC REST API &amp; DOCS
      </div>
      <div class="slide-num-badge">SLIDE 09 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1.35fr; gap:16px; align-items:center;">
        <div>
          <p class="anim-item d-1" style="font-size:13.5px; font-weight:700; color:var(--black); margin-bottom:7px;">
            Creating a collection instantly generates standard REST endpoints, testable right away at <code>/docs</code>:
          </p>
          <div class="code-box anim-item d-2">
            <div><span class="cm">// 1. Query &amp; Filter Records</span></div>
            <div><span class="kw">GET</span> <span class="str">/api/collections/:col/records?page=1&perPage=20</span></div>
            <br>
            <div><span class="cm">// 2. Create Single Record</span></div>
            <div><span class="kw">POST</span> <span class="str">/api/collections/:col/records</span></div>
            <br>
            <div><span class="cm">// 3. Update Existing Record</span></div>
            <div><span class="kw">PATCH</span> <span class="str">/api/collections/:col/records/:id</span></div>
            <br>
            <div><span class="cm">// 4. Live Event Stream (SSE)</span></div>
            <div><span class="kw">GET</span> <span class="str">/api/realtime</span></div>
          </div>
        </div>
        <div class="img-frame anim-scale d-2" onclick="openLightbox('${imgDocs}', 'Interactive OpenAPI 3.0 Documentation at /docs')">
          <div class="frame-bar">
            <div class="frame-dot"></div><div class="frame-dot"></div><div class="frame-dot"></div>
            <span class="frame-title">
              SCALAR OPENAPI 3.0 (/docs)
              <span class="zoom-hint">ZOOM</span>
            </span>
          </div>
          <img src="${imgDocs}" alt="Interactive API Docs" />
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 10: CLI SUITE ==================== -->
  <div class="slide" id="s-10">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        TERMINAL CLI SUITE
      </div>
      <div class="slide-num-badge">SLIDE 10 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1.35fr 1fr; gap:16px; align-items:center;">
        <div class="img-frame anim-scale d-1" onclick="openLightbox('${imgCli}', 'MiniBase Terminal CLI Suite')">
          <div class="frame-bar">
            <div class="frame-dot"></div><div class="frame-dot"></div><div class="frame-dot"></div>
            <span class="frame-title">
              MINIBASE CLI
              <span class="zoom-hint">ZOOM</span>
            </span>
          </div>
          <img src="${imgCli}" alt="CLI Suite" />
        </div>
        <div class="code-box anim-item d-2">
          <div><span class="cm"># Start server &amp; open browser</span></div>
          <div><span class="fn">minibase</span> <span class="str">serve --open</span></div>
          <br>
          <div><span class="cm"># Expose with public HTTPS tunnel</span></div>
          <div><span class="fn">minibase</span> <span class="str">serve --tunnel</span></div>
          <br>
          <div><span class="cm"># Inspect process health and PID</span></div>
          <div><span class="fn">minibase</span> <span class="str">status</span></div>
          <br>
          <div><span class="cm"># Execute raw SQL against WAL</span></div>
          <div><span class="fn">minibase</span> <span class="str">sql "SELECT * FROM wallpapers LIMIT 5;"</span></div>
          <br>
          <div><span class="cm"># Reset admin password via terminal</span></div>
          <div><span class="fn">minibase</span> <span class="str">admin passwd admin@minibase.io newpass</span></div>
          <br>
          <div><span class="cm"># Create hot database backup</span></div>
          <div><span class="fn">minibase</span> <span class="str">backup ./backups/prod.backup</span></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 11: AUTH & SECURITY ==================== -->
  <div class="slide" id="s-11">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        AUTH &amp; SECURITY
      </div>
      <div class="slide-num-badge">SLIDE 11 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1.35fr; gap:16px; align-items:center;">
        <div style="display:flex; flex-direction:column; gap:7px;">
          <div class="card anim-item d-1" style="padding:8px 12px;">
            <h4 class="card-title">JWT AUTHENTICATION TOKENS</h4>
            <p class="card-desc">Signed tokens with configurable 7-day default session longevity.</p>
          </div>
          <div class="card anim-item d-2" style="padding:8px 12px;">
            <h4 class="card-title">USER AUTH COLLECTIONS</h4>
            <p class="card-desc">Password hashing, email verification, and token refresh support.</p>
          </div>
          <div class="card anim-item d-3" style="padding:8px 12px;">
            <h4 class="card-title">FINE-GRAINED RBAC RULES</h4>
            <p class="card-desc">Declarative permission rules matching <code>@request.auth.id != ""</code>.</p>
          </div>
          <div class="card anim-item d-4" style="padding:8px 12px;">
            <h4 class="card-title">SSL / HTTPS &amp; TUNNELING</h4>
            <p class="card-desc">Custom local SSL certificates plus zero-config Cloudflare TLS tunnel.</p>
          </div>
        </div>
        <div class="img-frame anim-scale d-2" onclick="openLightbox('${imgAuth}', 'MiniBase User Authentication Portal')">
          <div class="frame-bar">
            <div class="frame-dot"></div><div class="frame-dot"></div><div class="frame-dot"></div>
            <span class="frame-title">
              USER AUTH PORTAL
              <span class="zoom-hint">ZOOM</span>
            </span>
          </div>
          <img src="${imgAuth}" alt="User Auth Portal" />
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 12: DATA MIGRATION ==================== -->
  <div class="slide" id="s-12">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        MIGRATION &amp; BACKUPS
      </div>
      <div class="slide-num-badge">SLIDE 12 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1.35fr; gap:16px; align-items:center;">
        <div>
          <p class="anim-item d-1" style="font-size:14px; font-weight:700; color:var(--black); line-height:1.5; margin-bottom:9px;">
            Full data portability in MiniBase — manage exports and imports via UI or command line:
          </p>
          <div class="card anim-item d-2" style="margin-bottom:8px;">
            <h4 class="card-title">RFC 4180 COMPLIANT CSV &amp; JSON</h4>
            <p class="card-desc">Bulk ingest thousands of records in seconds with automatic schema mapping.</p>
          </div>
          <div class="card anim-item d-3">
            <h4 class="card-title">ATOMIC SQLITE TRANSACTIONS</h4>
            <p class="card-desc">Batch insertions wrapped in atomic transactions — automatic rollback on failure.</p>
          </div>
        </div>
        <div class="img-frame anim-scale d-2" onclick="openLightbox('${imgImport}', 'CSV & JSON Data Import / Export Modal')">
          <div class="frame-bar">
            <div class="frame-dot"></div><div class="frame-dot"></div><div class="frame-dot"></div>
            <span class="frame-title">
              IMPORT / EXPORT MODAL
              <span class="zoom-hint">ZOOM</span>
            </span>
          </div>
          <img src="${imgImport}" alt="Import Export Modal" />
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 13: CLIENT SDKs ==================== -->
  <div class="slide" id="s-13">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        MULTI-PLATFORM CLIENT CODE
      </div>
      <div class="slide-num-badge">SLIDE 13 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:11px;">
        <div class="card anim-item d-1" style="padding:9px 13px;">
          <div class="sub-head">JAVASCRIPT / TYPESCRIPT</div>
          <div class="code-box" style="font-size:10.5px; padding:7px 9px;">
            <div><span class="kw">const</span> res = <span class="kw">await</span> <span class="fn">fetch</span>(<span class="str">'http://localhost:8090/api/collections/posts/records'</span>);</div>
            <div><span class="kw">const</span> { items } = <span class="kw">await</span> res.<span class="fn">json</span>();</div>
            <div>console.<span class="fn">log</span>(items);</div>
          </div>
        </div>

        <div class="card anim-item d-2" style="padding:9px 13px;">
          <div class="sub-head">DART / FLUTTER (MOBILE)</div>
          <div class="code-box" style="font-size:10.5px; padding:7px 9px;">
            <div><span class="kw">final</span> res = <span class="kw">await</span> http.<span class="fn">get</span>(Uri.<span class="fn">parse</span>(<span class="str">'http://10.0.2.2:8090/api/collections/wallpapers/records'</span>));</div>
            <div><span class="kw">final</span> data = jsonDecode(res.body)[<span class="str">'items'</span>];</div>
          </div>
        </div>

        <div class="card anim-item d-3" style="padding:9px 13px;">
          <div class="sub-head">PYTHON CLIENT</div>
          <div class="code-box" style="font-size:10.5px; padding:7px 9px;">
            <div><span class="kw">import</span> requests</div>
            <div>res = requests.<span class="fn">get</span>(<span class="str">"http://localhost:8090/api/collections/posts/records"</span>)</div>
            <div>records = res.<span class="fn">json</span>().<span class="fn">get</span>(<span class="str">"items"</span>, [])</div>
          </div>
        </div>

        <div class="card anim-item d-4" style="padding:9px 13px;">
          <div class="sub-head">REAL-TIME SSE (BROWSER)</div>
          <div class="code-box" style="font-size:10.5px; padding:7px 9px;">
            <div><span class="kw">const</span> sse = <span class="kw">new</span> <span class="fn">EventSource</span>(<span class="str">'http://localhost:8090/api/realtime'</span>);</div>
            <div>sse.<span class="fn">addEventListener</span>(<span class="str">'create'</span>, (e) => {</div>
            <div>&nbsp;&nbsp;console.<span class="fn">log</span>(<span class="str">'Live Update:'</span>, JSON.<span class="fn">parse</span>(e.data));</div>
            <div>});</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 14: DEMO APP ==================== -->
  <div class="slide" id="s-14">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        DEMO APP — WALLPAPER GALLERY
      </div>
      <div class="slide-num-badge">SLIDE 14 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1.35fr 1fr; gap:16px; align-items:center;">
        <div class="img-frame anim-scale d-1" onclick="openLightbox('${imgDemo}', 'MiniBase Full-Stack Wallpaper Gallery Client Demo')">
          <div class="frame-bar">
            <div class="frame-dot"></div><div class="frame-dot"></div><div class="frame-dot"></div>
            <span class="frame-title">
              DEMO AT localhost:8090/demo
              <span class="zoom-hint">ZOOM</span>
            </span>
          </div>
          <img src="${imgDemo}" alt="Wallpaper App Client" />
        </div>
        <div>
          <p class="anim-item d-1" style="font-size:14px; font-weight:700; color:var(--black); line-height:1.5; margin-bottom:9px;">
            Full-stack demonstration application at <code>/demo</code> showcasing all capabilities:
          </p>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:12px; font-weight:700; color:var(--dark-gray);">
            <div class="anim-item d-2" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>Multipart Uploads:</strong> High-res wallpapers + Sharp thumbnails</span>
            </div>
            <div class="anim-item d-3" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>REST Filtering:</strong> Dynamic categories and instant search</span>
            </div>
            <div class="anim-item d-4" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>SSE Live Sync:</strong> Uploads immediately sync to connected clients</span>
            </div>
            <div class="anim-item d-5" style="display:flex; align-items:center; gap:6px;">
              <span class="badge" style="padding:2px 4px;"><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="20 6 9 17 4 12"/></svg></span>
              <span><strong>Cross-Platform:</strong> Flutter mobile and responsive web code included</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 15: REAL-WORLD APPLICATIONS (NEW) ==================== -->
  <div class="slide" id="s-15">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        REAL-WORLD APPLICATIONS
      </div>
      <div class="slide-num-badge">SLIDE 15 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="card anim-item d-1">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            </div>
            <h3 class="card-title">1. MOBILE &amp; FLUTTER APPLICATIONS</h3>
          </div>
          <p class="card-desc">
            Perfect backend companion for mobile apps. Built-in auth, image uploads, and real-time SSE event feeds keep mobile clients synced seamlessly.
          </p>
        </div>

        <div class="card anim-item d-2">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <h3 class="card-title">2. INTERNAL ENTERPRISE TOOLS &amp; ADMIN PANELS</h3>
          </div>
          <p class="card-desc">
            Build inventory trackers, staff directories, and CRM dashboards in minutes without configuring separate database servers or writing backend code.
          </p>
        </div>

        <div class="card anim-item d-3">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            </div>
            <h3 class="card-title">3. IOT, EDGE &amp; EMBEDDED COMPUTING</h3>
          </div>
          <p class="card-desc">
            With ~35MB RAM footprint and single-file portability, MiniBase runs smoothly on Raspberry Pi, edge gateways, and industrial embedded hardware.
          </p>
        </div>

        <div class="card anim-item d-4">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h3 class="card-title">4. RAPID STARTUP MVPS &amp; HACKATHONS</h3>
          </div>
          <p class="card-desc">
            Ship products in days instead of weeks. Focus purely on frontend design while MiniBase handles auth, storage, database schema, and REST APIs.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 16: KEY ADVANTAGES (NEW) ==================== -->
  <div class="slide" id="s-16">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
        KEY ADVANTAGES &amp; BENEFITS
      </div>
      <div class="slide-num-badge">SLIDE 16 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="card anim-item d-1">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <h4 class="card-title">ZERO HOSTING COSTS ($0 CLOUD BILLS)</h4>
          </div>
          <p class="card-desc">
            No per-query fees, no read/write meter traps, and no bandwidth surcharges. Host for free on any cheap $3/mo VPS or self-host at zero cost.
          </p>
        </div>

        <div class="card anim-item d-2">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <h4 class="card-title">MICROSECOND SQLITE SPEED</h4>
          </div>
          <p class="card-desc">
            No network overhead between application layer and database. In-process memory execution delivers microsecond read performance.
          </p>
        </div>

        <div class="card anim-item d-3">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <h4 class="card-title">100% DATA SOVEREIGNTY &amp; PRIVACY</h4>
          </div>
          <p class="card-desc">
            Your data is stored exclusively in a single local <code>data.db</code> file. Easy to backup, audit, copy, and fully compliant with GDPR privacy standards.
          </p>
        </div>

        <div class="card anim-item d-4">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <h4 class="card-title">ZERO-CONFIG PORTABLE DEPLOYMENT</h4>
          </div>
          <p class="card-desc">
            No database installation, user permissions, or port bindings required. Clone, install, and run — everything works right out of the box.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 17: LIMITATIONS & DISADVANTAGES (NEW) ==================== -->
  <div class="slide" id="s-17">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
        LIMITATIONS &amp; WHEN NOT TO USE
      </div>
      <div class="slide-num-badge">SLIDE 17 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="card anim-item d-1">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h4 class="card-title">SINGLE-NODE ARCHITECTURE</h4>
          </div>
          <p class="card-desc">
            MiniBase uses a local SQLite database file. It is designed for single-server vertical scaling, not multi-region distributed write clusters.
          </p>
        </div>

        <div class="card anim-item d-2">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><line x1="3.27" y1="6.96" x2="12" y2="12.01"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
            </div>
            <h4 class="card-title">NOT FOR MASSIVE BIG DATA (TERABYTE+)</h4>
          </div>
          <p class="card-desc">
            While SQLite easily handles tens of gigabytes and millions of rows, massive terabyte analytics pipelines are better suited for ClickHouse/Snowflake.
          </p>
        </div>

        <div class="card anim-item d-3">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
            </div>
            <h4 class="card-title">WRITE CONCURRENCY BOTTLENECKS</h4>
          </div>
          <p class="card-desc">
            In WAL mode, SQLite supports infinite simultaneous readers but sequential write commits. Heavy continuous write floods can create lock queues.
          </p>
        </div>

        <div class="card anim-item d-4">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            </div>
            <h4 class="card-title">NO BUILT-IN PUSH NOTIFICATIONS</h4>
          </div>
          <p class="card-desc">
            MiniBase provides live real-time Server-Sent Events (SSE), but native APNS (iOS) / FCM (Android) background push requires external services.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 18: ROADMAP (NEW) ==================== -->
  <div class="slide" id="s-18">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
        ROADMAP &amp; FUTURE VISION
      </div>
      <div class="slide-num-badge">SLIDE 18 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="card anim-item d-1">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/></svg>
            </div>
            <h4 class="card-title">LITESTREAM REPLICATION</h4>
          </div>
          <p class="card-desc">
            Automated continuous streaming replication to S3, Cloudflare R2, or MinIO for zero-effort offsite disaster recovery and live read replicas.
          </p>
        </div>

        <div class="card anim-item d-2">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </div>
            <h4 class="card-title">CUSTOM PLUGIN &amp; HOOK ECOSYSTEM</h4>
          </div>
          <p class="card-desc">
            Extending the core engine with JavaScript server-side hooks (<code>onRecordCreate</code>, <code>beforeAuth</code>, payment webhooks).
          </p>
        </div>

        <div class="card anim-item d-3">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            </div>
            <h4 class="card-title">DEDICATED SDK PACKAGES</h4>
          </div>
          <p class="card-desc">
            Publishing official native client libraries on npm (<code>minibase-js</code>), pub.dev (<code>minibase_flutter</code>), and PyPI (<code>minibase-python</code>).
          </p>
        </div>

        <div class="card anim-item d-4">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <div class="icon-box">
              <svg class="icon-svg" fill="none" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h4 class="card-title">OAUTH2 SOCIAL LOGIN PROVIDERS</h4>
          </div>
          <p class="card-desc">
            One-click social login integrations with Google, GitHub, Apple, and Discord directly manageable from the Admin Studio console.
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 19: QUICKSTART ==================== -->
  <div class="slide" id="s-19">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        QUICKSTART &amp; DEPLOYMENT
      </div>
      <div class="slide-num-badge">SLIDE 19 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1.1fr 1fr; gap:15px; align-items:center;">
        <div>
          <div class="sub-head anim-item d-1">3-STEP LOCAL SETUP:</div>
          <div class="code-box anim-item d-2" style="margin-bottom:8px;">
            <div><span class="cm"># 1. Clone repository</span></div>
            <div><span class="fn">git clone</span> <span class="str">https://github.com/kothalkarkkartik/MiniBase.git</span> &amp;&amp; <span class="fn">cd</span> MiniBase</div>
            <br>
            <div><span class="cm"># 2. Install &amp; launch</span></div>
            <div><span class="fn">npm install</span> &amp;&amp; <span class="fn">node bin/minibase.js</span> <span class="str">serve --open</span></div>
          </div>

          <div class="sub-head anim-item d-3">DOCKER &amp; VPS DEPLOY:</div>
          <div class="code-box anim-item d-4">
            <div><span class="cm"># Docker Compose:</span></div>
            <div><span class="fn">docker compose</span> <span class="str">up -d</span></div>
            <br>
            <div><span class="cm"># Linux VPS Installer (systemd):</span></div>
            <div><span class="fn">curl</span> <span class="str">-fsSL https://raw.githubusercontent.com/.../install.sh | bash</span></div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:9px;">
          <div class="card anim-item d-2">
            <h4 class="card-title">PREDICTABLE INFRASTRUCTURE</h4>
            <p class="card-desc">
              Runs as a standalone self-contained background daemon under systemd or Docker container with zero ongoing maintenance.
            </p>
          </div>

          <div class="card anim-item d-3">
            <h4 class="card-title">DESKTOP STANDALONE (.EXE)</h4>
            <p class="card-desc">
              Packaged as a Windows executable that launches MiniBase Studio locally without requiring Node.js to be installed globally!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ==================== SLIDE 20: SUMMARY ==================== -->
  <div class="slide" id="s-20">
    <div class="slide-header">
      <div class="slide-title">
        <svg class="icon-svg" fill="none" stroke-width="3" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        SUMMARY &amp; CONCLUSION
      </div>
      <div class="slide-num-badge">SLIDE 20 / 20</div>
    </div>
    <div class="slide-body">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:center;">
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div class="card anim-item d-1">
            <h4 class="card-title">THE INDIE DEVELOPER'S BACKEND</h4>
            <p class="card-desc">
              MiniBase gives developers complete architectural freedom: microsecond performance, zero hosting bills, and 100% data ownership.
            </p>
          </div>

          <div class="anim-item d-2" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div class="card" style="text-align:center; padding:9px;">
              <div style="font-size:24px; font-weight:800; color:var(--black); line-height:1;">$0</div>
              <div style="font-size:11px; font-weight:800; color:var(--dark-gray); margin-top:2px;">HOSTING COST</div>
            </div>
            <div class="card" style="text-align:center; padding:9px;">
              <div style="font-size:24px; font-weight:800; color:var(--black); line-height:1;">35MB</div>
              <div style="font-size:11px; font-weight:800; color:var(--dark-gray); margin-top:2px;">RAM USAGE</div>
            </div>
          </div>
        </div>

        <div class="card anim-item d-3" style="background:#000; color:#fff; text-align:center; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <div style="font-size:24px; font-weight:800; text-transform:uppercase; margin-bottom:6px;">THANK YOU!</div>
          <p style="font-size:13px; font-weight:600; color:#ccc; margin-bottom:12px;">Questions, Feedback &amp; Contributions are Welcome!</p>
          <div style="font-size:14px; font-weight:800; color:#fff; border-bottom:2px solid #fff; padding-bottom:3px; margin-bottom:8px;">
            Kartik Kothalkar
          </div>
          <code style="font-size:11px; color:#aaa;">github.com/kothalkarkkartik/MiniBase</code>
          <div style="margin-top:14px;">
            <span class="badge" style="background:#fff; color:#000; gap:5px;">
              <svg class="icon-svg" style="width:12px; height:12px; stroke:none; fill:#000;" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              STAR ON GITHUB
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

</div>

<!-- Navigation Controls -->
<div class="nav-bar">
  <div class="progress-bar-bg">
    <div class="progress-bar-fill" id="pFill" style="width:5%;"></div>
  </div>
  <div class="nav-controls">
    <div style="display:flex; align-items:center; gap:5px;">
      <button class="nav-btn square" id="prevBtn" onclick="step(-1)">
        <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span id="slideIndicator" style="font-size:11px; font-weight:800; color:var(--black); min-width:54px; text-align:center;">1 / 20</span>
      <button class="nav-btn square" id="nextBtn" onclick="step(1)">
        <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <button class="nav-btn auto-play-btn" id="autoPlayBtn" onclick="toggleAutoPlay()" title="Toggle Auto-Play (P)">
        <svg id="playIcon" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        <span id="autoPlayText">AUTO</span>
      </button>
    </div>

    <div class="dots-container" id="dotsContainer"></div>

    <div class="key-tip">
      <span class="kbd">SCROLL</span> &nbsp;|&nbsp; <span class="kbd">NAV ARROWS</span> &nbsp;|&nbsp; <span class="kbd">P</span> PLAY &nbsp;|&nbsp; <span class="kbd">F</span> FULL &nbsp;|&nbsp; <span class="kbd">ESC</span> CLOSE
    </div>
  </div>
</div>

<script>
  let cur = 1;
  const total = 20;
  let isAnimating = false;
  let isAutoPlaying = false;
  let autoPlayTimer = null;
  const AUTO_PLAY_INTERVAL = 4500;
  const dotsContainer = document.getElementById('dotsContainer');

  // Diverse animation styles pool
  const animStyles = ['cube', 'zoom', 'deck', 'diag'];

  for (let i = 1; i <= total; i++) {
    const d = document.createElement('div');
    d.className = 'nav-dot' + (i === 1 ? ' active' : '');
    d.onclick = () => { resetAutoPlayTimer(); goTo(i); };
    dotsContainer.appendChild(d);
  }

  const ANIM_DURATION = 420;

  function goTo(n) {
    if (n < 1 || n > total || n === cur || isAnimating) return;
    isAnimating = true;

    const isForward = n > cur;
    const oldSlide = document.getElementById('s-' + cur);
    const newSlide = document.getElementById('s-' + n);

    // Pick diverse transition style based on slide index
    const styleChoice = animStyles[(Math.abs(n - cur) + cur) % animStyles.length];

    let exitClass = '';
    let enterClass = '';

    if (styleChoice === 'cube') {
      exitClass = isForward ? 'anim-cube-exit-next' : 'anim-cube-exit-prev';
      enterClass = isForward ? 'anim-cube-next' : 'anim-cube-prev';
    } else if (styleChoice === 'zoom') {
      exitClass = isForward ? 'anim-zoom-exit-next' : 'anim-zoom-exit-prev';
      enterClass = isForward ? 'anim-zoom-next' : 'anim-zoom-prev';
    } else if (styleChoice === 'deck') {
      exitClass = isForward ? 'anim-deck-exit-next' : 'anim-deck-exit-prev';
      enterClass = isForward ? 'anim-deck-next' : 'anim-deck-prev';
    } else { // diag
      exitClass = isForward ? 'anim-diag-exit-next' : 'anim-diag-exit-prev';
      enterClass = isForward ? 'anim-diag-next' : 'anim-diag-prev';
    }

    // Clear any inline styles so nothing is blocked
    oldSlide.removeAttribute('style');
    newSlide.removeAttribute('style');

    // Both slides remain visible & animate simultaneously without dropping display
    oldSlide.className = 'slide slide-animating ' + exitClass;
    newSlide.className = 'slide slide-animating ' + enterClass;

    cur = n;
    renderUI();

    setTimeout(() => {
      oldSlide.className = 'slide';
      newSlide.className = 'slide active';
      isAnimating = false;
    }, ANIM_DURATION);
  }

  function step(d) {
    resetAutoPlayTimer();
    goTo(cur + d);
  }

  function renderUI() {
    document.getElementById('slideIndicator').textContent = cur + ' / ' + total;
    document.getElementById('pFill').style.width = (cur / total * 100) + '%';
    document.getElementById('prevBtn').disabled = cur === 1;
    document.getElementById('nextBtn').disabled = cur === total;

    for (let i = 0; i < dotsContainer.children.length; i++) {
      dotsContainer.children[i].className = 'nav-dot' + (i + 1 === cur ? ' active' : '');
    }
  }

  // AUTO-PLAY CONTROLS
  function toggleAutoPlay() {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }

  function startAutoPlay() {
    isAutoPlaying = true;
    const btn = document.getElementById('autoPlayBtn');
    btn.classList.add('playing');
    document.getElementById('playIcon').innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    document.getElementById('autoPlayText').textContent = 'PAUSE';

    clearInterval(autoPlayTimer);
    autoPlayTimer = setInterval(() => {
      const modal = document.getElementById('lightboxModal');
      if (modal.classList.contains('open')) return;

      if (cur >= total) {
        goTo(1);
      } else {
        goTo(cur + 1);
      }
    }, AUTO_PLAY_INTERVAL);
  }

  function stopAutoPlay() {
    isAutoPlaying = false;
    clearInterval(autoPlayTimer);
    const btn = document.getElementById('autoPlayBtn');
    btn.classList.remove('playing');
    document.getElementById('playIcon').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    document.getElementById('autoPlayText').textContent = 'AUTO';
  }

  function resetAutoPlayTimer() {
    if (isAutoPlaying) {
      clearInterval(autoPlayTimer);
      startAutoPlay();
    }
  }

  // MOUSE WHEEL & TRACKPAD SCROLL NAVIGATION WITH INERTIA LOCK
  let isWheelLocked = false;
  let lastWheelTime = 0;

  window.addEventListener('wheel', e => {
    const modal = document.getElementById('lightboxModal');
    if (modal && modal.classList.contains('open')) return;

    const now = Date.now();

    // Ignore while animation is active or locked
    if (isAnimating || isWheelLocked || (now - lastWheelTime < 550)) return;

    // Filter tiny incidental touchpad motions
    if (Math.abs(e.deltaY) < 25) return;

    isWheelLocked = true;
    lastWheelTime = now;
    resetAutoPlayTimer();

    if (e.deltaY > 0) {
      step(1);
    } else {
      step(-1);
    }

    setTimeout(() => {
      isWheelLocked = false;
    }, 550);
  }, { passive: true });

  // Lightbox functions
  function openLightbox(src, caption) {
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImg');
    const cap = document.getElementById('lightboxCaption');
    img.src = src;
    cap.textContent = caption || 'Screenshot View';
    modal.classList.add('open');
  }

  function closeLightbox(e) {
    if (e && e.target && e.target.id !== 'lightboxModal') return;
    const modal = document.getElementById('lightboxModal');
    modal.classList.remove('open');
    setTimeout(() => { document.getElementById('lightboxImg').src = ''; }, 200);
  }

  document.addEventListener('keydown', e => {
    const modal = document.getElementById('lightboxModal');
    if (modal.classList.contains('open')) {
      if (e.key === 'Escape') {
        closeLightbox(null);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); step(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'Home') { e.preventDefault(); resetAutoPlayTimer(); goTo(1); }
    if (e.key === 'End') { e.preventDefault(); resetAutoPlayTimer(); goTo(total); }
    if (e.key === 'p' || e.key === 'P') { e.preventDefault(); toggleAutoPlay(); }
    if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    }
  });

  let touchX = 0;
  document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; });
  document.addEventListener('touchend', e => {
    const diff = touchX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) step(diff > 0 ? 1 : -1);
  });

  renderUI();
</script>

</body>
</html>`;

  const outputPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\9a3dfbf7-d267-421b-b672-15c1257252f7\\minibase-presentation.html';
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`Generated 20-slide presentation at: ${outputPath} (${(html.length / 1024).toFixed(1)} KB)`);
}

run();
