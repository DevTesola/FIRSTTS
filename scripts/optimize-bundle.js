// Bundle optimization script
const fs = require('fs');
const path = require('path');

// Find all files importing react-icons
const findReactIconImports = () => {
  const files = [];
  const searchDir = (dir) => {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        searchDir(fullPath);
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('react-icons')) {
          files.push(fullPath);
        }
      }
    }
  };
  
  searchDir(process.cwd());
  return files;
};

// Fix react-icons imports
const fixReactIconImports = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern: import Icon1 from 'react-icons/XX/Icon1'
import Icon2 from 'react-icons/XX/Icon2'
  const importRegex = /import\s*{([^}]+)}\s*from\s*['"]react-icons\/([^'"]+)['"]/g;
  
  content = content.replace(importRegex, (match, icons, iconSet) => {
    const iconList = icons.split(',').map(icon => icon.trim());
    const newImports = iconList.map(icon => 
      `import ${icon} from 'react-icons/${iconSet}/${icon}'`
    ).join('\n');
    modified = true;
    return newImports;
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed imports in ${filePath}`);
  }
};

// Main execution
console.log('🔍 Searching for react-icons imports...');
const files = findReactIconImports();
console.log(`Found ${files.length} files with react-icons imports`);

files.forEach(file => {
  console.log(`Processing ${file}...`);
  fixReactIconImports(file);
});

console.log('✨ Bundle optimization complete!');