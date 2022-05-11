const { readdirSync, writeFileSync } = require('fs');

const isPrivatePackage = (name) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  const pkg = require(`./packages/${name}/package.json`);
  return pkg.private;
};

const packages = readdirSync('./packages', { withFileTypes: true }).filter(
  (dirent) => dirent.isDirectory() && dirent.name !== 'common' && !isPrivatePackage(dirent.name)
);

const capitalize = (str) => str.replace(/^./, (str) => str.toUpperCase());

const manifestImports = packages.map(
  (dirent) => `import ${capitalize(dirent.name)} from './packages/${dirent.name}/lib/manifest.json'`
);
const operationsImports = packages.map(
  (dirent) => `import ${capitalize(dirent.name)}Operation from './packages/${dirent.name}/lib/operations.json'`
);
const svgsImports = packages.map((dirent) => `import ${dirent.name}Svg from './packages/${dirent.name}/lib/icon.svg'`);

const manifestOuts = `export const allManifests = {\n ${packages
  .map((dirent) => capitalize(dirent.name))
  .join(',\n')} \n }`;
const operationsOuts = `export const allOperations = {\n ${packages
  .map((dirent) => capitalize(dirent.name) + ': ' + capitalize(dirent.name) + 'Operation')
  .join(',\n')} \n }`;
const svgOuts = `export const allSvgs = {\n ${packages
  .map((dirent) => dirent.name + ': ' + dirent.name + 'Svg')
  .join(',\n')} \n }`;

const clientContent = `
${manifestImports.join('\n')} \n
${operationsImports.join('\n')} \n
${svgsImports.join('\n')} \n
${manifestOuts}\n
${operationsOuts}\n
${svgOuts}\n
`;

writeFileSync('client.js', clientContent);
