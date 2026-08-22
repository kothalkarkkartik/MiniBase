
const COLLECTION_TEMPLATES = {
  products: {
    name: 'products',
    type: 'base',
    preset: 'public_read',
    fields: [
      { name: 'title', type: 'text', required: true, unique: false },
      { name: 'description', type: 'text', required: false, unique: false },
      { name: 'price', type: 'number', required: true, unique: false },
      { name: 'image', type: 'file', required: false, unique: false },
      { name: 'category', type: 'select', required: false, unique: false },
      { name: 'inStock', type: 'bool', required: false, unique: false }
    ]
  },
  blog: {
    name: 'posts',
    type: 'base',
    preset: 'public_read',
    fields: [
      { name: 'title', type: 'text', required: true, unique: false },
      { name: 'slug', type: 'text', required: true, unique: true },
      { name: 'content', type: 'text', required: true, unique: false },
      { name: 'banner', type: 'file', required: false, unique: false },
      { name: 'author', type: 'text', required: false, unique: false },
      { name: 'publishedDate', type: 'date', required: false, unique: false }
    ]
  },
  gallery: {
    name: 'wallpapers',
    type: 'base',
    preset: 'public_read',
    fields: [
      { name: 'title', type: 'text', required: true, unique: false },
      { name: 'image', type: 'file', required: true, unique: false },
      { name: 'category', type: 'select', required: false, unique: false },
      { name: 'downloads', type: 'number', required: false, unique: false }
    ]
  },
  team: {
    name: 'faculty',
    type: 'base',
    preset: 'public_read',
    fields: [
      { name: 'name', type: 'text', required: true, unique: false },
      { name: 'designation', type: 'text', required: true, unique: false },
      { name: 'department', type: 'text', required: false, unique: false },
      { name: 'email', type: 'email', required: false, unique: false },
      { name: 'phone', type: 'text', required: false, unique: false },
      { name: 'avatar', type: 'file', required: false, unique: false }
    ]
  },
  contact: {
    name: 'inquiries',
    type: 'base',
    preset: 'public_write',
    fields: [
      { name: 'name', type: 'text', required: true, unique: false },
      { name: 'email', type: 'email', required: true, unique: false },
      { name: 'message', type: 'text', required: true, unique: false },
      { name: 'status', type: 'select', required: false, unique: false }
    ]
  },
  tasks: {
    name: 'tasks',
    type: 'base',
    preset: 'users_only',
    fields: [
      { name: 'title', type: 'text', required: true, unique: false },
      { name: 'dueDate', type: 'date', required: false, unique: false },
      { name: 'priority', type: 'select', required: false, unique: false },
      { name: 'completed', type: 'bool', required: false, unique: false }
    ]
  }
};

function applyCollectionTemplate(key) {
  const tmpl = COLLECTION_TEMPLATES[key];
  if (!tmpl) return;

  const nameInput = document.getElementById('col-name');
  if (nameInput) nameInput.value = tmpl.name;

  const typeSelect = document.getElementById('col-type');
  if (typeSelect) typeSelect.value = tmpl.type;

  const container = document.getElementById('schema-fields-container');
  if (container) {
    container.innerHTML = tmpl.fields.map((f, i) => generateFieldCardHtml(f, i)).join('');
  }

  if (tmpl.preset) {
    applyRulePreset(tmpl.preset);
  }

  showToast(`Loaded "${key}" starter template!`, 'info');
}

function applyRulePreset(preset) {
  const setRule = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };

  const panel = document.getElementById('access-rules-panel');
  if (panel && panel.style.display === 'none') {
    toggleAccessRules();
  }

  if (preset === 'public_read') {
    setRule('rule-list', '');
    setRule('rule-view', '');
    setRule('rule-create', '__null__');
    setRule('rule-update', '__null__');
    setRule('rule-delete', '__null__');
    showToast('Rule preset: Public Read Only (Admin writes)', 'info');
  } else if (preset === 'public_write') {
    setRule('rule-list', '__null__');
    setRule('rule-view', '__null__');
    setRule('rule-create', '');
    setRule('rule-update', '__null__');
    setRule('rule-delete', '__null__');
    showToast('Rule preset: Public Form Submission (Admin reads)', 'info');
  } else if (preset === 'public_all') {
    setRule('rule-list', '');
    setRule('rule-view', '');
    setRule('rule-create', '');
    setRule('rule-update', '');
    setRule('rule-delete', '');
    showToast('Rule preset: Public Read & Write', 'info');
  } else if (preset === 'users_only') {
    setRule('rule-list', "@request.auth.id != ''");
    setRule('rule-view', "@request.auth.id != ''");
    setRule('rule-create', "@request.auth.id != ''");
    setRule('rule-update', "@request.auth.id != ''");
    setRule('rule-delete', "@request.auth.id != ''");
    showToast('Rule preset: Logged-in Users Only', 'info');
  } else if (preset === 'admin_only') {
    setRule('rule-list', '__null__');
    setRule('rule-view', '__null__');
    setRule('rule-create', '__null__');
    setRule('rule-update', '__null__');
    setRule('rule-delete', '__null__');
    showToast('Rule preset: Admin Only (Private)', 'info');
  }
}

async function downloadStarterApp(colName) {
  const origin = (_tunnelState.active && _tunnelState.url) ? _tunnelState.url : window.location.origin;
  const col = (state.collections || []).find(c => c.name === colName) || { name: colName, schema: [] };
  const schemaJson = JSON.stringify(col.schema || []);

  try {
    const res = await fetch('/starter_template.html');
    let template = await res.text();
    template = template
      .replaceAll('{{COL_NAME}}', colName)
      .replaceAll('{{COL_NAME_UPPER}}', colName.toUpperCase())
      .replaceAll('{{ORIGIN}}', origin)
      .replaceAll('{{SCHEMA_JSON}}', schemaJson.replace(/'/g, "\\'"));

    const blob = new Blob([template], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = colName + '_app.html';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded starter web app for "' + colName + '"!', 'success');
  } catch (err) {
    showToast('Failed to download template: ' + err.message, 'error');
  }
}

// MiniBase Admin Dashboard SPA Core Logic

const state = {
  view: 'records', // 'records' | 'schema' | 'realtime' | 'explorer' | 'logs' | 'settings'
  collections: [],
  activeCollection: null,
  records: [],
  page: 1,
  perPage: 30,
  totalPages: 1,
  totalItems: 0,
  searchQuery: '',
  filterQuery: '',
  sortQuery: '-created',
  stats: null,
  realtimeEvents: [],
  logs: [],
  logsPage: 1,
  logsTotalPages: 1,
};

// UI Helpers
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${type === 'success' ? '<polyline points="20 6 9 17 4 12"></polyline>' : type === 'error' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>'}
    </svg>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

window.__codeSnippets = window.__codeSnippets || {};

function copyToClipboard(text, message = 'Copied to clipboard!') {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(message, 'success');
    }).catch(() => fallbackCopyText(text, message));
  } else {
    fallbackCopyText(text, message);
  }
}

function fallbackCopyText(text, message) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    showToast(message, 'success');
  } catch {
    showToast('Failed to copy', 'error');
  }
  document.body.removeChild(ta);
}

function openModal(title, bodyHtml, footerHtml = '') {
  closeModal();
  const backdrop = document.createElement('div');
  backdrop.id = 'active-modal';
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="btn-icon" onclick="closeModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="modal-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
    </div>
  `;

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  document.body.appendChild(backdrop);
}

function closeModal() {
  const modal = document.getElementById('active-modal');
  if (modal) modal.remove();
}

function showConfirmDialog({
  title = 'Are you sure?',
  message = 'Do you really want to perform this action? This action cannot be undone.',
  confirmText = 'Yes, Delete',
  confirmBtnClass = 'btn-danger',
  icon = '🗑️',
  onConfirm = () => {},
}) {
  const bodyHtml = `
    <div style="display:flex; align-items:flex-start; gap:16px; padding:8px 0;">
      <div style="width:44px; height:44px; border-radius:12px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.25); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;">
        ${icon}
      </div>
      <div style="flex:1;">
        <h3 style="font-size:16px; font-weight:700; color:#FFFFFF; margin:0 0 6px 0; font-family:'Plus Jakarta Sans', sans-serif;">${escapeHtml(title)}</h3>
        <p style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin:0;">${message}</p>
      </div>
    </div>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button id="modal-confirm-btn" class="btn ${confirmBtnClass}" style="font-weight:700; padding:7px 18px;">${escapeHtml(confirmText)}</button>
  `;

  openModal('', bodyHtml, footerHtml);

  // Hide the default modal header for a clean, focused alert card
  const header = document.querySelector('#active-modal .modal-header');
  if (header) header.style.display = 'none';

  document.getElementById('modal-confirm-btn')?.addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

function openDrawer(title, bodyHtml, footerHtml = '') {
  closeDrawer();
  const backdrop = document.createElement('div');
  backdrop.id = 'active-drawer-backdrop';
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="drawer">
      <div class="drawer-header">
        <div class="drawer-title">${title}</div>
        <button class="btn-icon" onclick="closeDrawer()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="drawer-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="drawer-footer">${footerHtml}</div>` : ''}
    </div>
  `;

  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeDrawer();
  });

  document.body.appendChild(backdrop);
}

function closeDrawer() {
  const drawer = document.getElementById('active-drawer-backdrop');
  if (drawer) drawer.remove();
}

let _tunnelState = { active: false, url: null };

async function checkTunnelStatus() {
  try {
    const res = await fetch('/api/tunnel').then(r => r.json()).catch(() => ({ active: false }));
    _tunnelState = res || { active: false, url: null };
    updateTunnelBtnUI();
  } catch {}
}

function updateTunnelBtnUI() {
  const btn = document.getElementById('public-tunnel-btn');
  if (!btn) return;
  if (_tunnelState.active && _tunnelState.url) {
    btn.style.background = 'rgba(16,185,129,0.15)';
    btn.style.borderColor = 'rgba(16,185,129,0.4)';
    btn.style.color = '#10B981';
    btn.innerHTML = `<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> LIVE Tunnel</span>`;
  } else {
    btn.style.background = 'rgba(255,255,255,0.05)';
    btn.style.borderColor = 'rgba(255,255,255,0.1)';
    btn.style.color = 'var(--text-muted)';
    btn.innerHTML = `<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> Go Public (Internet)</span>`;
  }
}

async function openTunnelModal() {
  await checkTunnelStatus();

  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="padding:14px 16px; border-radius:8px; background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.22); font-size:12.5px; line-height:1.5; color:#E2E8F0;">
        <div style="font-weight:700; color:#38BDF8; margin-bottom:4px; font-size:13.5px; display:flex; align-items:center; gap:6px;">
          <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg> Global Remote Access</span>
        </div>
        <div>Turn on <strong>Instant Public Tunnel</strong> to get a secure HTTPS link. Use it in your Flutter mobile app, share it with friends, or access your database from anywhere on 4G/5G mobile data!</div>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px; padding:16px; border-radius:8px; background:#0E1015; border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div>
            <div style="font-weight:700; font-size:13px; color:#FFFFFF;">Public Cloudflare Tunnel</div>
            <div style="font-size:11.5px; color:var(--text-muted); margin-top:2px;">Status: <strong style="color:${_tunnelState.active ? '#10B981' : 'var(--text-dim)'};">${_tunnelState.active ? 'ONLINE & LIVE' : 'OFFLINE (Local Only)'}</strong></div>
          </div>
          <button id="toggle-tunnel-btn" class="btn ${_tunnelState.active ? 'btn-danger' : 'btn-primary'}" onclick="toggleTunnelAction()" style="font-weight:700; padding:6px 14px; font-size:12px;">
            ${_tunnelState.active ? 'Stop Public Link' : 'Turn ON Public Link'}
          </button>
        </div>

        ${_tunnelState.active && _tunnelState.url ? `
          <div style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Your Public MiniBase URL</label>
            <div style="display:flex; gap:6px;">
              <input type="text" class="input mono" readonly value="${_tunnelState.url}" style="font-size:12px; flex:1; color:#38BDF8; font-weight:600;" />
              <button class="btn btn-secondary" onclick="copyToClipboard('${_tunnelState.url}')" style="font-size:12px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy</button>
              <a href="${_tunnelState.url}/_/" target="_blank" class="btn btn-primary" style="font-size:12px;">Open ↗</a>
            </div>
            <div style="font-size:11.5px; color:#10B981; margin-top:2px;">
              ✓ Anyone on the internet or your Flutter app can connect to this URL.
            </div>
          </div>
        ` : `
          <div style="font-size:12px; color:var(--text-dim); margin-top:8px;">
            Currently only available at <code>http://localhost:8090</code>. Click above to make it public.
          </div>
        `}
      </div>
    </div>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
  `;

  openModal('Public Remote Link (Cloudflare Tunnel)', bodyHtml, footerHtml);
}

async function toggleTunnelAction() {
  const btn = document.getElementById('toggle-tunnel-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Processing...';
  }

  try {
    if (_tunnelState.active) {
      showToast('Stopping tunnel...', 'info');
      await window.api.stopTunnel();
      showToast('Tunnel stopped', 'info');
    } else {
      showToast('Starting secure Cloudflare tunnel...', 'info');
      await window.api.startTunnel();
      showToast('Public tunnel is LIVE!', 'success');
    }
    await checkTunnelStatus();
    openTunnelModal();
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = _tunnelState.active ? 'Stop Public Link' : 'Turn ON Public Link';
    }
  }
}

// Global escape listener to close modals & drawers
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
    closeDrawer();
  }
});

// App Initialization
async function initApp() {
  const hash = window.location.hash || '';

  if (hash.startsWith('#/confirm-password-reset')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const token = params.get('token');
    if (token) {
      renderConfirmPasswordResetView(token);
      return;
    }
  }

  if (hash === '#/forgot-password') {
    renderForgotPasswordView();
    return;
  }

  const hasAdminRes = await window.api.hasAdmin().catch(() => ({ hasAdmin: false }));

  if (!hasAdminRes.hasAdmin) {
    renderSetupView();
    return;
  }

  if (!window.api.isAuthenticated()) {
    renderLoginView();
    return;
  }

  renderAppLayout();
  checkTunnelStatus();
  await loadCollections();
  initRealtimeFeed();
}

window.addEventListener('hashchange', () => {
  const hash = window.location.hash || '';
  if (hash.startsWith('#/confirm-password-reset')) {
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const token = params.get('token');
    if (token) renderConfirmPasswordResetView(token);
  } else if (hash === '#/forgot-password') {
    renderForgotPasswordView();
  } else if (!window.api.isAuthenticated()) {
    renderLoginView();
  } else if (hash.startsWith('#/collections/')) {
    const colName = decodeURIComponent(hash.replace('#/collections/', '').split('?')[0].trim());
    if (state.activeCollection?.name !== colName && state.collections.some(c => c.name === colName)) {
      selectCollection(colName, false);
    }
  } else if (['#/realtime', '#/explorer', '#/logs', '#/settings'].includes(hash)) {
    const v = hash.replace('#/', '');
    if (state.view !== v) {
      switchView(v, false);
    }
  }
});

// Brand Wordmark (Pure Typography Logo - No Icons)
function getMiniBaseLogoText(size = 'sm') {
  if (size === 'lg') {
    return `<div class="brand-wordmark-lg"><span class="brand-part-mini">Mini</span><span class="brand-part-base">Base</span></div>`;
  }
  return `<span class="brand-wordmark"><span class="brand-part-mini">Mini</span><span class="brand-part-base">Base</span></span>`;
}

