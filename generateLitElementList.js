const fs = require('fs');
const path = require('path');

const generateElementsList = (specificFolder) => {
  const nodeModulesPath = path.resolve(__dirname, 'node_modules', specificFolder);
  const outputFilePath = path.resolve(__dirname, 'src', 'elementsList.json');

  const elements = [];

  const processFile = (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const classRegex = /class\s+(\w+)\s+{/g;
    let match;

    while ((match = classRegex.exec(fileContent)) !== null) {
      const className = match[1];
      const properties = [];
      const propertyRegex = /@property\(([^)]*)\)\s*\n\s*(\w+)\s*(\w+)\s*;/g;
      let propertyMatch;

      while ((propertyMatch = propertyRegex.exec(fileContent)) !== null) {
        const property = propertyMatch[3];
        properties.push(property);
      }

      if (properties.length > 0) {
        elements.push({ className, properties });
      }
    }
  };

  const traverseDirectory = (dir) => {
    fs.readdirSync(dir).forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        traverseDirectory(fullPath);
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
        processFile(fullPath);
      }
    });
  };

  traverseDirectory(nodeModulesPath);

  fs.writeFile(outputFilePath, JSON.stringify(elements, null, 2), (err) => {
    if (err) {
      console.error('Error writing elementsList.json:', err);
      return;
    }
    console.log('elementsList.json has been saved.');
  });
};

// Replace 'lit' with the folder name you want to parse within node_modules
generateElementsList('lit');
