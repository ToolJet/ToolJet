const { readdirSync, writeFileSync } = require('fs');

const packages = readdirSync('./packages', { withFileTypes: true })
.filter((dirent) => dirent.isDirectory() && dirent.name !== 'common')

const capitalize = str => str.replace(/^./, str => str.toUpperCase())
const mapImportNameToOldValue = str => {
  if(str === 'mongo') return 'mongodb'
  if(str === 'twilioapi') return 'twilio'
  if(str === 'typesenseapi') return 'typesense'
  if(str === 'minioapi') return 'minio'
  return str
}

const manifestImports = packages.map((dirent) => `import ${capitalize(mapImportNameToOldValue(dirent.name))} from './packages/${dirent.name}/lib/manifest.json'`);
const operationsImports = packages.map((dirent) => `import ${capitalize(mapImportNameToOldValue(dirent.name))}Operation from './packages/${dirent.name}/lib/operations.json'`);
const svgsImports = packages.map((dirent) => `import ${mapImportNameToOldValue(dirent.name)}Svg from './packages/${dirent.name}/lib/icon.svg'`);

const manifestOuts = `export const allManifests = {\n ${packages.map((dirent) => capitalize(mapImportNameToOldValue(dirent.name))).join(',\n')} \n }`
const operationsOuts = `export const allOperations = {\n ${packages.map((dirent) => capitalize(mapImportNameToOldValue(dirent.name)) + ': ' + capitalize(mapImportNameToOldValue(dirent.name)) + 'Operation').join(',\n')} \n }`
const svgOuts = `export const allSvgs = {\n ${packages.map((dirent) => mapImportNameToOldValue(dirent.name) + ': ' + mapImportNameToOldValue(dirent.name) + 'Svg').join(',\n')} \n }`

const clientContent = `
${manifestImports.join('\n')} \n
${operationsImports.join('\n')} \n
${svgsImports.join('\n')} \n
${manifestOuts}\n
${operationsOuts}\n
${svgOuts}\n
`

 writeFileSync('client.js', clientContent)