// Savage / Thug Corner Peeking Duck Mascot with Silky Smooth Animations
function getHaramiDuckSvg() {
  return `
    <div class="harami-duck-container">
      <div class="duck-speech-bubble" id="duck-speech">Deal with it. x}</div>
      <div class="duck-interactive-wrapper" id="duck-interactive-wrapper" onclick="triggerDuckDialogue()" title="Click me for savage advice!">
        <svg class="harami-duck" id="duck-mascot-svg" viewBox="0 0 120 120" overflow="visible" style="overflow: visible;" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gold-chain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FDE047" />
              <stop offset="50%" stop-color="#EAB308" />
              <stop offset="100%" stop-color="#CA8A04" />
            </linearGradient>
          </defs>

          <!-- Dynamic Animated Smoke Rings -->
          <g class="cigar-smoke-group">
            <circle cx="93" cy="60" r="3.5" class="smoke-p1" fill="rgba(226, 232, 240, 0.6)"/>
            <circle cx="96" cy="56" r="4.5" class="smoke-p2" fill="rgba(226, 232, 240, 0.45)"/>
            <circle cx="98" cy="52" r="5.5" class="smoke-p3" fill="rgba(226, 232, 240, 0.3)"/>
          </g>

          <!-- Animated Ear Steam (shoots out on rage!) -->
          <g class="duck-ear-steam ear-steam-left">
            <path d="M22 50 Q10 46 4 40" stroke="rgba(255, 255, 255, 0.9)" stroke-width="3" stroke-linecap="round" fill="none"/>
            <circle cx="3" cy="38" r="3.5" fill="rgba(255, 255, 255, 0.8)"/>
            <circle cx="8" cy="30" r="5" fill="rgba(255, 255, 255, 0.65)"/>
            <circle cx="2" cy="20" r="7" fill="rgba(255, 255, 255, 0.45)"/>
          </g>
          <g class="duck-ear-steam ear-steam-right">
            <path d="M90 50 Q102 46 108 40" stroke="rgba(255, 255, 255, 0.9)" stroke-width="3" stroke-linecap="round" fill="none"/>
            <circle cx="109" cy="38" r="3.5" fill="rgba(255, 255, 255, 0.8)"/>
            <circle cx="104" cy="30" r="5" fill="rgba(255, 255, 255, 0.65)"/>
            <circle cx="110" cy="20" r="7" fill="rgba(255, 255, 255, 0.45)"/>
          </g>

          <!-- Backward Cap / Bandana (Savage Style) -->
          <path d="M26 42 C30 24, 76 22, 88 38 C76 34, 38 34, 26 42 Z" fill="#EF4444"/>
          <path d="M84 34 C94 32, 104 38, 100 42 C92 44, 84 38, 84 34 Z" fill="#DC2626"/>

          <!-- Duck Body / Head Skin -->
          <circle cx="56" cy="56" r="34" class="duck-head-skin" fill="#FBBF24" stroke="#D97706" stroke-width="2.5"/>

          <!-- Gold Chain with Shimmer -->
          <path d="M38 78 C48 90, 68 90, 78 78" class="gold-chain-path" stroke="url(#gold-chain)" stroke-width="4.5" stroke-linecap="round"/>
          <circle cx="58" cy="85" r="4" fill="#FACC15" stroke="#CA8A04" stroke-width="1.5"/>

          <!-- Confident / Savage Eyebrows -->
          <g class="duck-eyebrows">
            <path d="M35 44 C39 40, 48 42, 51 46" stroke="#B45309" stroke-width="2.2" stroke-linecap="round" fill="none"/>
            <path d="M61 46 C64 42, 73 40, 77 44" stroke="#B45309" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          </g>

          <!-- Duck Eyes (Visible & Peeking when shades lift!) -->
          <!-- Left Eye -->
          <g class="duck-eye-left">
            <ellipse cx="43" cy="52" rx="6.5" ry="7.5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
            <ellipse cx="45" cy="52" rx="3.5" ry="4.5" class="duck-pupil duck-pupil-left" fill="#0F172A"/>
            <circle cx="46.5" cy="50" r="1.5" class="duck-glint duck-glint-left" fill="#FFFFFF"/>
          </g>

          <!-- Right Eye -->
          <g class="duck-eye-right">
            <ellipse cx="69" cy="52" rx="6.5" ry="7.5" fill="#FFFFFF" stroke="#000000" stroke-width="1.2"/>
            <ellipse cx="71" cy="52" rx="3.5" ry="4.5" class="duck-pupil duck-pupil-right" fill="#0F172A"/>
            <circle cx="72.5" cy="50" r="1.5" class="duck-glint duck-glint-right" fill="#FFFFFF"/>
          </g>

          <!-- Savage Duck Beak with Hinging Lower Jaw -->
          <g class="duck-beak-group">
            <!-- Open Inside Mouth (Reveals when lower jaw drops in anger!) -->
            <g class="duck-mouth-inside">
              <path d="M47 65 C58 66, 72 66, 75 63 C77 72, 68 80, 56 79 C48 78, 45 71, 47 65 Z" fill="#7F1D1D" stroke="#991B1B" stroke-width="1.2"/>
              <ellipse cx="58" cy="73" rx="6" ry="3.5" fill="#EF4444"/>
            </g>

            <!-- Upper Beak Bill (Firmly anchored below sunglasses) -->
            <path d="M44 62 C44 62, 58 58, 76 64 C78 69, 70 71, 56 70 C46 69, 42 66, 44 62 Z" class="duck-upper-bill" fill="#FB923C" stroke="#C2410C" stroke-width="2" stroke-linejoin="round"/>
            <path d="M47 66 C56 69, 72 69, 75 66" class="duck-smirk-line" stroke="#9A3412" stroke-width="1.8" stroke-linecap="round"/>

            <!-- Lower Jaw Bill (Hinges & drops down during yelling rage!) -->
            <path d="M45 66 C56 70, 72 70, 75 65 C77 74, 69 79, 56 78 C46 77, 43 71, 45 66 Z" class="duck-lower-bill" fill="#F97316" stroke="#C2410C" stroke-width="2" stroke-linejoin="round"/>
          </g>

          <!-- Thug Life Shades with Drop-Down Meme Animation -->
          <g class="thug-shades-group">
            <!-- Left Lens -->
            <polygon points="32,46 54,46 51,60 35,60" fill="#09090B" stroke="#000000" stroke-width="1.5"/>
            <line x1="36" y1="49" x2="48" y2="49" class="shades-glint" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
            
            <!-- Bridge -->
            <rect x="52" y="49" width="6" height="3" fill="#09090B"/>
            
            <!-- Right Lens -->
            <polygon points="58,46 80,46 77,60 61,60" fill="#09090B" stroke="#000000" stroke-width="1.5"/>
            <line x1="62" y1="49" x2="74" y2="49" class="shades-glint" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
            
            <!-- Frame Temples -->
            <line x1="32" y1="48" x2="22" y2="52" stroke="#09090B" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="80" y1="48" x2="90" y2="52" stroke="#09090B" stroke-width="2.5" stroke-linecap="round"/>
          </g>

          <!-- Lit Cigar in Beak (Drops down in shock/rage!) -->
          <g class="cigar-group">
            <rect x="70" y="65" width="22" height="5.5" rx="1.5" transform="rotate(-15 70 65)" fill="#78350F" stroke="#451A03" stroke-width="1"/>
            <rect x="70" y="65" width="4" height="5.5" rx="0.5" transform="rotate(-15 70 65)" fill="#EAB308"/>
            <!-- Pulsating Burning Ember Tip -->
            <rect x="88" y="60.2" width="3.5" height="5.5" rx="0.5" transform="rotate(-15 70 65)" class="cigar-ember" fill="#EF4444"/>
            <circle cx="91" cy="65.5" r="2" class="cigar-ember" fill="#F97316"/>
          </g>

          <!-- Left Peeking Wing tapping on card -->
          <ellipse cx="28" cy="84" rx="11" ry="7" class="wing-left" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
          
          <!-- Right Peeking Wing with Held Cigar for Reloading from Behind Back -->
          <g class="wing-right-group">
            <g class="held-fresh-cigar">
              <rect x="76" y="80" width="22" height="5.5" rx="1.5" transform="rotate(-35 76 80)" fill="#78350F" stroke="#451A03" stroke-width="1"/>
              <rect x="76" y="80" width="4.5" height="5.5" rx="0.5" transform="rotate(-35 76 80)" fill="#EAB308"/>
              <rect x="94" y="75" width="3.5" height="5.5" rx="0.5" transform="rotate(-35 76 80)" fill="#991B1B"/>
            </g>
            <ellipse cx="86" cy="84" rx="11" ry="7" class="wing-right" fill="#F59E0B" stroke="#B45309" stroke-width="2"/>
          </g>
        </svg>
      </div>
    </div>
  `;
}

const duckQuotes = [
  "Deal with it. 😎",
  "Quack quack, backend rocks! 🦆",
  "SELECT * FROM talent WHERE name = 'you' 🎯",
  "Backend is love, frontend is pain 💔",
  "Drop your tables, not your standards 💀",
  "REST in peace, GraphQL is here 🪦",
  "Migrate your schemas, not your excuses 🚀",
  "I'm watching your queries... always 👁️",
  "MiniBase: Lightweight. Fast. Zero bloat. ⚡",
  "Security tip: '12345678' is not a password 👮‍♂️",
  "Your data is safe with me... probably 🕵️",
  "Drink coffee, push code, repeat ☕"
];
let duckQuoteIdx = 0;
let _duckAutoInterval = null;

// Real bubble burst  tons of drops spraying everywhere
function burstBubble(speech) {
  const container = speech.parentElement;

  // cleanup old
  container.querySelectorAll('.bubble-shard, .bubble-drop').forEach(e => e.remove());

  const cx = speech.offsetLeft + speech.offsetWidth / 2;
  const cy = speech.offsetTop + speech.offsetHeight / 2;

  // Layer 1: 14 bigger shards (broken bubble film pieces)
  for (let i = 0; i < 14; i++) {
    const shard = document.createElement('div');
    shard.className = 'bubble-shard';
    const size = 5 + Math.random() * 8;
    const angle = (i / 14) * 360 + (Math.random() * 20 - 10);
    const dist = 32 + Math.random() * 40;
    const rad = angle * Math.PI / 180;
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist;
    const rot = Math.random() * 500 - 250;
    const dur = 0.32 + Math.random() * 0.25;
    shard.style.cssText = `
      width:${size}px; height:${size * 0.55}px;
      left:${cx - size/2}px; top:${cy - size * 0.3}px;
      --tx:${tx}px; --ty:${ty}px; --rot:${rot}deg; --dur:${dur}s;
    `;
    container.appendChild(shard);
  }

  // Layer 2: 32 high-velocity water droplets spraying in 360 degrees
  for (let i = 0; i < 32; i++) {
    const drop = document.createElement('div');
    drop.className = 'bubble-drop';
    const size = 3 + Math.random() * 4.5;
    const angle = Math.random() * 360;
    const dist = 24 + Math.random() * 65;
    const rad = angle * Math.PI / 180;
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist + (10 + Math.random() * 22); // gravity pull down
    const dur = 0.35 + Math.random() * 0.4;
    const delay = Math.random() * 0.05;
    drop.style.cssText = `
      width:${size}px; height:${size}px;
      left:${cx - size/2}px; top:${cy - size/2}px;
      --tx:${tx}px; --ty:${ty}px; --dur:${dur}s; --delay:${delay}s;
    `;
    container.appendChild(drop);
  }

  // Layer 3: 20 tiny micro-mist water droplets (fine air spray)
  for (let i = 0; i < 20; i++) {
    const drop = document.createElement('div');
    drop.className = 'bubble-drop';
    const size = 1.5 + Math.random() * 2.2;
    const angle = Math.random() * 360;
    const dist = 35 + Math.random() * 85;
    const rad = angle * Math.PI / 180;
    const tx = Math.cos(rad) * dist;
    const ty = Math.sin(rad) * dist + (14 + Math.random() * 28);
    const dur = 0.4 + Math.random() * 0.45;
    const delay = Math.random() * 0.08;
    drop.style.cssText = `
      width:${size}px; height:${size}px;
      left:${cx - size/2}px; top:${cy - size/2}px;
      --tx:${tx}px; --ty:${ty}px; --dur:${dur}s; --delay:${delay}s;
      opacity: 0.85;
    `;
    container.appendChild(drop);
  }

  // cleanup
  setTimeout(() => {
    container.querySelectorAll('.bubble-shard, .bubble-drop').forEach(e => e.remove());
  }, 900);
}

// Show a thought bubble with next quote
function showDuckThought() {
  const speech = document.getElementById('duck-speech');
  const wrapper = document.getElementById('duck-interactive-wrapper');
  if (!speech || !speech.classList) return;

  // Don't overwrite if duck is currently showing a roast or in rage mode
  if (speech.classList.contains('roast-mode') || window._isDuckRaging) return;

  // pick next quote
  duckQuoteIdx = (duckQuoteIdx + 1) % duckQuotes.length;
  speech.innerText = duckQuotes[duckQuoteIdx];

  // ALWAYS remove roast-mode and old classes to ensure normal dark theme
  speech.classList.remove('show', 'bursting', 'roast-mode');
  void speech.offsetWidth;
  speech.classList.add('show');

  // thinking head tilt
  if (wrapper) {
    wrapper.classList.add('duck-thinking');
    setTimeout(() => wrapper.classList.remove('duck-thinking'), 500);
  }

  // after 7s   real bubble burst (plenty of time to read)
  clearTimeout(window._duckHideTimer);
  window._duckHideTimer = setTimeout(() => {
    speech.classList.remove('show', 'roast-mode');
    speech.classList.add('bursting');
    burstBubble(speech);
  }, 7000);
}

// Click triggers immediate nod + quote
function triggerDuckDialogue() {
  const wrapper = document.getElementById('duck-interactive-wrapper');
  const speech = document.getElementById('duck-speech');

  if (speech) {
    speech.classList.remove('roast-mode');
  }

  if (wrapper) {
    wrapper.classList.remove('duck-rage');
    wrapper.classList.add('duck-spinning');
    setTimeout(() => wrapper.classList.remove('duck-spinning'), 500);
  }

  showDuckThought();

  // Reset auto-cycle timer so it doesn't overlap
  resetDuckAutoAdvice();
}

// Auto-cycling: show a thought every 12 seconds
function startDuckAutoAdvice(initialDelay = 3500) {
  stopDuckAutoAdvice();
  window._duckFirstTimeout = setTimeout(() => {
    showDuckThought();
    _duckAutoInterval = setInterval(showDuckThought, 12000);
  }, initialDelay);
}

function stopDuckAutoAdvice() {
  clearTimeout(window._duckFirstTimeout);
  clearInterval(_duckAutoInterval);
  _duckAutoInterval = null;
}

function resetDuckAutoAdvice(delay = 3500) {
  stopDuckAutoAdvice();
  startDuckAutoAdvice(delay);
}

function updateDuckEyeTracking(input) {
  const len = (input && input.value) ? input.value.length : 0;
  // Normalized typing progress over 20 characters
  const progress = Math.min(len, 20) / 20;
  
  // Aim gaze directly DOWN-LEFT towards the password input on the card
  const eyeX = -2.8 + progress * 2.2; // from -2.8px (start of input) to -0.6px (as text fills right)
  const eyeY = 3.2 + (len > 0 ? (len % 2 === 0 ? 0.25 : -0.25) : 0); // looking down into the password field

  const duckSvg = document.getElementById('duck-mascot-svg');
  if (!duckSvg) return;

  const leftPupil = duckSvg.querySelector('.duck-pupil-left');
  const leftGlint = duckSvg.querySelector('.duck-glint-left');
  const rightPupil = duckSvg.querySelector('.duck-pupil-right');
  const rightGlint = duckSvg.querySelector('.duck-glint-right');

  const transformVal = `translate(${eyeX.toFixed(2)}px, ${eyeY.toFixed(2)}px)`;
  if (leftPupil) leftPupil.style.transform = transformVal;
  if (leftGlint) leftGlint.style.transform = transformVal;
  if (rightPupil) rightPupil.style.transform = transformVal;
  if (rightGlint) rightGlint.style.transform = transformVal;
}

function resetDuckEyes() {
  const duckSvg = document.getElementById('duck-mascot-svg');
  if (!duckSvg) return;

  const leftPupil = duckSvg.querySelector('.duck-pupil-left');
  const leftGlint = duckSvg.querySelector('.duck-glint-left');
  const rightPupil = duckSvg.querySelector('.duck-pupil-right');
  const rightGlint = duckSvg.querySelector('.duck-glint-right');

  [leftPupil, leftGlint, rightPupil, rightGlint].forEach(el => {
    if (el) el.style.transform = 'translate(0, 0)';
  });
}

function bindDuckInteractions() {
  const wrapper = document.getElementById('duck-interactive-wrapper');
  const speech = document.getElementById('duck-speech');
  if (!wrapper) return;

  const emailInput = document.querySelector('input[type="email"]');
  const passInputs = document.querySelectorAll('input[type="password"]');

  if (emailInput) {
    emailInput.addEventListener('focus', () => {
      if (window._isDuckRaging) return;
      wrapper.classList.add('duck-watching');
      wrapper.classList.remove('duck-suspicious');
      resetDuckEyes();
    });
    emailInput.addEventListener('blur', () => {
      wrapper.classList.remove('duck-watching');
    });
  }

  passInputs.forEach(passInput => {
    passInput.addEventListener('focus', () => {
      if (window._isDuckRaging) return;
      wrapper.classList.add('duck-suspicious');
      wrapper.classList.remove('duck-watching');
      updateDuckEyeTracking(passInput);
    });

    passInput.addEventListener('input', () => {
      if (window._isDuckRaging) return;
      wrapper.classList.add('duck-suspicious');
      updateDuckEyeTracking(passInput);
    });

    passInput.addEventListener('keyup', () => {
      if (window._isDuckRaging) return;
      updateDuckEyeTracking(passInput);
    });

    passInput.addEventListener('blur', () => {
      wrapper.classList.remove('duck-suspicious');
      resetDuckEyes();
    });
  });

  // Start auto advice cycle
  startDuckAutoAdvice();
}

const duckRoastQuotes = [
  "Who's gonna type the password, your ghost? 🤬",
  "You thought you could sneak in with just an email? Clown! 🤡",
  "Password field is empty, genius. Fill it! 💀",
  "Are you trying to login with telepathy? Type the password! 🤦‍♂️",
  "Zero password = Zero access. What did you expect? 😂",
  "Nice try, script kiddie. Enter your password! 🦆",
  "Is the password classified top secret from you too? 🕵️‍♂️",
  "Blank password? What is this, a public WiFi router? 🪦",
  "Knock knock! Who's there? NOT YOU without a password! 🚪",
  "Did your cat step on the enter key? Type the password! 🐱",
  "Forgot your password already? Goldfish memory strikes again! 🐠"
];
let duckRoastIdx = 0;

const duckEmailRoastQuotes = [
  "Enter an email first, Einstein! 🤦‍♂️",
  "Logging in with only a password? Who are you, anonymous? 🤡",
  "Password without email? Am I supposed to guess your identity? 🕵️‍♂️",
  "Email field is empty, genius. Fill it up! 💀",
  "Password alone won't get you anywhere, detective! 🦆"
];
let duckEmailRoastIdx = 0;

const duckEmptyFormRoastQuotes = [
  "Submitting an empty form? Are you serious?! 🤦‍♂️",
  "Air doesn't have login credentials, my friend! 💨",
  "Did you forget your hands at home? Type something! ⌨️",
  "An empty form? Wow, what a revolutionary hack! 🤡",
  "Even JavaScript is embarrassed by this empty submission! 💀",
  "404: Brain not found. Fill the form first! 🧠",
  "Ghost login detected! Fill in your details! 👻",
  "You pressed submit hoping for magic? Type credentials! 🦆"
];
let duckEmptyFormRoastIdx = 0;

