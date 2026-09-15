const fs = require('fs');
const path = require('path');

const root = process.cwd();
const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(root, '.next', 'standalone', '.next', 'static');
const publicSrc = path.join(root, 'public');
const publicDest = path.join(root, '.next', 'standalone', 'public');

try {
  if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, staticDest, { recursive: true, force: true });
    console.log('Successfully copied .next/static to standalone build directory.');
  }
  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true, force: true });
    console.log('Successfully copied public assets to standalone build directory.');
  }
} catch (err) {
  console.warn('Notice: Could not copy standalone static assets:', err.message);
}
