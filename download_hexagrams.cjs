const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const targetDir = path.join(__dirname, 'public', 'hexagrams');

// Ensure directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function downloadFile(url, dest, callback) {
  const parsedUrl = new URL(url);
  const options = {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    headers: {
      'User-Agent': 'AntigravityDivinationProject/1.0 (dusty@vibecoding.com) Node/26.0.0'
    }
  };

  https.get(options, (response) => {
    // Handle redirect
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      // Resolve relative redirect location if needed, though Special:FilePath returns absolute
      downloadFile(response.headers.location, dest, callback);
      return;
    }

    if (response.statusCode !== 200) {
      callback(new Error(`Failed to download from ${url}, status code: ${response.statusCode}`));
      return;
    }

    const file = fs.createWriteStream(dest);
    response.pipe(file);
    file.on('finish', () => {
      file.close(callback);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {}); // Delete temporary file
    callback(err);
  });
}

async function downloadAll() {
  console.log('Starting download of 64 hexagram SVG files with User-Agent...');
  for (let i = 1; i <= 64; i++) {
    const numStr = String(i).padStart(2, '0');
    const filename = `Iching-hexagram-${numStr}.svg`;
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}`;
    const dest = path.join(targetDir, filename);

    console.log(`Downloading [${i}/64]: ${filename}...`);
    try {
      await new Promise((resolve, reject) => {
        downloadFile(url, dest, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log(`Saved ${filename}`);
      // Sleep slightly to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (error) {
      console.error(`Error downloading ${filename}:`, error.message);
    }
  }
  console.log('All 64 hexagram SVG downloads complete.');
}

downloadAll();
