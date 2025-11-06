const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
const clientDir = path.join(distDir, 'client');

const redirectsContent = `/*    /index.html   200`;

try {
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }

  const files = fs.readdirSync(distDir);
  files.forEach((file) => {
    const srcPath = path.join(distDir, file);
    const destPath = path.join(clientDir, file);
    if (fs.statSync(srcPath).isFile()) {
      fs.renameSync(srcPath, destPath);
    } else if (fs.statSync(srcPath).isDirectory() && file !== 'client') {
      fs.renameSync(srcPath, destPath);
    }
  });

  fs.writeFileSync(path.join(clientDir, '_redirects'), redirectsContent);
  console.log('✓ Created _redirects file for Netlify SPA routing');
} catch (error) {
  console.error('Error creating _redirects file:', error);
  process.exit(1);
}
