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

const darkSvgsIcons = new Set(['grpc', 'grpcv2', 'influxdb', 'mariadb', 'mysql', 'zendesk']);
const svgsImports = packages.flatMap((dirent) => {
    const iconImport = `import ${dirent.name}Svg from './packages/${dirent.name}/lib/icon.svg'`;
    if (darkSvgsIcons.has(dirent.name)) {
        return [iconImport, `import ${dirent.name}DarkSvg from './packages/${dirent.name}/lib/darkIcon.svg'`];
    }
    return [iconImport];
});

const manifestOuts = `export const allManifests = {\n ${packages
  .map((dirent) => capitalize(dirent.name))
  .join(',\n')} \n }`;
const operationsOuts = `export const allOperations = {\n ${packages
  .map((dirent) => capitalize(dirent.name) + ': ' + capitalize(dirent.name) + 'Operation')
  .join(',\n')} \n }`;

const svgOuts = `export const allSvgs = {\n ${packages
  .flatMap((dirent) => {
    const icon = dirent.name + ': ' + dirent.name + 'Svg'
    if(darkSvgsIcons.has(dirent.name)){
      return [icon,dirent.name + 'Dark: ' + dirent.name + 'DarkSvg']
    }
    return [icon]
    })
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
