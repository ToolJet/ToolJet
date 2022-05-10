const { readdirSync, writeFileSync } = require('fs');
const { includes, excludes } = require('./configs.json');

const allPackages = readdirSync('./packages', { withFileTypes: true }).filter(
  (dirent) => dirent.isDirectory() && dirent.name !== 'common'
);

const packages =
  includes && includes.length > 0
    ? allPackages.filter((dirent) => includes.includes(dirent.name))
    : excludes && excludes.length > 0
    ? allPackages.filter((dirent) => !excludes.includes(dirent.name))
    : allPackages;

// Adding Rest API
if (!packages.some((e) => e.name === 'restapi') && allPackages.some((e) => e.name === 'restapi')) {
  packages.push(allPackages.find((e) => e.name === 'restapi'));
}

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
