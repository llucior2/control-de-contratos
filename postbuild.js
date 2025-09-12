const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');

fs.readFile(indexPath, 'utf8', (err, data) => {
  if (err) {
    return console.error('Error reading index.html:', err);
  }

  // Replace absolute paths with relative paths
  // Example: href="/assets/index-C6tHy2cj.js" -> href="./assets/index-C6tHy2cj.js"
  const result = data.replace(/href="\/assets/g, 'href="./assets').replace(/src="\/assets/g, 'src="./assets');

  fs.writeFile(indexPath, result, 'utf8', (err) => {
    if (err) return console.error('Error writing index.html:', err);
    console.log('index.html asset paths successfully updated to be relative.');
  });
});