function roastDuckUser(customMsg) {
  const speech = document.getElementById('duck-speech');
  const wrapper = document.getElementById('duck-interactive-wrapper');
  const duckSvg = document.getElementById('duck-mascot-svg');
  const card = document.querySelector('.auth-wrapper .card');
  if (!speech) return;

  // Stop regular auto cycle so it never interrupts the roast
  stopDuckAutoAdvice();

  const msg = customMsg || duckRoastQuotes[duckRoastIdx % duckRoastQuotes.length];
  duckRoastIdx++;

  speech.innerText = msg;
  speech.classList.remove('show', 'bursting');
  speech.classList.add('roast-mode');
  void speech.offsetWidth;
  speech.classList.add('show');

  // 1. Trigger Duck Rage (boiling red face + ear steam) & hide cigar in mouth as it drops
  if (wrapper) {
    window._isDuckRaging = true;
    wrapper.classList.remove('duck-watching', 'duck-suspicious', 'duck-thinking', 'duck-pulling-cigar', 'duck-rage');
    void wrapper.offsetWidth;
    wrapper.classList.add('duck-rage');

    if (duckSvg) {
      const mouthCigar = duckSvg.querySelector('.cigar-group');
      const mouthSmoke = duckSvg.querySelector('.cigar-smoke-group');
      if (mouthCigar) mouthCigar.style.opacity = '0';
      if (mouthSmoke) mouthSmoke.style.opacity = '0';
    }

    clearTimeout(window._duckRageTimer);
    window._duckRageTimer = setTimeout(() => {
      window._isDuckRaging = false;
      wrapper.classList.remove('duck-rage');

      // 2. Duck calms down -> reaches behind back, pulls out brand new cigar & lights it!
      wrapper.classList.add('duck-pulling-cigar');
      if (duckSvg) {
        const mouthCigar = duckSvg.querySelector('.cigar-group');
        const mouthSmoke = duckSvg.querySelector('.cigar-smoke-group');
        if (mouthCigar) mouthCigar.style.opacity = '1';
        if (mouthSmoke) {
          setTimeout(() => { mouthSmoke.style.opacity = '1'; }, 1050);
        }
      }

      setTimeout(() => {
        wrapper.classList.remove('duck-pulling-cigar');
      }, 1250);

      // Clean up fallen cigar butt on the button smoothly
      if (card) {
        const droppedCigar = card.querySelector('.dropped-cigar-prop');
        const droppedSmoke = card.querySelector('.dropped-cigar-smoke');
        if (droppedCigar) {
          droppedCigar.style.transition = 'opacity 0.6s ease';
          droppedCigar.style.opacity = '0';
          setTimeout(() => droppedCigar.remove(), 600);
        }
        if (droppedSmoke) {
          droppedSmoke.style.transition = 'opacity 0.6s ease';
          droppedSmoke.style.opacity = '0';
          setTimeout(() => droppedSmoke.remove(), 600);
        }
      }
    }, 1800);
  }

  // 3. Physically spawn the falling cigar prop that tumbles down and lands on the submit button!
  if (card) {
    card.querySelectorAll('.dropped-cigar-prop, .dropped-cigar-smoke').forEach(e => e.remove());
    const prop = document.createElement('div');
    prop.className = 'dropped-cigar-prop';
    card.appendChild(prop);

    // After 850ms landing on the button, puff a tiny rising smoke
    setTimeout(() => {
      if (document.body.contains(prop)) {
        const smoke = document.createElement('div');
        smoke.className = 'dropped-cigar-smoke';
        smoke.style.cssText = 'top: 290px; right: 175px;';
        card.appendChild(smoke);
      }
    }, 850);
  }

  // Roast stays clearly visible for 8 full seconds so user has abundant time to read
  clearTimeout(window._duckHideTimer);
  window._duckHideTimer = setTimeout(() => {
    speech.classList.remove('show');
    speech.classList.add('bursting');
    burstBubble(speech);
    speech.classList.remove('roast-mode');

    // Resume regular peaceful auto thoughts 5 seconds AFTER the roast finishes
    startDuckAutoAdvice(5000);
  }, 8000);
}

// 1. Setup Initial Admin View
function renderSetupView() {
  document.getElementById('app').innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-glow"></div>
      <div class="card" style="width:420px; position:relative; z-index:10; border-color:rgba(255, 255, 255, 0.12);">
        ${getHaramiDuckSvg()}
        <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle); text-align:center;">
          ${getMiniBaseLogoText('lg')}
          <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">Create super-admin credentials to initialize database</p>
        </div>
        <form id="setup-form" style="display:flex; flex-direction:column; gap:16px;" novalidate>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Super-Admin Email</label>
            <input type="email" id="setup-email" class="input" placeholder="admin@example.com" autofocus />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Password</label>
            <input type="password" id="setup-password" class="input" placeholder="Minimum 8 characters" minlength="8" />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Confirm Password</label>
            <input type="password" id="setup-password-confirm" class="input" placeholder="Repeat password" minlength="8" />
          </div>
          <button type="submit" class="btn btn-primary" style="margin-top:8px; padding:10px 16px; font-size:14px;">
            Create Admin & Launch MiniBase
          </button>
        </form>
      </div>
    </div>
  `;

  bindDuckInteractions();

  document.getElementById('setup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('setup-email').value.trim();
    const pass = document.getElementById('setup-password').value;
    const confirm = document.getElementById('setup-password-confirm').value;

    if (!email && !pass) {
      const emptyRoast = duckEmptyFormRoastQuotes[duckEmptyFormRoastIdx % duckEmptyFormRoastQuotes.length];
      duckEmptyFormRoastIdx++;
      roastDuckUser(emptyRoast);
      document.getElementById('setup-email').focus();
      return;
    }

    if (!email) {
      const emailRoast = duckEmailRoastQuotes[duckEmailRoastIdx % duckEmailRoastQuotes.length];
      duckEmailRoastIdx++;
      roastDuckUser(emailRoast);
      document.getElementById('setup-email').focus();
      return;
    }
    if (!pass) {
      roastDuckUser("Who's gonna type the password?! x");
      document.getElementById('setup-password').focus();
      return;
    }
    if (pass.length < 8) {
      roastDuckUser("Less than 8 chars? You want to get hacked? x");
      document.getElementById('setup-password').focus();
      return;
    }
    if (pass !== confirm) {
      roastDuckUser("Passwords don't match! Check your eyes x");
      document.getElementById('setup-password-confirm').focus();
      return;
    }

    try {
      await window.api.setup(email, pass);
      showToast('Admin account created! Launching MiniBase...', 'success');
      setTimeout(() => initApp(), 500);
    } catch (err) {
      roastDuckUser(err.message);
    }
  });
}

// 2. Login View
function renderLoginView() {
  document.getElementById('app').innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-glow"></div>
      <div class="card" style="width:400px; position:relative; z-index:10; border-color:rgba(255, 255, 255, 0.12);">
        ${getHaramiDuckSvg()}
        <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle); text-align:center;">
          ${getMiniBaseLogoText('lg')}
          <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">Sign in to admin management studio</p>
        </div>
        <form id="login-form" style="display:flex; flex-direction:column; gap:16px;" novalidate>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Email Address</label>
            <input type="email" id="login-email" class="input" placeholder="admin@example.com" autofocus />
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="form-label" style="margin-bottom:0;">Password</label>
              <a href="#/forgot-password" style="font-size:12px; color:#38BDF8; text-decoration:none; font-weight:500; transition:color 0.15s ease;">Forgot password?</a>
            </div>
            <input type="password" id="login-password" class="input" placeholder="⬢⬢⬢⬢⬢⬢⬢⬢" />
          </div>
          <button type="submit" class="btn btn-primary" style="margin-top:8px; padding:10px 16px; font-size:14px;">
            Sign In to Studio
          </button>
        </form>
      </div>
    </div>
  `;

  bindDuckInteractions();

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;

    if (!email && !pass) {
      const emptyRoast = duckEmptyFormRoastQuotes[duckEmptyFormRoastIdx % duckEmptyFormRoastQuotes.length];
      duckEmptyFormRoastIdx++;
      roastDuckUser(emptyRoast);
      document.getElementById('login-email').focus();
      return;
    }

    if (!email) {
      const emailRoast = duckEmailRoastQuotes[duckEmailRoastIdx % duckEmailRoastQuotes.length];
      duckEmailRoastIdx++;
      roastDuckUser(emailRoast);
      document.getElementById('login-email').focus();
      return;
    }

    if (!pass) {
      roastDuckUser(); // triggers savage password roasts
      document.getElementById('login-password').focus();
      return;
    }

    try {
      await window.api.login(email, pass);
      showToast('Logged in successfully', 'success');
      setTimeout(() => initApp(), 400);
    } catch (err) {
      roastDuckUser(err.message || 'Invalid credentials. Nice try, hacker! x');
    }
  });
}

// 2.1 Forgot Password View
function renderForgotPasswordView() {
  document.getElementById('app').innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-glow"></div>
      <div class="card" style="width:400px; position:relative; z-index:10; border-color:rgba(255, 255, 255, 0.12);">
        ${getHaramiDuckSvg()}
        <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle); text-align:center;">
          ${getMiniBaseLogoText('lg')}
          <p style="font-size:13px; color:var(--text-muted); margin-top:8px;">Reset your admin password</p>
        </div>
        <form id="forgot-form" style="display:flex; flex-direction:column; gap:16px;" novalidate>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label">Admin Email Address</label>
            <input type="email" id="forgot-email" class="input" placeholder="admin@example.com" autofocus />
          </div>
          <button type="submit" id="forgot-submit-btn" class="btn btn-primary" style="margin-top:4px; padding:10px 16px; font-size:14px;">
            Send Reset Link
          </button>
          <div id="reset-result-box" style="display:none; padding:12px; border-radius:8px; background:rgba(16, 185, 129, 0.08); border:1px solid rgba(16, 185, 129, 0.25); font-size:12px; line-height:1.5; color:#E2E8F0;">
          </div>
          <div style="display:flex; justify-content:center; margin-top:4px;">
            <a href="javascript:void(0)" onclick="window.location.hash=''; renderLoginView();" style="font-size:12.5px; color:var(--text-muted); text-decoration:none;">← Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `;

  bindDuckInteractions();

  document.getElementById('confirm-reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = document.getElementById('reset-password').value;
    const confirm = document.getElementById('reset-password-confirm').value;

    if (!pass) {
      roastDuckUser("Enter a new password! 🔒");
      document.getElementById('reset-password').focus();
      return;
    }
    if (pass.length < 8) {
      roastDuckUser("Password must be at least 8 characters! ⚠️");
      document.getElementById('reset-password').focus();
      return;
    }
    if (pass !== confirm) {
      roastDuckUser("Passwords don't match! Double check. 👀");
      document.getElementById('reset-password-confirm').focus();
      return;
    }

    const btn = document.getElementById('confirm-reset-btn');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
      await window.api.confirmPasswordReset(token, pass, confirm);
      showToast('Password updated successfully! Please sign in.', 'success');
      window.location.hash = '';
      setTimeout(() => renderLoginView(), 600);
    } catch (err) {
      roastDuckUser(err.message);
      btn.disabled = false;
      btn.textContent = 'Update Password & Sign In';
    }
  });
}

// 3. Main App Layout
function toggleSidebar() {
  const app = document.getElementById('app');
  if (!app) return;
  const isCollapsed = app.classList.toggle('sidebar-collapsed');
  localStorage.setItem('minibase_sidebar_collapsed', isCollapsed ? '1' : '0');
}

function renderAppLayout() {
  const app = document.getElementById('app');
  if (!app) return;

  if (localStorage.getItem('minibase_sidebar_collapsed') === '1') {
    app.classList.add('sidebar-collapsed');
  }

  app.innerHTML = `
    <!-- DevTools Studio Sidebar -->
    <aside class="sidebar">
      <div class="brand-header">
        <div class="brand-logo">
          ${getMiniBaseLogoText('sm')}
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <div class="status-badge">
            <span>v1.0</span>
          </div>
          <button class="btn-icon" onclick="toggleSidebar()" title="Collapse Menu (Ctrl+B)" style="width:24px; height:24px; color:var(--text-dim);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Quick Table Filter -->
      <div class="sidebar-search-box">
        <div style="position:relative; display:flex; align-items:center;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute; left:8px; color:var(--text-dim); pointer-events:none;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="sidebar-table-filter" class="sidebar-search-input" placeholder="Filter tables..." oninput="handleSidebarFilter(this.value)" />
        </div>
      </div>

      <div class="sidebar-scroll">
        <div class="sidebar-section-title">
          <span>Collections</span>
          <button class="btn-icon" onclick="openCollectionModal()" title="New Collection" style="width:20px; height:20px; color:var(--brand-primary);">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <div id="sidebar-collections-list" style="display:flex; flex-direction:column; gap:1px;">
          <!-- Collections dynamic list -->
        </div>

        <div class="sidebar-section-title" style="margin-top:12px;">
          <span>System & Engine</span>
        </div>

        <button class="sidebar-nav-btn ${state.view === 'admins' ? 'active' : ''}" onclick="openAdminsModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <span>_admins</span>
          <span class="count-badge">system</span>
        </button>

        <div class="sidebar-section-title" style="margin-top:12px;">
          <span>Developer Tools</span>
        </div>

        <button class="sidebar-nav-btn ${state.view === 'explorer' ? 'active' : ''}" onclick="switchView('explorer')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
          <span>API & SDKs</span>
        </button>

        <button class="sidebar-nav-btn ${state.view === 'realtime' ? 'active' : ''}" onclick="switchView('realtime')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <span>Live Stream</span>
        </button>

        <button class="sidebar-nav-btn ${state.view === 'logs' ? 'active' : ''}" onclick="switchView('logs')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
          <span>Request Logs</span>
        </button>

        <button class="sidebar-nav-btn ${state.view === 'settings' ? 'active' : ''}" onclick="switchView('settings')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>Project Settings</span>
        </button>
      </div>

      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar">${(window.api.admin?.email || 'A')[0].toUpperCase()}</div>
          <div class="user-info">
            <div class="user-email">${escapeHtml(window.api.admin?.email || 'Admin')}</div>
            <div class="user-role">Super Admin</div>
          </div>
        </div>
        <button class="btn-icon" onclick="logoutAdmin()" title="Sign Out">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
    </aside>

    <!-- Main View -->
    <main class="main-view">
      <div class="topbar">
        <div class="topbar-left" style="display:flex; align-items:center; gap:10px;">
          <button id="sidebar-toggle-btn" class="btn-icon" onclick="toggleSidebar()" title="Toggle Menu (Ctrl+B)" style="color:var(--text-muted); width:28px; height:28px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <div id="topbar-title-section" class="topbar-title">Dashboard</div>
          <button id="public-tunnel-btn" class="btn btn-sm" onclick="openTunnelModal()" style="display:inline-flex; align-items:center; gap:6px; font-size:11.5px; padding:4px 10px; border-radius:12px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); color:#38BDF8; font-weight:600;">
            <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> Public Link</span>
          </button>
        </div>
        <div class="topbar-right" id="topbar-actions">
          <!-- Dynamic Topbar Actions -->
        </div>
      </div>

      <div class="content-area" id="content-view">
        <!-- Main dynamic content -->
      </div>
    </main>
  `;
}

function handleSidebarFilter(query) {
  const q = (query || '').toLowerCase().trim();
  const rows = document.querySelectorAll('.sidebar-col-row');
  rows.forEach(r => {
    const text = r.textContent.toLowerCase();
    r.style.display = (!q || text.includes(q)) ? 'flex' : 'none';
  });
}


function logoutAdmin() {
  window.api.clearAuth();
  showToast('Signed out', 'info');
  setTimeout(() => initApp(), 300);
}

// 4. Load Collections List
async function loadCollections() {
  try {
    const res = await window.api.getCollections();
    state.collections = res.items || [];

    renderSidebarCollections();

    // Check URL Hash first or localStorage
    const hash = window.location.hash || '';
    let targetColName = null;
    let targetView = null;

    if (hash.startsWith('#/collections/')) {
      targetColName = decodeURIComponent(hash.replace('#/collections/', '').split('?')[0].trim());
    } else if (['#/realtime', '#/explorer', '#/logs', '#/settings'].includes(hash)) {
      targetView = hash.replace('#/', '');
    } else {
      // Check localStorage
      const savedCol = localStorage.getItem('minibase_active_col');
      const savedView = localStorage.getItem('minibase_view');
      if (savedView && ['realtime', 'explorer', 'logs', 'settings'].includes(savedView)) {
        targetView = savedView;
      } else if (savedCol && state.collections.some(c => c.name === savedCol)) {
        targetColName = savedCol;
      }
    }

    if (targetView) {
      switchView(targetView);
    } else if (targetColName && state.collections.some(c => c.name === targetColName)) {
      selectCollection(targetColName);
    } else if (state.collections.length > 0) {
      selectCollection(state.collections[0].name);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderSidebarCollections() {
  const container = document.getElementById('sidebar-collections-list');
  if (!container) return;

  if (state.collections.length === 0) {
    container.innerHTML = `
      <div style="padding:16px 10px; text-align:center; color:var(--text-muted); font-size:12px;">
        No tables yet — let's create one!
        <div style="margin-top:8px;">
          <button class="btn btn-primary" style="padding:4px 10px; font-size:11px;" onclick="openCollectionModal()">+ New Table</button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = state.collections
    .map(c => `
      <div style="display:flex; align-items:center; gap:0; position:relative;" class="sidebar-col-row">
        <button class="sidebar-nav-btn ${state.view === 'records' && state.activeCollection?.name === c.name ? 'active' : ''}" onclick="selectCollection('${c.name}')" style="flex:1; min-width:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${c.type === 'auth' ? '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' : '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>'}
          </svg>
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(c.name)}</span>
          <span class="col-type-tag tag-${c.type}">${c.type}</span>
        </button>
        <button class="btn-icon sidebar-del-btn" onclick="event.stopPropagation(); deleteCollectionAction('${c.name}')" title="Delete Table" style="width:24px; height:24px; flex-shrink:0; color:var(--text-dim); opacity:0; transition:opacity 0.15s ease;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `)
    .join('');
}

function selectCollection(name, updateUrl = true) {
  const col = state.collections.find(c => c.name === name);
  if (!col) return;

  state.activeCollection = col;
  state.view = 'records';
  state.page = 1;
  state.searchQuery = '';
  state.filterQuery = '';

  localStorage.setItem('minibase_active_col', name);
  localStorage.setItem('minibase_view', 'records');

  if (updateUrl && window.location.hash !== `#/collections/${encodeURIComponent(name)}`) {
    window.location.hash = `#/collections/${encodeURIComponent(name)}`;
  }

  renderSidebarCollections();
  renderTopBar();
  loadRecords();
}

