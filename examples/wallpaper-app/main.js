import { MiniBaseClient } from './minibase-sdk.js';

// Connect dynamically to MiniBase backend (Localhost, Vite dev server, or Remote Cloudflare Tunnel)
const backendOrigin = window.location.origin.includes('5173') ? 'http://localhost:8090' : window.location.origin;
const mb = new MiniBaseClient(backendOrigin);

const masonry = document.getElementById('masonry');
const loader = document.getElementById('loader');
const navLinks = document.querySelectorAll('.nav-links a[data-cat], .cat-pill[data-cat]');

// Modal elements
const modal = document.getElementById('preview-modal');
const modalImg = document.getElementById('preview-img');
const modalTitle = document.getElementById('preview-title');
const modalCat = document.getElementById('preview-cat');
const modalDownloads = document.getElementById('preview-downloads');
const closeBtn = document.getElementById('close-modal');
const downloadBtn = document.getElementById('download-btn');

let currentWallpapers = [];
let activeRecord = null;
let currentSearchQuery = '';

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');

async function loadWallpapers(category = 'all', searchQuery = '') {
  loader.style.display = 'block';
  masonry.innerHTML = '';
  
  try {
    const params = new URLSearchParams({ sort: '-created' });
    
    if (category && category !== 'all') {
      params.append('filter', `category = '${category}'`);
    }

    if (searchQuery && searchQuery.trim()) {
      params.append('search', searchQuery.trim());
    }

    const res = await mb.request(`/api/collections/wallpapers/records?${params.toString()}`);
    currentWallpapers = res.items || [];
    renderGrid(currentWallpapers, searchQuery);
  } catch (err) {
    console.error('Failed to load wallpapers:', err);
    renderGrid([], searchQuery, true);
  } finally {
    loader.style.display = 'none';
  }
}

function renderGrid(items, query = '', isError = false) {
  if (isError || !items || items.length === 0) {
    masonry.innerHTML = `
      <div class="not-found-container">
        <div class="not-found-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="1.75"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </div>
        <h3 class="not-found-title">${query ? 'Record Not Found' : 'No Wallpapers Available'}</h3>
        <p class="not-found-desc">
          ${query ? `No matching record found for "${query}".` : 'No wallpapers available in this category yet.'}
        </p>
        ${query ? `<button id="reset-search-btn" class="reset-search-btn">Reset Search</button>` : ''}
      </div>
    `;

    const resetBtn = document.getElementById('reset-search-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        currentSearchQuery = '';
        const activeCat = document.querySelector('.nav-links a.active, .cat-pill.active')?.getAttribute('data-cat') || 'all';
        loadWallpapers(activeCat, '');
      });
    }
    return;
  }

  masonry.innerHTML = items.map(item => {
    // We use the SDK to get the file URL
    const imgUrl = mb.getFileUrl('wallpapers', item.id, item.image);
    
    return `
      <div class="wallpaper-card" data-id="${item.id}">
        <img src="${imgUrl}" alt="${item.title}" loading="lazy" />
        <div class="card-overlay">
          <div class="card-title">${item.title}</div>
          <div class="card-meta">
            <span class="cat-tag">${item.category || 'Uncategorized'}</span>
            <span style="display:inline-flex; align-items:center; gap:4px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              ${item.downloads || 0}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add click listeners to cards
  document.querySelectorAll('.wallpaper-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-id');
      const record = currentWallpapers.find(r => r.id === id);
      if (record) openModal(record);
    });
  });
}

function openModal(record) {
  activeRecord = record;
  const imgUrl = mb.getFileUrl('wallpapers', record.id, record.image);
  
  modalImg.src = imgUrl;
  modalTitle.textContent = record.title;
  modalCat.textContent = record.category || 'Uncategorized';
  modalDownloads.textContent = record.downloads || 0;
  
  modal.classList.add('active');
}

closeBtn.addEventListener('click', () => {
  modal.classList.remove('active');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.classList.remove('active');
});

// Category filtering
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    loadWallpapers(link.getAttribute('data-cat'), currentSearchQuery);
  });
});

// Live Search with Debounce
let searchTimeout = null;
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    currentSearchQuery = val;
    
    if (clearSearchBtn) {
      clearSearchBtn.style.display = val.trim() ? 'block' : 'none';
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const activeCat = document.querySelector('.nav-links a.active')?.getAttribute('data-cat') || 'all';
      loadWallpapers(activeCat, val);
    }, 250);
  });
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    currentSearchQuery = '';
    const activeCat = document.querySelector('.nav-links a.active')?.getAttribute('data-cat') || 'all';
    loadWallpapers(activeCat, '');
  });
}

// Download action
downloadBtn.addEventListener('click', async () => {
  if (!activeRecord) return;
  
  const imgUrl = mb.getFileUrl('wallpapers', activeRecord.id, activeRecord.image);
  
  // Update downloads counter in backend
  try {
    const newDownloads = (activeRecord.downloads || 0) + 1;
    await mb.request(`/api/collections/wallpapers/records/${activeRecord.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ downloads: newDownloads })
    });
    
    activeRecord.downloads = newDownloads;
    modalDownloads.textContent = newDownloads;
    
    // Refresh grid
    const activeCat = document.querySelector('.nav-links a.active')?.getAttribute('data-cat') || 'all';
    loadWallpapers(activeCat, currentSearchQuery);
  } catch(err) {
    console.error('Failed to update download count:', err);
  }

  // Trigger browser download
  const a = document.createElement('a');
  a.href = imgUrl;
  a.download = activeRecord.image;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

// Initial load
loadWallpapers();
