// fix-publish.js
//  fix the default ng build folder structure for GitHub Pages
const fs = require('fs');
const path = require('path');

const fromDir = path.join(__dirname, 'docs', 'browser');
const toDir = path.join(__dirname, 'docs');

const logHeader = '** Fix Publish for GitHub Pages :';

if (fs.existsSync(fromDir)) {
  fs.readdirSync(fromDir).forEach(file => {
    fs.renameSync(path.join(fromDir, file), path.join(toDir, file));
  });
  fs.rmdirSync(fromDir);
  console.log(`${logHeader} Moved files from 'docs/browser' to 'docs/' and removed 'docs/browser' directory.`);
} else {
  console.log(`${logHeader} No docs/browser directory found.`);
}
console.log('');