function switchView(viewName, updateUrl = true) {
  state.view = viewName;
  localStorage.setItem('minibase_view', viewName);

  if (updateUrl && window.location.hash !== `#/${viewName}`) {
    window.location.hash = `#/${viewName}`;
  }

  renderSidebarCollections();
  renderTopBar();

  if (viewName === 'realtime') renderRealtimeView();
  else if (viewName === 'explorer') renderExplorerView();
  else if (viewName === 'logs') loadLogsView();
  else if (viewName === 'settings') loadSettingsView();
}

function renderTopBar() {
  const titleSection = document.getElementById('topbar-title-section');
  const actionsSection = document.getElementById('topbar-actions');
  if (!titleSection || !actionsSection) return;

  if (state.view === 'records' && state.activeCollection) {
    titleSection.innerHTML = `
      <span>${escapeHtml(state.activeCollection.name)}</span>
      <span class="col-type-tag tag-${state.activeCollection.type}">${state.activeCollection.type}</span>
      <span style="font-size:12px; font-weight:400; color:var(--text-muted); font-family:var(--font-mono);">(${state.totalItems} rows)</span>
    `;

    actionsSection.innerHTML = `
      <button class="btn btn-secondary" onclick="openCollectionModal(state.activeCollection)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        <span>Edit Columns</span>
      </button>
      <button class="btn btn-secondary" onclick="exportCollectionData()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        <span>Export JSON</span>
      </button>
      <button class="btn btn-primary" onclick="openRecordDrawer()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>New Record</span>
      </button>
    `;
  } else if (state.view === 'realtime') {
    titleSection.innerHTML = `<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> Live Activity Feed</span>`;
    actionsSection.innerHTML = `
      <button class="btn btn-secondary" onclick="state.realtimeEvents = []; renderRealtimeView();">Clear Events</button>
    `;
  } else if (state.view === 'explorer') {
    titleSection.innerHTML = `<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> API Quickstart</span>`;
    actionsSection.innerHTML = '';
  } else if (state.view === 'logs') {
    titleSection.innerHTML = `<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg> System Logs</span>`;
    actionsSection.innerHTML = `
      <button class="btn btn-danger" onclick="clearLogsAction()">Clear All Logs</button>
    `;
  } else if (state.view === 'settings') {
    titleSection.innerHTML = `<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> Project Settings</span>`;
    actionsSection.innerHTML = `
      <a href="/api/admins/backup" class="btn btn-primary" target="_blank">Download DB Backup</a>
    `;
  }
}

