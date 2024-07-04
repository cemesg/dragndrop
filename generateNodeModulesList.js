const fs = require('fs');
const path = require('path');

const generateNodeModulesList = () => {
  const nodeModulesPath = path.resolve(__dirname, 'node_modules');
  const outputFilePath = path.resolve(__dirname, 'src', 'nodeModulesList.json');

  fs.readdir(nodeModulesPath, (err, files) => {
    if (err) {
      console.error('Error reading node_modules:', err);
      return;
    }

    // Filter only directories (node modules)
    const nodeModules = files.filter(file => fs.lstatSync(path.join(nodeModulesPath, file)).isDirectory());

    // Write the list to a JSON file
    fs.writeFile(outputFilePath, JSON.stringify(nodeModules, null, 2), (writeErr) => {
      if (writeErr) {
        console.error('Error writing nodeModulesList.json:', writeErr);
        return;
      }
      console.log('nodeModulesList.json has been saved.');
    });
  });
};

// Run the function to generate the list
generateNodeModulesList();
