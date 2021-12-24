const { readdirSync, writeFileSync } = require('fs');

const packages = readdirSync('./packages', { withFileTypes: true })
.filter((dirent) => dirent.isDirectory() && dirent.name !== 'common')

const imports = packages.map((dirent) => `import ${dirent.name} from './packages/${dirent.name}/lib'`);
const manifestImports = packages.map((dirent) => `import ${dirent.name}Manifest from './packages/${dirent.name}/lib/manifest.json'`);
const operationsImports = packages.map((dirent) => `import ${dirent.name}Operation from './packages/${dirent.name}/lib/operations.json'`);

const outs = `export default {\n${packages.map((dirent) => dirent.name).join(',\n')} \n }`;
const manifestOuts = `export const allManifests = {\n ${packages.map((dirent) => dirent.name + 'Manifest').join(',\n')} \n }`
const operationsOuts = `export const allOperations = {\n ${packages.map((dirent) => dirent.name + 'Operation').join(',\n')} \n }`
const content = `
${imports.join('\n')} \n
${manifestImports.join('\n')} \n
${operationsImports.join('\n')} \n
${outs}\n
${manifestOuts}\n
${operationsOuts}\n
`

 writeFileSync('index.ts', content)