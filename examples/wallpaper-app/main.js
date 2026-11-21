import { MiniBaseClient } from './minibase-sdk.js';

// Connect dynamically to MiniBase backend (current origin or localhost:8090)
const backendOrigin = window.location.origin.includes('5173') ? 'http://localhost:8090' : window.location.origin;
const mb = new MiniBaseClient(backendOrigin);

// Elements
const masonry = document.getElementById('masonry');
const loader = document.getElementById('loader');
const telemetryCollection = document.getElementById('telemetry-collection');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const catButtons = document.querySelectorAll('.cat-btn[data-cat]');
const sseStatus = document.getElementById('sse-status');
const sseText = document.getElementById('sse-text');

// Preview Modal Elements
const previewModal = document.getElementById('preview-modal');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModalBtn = document.getElementById('close-modal');
const modalImg = document.getElementById('preview-img');
const modalTitle = document.getElementById('preview-title');
const modalCat = document.getElementById('preview-cat');
const modalRecId = document.getElementById('preview-rec-id');
const modalDownloads = document.getElementById('preview-downloads');
const downloadBtn = document.getElementById('download-btn');

// Upload Modal Elements
const uploadModal = document.getElementById('upload-modal');
const uploadModalBackdrop = document.getElementById('uploadModalBackdrop');
const openUploadBtn = document.getElementById('open-upload-btn');
const closeUploadModalBtn = document.getElementById('close-upload-modal');
const cancelUploadBtn = document.getElementById('cancel-upload');
const uploadForm = document.getElementById('upload-form');
const upTitle = document.getElementById('up-title');
const upCategory = document.getElementById('up-category');
const upFile = document.getElementById('up-file');
const fileDropText = document.getElementById('file-drop-text');
const uploadStatus = document.getElementById('upload-status');
const submitUploadBtn = document.getElementById('submit-upload');
const submitText = document.getElementById('submit-text');

let currentWallpapers = [];
let activeRecord = null;
let currentSearchQuery = '';
let activeCategory = 'all';

