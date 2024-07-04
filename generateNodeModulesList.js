const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const generateLitElementsList = (specificFolder) => {
  const nodeModulesPath = path.resolve(__dirname, 'node_modules', specificFolder);
  const outputFilePath = path.resolve(__dirname, 'src', 'litElementsList.json');

  const litElements = [];

  const processFile = (filePath) => {
    const sourceFile = ts.createSourceFile(
      filePath,
      fs.readFileSync(filePath, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    );

    const visit = (node) => {
      if (ts.isClassDeclaration(node) && node.name && node.name.text.endsWith('Element')) {
        const className = node.name.text;
        const properties = [];

        node.members.forEach(member => {
          if (member.decorators) {
            member.decorators.forEach(decorator => {
              if (ts.isCallExpression(decorator.expression) &&
                  ts.isIdentifier(decorator.expression.expression) &&
                  decorator.expression.expression.text === 'property') {
                properties.push(member.name.text);
              }
            });
          }
        });

        if (properties.length > 0) {
          litElements.push({ className, properties });
        }
      }
      ts.forEachChild(node, visit);
    };

    ts.forEachChild(sourceFile, visit);
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

  fs.writeFile(outputFilePath, JSON.stringify(litElements, null, 2), (err) => {
    if (err) {
      console.error('Error writing litElementsList.json:', err);
      return;
    }
    console.log('litElementsList.json has been saved.');
  });
};

// Replace 'lit' with the folder name you want to parse within node_modules
generateLitElementsList('lit');
