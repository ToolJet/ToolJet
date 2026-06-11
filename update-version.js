// As we are maintaining three .version files, this script will help in updating it one go
const fs = require('fs');
const path = require('path');

// Get the new version from the command-line arguments
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('Usage: node update-version.js <new-version>');
  process.exit(1);
}

// Function to update version in a file
function updateVersion(filePath, newVersion) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const updatedContent = content.replace(/\d+\.\d+\.\d+/, newVersion);
  fs.writeFileSync(filePath, updatedContent, 'utf-8');
  console.log(`Updated version in ${filePath} to ${newVersion}`);
}

// Update version in both server and client folders
const versionPath =  path.join(__dirname, '.version')
const serverVersionFilePath = path.join(__dirname, 'server', '.version');
const frontendVersionFilePath = path.join(__dirname, 'frontend', '.version');

updateVersion(versionPath,newVersion)
updateVersion(serverVersionFilePath, newVersion);
updateVersion(frontendVersionFilePath, newVersion);

// eg.---> npm run update-version <version> ---> npm run update-version 3.0.0