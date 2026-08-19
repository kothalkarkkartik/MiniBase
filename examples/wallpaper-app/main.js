import './style.css';
import { MiniBaseClient } from './minibase-sdk.js';

// Connect to local MiniBase instance
const mb = new MiniBaseClient('http://localhost:8090');

const masonry = document.getElementById('masonry');
const loader = document.getElementById('loader');
const navLinks = document.querySelectorAll('.nav-links a[data-cat]');

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

async function loadWallpapers(category = 'all') {
  loader.style.display = 'block';
  masonry.innerHTML = '';
  
  try {
    let filter = '';
    if (category !== 'all') {
      filter = `category = '${category}'`;
    }

    const res = await mb.request(`/api/collections/wallpapers/records?sort=-created${filter ? '&filter=' + encodeURIComponent(filter) : ''}`);
    currentWallpapers = res.items || [];
    renderGrid(currentWallpapers);
  } catch (err) {
    console.error('Failed to load wallpapers:', err);
    masonry.innerHTML = `<p style="color:var(--accent-rose); text-align:center;">Failed to load wallpapers from MiniBase.</p>`;
  } finally {
    loader.style.display = 'none';
  }
}

function renderGrid(items) {
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
            <span>⬇ ${item.downloads || 0}</span>
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
    loadWallpapers(link.getAttribute('data-cat'));
  });
});

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
    const activeCat = document.querySelector('.nav-links a.active').getAttribute('data-cat');
    loadWallpapers(activeCat);
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
