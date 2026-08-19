import { MiniBaseClient } from './public/js/minibase-sdk.js';
import fs from 'fs';
import path from 'path';

const mb = new MiniBaseClient('http://localhost:8090');

const samples = [
  { title: 'Mountain Peaks', category: 'Nature', downloads: 120, featured: true, url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
  { title: 'Neon Cyberpunk', category: 'Abstract', downloads: 350, featured: true, url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=800&q=80' },
  { title: 'Minimalist Desert', category: 'Nature', downloads: 85, featured: false, url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800&q=80' },
  { title: 'Dark Architecture', category: 'Architecture', downloads: 210, featured: false, url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80' },
  { title: 'Abstract Waves', category: 'Abstract', downloads: 540, featured: true, url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80' },
  { title: 'Forest Path', category: 'Nature', downloads: 190, featured: false, url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80' }
];

async function seed() {
  console.log('Logging in...');
  const authRes = await mb.request('/api/admins/auth-with-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@minibase.io', password: 'admin12345' }),
  });
  
  if (authRes.token) {
    mb.token = authRes.token;
  }

  const tmpDir = path.join(process.cwd(), 'tmp_seed');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    console.log(`Downloading ${s.title}...`);
    
    // Download image
    const response = await fetch(s.url);
    const buffer = await response.arrayBuffer();
    const filePath = path.join(tmpDir, `image_${i}.jpg`);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    // Upload to minibase
    console.log(`Uploading ${s.title} to MiniBase...`);
    const formData = new FormData();
    formData.append('title', s.title);
    formData.append('category', s.category);
    formData.append('downloads', s.downloads);
    formData.append('featured', s.featured ? 'true' : 'false');
    
    // File blob
    const fileBlob = new Blob([buffer], { type: 'image/jpeg' });
    formData.append('image', fileBlob, `image_${i}.jpg`);

    try {
      const rec = await mb.request('/api/collections/wallpapers/records', {
        method: 'POST',
        body: formData
      });
      console.log(`Inserted record ${rec.id} for ${s.title}`);
    } catch (err) {
      console.error(`Error inserting ${s.title}:`, err.message);
    }
  }

  console.log('Seeding complete!');
}

seed();
