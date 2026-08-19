import { MiniBaseClient } from './public/js/minibase-sdk.js';

const mb = new MiniBaseClient('http://localhost:8090');

async function setup() {
  console.log('Logging in as admin...');
  const authRes = await mb.request('/api/admins/auth-with-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@minibase.io', password: 'admin12345' }),
  });
  
  if (authRes.token) {
    mb.token = authRes.token;
  }

  console.log('Creating wallpapers collection...');
  try {
    const colRes = await mb.request('/api/collections', {
      method: 'POST',
      body: JSON.stringify({
        name: 'wallpapers',
        type: 'base',
        schema: [
          { name: 'title', type: 'text', required: true },
          { name: 'image', type: 'file', required: true },
          { name: 'category', type: 'text' },
          { name: 'downloads', type: 'number' },
          { name: 'featured', type: 'bool' }
        ],
        listRule: '',   // Everyone
        viewRule: '',   // Everyone
        createRule: null, // Admin only
        updateRule: '', // TEMPORARILY EVERYONE so we can increment downloads from frontend easily without auth, or we can use custom backend endpoint, but let's just make it everyone for now
        deleteRule: null  // Admin only
      })
    });
    console.log('Collection created:', colRes.name);
  } catch (err) {
    console.error('Error creating collection:', err.message);
  }
}

setup();
