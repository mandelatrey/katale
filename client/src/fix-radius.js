const fs = require('fs');

const files = [
  '/Users/mandelatrevor/Desktop/REPOS/mapping-2/uganda-market-map/client/src/App.jsx',
  '/Users/mandelatrevor/Desktop/REPOS/mapping-2/uganda-market-map/client/src/components/Popup.jsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/borderRadius:\s*(\d+)/g, (match, p1) => {
    const val = parseInt(p1);
    // Ignore high values used for pill/circle
    if (val >= 50) return match; 
    
    if (val <= 6) return `borderRadius: 'var(--radius-sm)'`;
    if (val <= 10) return `borderRadius: 'var(--radius-md)'`;
    if (val <= 16) return `borderRadius: 'var(--radius-lg)'`;
    return `borderRadius: 'var(--radius-xl)'`;
  });
  fs.writeFileSync(file, content, 'utf8');
});