// ==================== LOAD WALLPAPERS ====================
async function loadWallpapers(category = activeCategory, search = currentSearchQuery) {
  if (loader) loader.style.display = 'flex';
  
  try {
    const params = new URLSearchParams({ sort: '-created', perPage: '50' });

    if (category && category !== 'all') {
      params.append('filter', `category = '${category}'`);
    }

    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    const res = await mb.request(`/api/collections/wallpapers/records?${params.toString()}`);
    currentWallpapers = res.items || [];

    if (telemetryCollection) {
      telemetryCollection.textContent = `wallpapers (${currentWallpapers.length} records)`;
    }

    renderGrid(currentWallpapers);
  } catch (err) {
    console.error('[MiniBase] Failed to fetch wallpapers:', err);
    renderGrid([], true);
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

// ==================== RENDER GRID ====================
function renderGrid(items, isError = false) {
  if (isError) {
    masonry.innerHTML = `
      <div class="empty-state">
        <h3>BACKEND CONNECTION NOTICE</h3>
        <p>Could not connect to MiniBase on <code>${backendOrigin}</code>. Ensure the server is running with <code>node minibase.js serve</code>.</p>
        <button class="retro-btn" onclick="location.reload()" style="margin-top:10px;">RETRY CONNECTION</button>
      </div>
    `;
    return;
  }

  if (!items || items.length === 0) {
    masonry.innerHTML = `
      <div class="empty-state">
        <h3>NO RECORDS FOUND</h3>
        <p>${currentSearchQuery ? `No matching wallpapers found for query "${currentSearchQuery}".` : 'No wallpapers found in this category.'}</p>
        <button id="reset-filter-btn" class="retro-btn" style="margin-top:10px;">RESET FILTERS</button>
      </div>
    `;
    const resetBtn = document.getElementById('reset-filter-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        currentSearchQuery = '';
        setActiveCategory('all');
      });
    }
    return;
  }

  masonry.innerHTML = items.map(item => {
    const imgUrl = mb.getFileUrl('wallpapers', item.id, item.image);

    return `
      <div class="wallpaper-card" data-id="${item.id}">
        <div class="card-frame-bar">
          <div class="card-dots">
            <div class="card-dot"></div>
            <div class="card-dot"></div>
            <div class="card-dot"></div>
          </div>
          <span class="badge" style="font-size:9px; padding:1px 5px;">${item.category || 'NATURE'}</span>
        </div>

        <div class="card-image-box">
          <img src="${imgUrl}" alt="${item.title}" loading="lazy" />
        </div>

        <div class="card-details">
          <div class="card-header-row">
            <h3 class="card-title">${item.title}</h3>
          </div>

          <div class="card-meta-row">
            <span class="card-id-text">ID: ${item.id.slice(0, 10)}...</span>
            <span style="display:inline-flex; align-items:center; gap:4px; font-weight:800;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              ${item.downloads || 0}
            </span>
          </div>

          <div class="card-actions-row">
            <button class="card-action-btn view-btn" data-id="${item.id}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <span>PREVIEW</span>
            </button>
            <button class="card-action-btn quick-dl-btn" data-id="${item.id}" title="Direct Download">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>GET</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Wire Card Clicks
  document.querySelectorAll('.wallpaper-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.quick-dl-btn')) return;
      const id = card.getAttribute('data-id');
      const record = currentWallpapers.find(r => r.id === id);
      if (record) openPreviewModal(record);
    });
  });

  document.querySelectorAll('.quick-dl-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const record = currentWallpapers.find(r => r.id === id);
      if (record) triggerDownload(record);
    });
  });
}

// ==================== PREVIEW MODAL ====================
function openPreviewModal(record) {
  activeRecord = record;
  const imgUrl = mb.getFileUrl('wallpapers', record.id, record.image);

  modalImg.src = imgUrl;
  modalTitle.textContent = record.title;
  modalCat.textContent = record.category || 'Nature';
  modalRecId.textContent = `ID: ${record.id}`;
  modalDownloads.textContent = record.downloads || 0;

  previewModal.classList.add('active');
}

function closePreviewModal() {
  previewModal.classList.remove('active');
  activeRecord = null;
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closePreviewModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', closePreviewModal);

// ==================== DOWNLOAD HANDLER ====================
async function triggerDownload(record) {
  if (!record) return;
  const imgUrl = mb.getFileUrl('wallpapers', record.id, record.image);

  try {
    const newDownloads = (record.downloads || 0) + 1;
    // Atomic PATCH via MiniBase REST API
    await mb.request(`/api/collections/wallpapers/records/${record.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ downloads: newDownloads })
    });

    record.downloads = newDownloads;
    if (modalDownloads) modalDownloads.textContent = newDownloads;

    // Direct browser trigger
    const a = document.createElement('a');
    a.href = imgUrl;
    a.download = record.image || `${record.title}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.warn('[MiniBase] Failed to increment download count:', err);
    window.open(imgUrl, '_blank');
  }
}

if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    if (activeRecord) triggerDownload(activeRecord);
  });
}

// ==================== UPLOAD MODAL ====================
function openUploadModal() {
  if (uploadModal) uploadModal.classList.add('active');
  if (uploadStatus) uploadStatus.style.display = 'none';
  if (uploadForm) uploadForm.reset();
  if (fileDropText) fileDropText.textContent = 'Click or Drag Image File Here';
}

function closeUploadModal() {
  if (uploadModal) uploadModal.classList.remove('active');
}

if (openUploadBtn) openUploadBtn.addEventListener('click', openUploadModal);
if (closeUploadModalBtn) closeUploadModalBtn.addEventListener('click', closeUploadModal);
if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', closeUploadModal);
if (uploadModalBackdrop) uploadModalBackdrop.addEventListener('click', closeUploadModal);

if (upFile) {
  upFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && fileDropText) {
      fileDropText.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    }
  });
}

// Handle Upload Form Submit
if (uploadForm) {
  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = upTitle.value.trim();
    const category = upCategory.value;
    const file = upFile.files[0];

    if (!title || !file) {
      showUploadStatus('Please provide a title and select an image file.', 'error');
      return;
    }

    submitUploadBtn.disabled = true;
    submitText.textContent = 'SAVING TO SQLITE...';
    showUploadStatus('Streaming file to MiniBase Storage...', 'success');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('downloads', '0');
      formData.append('image', file);

      // POST /api/collections/wallpapers/records
      const createdRecord = await mb.collection('wallpapers').create(formData);
      console.log('[MiniBase] Created wallpaper record:', createdRecord);

      showUploadStatus(`SUCCESS! Record saved to SQLite (ID: ${createdRecord.id})`, 'success');
      setTimeout(() => {
        closeUploadModal();
        loadWallpapers(activeCategory, currentSearchQuery);
      }, 1200);
    } catch (err) {
      console.error('[MiniBase] Upload error:', err);
      showUploadStatus(`Upload failed: ${err.message}`, 'error');
    } finally {
      submitUploadBtn.disabled = false;
      submitText.textContent = 'SUBMIT TO MINIBASE';
    }
  });
}

function showUploadStatus(msg, type) {
  if (!uploadStatus) return;
  uploadStatus.textContent = msg;
  uploadStatus.className = `upload-status ${type}`;
  uploadStatus.style.display = 'block';
}

// ==================== CATEGORIES & SEARCH ====================
function setActiveCategory(cat) {
  activeCategory = cat;
  catButtons.forEach(btn => {
    if (btn.getAttribute('data-cat') === cat) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  loadWallpapers(cat, currentSearchQuery);
}

catButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const cat = btn.getAttribute('data-cat');
    setActiveCategory(cat);
  });
});

// Live Search with Debounce
let searchTimer = null;
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    currentSearchQuery = val;

    if (clearSearchBtn) {
      clearSearchBtn.style.display = val.trim() ? 'block' : 'none';
    }

    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      loadWallpapers(activeCategory, val);
    }, 250);
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    currentSearchQuery = '';
    loadWallpapers(activeCategory, '');
  });
}

// Keyboard shortcuts (Cmd+K for search, Esc to close modals)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePreviewModal();
    closeUploadModal();
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (searchInput) searchInput.focus();
  }
});

// ==================== REALTIME SSE SYNC ====================
function initSSE() {
  try {
    mb.collection('wallpapers').subscribe('*', (event) => {
      console.log('[MiniBase SSE Live Event]:', event);

      if (sseStatus) {
        sseStatus.style.background = '#064E3B';
        sseText.textContent = `SSE EVENT: ${event.action.toUpperCase()}`;
        setTimeout(() => {
          sseStatus.style.background = '#111111';
          sseText.textContent = 'SSE SYNCED';
        }, 2000);
      }

      loadWallpapers(activeCategory, currentSearchQuery);
    });

    if (sseStatus) sseStatus.title = 'Real-time Server-Sent Events active';
  } catch (err) {
    console.warn('[MiniBase] SSE init notice:', err);
    if (sseText) sseText.textContent = 'POLLING';
  }
}

// Initial Run
loadWallpapers();
initSSE();
