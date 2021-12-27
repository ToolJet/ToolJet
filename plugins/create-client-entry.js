const { readdirSync, writeFileSync } = require('fs');

const packages = readdirSync('./packages', { withFileTypes: true })
.filter((dirent) => dirent.isDirectory() && dirent.name !== 'common')

const capitalize = str => str.replace(/^./, str => str.toUpperCase())
const mapImportNameToOldValue = str => {
  if(str === 'mongo') return 'mongodb'
  if(str === 'twilioapi') return 'twilio'
  if(str === 'typesenseapi') return 'typesense'
  return str
}

const manifestImports = packages.map((dirent) => `import ${capitalize(mapImportNameToOldValue(dirent.name))} from './packages/${dirent.name}/lib/manifest.json'`);
const operationsImports = packages.map((dirent) => `import ${capitalize(mapImportNameToOldValue(dirent.name))}Operation from './packages/${dirent.name}/lib/operations.json'`);

const manifestOuts = `export const allManifests = {\n ${packages.map((dirent) => capitalize(mapImportNameToOldValue(dirent.name))).join(',\n')} \n }`
const operationsOuts = `export const allOperations = {\n ${packages.map((dirent) => capitalize(mapImportNameToOldValue(dirent.name)) + ': ' + capitalize(mapImportNameToOldValue(dirent.name)) + 'Operation').join(',\n')} \n }`


const clientContent = `
${manifestImports.join('\n')} \n
${operationsImports.join('\n')} \n
${manifestOuts}\n
${operationsOuts}\n
`

 writeFileSync('client.js', clientContent)