// 5. Records Explorer View
async function loadRecords() {
  if (!state.activeCollection) return;
  const contentView = document.getElementById('content-view');
  if (!contentView) return;

  try {
    const res = await window.api.getRecords(state.activeCollection.name, {
      page: state.page,
      perPage: state.perPage,
      search: state.searchQuery,
      filter: state.filterQuery,
      sort: state.sortQuery,
    });

    state.records = res.items || [];
    state.page = res.page;
    state.totalPages = res.totalPages || 1;
    state.totalItems = res.totalItems || 0;

    renderTopBar();
    renderRecordsTable();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Interactive Connect App / API Preview State
let _apiTab = 'html'; // 'html' | 'react' | 'fetch' | 'flutter' | 'curl'
let _apiAction = 'list'; // 'list' | 'view' | 'create' | 'update' | 'delete' | 'realtime' | 'auth'

function setApiModalTab(tab) {
  _apiTab = tab;
  updateApiModalSnippet();
}

function setApiModalAction(action) {
  _apiAction = action;
  updateApiModalSnippet();
}

function getSampleBody(col) {
  const sample = {};
  (col.schema || []).forEach(f => {
    if (f.type === 'bool') sample[f.name] = true;
    else if (f.type === 'number') sample[f.name] = 100;
    else if (f.type === 'email') sample[f.name] = 'user@example.com';
    else if (f.type === 'url') sample[f.name] = 'https://example.com/image.jpg';
    else if (f.type === 'date') sample[f.name] = new Date().toISOString();
    else if (f.type === 'json') sample[f.name] = ['example_tag'];
    else sample[f.name] = `Sample ${f.name}`;
  });
  return sample;
}

function generateApiCode(col, tab, action) {
  const origin = window.location.origin;
  const name = col.name;
  const sample = getSampleBody(col);
  const sampleJson = JSON.stringify(sample, null, 2);

  if (tab === 'html') {
    if (action === 'list') {
      return `<!-- 1. Add MiniBase script to your HTML <head> or <body> -->
<script src="${origin}/js/minibase-sdk.js"></script>

<script>
  const mb = new MiniBase('${origin}');

  async function loadData() {
    // Fetch all rows from "${name}"
    const res = await mb.collection('${name}').getList(1, 30, {
      sort: '-created'
    });
    console.log('Rows:', res.items);
  }

  loadData();
</script>`;
    } else if (action === 'view') {
      return `<script src="${origin}/js/minibase-sdk.js"></script>
<script>
  const mb = new MiniBase('${origin}');

  async function getOneRecord(id) {
    const record = await mb.collection('${name}').getOne(id);
    console.log('Record details:', record);
  }
</script>`;
    } else if (action === 'create') {
      return `<script src="${origin}/js/minibase-sdk.js"></script>
<script>
  const mb = new MiniBase('${origin}');

  async function addNewRow() {
    const newRecord = await mb.collection('${name}').create(${sampleJson});
    console.log('Created record ID:', newRecord.id);
  }
</script>`;
    } else if (action === 'update') {
      return `<script src="${origin}/js/minibase-sdk.js"></script>
<script>
  const mb = new MiniBase('${origin}');

  async function updateRow(recordId) {
    const updated = await mb.collection('${name}').update(recordId, ${sampleJson});
    console.log('Updated record:', updated);
  }
</script>`;
    } else if (action === 'delete') {
      return `<script src="${origin}/js/minibase-sdk.js"></script>
<script>
  const mb = new MiniBase('${origin}');

  async function deleteRow(recordId) {
    await mb.collection('${name}').delete(recordId);
    console.log('Record deleted successfully');
  }
</script>`;
    } else if (action === 'realtime') {
      return `<script src="${origin}/js/minibase-sdk.js"></script>
<script>
  const mb = new MiniBase('${origin}');

  // Auto-updates in real time when any row is added, edited or deleted!
  mb.collection('${name}').subscribe('*', (e) => {
    console.log('Realtime Event:', e.action, e.record);
  });
</script>`;
    } else if (action === 'auth') {
      return `<script src="${origin}/js/minibase-sdk.js"></script>
<script>
  const mb = new MiniBase('${origin}');

  async function loginUser(email, password) {
    const authData = await mb.collection('${name}').authWithPassword(email, password);
    console.log('Logged in user:', authData.record);
    console.log('Auth Token:', authData.token);
  }
</script>`;
    }
  }

  if (tab === 'react') {
    if (action === 'list') {
      return `import { useEffect, useState } from 'react';
import { MiniBaseClient } from 'minibase-sdk';

const mb = new MiniBaseClient('${origin}');

export default function ${name.charAt(0).toUpperCase() + name.slice(1)}List() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mb.collection('${name}').getList(1, 30, { sort: '-created' })
      .then(res => {
        setItems(res.items);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  if (loading) return <div>Loading ${name}...</div>;

  return (
    <div>
      <h2>${name} ({items.length})</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>{JSON.stringify(item)}</li>
        ))}
      </ul>
    </div>
  );
}`;
    } else if (action === 'create') {
      return `import { MiniBaseClient } from 'minibase-sdk';
const mb = new MiniBaseClient('${origin}');

async function handleCreate() {
  const newRow = await mb.collection('${name}').create(${sampleJson});
  alert('Created record ID: ' + newRow.id);
}`;
    } else if (action === 'realtime') {
      return `import { useEffect, useState } from 'react';
import { MiniBaseClient } from 'minibase-sdk';

const mb = new MiniBaseClient('${origin}');

export function use${name.charAt(0).toUpperCase() + name.slice(1)}Realtime() {
  const [lastEvent, setLastEvent] = useState(null);

  useEffect(() => {
    mb.collection('${name}').subscribe('*', (e) => {
      setLastEvent(e);
    });
  }, []);

  return lastEvent;
}`;
    } else {
      return `import { MiniBaseClient } from 'minibase-sdk';
const mb = new MiniBaseClient('${origin}');

// Action: ${action}
const result = await mb.collection('${name}').${action === 'view' ? 'getOne("RECORD_ID")' : action === 'delete' ? 'delete("RECORD_ID")' : action === 'auth' ? 'authWithPassword("user@example.com", "password123")' : 'update("RECORD_ID", ' + sampleJson + ')'};
console.log(result);`;
    }
  }

  if (tab === 'fetch') {
    if (action === 'list') {
      return `// Pure JavaScript / fetch (Works anywhere, 0 libraries needed)
fetch('${origin}/api/collections/${name}/records?page=1&perPage=30&sort=-created')
  .then(res => res.json())
  .then(data => {
    console.log('Total items:', data.totalItems);
    console.log('Rows:', data.items);
  })
  .catch(err => console.error('API Error:', err));`;
    } else if (action === 'view') {
      return `fetch('${origin}/api/collections/${name}/records/RECORD_ID')
  .then(res => res.json())
  .then(record => console.log('Record:', record));`;
    } else if (action === 'create') {
      return `fetch('${origin}/api/collections/${name}/records', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
    // 'Authorization': 'Bearer YOUR_TOKEN' // If rule is restricted
  },
  body: JSON.stringify(${sampleJson})
})
  .then(res => res.json())
  .then(newRecord => console.log('Saved:', newRecord));`;
    } else if (action === 'update') {
      return `fetch('${origin}/api/collections/${name}/records/RECORD_ID', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(${sampleJson})
})
  .then(res => res.json())
  .then(updated => console.log('Updated:', updated));`;
    } else if (action === 'delete') {
      return `fetch('${origin}/api/collections/${name}/records/RECORD_ID', {
  method: 'DELETE'
})
  .then(res => console.log('Deleted successfully'));`;
    } else if (action === 'auth') {
      return `fetch('${origin}/api/collections/${name}/auth-with-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identity: 'user@example.com',
    password: 'password123'
  })
})
  .then(res => res.json())
  .then(auth => {
    console.log('Token:', auth.token);
    console.log('User:', auth.record);
  });`;
    } else {
      return `// Realtime using browser native EventSource
const events = new EventSource('${origin}/api/realtime');
events.addEventListener('create', (e) => console.log('Created:', JSON.parse(e.data)));
events.addEventListener('update', (e) => console.log('Updated:', JSON.parse(e.data)));
events.addEventListener('delete', (e) => console.log('Deleted:', JSON.parse(e.data)));`;
    }
  }

  if (tab === 'flutter') {
    if (action === 'list') {
      return `// ⚡ Using MiniBase Flutter SDK (minibase.dart)
import 'package:your_app/minibase.dart';

final mb = MiniBase('${origin}');

// Fetch ${name} records
final res = await mb.collection('${name}').getList(
  page: 1,
  perPage: 30,
  sort: '-created',
);

List<dynamic> items = res['items'];
print('Fetched ${items.length} records: $items');`;
    } else if (action === 'view') {
      return `// ⚡ Fetch Single Record by ID in Flutter
import 'package:your_app/minibase.dart';

final mb = MiniBase('${origin}');
final record = await mb.collection('${name}').getOne('RECORD_ID');
print('Record details: $record');

// If record contains an image/file:
final fileUrl = mb.getFileUrl('${name}', record['id'], record['image'] ?? '');
print('File URL: $fileUrl');`;
    } else if (action === 'create') {
      return `// ⚡ Create New Record in Flutter
import 'package:your_app/minibase.dart';

final mb = MiniBase('${origin}');
final newRecord = await mb.collection('${name}').create(${sampleJson});
print('Created Record ID: ${newRecord["id"]}');`;
    } else if (action === 'update') {
      return `// ⚡ Update Record in Flutter
import 'package:your_app/minibase.dart';

final mb = MiniBase('${origin}');
final updated = await mb.collection('${name}').update('RECORD_ID', ${sampleJson});
print('Updated successfully: $updated');`;
    } else if (action === 'delete') {
      return `// ⚡ Delete Record in Flutter
import 'package:your_app/minibase.dart';

final mb = MiniBase('${origin}');
final success = await mb.collection('${name}').delete('RECORD_ID');
print('Deleted successfully: $success');`;
    } else if (action === 'auth') {
      return `// ⚡ User Auth with Password in Flutter
import 'package:your_app/minibase.dart';

final mb = MiniBase('${origin}');
final authData = await mb.collection('${name}').authWithPassword('user@example.com', 'password123');
print('Auth Token: ${authData["token"]}');
print('User Profile: ${authData["record"]}');`;
    } else {
      return `// ⚡ MiniBase Flutter Client
import 'package:your_app/minibase.dart';

final mb = MiniBase('${origin}');
final items = await mb.collection('${name}').getList();`;
    }
  }

  if (tab === 'curl') {
    if (action === 'list') {
      return `curl -X GET "${origin}/api/collections/${name}/records?page=1&perPage=30"`;
    } else if (action === 'view') {
      return `curl -X GET "${origin}/api/collections/${name}/records/RECORD_ID"`;
    } else if (action === 'create') {
      return `curl -X POST "${origin}/api/collections/${name}/records" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sample)}'`;
    } else if (action === 'update') {
      return `curl -X PATCH "${origin}/api/collections/${name}/records/RECORD_ID" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(sample)}'`;
    } else if (action === 'delete') {
      return `curl -X DELETE "${origin}/api/collections/${name}/records/RECORD_ID"`;
    } else if (action === 'auth') {
      return `curl -X POST "${origin}/api/collections/${name}/auth-with-password" \\
  -H "Content-Type: application/json" \\
  -d '{"identity":"user@example.com","password":"password123"}'`;
    } else {
      return `curl -N "${origin}/api/realtime"`;
    }
  }

  return `// MiniBase API`;
}

function updateApiModalSnippet() {
  const col = state.activeCollection;
  if (!col) return;
  const origin = (_tunnelState.active && _tunnelState.url) ? _tunnelState.url : window.location.origin;
  const codeBox = document.getElementById('api-snippet-code');
  if (!codeBox) return;

  const currentTab = window._activeApiTab || 'flutter';

  if (currentTab === 'flutter') {
    codeBox.textContent = `// 📱 Flutter / Dart Integration
import 'package:flutter/material.dart';
import 'minibase.dart';

final mb = MiniBase('${origin}');

// Fetch records from "${col.name}"
Future<void> load${col.name[0].toUpperCase() + col.name.slice(1)}() async {
  final res = await mb.collection('${col.name}').getList(
    page: 1,
    perPage: 30,
    sort: '-created',
  );
  List<dynamic> items = res['items'];
  print('Loaded ${items.length} records');
}

// Create new record
Future<void> createRecord() async {
  final record = await mb.collection('${col.name}').create({
${(col.schema || []).map(f => `    '${f.name}': ${f.type === 'number' ? '0' : f.type === 'bool' ? 'true' : `'${f.name}_sample'`},`).join('\n')}
  });
  print('Created ID: ${record['id']}');
}`;
  } else if (currentTab === 'js') {
    codeBox.textContent = `// ⚡ JavaScript / TypeScript SDK
import { MiniBaseClient } from './minibase-sdk.js';

const mb = new MiniBaseClient('${origin}');

// Fetch all records
const res = await mb.collection('${col.name}').getList({
  page: 1,
  perPage: 30,
  sort: '-created'
});
console.log('Records:', res.items);

// Realtime subscription
mb.realtime.subscribe('${col.name}', (e) => {
  console.log('Live Event:', e.action, e.record);
});`;
  } else if (currentTab === 'curl') {
    codeBox.textContent = `# 🌐 cURL / REST API
# 1. Fetch records list
curl -X GET "${origin}/api/collections/${col.name}/records?page=1&perPage=30" \\
     -H "Accept: application/json"

# 2. Create new record
curl -X POST "${origin}/api/collections/${col.name}/records" \\
     -H "Content-Type: application/json" \\
     -d '{${(col.schema || []).map(f => `"${f.name}": ${f.type === 'number' ? '0' : f.type === 'bool' ? 'true' : `"${f.name}_sample"`}`).join(', ')}}'`;
  } else if (currentTab === 'python') {
    codeBox.textContent = `# 🐍 Python Client
import requests

BASE_URL = "${origin}"

# Fetch records
res = requests.get(f"{BASE_URL}/api/collections/${col.name}/records")
data = res.json()
print("Records:", data.get("items", []))

# Insert record
payload = {
${(col.schema || []).map(f => `    "${f.name}": ${f.type === 'number' ? '0' : f.type === 'bool' ? 'True' : `"${f.name}_sample"`},`).join('\n')}
}
post_res = requests.post(f"{BASE_URL}/api/collections/${col.name}/records", json=payload)
print("Created:", post_res.json())`;
  }

  window.__codeSnippets['api_preview'] = codeBox.textContent;
}

window.selectApiTab = function(tabName) {
  window._activeApiTab = tabName;
  document.querySelectorAll('.api-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  updateApiModalSnippet();
};


function copyApiSnippetAction() {
  const code = window.__codeSnippets['api_preview'] || '';
  copyToClipboard(code);
  const btn = document.getElementById('copy-api-btn');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" style="vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied to Clipboard!</span>';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  }
}

let _currentRenderedColName = null;

function renderRecordsContent(col, fields) {
  if (state.records.length === 0) {
    if (state.searchQuery || state.filterQuery) {
      return `
        <div class="empty-state" style="padding:48px 24px; display:flex; flex-direction:column; align-items:center; text-align:center;">
          <div style="width:64px; height:64px; border-radius:16px; background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.2); display:flex; align-items:center; justify-content:center; margin-bottom:16px; font-size:28px;">
            🔍
          </div>
          <h3 style="font-size:17px; font-weight:700; color:#FFFFFF; margin-bottom:6px; font-family:'Plus Jakarta Sans', sans-serif;">No matching records found</h3>
          <p style="font-size:13px; color:var(--text-muted); max-width:380px; margin-bottom:20px; line-height:1.6;">
            No rows matched your search/filter query in <strong>"${escapeHtml(col.name)}"</strong>.
          </p>
          <button class="btn btn-secondary" onclick="clearFilters()" style="font-weight:600; padding:8px 18px; font-size:13px; border-radius:8px;">
            Clear Search & Filter
          </button>
        </div>
      `;
    } else {
      return `
        <div class="empty-state" style="padding:48px 24px; display:flex; flex-direction:column; align-items:center; text-align:center;">
          <div style="width:64px; height:64px; border-radius:16px; background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); display:flex; align-items:center; justify-content:center; margin-bottom:16px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="1.75"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
          </div>
          <h3 style="font-size:17px; font-weight:700; color:#FFFFFF; margin-bottom:6px; font-family:'Plus Jakarta Sans', sans-serif;">This table is empty</h3>
          <p style="font-size:13px; color:var(--text-muted); max-width:380px; margin-bottom:20px; line-height:1.6;">
            Start adding data to <strong>"${escapeHtml(col.name)}"</strong>. Click the button below to add your first row.
          </p>
          
          <button class="btn btn-primary" onclick="openRecordDrawer()" style="background:#10B981; color:#042F1A; border-color:rgba(16,185,129,0.3); font-weight:700; padding:10px 24px; font-size:14px; border-radius:8px; display:inline-flex; align-items:center; gap:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Add First Row</span>
          </button>
        </div>
      `;
    }
  }

  const friendlyTypes = { text: 'Text', number: 'Number', bool: 'Yes/No', email: 'Email', url: 'Link', date: 'Date', select: 'Dropdown', json: 'Data', file: 'File', relation: 'Link to Table' };

  return `
    <table class="data-grid" style="width:100%; border-collapse:collapse; text-align:left; font-size:12.5px;">
      <thead>
        <tr style="background:#12141A; position:sticky; top:0; z-index:10; border-bottom:1px solid rgba(255,255,255,0.08);">
          <th style="width:130px; padding:9px 12px; font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600; letter-spacing:0.04em;">Record ID</th>
          ${col.type === 'auth' ? '<th style="padding:9px 12px; font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Email</th><th style="padding:9px 12px; font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Verified</th>' : ''}
          ${fields.map(f => `<th style="padding:9px 12px; font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600; letter-spacing:0.04em;">${escapeHtml(f.name)} <span style="font-size:9.5px; color:var(--text-faint); font-weight:normal;">(${friendlyTypes[f.type] || f.type})</span></th>`).join('')}
          <th style="width:140px; padding:9px 12px; font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600;">Created Date</th>
          <th style="width:80px; padding:9px 12px; font-size:11px; color:var(--text-dim); text-transform:uppercase; font-weight:600; text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${state.records.map(rec => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background 0.1s ease;" onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="this.style.background='transparent'" onclick="viewRecordDetails('${rec.id}')">
            <td style="padding:9px 12px;">
              <span class="cell-id" onclick="copyToClipboard('${rec.id}')" title="Click to copy ID" style="cursor:pointer; display:inline-flex; align-items:center; gap:5px; font-family:var(--font-mono); font-size:11.5px; color:var(--text-muted); background:rgba(255,255,255,0.04); padding:2px 6px; border-radius:4px; border:1px solid rgba(255,255,255,0.06);">
                ${rec.id}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              </span>
            </td>
            ${col.type === 'auth' ? `
              <td style="padding:9px 12px;"><strong>${escapeHtml(rec.email || '')}</strong></td>
              <td style="padding:9px 12px;">${rec.verified ? '<span class="cell-bool-true">✓ Yes</span>' : '<span class="cell-bool-false">✗ No</span>'}</td>
            ` : ''}
            ${fields.map(f => `<td style="padding:9px 12px; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${formatCellValue(rec[f.name], f, rec, col)}</td>`).join('')}
            <td style="padding:9px 12px; color:var(--text-secondary); font-size:11.5px;" class="mono">${formatDate(rec.created)}</td>
            <td style="padding:9px 12px; text-align:right; white-space:nowrap;">
              <button class="btn-icon" onclick="event.stopPropagation(); viewRecordDetails('${rec.id}')" title="View Record Details" style="color:var(--accent-cyan);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
              <button class="btn-icon" onclick="event.stopPropagation(); openRecordDrawer('${rec.id}')" title="Edit Record">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button class="btn-icon" style="color:var(--accent-rose);" onclick="event.stopPropagation(); deleteRecordAction('${rec.id}')" title="Delete Record">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderPaginationContent() {
  return `
    <div>Showing <strong>${state.records.length}</strong> of <strong>${state.totalItems}</strong> rows</div>
    <div style="display:flex; align-items:center; gap:8px;">
      <button class="btn btn-secondary btn-icon" ${state.page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="changePage(${state.page - 1})">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <span>Page <strong>${state.page}</strong> of <strong>${state.totalPages}</strong></span>
      <button class="btn btn-secondary btn-icon" ${state.page >= state.totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''} onclick="changePage(${state.page + 1})">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  `;
}

function renderRecordsTable() {
  const contentView = document.getElementById('content-view');
  if (!contentView || !state.activeCollection) return;

  const col = state.activeCollection;
  const fields = col.schema || [];

  const scrollContainer = document.getElementById('records-scroll-container');
  const paginationContainer = document.getElementById('records-pagination-container');

  // If table container already exists for this collection, update only the table grid and pagination!
  // This keeps the search input and filter input 100% focused while typing!
  if (scrollContainer && paginationContainer && _currentRenderedColName === col.name) {
    scrollContainer.innerHTML = renderRecordsContent(col, fields);
    paginationContainer.innerHTML = renderPaginationContent();

    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (clearSearchBtn) clearSearchBtn.style.display = state.searchQuery ? 'inline-block' : 'none';

    const clearFilterBtn = document.getElementById('clear-filter-btn');
    if (clearFilterBtn) clearFilterBtn.style.display = state.filterQuery ? 'inline-block' : 'none';
    return;
  }

  _currentRenderedColName = col.name;

  contentView.innerHTML = `
    <div class="collection-view-container" style="display:flex; flex-direction:column; gap:12px; height:100%;">
      
      <!-- Top Action & Collection Header Bar -->
      <div class="collection-header-card" style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:#12141A; border:1px solid rgba(255,255,255,0.08); border-radius:8px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:34px; height:34px; border-radius:6px; background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.25); display:flex; align-items:center; justify-content:center; color:#10B981; font-size:16px;">
            ${col.type === 'auth' ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>' : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>'}
          </div>
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <h2 style="font-size:15px; font-weight:700; margin:0; font-family:'Plus Jakarta Sans', sans-serif; color:#FFFFFF;">${escapeHtml(col.name)}</h2>
              <span class="col-type-tag tag-${col.type}">${col.type}</span>
              <span style="font-size:11px; padding:1px 7px; border-radius:10px; background:rgba(255,255,255,0.06); color:var(--text-muted); font-family:var(--font-mono);">${state.totalItems} rows</span>
            </div>
            <div style="font-size:12px; color:var(--text-dim); margin-top:2px;">
              ${col.type === 'auth' ? 'User accounts table with login & auth' : 'Your data table — add, edit & manage rows here'}
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-secondary" onclick="openApiQuickstartModal()" title="Get code to connect your app">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            <span>Connect App</span>
          </button>
          <button class="btn btn-secondary" onclick="openCollectionModal(state.activeCollection)" title="Add or remove columns">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <span>Edit Columns</span>
          </button>
          <button class="btn btn-primary" onclick="openRecordDrawer()" style="background:#10B981; color:#042F1A; border-color:rgba(16,185,129,0.3); font-weight:700;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Add Row</span>
          </button>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-container" style="flex:1; display:flex; flex-direction:column; background:#0E1015; border:1px solid rgba(255,255,255,0.08); border-radius:8px; overflow:hidden;">
        
        <!-- Search & Filter Toolbar -->
        <div class="table-toolbar" style="padding:10px 14px; background:#12141A; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; gap:10px;">
          <div class="search-input-wrapper" style="width:260px; position:relative;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); width:13px; height:13px; color:var(--text-dim);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input id="records-search-input" type="text" class="input" style="padding-left:30px; padding-right:26px;" placeholder="Search in ${escapeHtml(col.name)}..." value="${escapeHtml(state.searchQuery)}" oninput="handleSearchInput(this.value)" onkeyup="handleSearch(event)" />
            <button id="clear-search-btn" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px; line-height:1; padding:0 4px; display:${state.searchQuery ? 'inline-block' : 'none'};" onclick="clearSearchInput()" title="Clear search">&times;</button>
          </div>
          
          <div class="search-input-wrapper" style="flex:1; position:relative;">
            <input id="records-filter-input" type="text" class="input" style="padding-right:26px;" placeholder="Filter rows (e.g. status = 'active')" value="${escapeHtml(state.filterQuery)}" oninput="handleFilterInput(this.value)" onkeyup="handleFilter(event)" />
            <button id="clear-filter-btn" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px; line-height:1; padding:0 4px; display:${state.filterQuery ? 'inline-block' : 'none'};" onclick="clearFilterInput()" title="Clear filter">&times;</button>
          </div>

          <div style="display:flex; align-items:center; gap:6px;">
            <select class="input select" style="width:170px; font-size:12px; padding:5px 8px;" onchange="state.sortQuery = this.value; state.page = 1; loadRecords();">
              <option value="-created" ${state.sortQuery === '-created' ? 'selected' : ''}>Newest First (-created)</option>
              <option value="+created" ${state.sortQuery === '+created' ? 'selected' : ''}>Oldest First (+created)</option>
              <option value="-updated" ${state.sortQuery === '-updated' ? 'selected' : ''}>Recently Updated</option>
              <option value="id" ${state.sortQuery === 'id' ? 'selected' : ''}>Sort by ID</option>
            </select>

            <button class="btn btn-secondary btn-icon" onclick="loadRecords()" title="Refresh records">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </button>
          </div>
        </div>

        <!-- Scrollable Table Grid / Empty State -->
        <div id="records-scroll-container" class="table-scroll" style="flex:1; overflow:auto;">
          ${renderRecordsContent(col, fields)}
        </div>

        <!-- Table Pagination Footer -->
        <div id="records-pagination-container" class="table-pagination" style="padding:10px 14px; background:#12141A; border-top:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--text-muted);">
          ${renderPaginationContent()}
        </div>
      </div>
    </div>
  `;
}

function formatCellValue(val, field, rec, col) {
  if (val === null || val === undefined || val === '') return '<span style="color:var(--text-dim); font-size:11px; font-family:var(--font-mono);">NULL</span>';

  if (field.type === 'bool' || field.name === 'published') {
    const isTrue = Boolean(val === true || val === 1 || val === 'true' || val === '1');
    if (field.name === 'published') {
      return isTrue
        ? '<span style="display:inline-flex; align-items:center; gap:5px; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; background:rgba(16, 185, 129, 0.12); color:#10B981; border:1px solid rgba(16, 185, 129, 0.25);">Published</span>'
        : '<span style="display:inline-flex; align-items:center; gap:5px; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:600; background:rgba(245, 158, 11, 0.12); color:#F59E0B; border:1px solid rgba(245, 158, 11, 0.25);">Draft</span>';
    }
    return isTrue
      ? '<span class="cell-bool-true"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:middle; margin-right:3px;"><polyline points="20 6 9 17 4 12"></polyline></svg>true</span>'
      : '<span class="cell-bool-false"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="vertical-align:middle; margin-right:3px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>false</span>';
  }

  if (field.name === 'category') {
    const cat = String(val);
    const catColors = {
      Engineering: { bg: 'rgba(56, 189, 248, 0.12)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.25)' },
      Architecture: { bg: 'rgba(245, 158, 11, 0.12)', text: '#FBBF24', border: 'rgba(245, 158, 11, 0.25)' },
      Security: { bg: 'rgba(239, 68, 68, 0.12)', text: '#F87171', border: 'rgba(239, 68, 68, 0.25)' },
      Design: { bg: 'rgba(168, 85, 247, 0.12)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.25)' },
      Tutorial: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34D399', border: 'rgba(16, 185, 129, 0.25)' },
      Product: { bg: 'rgba(236, 72, 153, 0.12)', text: '#F472B6', border: 'rgba(236, 72, 153, 0.25)' },
      Nature: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34D399', border: 'rgba(16, 185, 129, 0.25)' },
      Abstract: { bg: 'rgba(168, 85, 247, 0.12)', text: '#C084FC', border: 'rgba(168, 85, 247, 0.25)' },
    };
    const c = catColors[cat] || { bg: 'rgba(255, 255, 255, 0.08)', text: '#E2E8F0', border: 'rgba(255, 255, 255, 0.14)' };
    return `<span style="display:inline-block; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:600; background:${c.bg}; color:${c.text}; border:1px solid ${c.border};">${escapeHtml(cat)}</span>`;
  }

  if (field.name === 'tags' || field.type === 'json') {
    let parsed = val;
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try { parsed = JSON.parse(val); } catch {}
    }
    if (Array.isArray(parsed)) {
      return `<div style="display:flex; flex-wrap:wrap; gap:4px;">${parsed.slice(0, 3).map(t => `<span style="display:inline-block; padding:1px 6px; border-radius:4px; font-size:10.5px; background:rgba(99, 102, 241, 0.12); color:#A5B4FC; border:1px solid rgba(99, 102, 241, 0.2);">#${escapeHtml(String(t))}</span>`).join('')}${parsed.length > 3 ? `<span style="font-size:10px; color:var(--text-muted);">+${parsed.length - 3}</span>` : ''}</div>`;
    }
    return `<span class="cell-badge mono" style="background:rgba(99, 102, 241, 0.12); color:#A5B4FC;">${escapeHtml(typeof val === 'object' ? JSON.stringify(val) : String(val))}</span>`;
  }

  if (field.type === 'number') {
    const num = Number(val);
    if (!isNaN(num) && num >= 1000) {
      const formatted = (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      return `<span class="mono" style="font-weight:500;">${formatted}</span>`;
    }
    return `<span class="mono">${val}</span>`;
  }

  if (field.type === 'file') {
    const fileUrl = `/api/files/${col.name}/${rec.id}/${encodeURIComponent(val)}`;
    const isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(val);
    if (isImg) {
      return `
        <a href="${fileUrl}" target="_blank" style="display:inline-flex; align-items:center; gap:6px; color:var(--text-main); text-decoration:none;">
          <img src="${fileUrl}" style="width:22px; height:22px; border-radius:4px; object-fit:cover; border:1px solid var(--border-subtle);" />
          <span style="font-size:12px; color:#38BDF8;">${escapeHtml(val)}</span>
        </a>
      `;
    }
    return `<a href="${fileUrl}" target="_blank" class="cell-badge" style="display:inline-flex; align-items:center; gap:4px; text-decoration:none;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> ${escapeHtml(val)}</a>`;
  }

  if (field.type === 'relation') {
    return `<span class="cell-badge mono" style="background:rgba(56, 189, 248, 0.1); color:var(--accent-cyan); display:inline-flex; align-items:center; gap:4px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> ${escapeHtml(String(val))}</span>`;
  }

  const str = String(val);
  if (str.length > 55) {
    return `<span title="${escapeHtml(str)}">${escapeHtml(str.slice(0, 52))}...</span>`;
  }
  return escapeHtml(str);
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

let searchDebounceTimer = null;
function handleSearchInput(val) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    state.searchQuery = (val || '').trim();
    state.page = 1;
    loadRecords();
  }, 200);
}

function handleSearch(e) {
  if (e.key === 'Enter') {
    clearTimeout(searchDebounceTimer);
    state.searchQuery = (e.target.value || '').trim();
    state.page = 1;
    loadRecords();
  }
}

let filterDebounceTimer = null;
function handleFilterInput(val) {
  clearTimeout(filterDebounceTimer);
  filterDebounceTimer = setTimeout(() => {
    state.filterQuery = (val || '').trim();
    state.page = 1;
    loadRecords();
  }, 350);
}

function handleFilter(e) {
  if (e.key === 'Enter') {
    clearTimeout(filterDebounceTimer);
    state.filterQuery = (e.target.value || '').trim();
    state.page = 1;
    loadRecords();
  }
}

function clearSearchInput() {
  state.searchQuery = '';
  const input = document.getElementById('records-search-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  state.page = 1;
  loadRecords();
}

function clearFilterInput() {
  state.filterQuery = '';
  const input = document.getElementById('records-filter-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  state.page = 1;
  loadRecords();
}

function clearFilters() {
  state.searchQuery = '';
  state.filterQuery = '';
  const sInput = document.getElementById('records-search-input');
  if (sInput) sInput.value = '';
  const fInput = document.getElementById('records-filter-input');
  if (fInput) fInput.value = '';
  state.page = 1;
  loadRecords();
}

function changePage(newPage) {
  if (newPage < 1 || newPage > state.totalPages) return;
  state.page = newPage;
  loadRecords();
}

// 5.5. View Specific Record Details Modal
let _recordViewTab = 'fields'; // 'fields' | 'json' | 'api'

async function viewRecordDetails(recordId) {
  const col = state.activeCollection;
  if (!col) return;

  let record = (state.records || []).find(r => r.id === recordId);
  try {
    const fresh = await window.api.getRecord(col.name, recordId);
    if (fresh && fresh.id) record = fresh;
  } catch {}

  if (!record) {
    showToast('Record not found', 'error');
    return;
  }

  window.__activeViewRecord = record;
  _recordViewTab = 'fields';

  renderRecordDetailsModal();
}

function setRecordViewTab(tab) {
  _recordViewTab = tab;
  renderRecordDetailsModal();
}

function renderRecordDetailsModal() {
  const col = state.activeCollection;
  const record = window.__activeViewRecord;
  if (!col || !record) return;

  const origin = window.location.origin;
  const apiUrl = `${origin}/api/collections/${col.name}/records/${record.id}`;

  const tabsHtml = `
    <div style="display:flex; gap:6px; margin-bottom:14px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:8px;">
      <button class="btn btn-sm ${_recordViewTab === 'fields' ? 'btn-primary' : 'btn-secondary'}" onclick="setRecordViewTab('fields')">
        Fields & Values
      </button>
      <button class="btn btn-sm ${_recordViewTab === 'json' ? 'btn-primary' : 'btn-secondary'}" onclick="setRecordViewTab('json')">
        Raw JSON
      </button>
      <button class="btn btn-sm ${_recordViewTab === 'api' ? 'btn-primary' : 'btn-secondary'}" onclick="setRecordViewTab('api')">
        API Link & Code
      </button>
    </div>
  `;

  let bodyHtml = '';

  if (_recordViewTab === 'fields') {
    const fieldsList = [
      { name: 'id', label: 'Record ID', type: 'id', val: record.id },
      ...(col.type === 'auth' ? [
        { name: 'email', label: 'Email', type: 'email', val: record.email },
        { name: 'verified', label: 'Email Verified', type: 'bool', val: record.verified },
      ] : []),
      ...(col.schema || []).map(f => ({ name: f.name, label: f.name, type: f.type, val: record[f.name] })),
      { name: 'created', label: 'Created At', type: 'date', val: record.created },
      { name: 'updated', label: 'Updated At', type: 'date', val: record.updated },
    ];

    bodyHtml = `
      ${tabsHtml}
      <div style="display:flex; flex-direction:column; gap:10px; max-height:55vh; overflow-y:auto; padding-right:4px;">
        ${fieldsList.map(item => {
          let renderedVal = '';
          const val = item.val;

          if (val === null || val === undefined || val === '') {
            renderedVal = `<span style="color:var(--text-muted); font-size:12px; font-style:italic;">null (empty)</span>`;
          } else if (item.type === 'file') {
            const fileUrl = `/api/files/${col.name}/${record.id}/${encodeURIComponent(val)}`;
            const isImg = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(val);
            renderedVal = `
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${isImg ? `
                  <a href="${fileUrl}" target="_blank" style="display:inline-block;">
                    <img src="${fileUrl}" style="max-height:180px; max-width:100%; border-radius:8px; object-fit:cover; border:1px solid rgba(255,255,255,0.12); box-shadow:0 4px 12px rgba(0,0,0,0.3);" />
                  </a>
                ` : ''}
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                  <a href="${fileUrl}" target="_blank" class="btn btn-sm btn-secondary" style="font-size:11.5px; padding:4px 10px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> View File: ${escapeHtml(val)}
                  </a>
                  <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('${origin}${fileUrl}')" style="font-size:11.5px; padding:4px 8px;" title="Copy direct file URL">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy Link
                  </button>
                </div>
              </div>
            `;
          } else if (item.type === 'bool') {
            const isT = Boolean(val === true || val === 1 || val === 'true');
            renderedVal = isT
              ? `<span style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600; background:rgba(16, 185, 129, 0.15); color:#10B981; border:1px solid rgba(16, 185, 129, 0.3);">✓ true (Yes)</span>`
              : `<span style="display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:12px; font-size:12px; font-weight:600; background:rgba(239, 68, 68, 0.15); color:#EF4444; border:1px solid rgba(239, 68, 68, 0.3);">✗ false (No)</span>`;
          } else if (item.type === 'json') {
            renderedVal = `<pre style="margin:0; padding:8px 10px; border-radius:6px; background:#080A0E; border:1px solid rgba(255,255,255,0.06); font-size:11.5px; font-family:var(--font-mono); color:#A5B4FC; max-height:120px; overflow:auto;">${escapeHtml(typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val))}</pre>`;
          } else if (item.type === 'date') {
            renderedVal = `<span class="mono" style="font-size:12.5px; color:#F1F5F9;">${formatDate(val)} <span style="font-size:11px; color:var(--text-muted);">(${escapeHtml(String(val))})</span></span>`;
          } else if (item.type === 'id') {
            renderedVal = `
              <span style="display:inline-flex; align-items:center; gap:8px;">
                <code style="font-family:var(--font-mono); font-size:13px; color:#38BDF8; font-weight:600; background:rgba(56,189,248,0.1); padding:2px 8px; border-radius:4px; border:1px solid rgba(56,189,248,0.2);">${escapeHtml(val)}</code>
                <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('${escapeHtml(val)}')" style="padding:2px 8px; font-size:11px;"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy ID</button>
              </span>
            `;
          } else {
            renderedVal = `<span style="font-size:13px; color:#F8FAFC; word-break:break-word; line-height:1.5;">${escapeHtml(String(val))}</span>`;
          }

          return `
            <div style="display:flex; flex-direction:column; gap:4px; padding:10px 12px; border-radius:8px; background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.05);">
              <div style="display:flex; align-items:center; justify-content:space-between;">
                <span style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">${escapeHtml(item.label)}</span>
                <span style="font-size:10px; color:var(--text-dim); font-family:var(--font-mono);">${escapeHtml(item.type)}</span>
              </div>
              <div>${renderedVal}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else if (_recordViewTab === 'json') {
    const jsonStr = JSON.stringify(record, null, 2);
    bodyHtml = `
      ${tabsHtml}
      <div style="position:relative;">
        <pre style="margin:0; padding:14px; border-radius:8px; background:#080A0E; border:1px solid rgba(255,255,255,0.08); font-size:12px; line-height:1.5; font-family:var(--font-mono); color:#38BDF8; max-height:55vh; overflow:auto;"><code>${escapeHtml(jsonStr)}</code></pre>
        <button class="btn btn-sm btn-secondary" onclick="copyToClipboard(JSON.stringify(window.__activeViewRecord, null, 2))" style="position:absolute; right:10px; top:10px; font-size:11px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy JSON
        </button>
      </div>
    `;
  } else if (_recordViewTab === 'api') {
    bodyHtml = `
      ${tabsHtml}
      <div style="display:flex; flex-direction:column; gap:12px; max-height:55vh; overflow-y:auto;">
        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Direct API Endpoint (GET)</label>
          <div style="display:flex; gap:6px; margin-top:4px;">
            <input type="text" class="input mono" readonly value="${apiUrl}" style="font-size:12px; flex:1;" />
            <button class="btn btn-secondary" onclick="copyToClipboard('${apiUrl}')" style="font-size:12px;">Copy</button>
            <a href="${apiUrl}" target="_blank" class="btn btn-primary" style="font-size:12px;">Open ↗</a>
          </div>
        </div>

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">cURL Command</label>
          <pre style="margin-top:4px; padding:10px; border-radius:6px; background:#080A0E; border:1px solid rgba(255,255,255,0.08); font-size:11.5px; font-family:var(--font-mono); color:#10B981;">curl -X GET "${apiUrl}"</pre>
        </div>

        <div>
          <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">JavaScript Fetch</label>
          <pre style="margin-top:4px; padding:10px; border-radius:6px; background:#080A0E; border:1px solid rgba(255,255,255,0.08); font-size:11.5px; font-family:var(--font-mono); color:#A5B4FC;">const record = await fetch('${apiUrl}').then(r => r.json());
console.log(record);</pre>
        </div>
      </div>
    `;
  }

  const footerHtml = `
    <button class="btn btn-danger" style="margin-right:auto;" onclick="closeModal(); deleteRecordAction('${record.id}');">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Delete
    </button>
    <button class="btn btn-primary" onclick="closeModal(); openRecordDrawer('${record.id}');">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit Record
    </button>
    <button class="btn btn-secondary" onclick="closeModal()">Close</button>
  `;

  openModal(`Record Details: ${col.name} / ${record.id}`, bodyHtml, footerHtml);
}

// 6. Record Drawer (Create / Edit)
function openRecordDrawer(recordId = null) {
  const col = state.activeCollection;
  if (!col) return;

  const isEdit = Boolean(recordId);
  const existingRecord = isEdit ? state.records.find(r => r.id === recordId) || {} : {};

  const fieldsHtml = (col.schema || [])
    .map(field => {
      const val = existingRecord[field.name];
      const isReq = field.required;

      let inputControl = '';

      switch (field.type) {
        case 'editor':
          inputControl = `<textarea name="${field.name}" class="input mono" rows="8" placeholder="# Markdown content..." style="line-height:1.6; font-size:13px;">${escapeHtml(val || '')}</textarea>`;
          break;
        case 'number':
          inputControl = `<input type="number" step="any" name="${field.name}" class="input" value="${val !== undefined && val !== null ? val : ''}" ${isReq && !isEdit ? 'required' : ''} />`;
          break;
        case 'bool':
          inputControl = `
            <select name="${field.name}" class="input">
              <option value="true" ${val ? 'selected' : ''}>true (Yes / Published)</option>
              <option value="false" ${!val ? 'selected' : ''}>false (No / Draft)</option>
            </select>
          `;
          break;
        case 'email':
          inputControl = `<input type="email" name="${field.name}" class="input" value="${escapeHtml(val || '')}" ${isReq && !isEdit ? 'required' : ''} />`;
          break;
        case 'url':
          inputControl = `<input type="url" name="${field.name}" class="input" placeholder="https://..." value="${escapeHtml(val || '')}" ${isReq && !isEdit ? 'required' : ''} />`;
          break;
        case 'date':
          inputControl = `<input type="datetime-local" name="${field.name}" class="input" value="${val ? new Date(val).toISOString().slice(0, 16) : ''}" ${isReq && !isEdit ? 'required' : ''} />`;
          break;
        case 'select':
          const options = field.options?.values || [];
          inputControl = `
            <select name="${field.name}" class="input">
              <option value="">-- Select option --</option>
              ${options.map(opt => `<option value="${escapeHtml(opt)}" ${val === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('')}
            </select>
          `;
          break;
        case 'json':
          inputControl = `<textarea name="${field.name}" class="input mono" rows="4" placeholder='["tag1", "tag2"]'>${typeof val === 'object' ? JSON.stringify(val, null, 2) : (val || '')}</textarea>`;
          break;
        case 'file':
          inputControl = `
            <div style="display:flex; flex-direction:column; gap:8px;">
              <input type="file" name="${field.name}" class="input" style="padding:6px;" />
              ${val ? `<div style="font-size:12px; color:var(--text-muted);">Current file: <strong>${escapeHtml(val)}</strong></div>` : ''}
            </div>
          `;
          break;
        case 'relation':
          inputControl = `<input type="text" name="${field.name}" class="input mono" placeholder="Target Record ID" value="${escapeHtml(val || '')}" ${isReq && !isEdit ? 'required' : ''} />`;
          break;
        case 'text':
        default:
          inputControl = `<input type="text" name="${field.name}" class="input" value="${escapeHtml(val || '')}" ${isReq && !isEdit ? 'required' : ''} />`;
          break;
      }

      return `
        <div class="form-group">
          <label class="form-label">
            <span>${escapeHtml(field.name)} ${isReq ? '<span style="color:var(--accent-rose);">*</span>' : ''}</span>
            <span style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">${field.type}</span>
          </label>
          ${inputControl}
        </div>
      `;
    })
    .join('');

  const authFieldsHtml = col.type === 'auth' ? `
    <div class="form-group">
      <label class="form-label">Auth Email <span style="color:var(--accent-rose);">*</span></label>
      <input type="email" name="email" class="input" value="${escapeHtml(existingRecord.email || '')}" required />
    </div>
    <div class="form-group">
      <label class="form-label">Password ${isEdit ? '<span style="font-weight:normal; color:var(--text-muted);">(leave blank to keep unchanged)</span>' : '<span style="color:var(--accent-rose);">*</span>'}</label>
      <input type="password" name="password" class="input" placeholder="Min 8 characters" minlength="8" ${!isEdit ? 'required' : ''} />
    </div>
    <div class="form-group">
      <label class="form-label">Email Verified</label>
      <select name="verified" class="input">
        <option value="1" ${existingRecord.verified ? 'selected' : ''}>Verified (1)</option>
        <option value="0" ${!existingRecord.verified ? 'selected' : ''}>Unverified (0)</option>
      </select>
    </div>
  ` : '';

  const formInnerHtml = (!authFieldsHtml && !fieldsHtml) 
    ? `
      <div style="padding:32px 20px; text-align:center; background:var(--bg-app); border-radius:8px; border:1px dashed rgba(255,255,255,0.1);">
        <div style="font-size:32px; margin-bottom:12px;">x:️</div>
        <h4 style="font-size:15px; font-weight:600; color:var(--text-primary); margin-bottom:6px;">No columns in this table</h4>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px; line-height:1.5;">You need to add some columns to your table before you can insert a row.</p>
        <button type="button" class="btn btn-secondary" onclick="closeDrawer(); openCollectionModal(state.activeCollection);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          <span>Edit Columns Now</span>
        </button>
      </div>
    `
    : `
      ${authFieldsHtml}
      ${fieldsHtml}
    `;

  const bodyHtml = `
    <form id="record-form" style="display:flex; flex-direction:column; gap:16px;">
      ${formInnerHtml}
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="closeDrawer()">Cancel</button>
    <button class="btn btn-primary" onclick="submitRecordForm('${recordId || ''}')">
      ${isEdit ? 'Save Changes' : 'Create Record'}
    </button>
  `;

  openDrawer(isEdit ? `Edit Record (${recordId})` : `New ${col.name} Record`, bodyHtml, footerHtml);
}

async function submitRecordForm(recordId) {
  const form = document.getElementById('record-form');
  if (!form) return;

  const col = state.activeCollection;
  const formData = new FormData(form);

  // If json fields, validate parse
  for (const field of col.schema) {
    if (field.type === 'json') {
      const val = formData.get(field.name);
      if (val && typeof val === 'string' && val.trim()) {
        try {
          JSON.parse(val);
        } catch {
          showToast(`Invalid JSON in field "${field.name}"`, 'error');
          return;
        }
      }
    }
  }

  try {
    if (recordId) {
      await window.api.updateRecord(col.name, recordId, formData);
      showToast('Record updated successfully', 'success');
    } else {
      await window.api.createRecord(col.name, formData);
      showToast('Record created successfully', 'success');
    }
    closeDrawer();
    loadRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
}function deleteRecordAction(id) {
  showConfirmDialog({
    title: 'Delete Record',
    message: `Are you sure you want to permanently delete record <code class="mono">${escapeHtml(id)}</code>?`,
    confirmText: 'Delete Record',
    confirmBtnClass: 'btn-danger',
    icon: '🗑️',
    onConfirm: async () => {
      try {
        await window.api.deleteRecord(state.activeCollection.name, id);
        showToast('Record deleted', 'success');
        loadRecords();
      } catch (err) {
        showToast(err.message, 'error');
      }
    },
  });
}

function exportCollectionData() {
  if (!state.records || state.records.length === 0) {
    showToast('No records to export', 'info');
    return;
  }

  const jsonStr = JSON.stringify(state.records, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.activeCollection.name}_export.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Exported JSON successfully', 'success');
}

// 7. Visual Schema Builder Modal (PocketBase-style clean UI)
function openCollectionModal(existingCollection = null) {
  const isEdit = Boolean(existingCollection);
  const col = existingCollection || {
    name: '', type: 'base', schema: [],
    listRule: '', viewRule: '', createRule: '', updateRule: '', deleteRule: '',
  };

  let fieldRows = (col.schema || []).map((f, idx) => generateFieldCardHtml(f, idx)).join('');

  const sysFieldRow = (name, type, nonempty, hidden) => {
    const tags = [];
    if (nonempty) tags.push('<span style="font-size:10px; padding:1px 6px; border-radius:4px; background:rgba(251,191,36,0.12); color:#FBBF24; font-weight:500;">Nonempty</span>');
    if (hidden) tags.push('<span style="font-size:10px; padding:1px 6px; border-radius:4px; background:rgba(148,163,184,0.12); color:#94A3B8; font-weight:500;">Hidden</span>');
    return '<div style="display:flex;align-items:center;gap:10px;padding:9px 14px;background:rgba(255,255,255,0.015);border-bottom:1px solid rgba(255,255,255,0.04);"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-dim);flex-shrink:0;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg><span style="font-size:13px;font-weight:500;color:var(--text-secondary);min-width:130px;">' + name + '</span><span style="font-size:11px;color:var(--text-dim);min-width:70px;">' + type + '</span><div style="display:flex;gap:4px;margin-left:auto;">' + tags.join('') + '</div></div>';
  };

  let systemHtml = '';
  if (isEdit) {
    let rows = sysFieldRow('id', 'Text', true, true);
    if (col.type === 'auth') {
      rows += sysFieldRow('email', 'Email', true, false);
      rows += sysFieldRow('emailVisibility', 'Yes/No', false, false);
      rows += sysFieldRow('verified', 'Yes/No', true, false);
      rows += sysFieldRow('password', 'Password', true, true);
      rows += sysFieldRow('tokenKey', 'Text', true, true);
    }
    rows += sysFieldRow('created', 'Auto Date', true, true);
    rows += sysFieldRow('updated', 'Auto Date', true, true);
    systemHtml = '<div style="margin-bottom:16px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:pointer;" onclick="toggleSystemFields()"><h4 style="font-size:12px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em;">System Fields</h4><svg id="system-fields-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-dim);transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg></div><div id="system-fields-list" style="display:none;flex-direction:column;gap:0;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">' + rows + '</div></div>';
  }

  const ruleRow = (label, id, val) => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;"><span style="font-size:12px;color:var(--text-secondary);min-width:180px;flex-shrink:0;">${label}</span><select id="${id}" class="input" style="flex:1;font-size:12px;padding:6px 10px;"><option value="__null__"${!val && val !== '' ? ' selected' : ''}>Admin Only (Private)</option><option value="@request.auth.id != ''"${val === "@request.auth.id != ''" ? ' selected' : ''}>Auth Users Only</option><option value=""${val === '' ? ' selected' : ''}>Everyone (Public)</option></select></div>`;

  const starterTemplatesHtml = !isEdit ? `
    <div style="margin-bottom:16px; padding:12px 14px; border-radius:8px; background:rgba(56,189,248,0.05); border:1px solid rgba(56,189,248,0.18);">
      <div style="font-size:11px; font-weight:700; color:#38BDF8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between;">
        <span>Starter Templates</span>
        <span style="font-size:10px; color:var(--text-muted); font-weight:normal;">Auto-fills columns & rules</span>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        <button type="button" class="btn btn-sm btn-secondary" onclick="applyCollectionTemplate('products')">Products Store</button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="applyCollectionTemplate('blog')">Blog Posts</button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="applyCollectionTemplate('gallery')">Wallpaper Gallery</button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="applyCollectionTemplate('team')">Team Directory</button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="applyCollectionTemplate('contact')">Contact Submissions</button>
        <button type="button" class="btn btn-sm btn-secondary" onclick="applyCollectionTemplate('tasks')">Task Manager</button>
      </div>
    </div>
  ` : '';

  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:0;">
      ${starterTemplatesHtml}

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
        <div class="form-group">
          <label class="form-label" style="font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-dim); margin-bottom:5px;">Table Name</label>
          <input type="text" id="col-name" class="input" placeholder="e.g. products" value="${escapeHtml(col.name)}" ${isEdit ? 'disabled style="opacity:0.5;"' : 'required'} />
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:10px; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-dim); margin-bottom:5px;">Table Type</label>
          <select id="col-type" class="input" ${isEdit ? 'disabled style="opacity:0.5;"' : ''}>
            <option value="base" ${col.type === 'base' ? 'selected' : ''}>Normal Table (Data)</option>
            <option value="auth" ${col.type === 'auth' ? 'selected' : ''}>Users Table (Auth & Login)</option>
          </select>
        </div>
      </div>

      ${systemHtml}

      <div>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <h4 style="font-size:12px; font-weight:600; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.05em;">Columns & Fields</h4>
          <button class="btn btn-secondary" style="padding:3px 10px; font-size:11px; border-radius:6px;" onclick="addFieldToSchemaBuilder()">+ New column</button>
        </div>
        <div id="schema-fields-container" style="display:flex; flex-direction:column; gap:0; max-height:280px; overflow-y:auto; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          ${fieldRows || '<div id="no-fields-msg" style="padding:24px; text-align:center; color:var(--text-muted); font-size:12px; background:rgba(255,255,255,0.02);">No fields yet — choose a template above or click "+ New column".</div>'}
        </div>
      </div>

      <div style="border-top:1px solid var(--border-subtle); padding-top:14px; margin-top:16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;cursor:pointer;" onclick="toggleAccessRules()">
          <h4 style="font-size:12px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em;">API Access Permissions</h4>
          <svg id="access-rules-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-dim);transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <p style="font-size:11px; color:var(--text-dim); margin-bottom:8px;">Who can read and write to this table.</p>
        
        <div id="access-rules-panel" style="display:none; flex-direction:column;">
          <div style="margin-bottom:12px; display:flex; flex-wrap:wrap; gap:6px;">
            <button type="button" class="btn btn-sm btn-secondary" style="font-size:11px; padding:3px 8px;" onclick="applyRulePreset('public_read')">Public Read</button>
            <button type="button" class="btn btn-sm btn-secondary" style="font-size:11px; padding:3px 8px;" onclick="applyRulePreset('public_write')">Public Submit</button>
            <button type="button" class="btn btn-sm btn-secondary" style="font-size:11px; padding:3px 8px;" onclick="applyRulePreset('public_all')">Full Public</button>
            <button type="button" class="btn btn-sm btn-secondary" style="font-size:11px; padding:3px 8px;" onclick="applyRulePreset('users_only')">Auth Users</button>
            <button type="button" class="btn btn-sm btn-secondary" style="font-size:11px; padding:3px 8px;" onclick="applyRulePreset('admin_only')">Admin Only</button>
          </div>
          ${ruleRow('List (Browse)', 'rule-list', col.listRule)}
          ${ruleRow('View (Single)', 'rule-view', col.viewRule)}
          ${ruleRow('Create (Insert)', 'rule-create', col.createRule)}
          ${ruleRow('Update (Edit)', 'rule-update', col.updateRule)}
          ${ruleRow('<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle; margin-right:4px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Delete (Remove)', 'rule-delete', col.deleteRule)}
        </div>
      </div>
    </div>
  `;

  const footerHtml = `
    ${isEdit ? '<button class="btn btn-danger" style="margin-right:auto;" onclick="deleteCollectionAction(\'' + col.name + '\')">Delete Table</button>' : ''}
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="saveCollectionSchema('${isEdit ? col.name : ''}')">
      ${isEdit ? 'Save Changes' : 'Create Table'}
    </button>
  `;

  openModal(isEdit ? 'Edit Table Schema' : 'Create New Table', bodyHtml, footerHtml);
}

function toggleSystemFields() {
  const list = document.getElementById('system-fields-list');
  const chevron = document.getElementById('system-fields-chevron');
  if (!list) return;
  const show = list.style.display === 'none';
  list.style.display = show ? 'flex' : 'none';
  if (chevron) chevron.style.transform = show ? 'rotate(180deg)' : 'rotate(0deg)';
}

function toggleAccessRules() {
  const panel = document.getElementById('access-rules-panel');
  const chevron = document.getElementById('access-rules-chevron');
  if (!panel) return;
  const show = panel.style.display === 'none';
  panel.style.display = show ? 'flex' : 'none';
  if (chevron) chevron.style.transform = show ? 'rotate(180deg)' : 'rotate(0deg)';
}

function generateFieldCardHtml(field = { name: '', type: 'text', required: false, unique: false }, index = Date.now()) {
  const friendlyTypes = { text:'Text', number:'Number', bool:'Yes/No', email:'Email', url:'URL', date:'Date', select:'Select', json:'JSON', file:'File', relation:'Relation' };
  const collapsed = field.name ? true : false;

  return `
    <div class="field-card" id="field-card-${index}" style="background:rgba(255,255,255,0.015); border-bottom:1px solid rgba(255,255,255,0.04);">
      <div style="display:flex; align-items:center; gap:10px; padding:9px 14px; cursor:pointer;" onclick="toggleFieldExpand('field-card-${index}')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-dim); flex-shrink:0; transition:transform 0.2s;" class="field-chevron"><polyline points="6 9 12 15 18 9"></polyline></svg>
        <span style="font-size:13px; font-weight:500; color:var(--text-primary); min-width:100px;" class="field-display-name">${escapeHtml(field.name || 'new_field')}</span>
        <span style="font-size:11px; color:var(--text-dim);">${friendlyTypes[field.type] || field.type}</span>
        <div style="display:flex; gap:4px; margin-left:auto; align-items:center;" class="field-tags">
          ${field.required ? '<span style="font-size:10px; padding:1px 6px; border-radius:4px; background:rgba(251,191,36,0.12); color:#FBBF24; font-weight:500;">Nonempty</span>' : ''}
          ${field.unique ? '<span style="font-size:10px; padding:1px 6px; border-radius:4px; background:rgba(139,92,246,0.12); color:#A78BFA; font-weight:500;">Unique</span>' : ''}
        </div>
        <button class="btn-icon" style="color:var(--accent-rose); flex-shrink:0; width:22px; height:22px;" onclick="event.stopPropagation(); document.getElementById('field-card-${index}').remove()" title="Remove">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div class="field-card-body" style="display:${collapsed ? 'none' : 'flex'}; flex-direction:column; gap:10px; padding:0 14px 12px 36px;">
        <div style="display:grid; grid-template-columns:1fr 130px; gap:8px;">
          <div>
            <label style="font-size:10px; text-transform:uppercase; color:var(--text-dim); letter-spacing:0.04em; margin-bottom:4px; display:block;">Name</label>
            <input type="text" class="input field-name" placeholder="field_name" value="${escapeHtml(field.name || '')}" required style="font-size:13px;" oninput="this.closest('.field-card').querySelector('.field-display-name').textContent = this.value || 'new_field'" />
          </div>
          <div>
            <label style="font-size:10px; text-transform:uppercase; color:var(--text-dim); letter-spacing:0.04em; margin-bottom:4px; display:block;">Type</label>
            <select class="input field-type" style="font-size:13px;">
              <option value="text" ${field.type === 'text' ? 'selected' : ''}>Text</option>
              <option value="number" ${field.type === 'number' ? 'selected' : ''}>Number</option>
              <option value="bool" ${field.type === 'bool' ? 'selected' : ''}>Yes/No</option>
              <option value="email" ${field.type === 'email' ? 'selected' : ''}>Email</option>
              <option value="url" ${field.type === 'url' ? 'selected' : ''}>URL</option>
              <option value="date" ${field.type === 'date' ? 'selected' : ''}>Date</option>
              <option value="select" ${field.type === 'select' ? 'selected' : ''}>Select</option>
              <option value="json" ${field.type === 'json' ? 'selected' : ''}>JSON</option>
              <option value="file" ${field.type === 'file' ? 'selected' : ''}>File</option>
              <option value="relation" ${field.type === 'relation' ? 'selected' : ''}>Relation</option>
            </select>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:16px; font-size:12px; color:var(--text-secondary);">
          <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
            <input type="checkbox" class="field-req" ${field.required ? 'checked' : ''} />
            <span>Nonempty</span>
          </label>
          <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
            <input type="checkbox" class="field-uniq" ${field.unique ? 'checked' : ''} />
            <span>Unique</span>
          </label>
        </div>
      </div>
    </div>
  `;
}

function toggleFieldExpand(cardId) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const body = card.querySelector('.field-card-body');
  const chevron = card.querySelector('.field-chevron');
  if (!body) return;
  const show = body.style.display === 'none';
  body.style.display = show ? 'flex' : 'none';
  if (chevron) chevron.style.transform = show ? 'rotate(180deg)' : 'rotate(0deg)';
}


function addFieldToSchemaBuilder() {
  const container = document.getElementById('schema-fields-container');
  const msg = document.getElementById('no-fields-msg');
  if (msg) msg.remove();

  const div = document.createElement('div');
  div.innerHTML = generateFieldCardHtml();
  container.appendChild(div.firstElementChild);
}


async function saveCollectionSchema(existingName) {
  const name = document.getElementById('col-name').value.trim();
  const type = document.getElementById('col-type').value;

  if (!name) {
    showToast('Table name is required', 'error');
    return;
  }

  // Gather fields
  const fieldCards = document.querySelectorAll('#schema-fields-container .field-card');
  const schema = [];

  for (const card of fieldCards) {
    const fName = card.querySelector('.field-name').value.trim();
    const fType = card.querySelector('.field-type').value;
    const fReq = card.querySelector('.field-req').checked;
    const fUniq = card.querySelector('.field-uniq').checked;

    if (!fName) {
      showToast('All columns must have a name', 'error');
      return;
    }

    schema.push({
      name: fName,
      type: fType,
      required: fReq,
      unique: fUniq,
    });
  }

  // Convert dropdown values: __null__   null (Admin Only), ''   '' (Public), expression   expression
  const ruleVal = (id) => { const v = document.getElementById(id).value; return v === '__null__' ? null : v; };

  const payload = {
    name,
    type,
    schema,
    listRule: ruleVal('rule-list'),
    viewRule: ruleVal('rule-view'),
    createRule: ruleVal('rule-create'),
    updateRule: ruleVal('rule-update'),
    deleteRule: ruleVal('rule-delete'),
  };

  try {
    if (existingName) {
      await window.api.updateCollection(existingName, payload);
      showToast(`Table "${name}" updated!`, 'success');
    } else {
      await window.api.createCollection(payload);
      showToast(`Table "${name}" created!`, 'success');
    }

    closeModal();
    await loadCollections();
    selectCollection(name);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function deleteCollectionAction(name) {
  showConfirmDialog({
    title: 'Delete Table',
    message: `Are you sure you want to DELETE table <strong>"${escapeHtml(name)}"</strong> and ALL its rows? This action cannot be undone.`,
    confirmText: 'Delete Table',
    confirmBtnClass: 'btn-danger',
    icon: '🚨',
    onConfirm: async () => {
      try {
        await window.api.deleteCollection(name);
        showToast(`Table "${name}" deleted`, 'success');
        closeModal();
        state.activeCollection = null;
        await loadCollections();
      } catch (err) {
        showToast(err.message, 'error');
      }
    },
  });
}

// 8. Realtime Stream View
function initRealtimeFeed() {
  window.api.initRealtime((action, data) => {
    if (action === 'MB_CONNECT' || action === 'PB_CONNECT') return;

    state.realtimeEvents.unshift({
      action: data.action || action,
      collection: data.collection,
      record: data.record,
      timestamp: data.timestamp || new Date().toISOString(),
    });

    if (state.realtimeEvents.length > 100) state.realtimeEvents.pop();

    const badge = document.getElementById('realtime-counter');
    if (badge) badge.innerText = state.realtimeEvents.length;

    if (state.view === 'realtime') {
      renderRealtimeView();
    } else if (state.view === 'records' && state.activeCollection?.name === data.collection) {
      // Reload table in background
      loadRecords();
    }
  });
}

function renderRealtimeView() {
  const contentView = document.getElementById('content-view');
  if (!contentView) return;

  contentView.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:16px; display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="pulse-dot"></span>
          <div>
            <h3 style="font-size:14px; font-weight:700; color:var(--text-primary);">Live SSE Broadcast Channel</h3>
            <p style="font-size:12px; color:var(--text-secondary);">Connected to <code>/api/realtime</code>. Events will appear here live when created, modified, or deleted.</p>
          </div>
        </div>
        <span class="cell-badge mono">${state.realtimeEvents.length} Events Received</span>
      </div>

      <div class="realtime-feed">
        ${state.realtimeEvents.length === 0 ? `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            <h3>Listening for database changes...</h3>
            <p style="font-size:13px; color:var(--text-muted);">Try creating, updating, or deleting records from the Data Explorer or API to see live events streamed here.</p>
          </div>
        ` : state.realtimeEvents.map(e => `
          <div class="event-card">
            <div class="event-header">
              <div style="display:flex; align-items:center; gap:8px;">
                <span class="event-badge badge-${e.action}">${e.action}</span>
                <span style="font-weight:700; font-size:13px; color:var(--text-primary);">${escapeHtml(e.collection)}</span>
                <span class="mono" style="font-size:12px; color:var(--text-muted);">${e.record?.id || ''}</span>
              </div>
              <span class="mono" style="font-size:11px; color:var(--text-muted);">${formatDate(e.timestamp)}</span>
            </div>
            <pre class="code-block" style="margin:0; padding:8px 12px; font-size:11px; max-height:160px;">${escapeHtml(JSON.stringify(e.record, null, 2))}</pre>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 9. API Playground & Code Generator
function renderExplorerView() {
  const contentView = document.getElementById('content-view');
  if (!contentView) return;

  const colName = state.activeCollection?.name || (state.collections[0]?.name || 'posts');
  const origin = window.location.origin;

  contentView.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:20px;">
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
        <h3 style="font-size:16px; font-weight:700; margin-bottom:6px;">MiniBase Code Generator</h3>
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px;">Instantly copy production-ready code to integrate your frontend or backend with MiniBase.</p>
        
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
          <label class="form-label" style="margin:0;">Select Collection:</label>
          <select id="explorer-col-select" class="input" style="width:200px;" onchange="updateExplorerCode(this.value)">
            ${state.collections.map(c => `<option value="${c.name}" ${c.name === colName ? 'selected' : ''}>${c.name} (${c.type})</option>`).join('')}
          </select>
        </div>

        <div style="display:flex; flex-direction:column; gap:14px;" id="explorer-code-blocks">
          <!-- Code will be injected here -->
        </div>
      </div>
    </div>
  `;

  updateExplorerCode(colName);
}

function updateExplorerCode(colName) {
  const origin = window.location.origin;
  const container = document.getElementById('explorer-code-blocks');
  if (!container) return;

  const jsCode = `// 1. Install & Initialize Client SDK
import { MiniBaseClient } from './minibase-sdk.js';

const mb = new MiniBaseClient('${origin}');

// List Records (with pagination & filter)
const result = await mb.collection('${colName}').getList(1, 30, {
  filter: "created >= '2026-01-01'",
  sort: "-created"
});
console.log(result.items);

// Create New Record
const newRecord = await mb.collection('${colName}').create({
  // your fields here...
});

// Subscribe to Realtime Changes!
mb.collection('${colName}').subscribe('*', (e) => {
  console.log('Realtime event:', e.action, e.record);
});`;

  const curlCode = `# Fetch records via cURL
curl -X GET "${origin}/api/collections/${colName}/records?page=1&perPage=30" \\
  -H "Authorization: Bearer YOUR_TOKEN"

# Insert a record via cURL
curl -X POST "${origin}/api/collections/${colName}/records" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{"title": "Hello MiniBase"}'`;

  const pyCode = `# Python requests integration
import requests

url = "${origin}/api/collections/${colName}/records"
headers = { "Authorization": "Bearer YOUR_TOKEN" }

response = requests.get(url, headers=headers)
print(response.json())`;

  window.__codeSnippets['rules_js'] = jsCode;
  window.__codeSnippets['rules_curl'] = curlCode;
  window.__codeSnippets['rules_py'] = pyCode;

  container.innerHTML = `
    <div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
        <span style="font-weight:600; font-size:12px; color:var(--accent-emerald);">JavaScript / TypeScript SDK</span>
        <button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="copyToClipboard(window.__codeSnippets['rules_js'])">Copy JS Code</button>
      </div>
      <pre class="code-block">${escapeHtml(jsCode)}</pre>
    </div>

    <div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
        <span style="font-weight:600; font-size:12px; color:var(--accent-cyan);">cURL REST Endpoint</span>
        <button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="copyToClipboard(window.__codeSnippets['rules_curl'])">Copy cURL</button>
      </div>
      <pre class="code-block">${escapeHtml(curlCode)}</pre>
    </div>

    <div>
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
        <span style="font-weight:600; font-size:12px; color:var(--accent-indigo);">Python</span>
        <button class="btn btn-secondary" style="padding:2px 8px; font-size:11px;" onclick="copyToClipboard(window.__codeSnippets['rules_py'])">Copy Python</button>
      </div>
      <pre class="code-block">${escapeHtml(pyCode)}</pre>
    </div>
  `;
}

// 10. Request Logs Inspector View
async function loadLogsView() {
  const contentView = document.getElementById('content-view');
  if (!contentView) return;

  try {
    const res = await window.api.getLogs(state.logsPage, 50);
    state.logs = res.items || [];
    state.logsTotalPages = res.totalPages || 1;

    contentView.innerHTML = `
      <div class="table-container">
        <div class="table-toolbar">
          <div style="font-weight:700; font-size:13px;">Recent API Requests (${res.totalItems || 0})</div>
          <button class="btn btn-secondary" onclick="loadLogsView()">Refresh Logs</button>
        </div>
        <div class="table-scroll">
          ${state.logs.length === 0 ? `
            <div class="empty-state">
              <h3>No request logs recorded yet</h3>
            </div>
          ` : `
            <table class="data-grid">
              <thead>
                <tr>
                  <th style="width:70px;">Status</th>
                  <th style="width:80px;">Method</th>
                  <th>Path / URL</th>
                  <th style="width:90px;">Time (ms)</th>
                  <th style="width:100px;">Auth</th>
                  <th style="width:120px;">IP</th>
                  <th style="width:140px;">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                ${state.logs.map(l => `
                  <tr>
                    <td>
                      <span class="cell-badge" style="${l.status < 300 ? 'background:rgba(16,185,129,0.15); color:#34D399;' : l.status < 400 ? 'background:rgba(56,189,248,0.15); color:#7DD3FC;' : 'background:rgba(244,63,94,0.15); color:#FDA4AF;'} font-weight:700;">
                        ${l.status}
                      </span>
                    </td>
                    <td><strong>${escapeHtml(l.method)}</strong></td>
                    <td class="mono" style="font-size:12px;">${escapeHtml(l.url)}</td>
                    <td class="mono" style="font-size:12px;">${l.execTimeMs}ms</td>
                    <td><span class="cell-badge">${l.authType || 'guest'}</span></td>
                    <td class="mono" style="font-size:11px; color:var(--text-muted);">${escapeHtml(l.ip)}</td>
                    <td class="mono" style="font-size:11px; color:var(--text-muted);">${formatDate(l.created)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function clearLogsAction() {
  showConfirmDialog({
    title: 'Clear Request Logs',
    message: 'Are you sure you want to clear all request activity logs from the database?',
    confirmText: 'Clear Logs',
    confirmBtnClass: 'btn-danger',
    icon: '🧹',
    onConfirm: async () => {
      try {
        await window.api.clearLogs();
        showToast('Logs cleared', 'success');
        loadLogsView();
      } catch (err) {
        showToast(err.message, 'error');
      }
    },
  });
}

// 11. Settings View
async function loadSettingsView() {
  const contentView = document.getElementById('content-view');
  if (!contentView) return;

  try {
    const stats = await window.api.getStats();
    const settings = await window.api.getSettings().catch(() => ({}));
    const adminsRes = await window.api.getAdmins();
    const admins = adminsRes.items || [];

    const dbSizeMb = (stats.dbSizeBytes / (1024 * 1024)).toFixed(2);
    const smtp = settings.smtp || {};

    contentView.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px; max-width:960px; padding-bottom:40px;">
        
        <!-- System Health Stats -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:16px;">
            <div style="font-size:12px; color:var(--text-muted);">Database Size</div>
            <div style="font-size:22px; font-weight:700; color:var(--accent-emerald); font-family:var(--font-mono); margin-top:4px;">${dbSizeMb} MB</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">SQLite WAL Mode</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:16px;">
            <div style="font-size:12px; color:var(--text-muted);">Total Collections</div>
            <div style="font-size:22px; font-weight:700; color:var(--accent-cyan); font-family:var(--font-mono); margin-top:4px;">${stats.totalCollections}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Base & Auth Tables</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:16px;">
            <div style="font-size:12px; color:var(--text-muted);">Total Records</div>
            <div style="font-size:22px; font-weight:700; color:var(--accent-indigo); font-family:var(--font-mono); margin-top:4px;">${stats.totalRecords}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">All rows indexed</div>
          </div>
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:16px;">
            <div style="font-size:12px; color:var(--text-muted);">Realtime Subscribers</div>
            <div style="font-size:22px; font-weight:700; color:var(--accent-amber); font-family:var(--font-mono); margin-top:4px;">${stats.activeRealtimeClients}</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">Active SSE connections</div>
          </div>
        </div>

        <!-- Application & Storage Paths Card -->
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
            <div>
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
                <span>📂</span>
                <span>Application & Directory Paths</span>
              </h3>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Configure your project paths, server URL, and data storage location</p>
            </div>
            <button class="btn btn-primary" onclick="saveAppSettings()">
              <span>Save Paths & Settings</span>
            </button>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">Application Name</label>
              <input type="text" id="set-app-name" class="input" placeholder="MiniBase" value="${escapeHtml(settings.appName || stats.appName || 'MiniBase')}" />
              <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Shown in emails, logs, and dashboard header</div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">Application Public URL</label>
              <input type="url" id="set-app-url" class="input" placeholder="http://localhost:8090" value="${escapeHtml(settings.appUrl || window.location.origin)}" />
              <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Used to generate password reset and verification links</div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">Data Directory Path</label>
              <input type="text" id="set-data-dir" class="input mono" placeholder="./minibase_data" value="${escapeHtml(settings.dataDir || stats.dataDir || './minibase_data')}" />
              <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Root folder where SQLite database and file uploads are saved</div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">Storage / Uploads Path</label>
              <input type="text" id="set-storage-dir" class="input mono" placeholder="./minibase_data/storage" value="${escapeHtml(settings.storageDir || stats.storageDir || './minibase_data/storage')}" />
              <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">Directory where media files and uploaded attachments reside</div>
            </div>
          </div>

          <div style="margin-top:12px; padding:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:8px; display:flex; align-items:center; justify-content:space-between;">
            <div>
              <div style="font-size:12px; font-weight:600; color:var(--text-secondary);">Active SQLite Database File</div>
              <div style="font-size:11.5px; color:var(--accent-emerald); font-family:var(--font-mono); margin-top:2px;">${escapeHtml(stats.dbPath)}</div>
            </div>
            <a href="/api/admins/backup" class="btn btn-sm btn-secondary" target="_blank" style="display:flex; align-items:center; gap:6px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>Download Backup</span>
            </a>
          </div>
        </div>

        <!-- Mail & SMTP Settings Card -->
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
            <div>
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
                <span>✉️</span>
                <span>Mail / SMTP Settings</span>
              </h3>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Real SMTP delivery for password reset emails and account verification</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary" onclick="openTestEmailModal()">
                <span>Send Test Email</span>
              </button>
              <button class="btn btn-primary" onclick="saveSmtpSettings()">
                <span>Save Mail Settings</span>
              </button>
            </div>
          </div>

          <div style="margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; font-weight:600; color:var(--text-primary);">
              <input type="checkbox" id="smtp-enabled" ${smtp.enabled ? 'checked' : ''} onchange="toggleSmtpFields(this.checked)" />
              <span>Enable SMTP Mail Delivery</span>
            </label>

            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:11.5px; color:var(--text-muted);">Provider Preset:</span>
              <select id="smtp-preset-select" class="input select" style="font-size:12px; padding:4px 10px; width:160px;" onchange="applySmtpPreset(this.value)">
                <option value="custom">Custom SMTP</option>
                <option value="gmail">Google Gmail</option>
                <option value="resend">Resend API</option>
                <option value="sendgrid">SendGrid</option>
                <option value="brevo">Brevo</option>
                <option value="mailgun">Mailgun</option>
                <option value="outlook">Microsoft 365 / Outlook</option>
              </select>
            </div>
          </div>

          <div id="smtp-preset-hint" style="display:none; margin-bottom:14px; padding:10px 14px; border-radius:6px; background:rgba(56,189,248,0.08); border:1px solid rgba(56,189,248,0.2); font-size:12px; line-height:1.4; color:#E0F2FE;">
          </div>

          <div id="smtp-fields-panel" style="display:${smtp.enabled ? 'grid' : 'none'}; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">SMTP Host</label>
              <input type="text" id="smtp-host" class="input mono" placeholder="smtp.gmail.com or smtp.resend.com" value="${escapeHtml(smtp.host || '')}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">Port</label>
              <input type="number" id="smtp-port" class="input mono" placeholder="587" value="${smtp.port || 587}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">Username / Email</label>
              <input type="text" id="smtp-username" class="input mono" placeholder="user@gmail.com or apikey" value="${escapeHtml(smtp.username || '')}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">Password / App Password</label>
              <div style="position:relative; display:flex; align-items:center;">
                <input type="password" id="smtp-password" class="input mono" style="padding-right:32px;" placeholder="••••••••" value="${escapeHtml(smtp.password || '')}" />
                <button type="button" class="btn-icon" style="position:absolute; right:6px; width:22px; height:22px; color:var(--text-muted);" onclick="togglePasswordVisibility('smtp-password', this)" title="Toggle password visibility">
                  👁️
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">Sender Name</label>
              <input type="text" id="smtp-from-name" class="input" placeholder="MiniBase Support" value="${escapeHtml(smtp.fromName || 'MiniBase Support')}" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:var(--text-dim);">Sender Email Address</label>
              <input type="email" id="smtp-from-address" class="input mono" placeholder="support@minibase.io" value="${escapeHtml(smtp.fromAddress || 'support@minibase.io')}" />
            </div>

            <div class="form-group" style="grid-column: span 2;">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12.5px; color:var(--text-secondary);">
                <input type="checkbox" id="smtp-tls" ${smtp.tls !== false ? 'checked' : ''} />
                <span>Enforce TLS Encryption (Recommended)</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Admin Accounts Management Card -->
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-lg); padding:20px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
            <div>
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
                <span>👤</span>
                <span>Super Admin Accounts</span>
              </h3>
              <p style="font-size:12px; color:var(--text-secondary); margin-top:2px;">Administrators with full management access to MiniBase Studio</p>
            </div>
            <button class="btn btn-primary" onclick="openCreateAdminModal()">+ New Admin</button>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px;">
            ${admins.map(adm => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:var(--bg-input); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
                <div style="display:flex; align-items:center; gap:10px;">
                  <div class="user-avatar" style="width:28px; height:28px; font-size:12px;">${adm.email[0].toUpperCase()}</div>
                  <div>
                    <div style="font-weight:600; font-size:13px;">${escapeHtml(adm.email)}</div>
                    <div style="font-size:11px; color:var(--text-muted);">Created: ${formatDate(adm.created)}</div>
                  </div>
                </div>
                ${admins.length > 1 && adm.id !== window.api.admin?.id ? `
                  <button class="btn-icon" style="color:var(--accent-rose);" onclick="deleteAdminAction('${adm.id}')" title="Delete Admin">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                ` : '<span class="cell-badge">Active Session</span>'}
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function toggleSmtpFields(show) {
  const panel = document.getElementById('smtp-fields-panel');
  if (panel) {
    panel.style.display = show ? 'grid' : 'none';
  }
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🔒';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

function applySmtpPreset(preset) {
  const hostEl = document.getElementById('smtp-host');
  const portEl = document.getElementById('smtp-port');
  const userEl = document.getElementById('smtp-username');
  const tlsEl = document.getElementById('smtp-tls');
  const hintEl = document.getElementById('smtp-preset-hint');
  const enabledEl = document.getElementById('smtp-enabled');

  if (enabledEl && !enabledEl.checked) {
    enabledEl.checked = true;
    toggleSmtpFields(true);
  }

  if (preset === 'gmail') {
    if (hostEl) hostEl.value = 'smtp.gmail.com';
    if (portEl) portEl.value = '465';
    if (tlsEl) tlsEl.checked = true;
    if (hintEl) {
      hintEl.style.display = 'block';
      hintEl.innerHTML = '<strong>Gmail Setup:</strong> In Google Account &rarr; Security &rarr; 2-Step Verification, generate a 16-character <strong>App Password</strong> and paste it in the Password field.';
    }
  } else if (preset === 'resend') {
    if (hostEl) hostEl.value = 'smtp.resend.com';
    if (portEl) portEl.value = '465';
    if (userEl) userEl.value = 'resend';
    if (tlsEl) tlsEl.checked = true;
    if (hintEl) {
      hintEl.style.display = 'block';
      hintEl.innerHTML = '<strong>Resend Setup:</strong> Username is <code>resend</code>. Password is your Resend API Key (<code>re_...</code>).';
    }
  } else if (preset === 'sendgrid') {
    if (hostEl) hostEl.value = 'smtp.sendgrid.net';
    if (portEl) portEl.value = '587';
    if (userEl) userEl.value = 'apikey';
    if (tlsEl) tlsEl.checked = true;
    if (hintEl) {
      hintEl.style.display = 'block';
      hintEl.innerHTML = '<strong>SendGrid Setup:</strong> Username is literally <code>apikey</code>. Password is your SendGrid API Key (<code>SG....</code>).';
    }
  } else if (preset === 'brevo') {
    if (hostEl) hostEl.value = 'smtp-relay.brevo.com';
    if (portEl) portEl.value = '587';
    if (tlsEl) tlsEl.checked = true;
    if (hintEl) {
      hintEl.style.display = 'block';
      hintEl.innerHTML = '<strong>Brevo Setup:</strong> Use your Brevo SMTP login email and Master SMTP Key from Brevo &rarr; SMTP & API.';
    }
  } else if (preset === 'mailgun') {
    if (hostEl) hostEl.value = 'smtp.mailgun.org';
    if (portEl) portEl.value = '587';
    if (tlsEl) tlsEl.checked = true;
    if (hintEl) {
      hintEl.style.display = 'block';
      hintEl.innerHTML = '<strong>Mailgun Setup:</strong> Use your domain SMTP credentials from Mailgun &rarr; Sending &rarr; Domains &rarr; SMTP.';
    }
  } else if (preset === 'outlook') {
    if (hostEl) hostEl.value = 'smtp.office365.com';
    if (portEl) portEl.value = '587';
    if (tlsEl) tlsEl.checked = true;
    if (hintEl) {
      hintEl.style.display = 'block';
      hintEl.innerHTML = '<strong>Outlook Setup:</strong> Enter your full Microsoft 365 / Outlook email and password.';
    }
  } else {
    if (hintEl) hintEl.style.display = 'none';
  }
}

async function saveAppSettings() {
  const appName = document.getElementById('set-app-name')?.value.trim() || 'MiniBase';
  const appUrl = document.getElementById('set-app-url')?.value.trim() || window.location.origin;
  const dataDir = document.getElementById('set-data-dir')?.value.trim() || './minibase_data';
  const storageDir = document.getElementById('set-storage-dir')?.value.trim() || './minibase_data/storage';

  try {
    await window.api.updateSettings({
      appName,
      appUrl,
      dataDir,
      storageDir,
    });
    showToast('Paths & Application Settings saved successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function saveSmtpSettings() {
  const enabled = document.getElementById('smtp-enabled')?.checked || false;
  const host = document.getElementById('smtp-host')?.value.trim() || '';
  const port = parseInt(document.getElementById('smtp-port')?.value || '587', 10);
  const username = document.getElementById('smtp-username')?.value.trim() || '';
  const password = document.getElementById('smtp-password')?.value || '';
  const fromName = document.getElementById('smtp-from-name')?.value.trim() || 'MiniBase Support';
  const fromAddress = document.getElementById('smtp-from-address')?.value.trim() || 'support@minibase.io';
  const tls = document.getElementById('smtp-tls')?.checked !== false;

  try {
    await window.api.updateSettings({
      smtp: {
        enabled,
        host,
        port,
        username,
        password,
        fromName,
        fromAddress,
        tls,
      },
    });
    showToast('Mail / SMTP settings saved successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openTestEmailModal() {
  const bodyHtml = `
    <div style="display:flex; flex-direction:column; gap:14px;">
      <p style="font-size:13px; color:var(--text-secondary); line-height:1.5;">
        Send a verified test email through your configured SMTP server to verify your live email delivery pipeline.
      </p>
      <div class="form-group">
        <label class="form-label">Recipient Email Address</label>
        <input type="email" id="test-email-to" class="input" placeholder="your-email@example.com" value="${escapeHtml(window.api.admin?.email || '')}" required />
      </div>
    </div>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button id="submit-test-email-btn" class="btn btn-primary" onclick="submitTestEmail()">Send Test Email</button>
  `;

  openModal('Send Test Email', bodyHtml, footerHtml);
}

async function submitTestEmail() {
  const email = document.getElementById('test-email-to')?.value.trim();
  if (!email) {
    showToast('Recipient email is required', 'error');
    return;
  }

  const btn = document.getElementById('submit-test-email-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Connecting & Sending...';
  }

  showToast('Connecting to SMTP and sending test email...', 'info');
  try {
    const res = await window.api.testEmail(email);
    showToast(res.message || 'Test email sent successfully! Check your inbox.', 'success');
    closeModal();
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send Test Email';
    }
  }
}

function openCreateAdminModal() {
  const bodyHtml = `
    <form id="create-admin-form" style="display:flex; flex-direction:column; gap:14px;">
      <div class="form-group">
        <label class="form-label">Admin Email</label>
        <input type="email" id="new-admin-email" class="input" placeholder="admin2@minibase.io" required />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input type="password" id="new-admin-password" class="input" placeholder="Min 8 characters" minlength="8" required />
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
    <button class="btn btn-primary" onclick="submitNewAdmin()">Create Admin</button>
  `;

  openModal('Create New Super Admin', bodyHtml, footerHtml);
}

async function submitNewAdmin() {
  const email = document.getElementById('new-admin-email').value;
  const pass = document.getElementById('new-admin-password').value;

  try {
    await window.api.createAdmin(email, pass);
    showToast('Admin created successfully', 'success');
    closeModal();
    loadSettingsView();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function deleteAdminAction(id) {
  showConfirmDialog({
    title: 'Remove Administrator',
    message: 'Are you sure you want to remove this admin account? They will lose all management access to MiniBase.',
    confirmText: 'Remove Admin',
    confirmBtnClass: 'btn-danger',
    icon: '👤',
    onConfirm: async () => {
      try {
        await window.api.deleteAdmin(id);
        showToast('Admin removed', 'success');
        loadSettingsView();
      } catch (err) {
        showToast(err.message, 'error');
      }
    },
  });
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

