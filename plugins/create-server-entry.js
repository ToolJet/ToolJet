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

const imports = packages.map((dirent) => `import ${dirent.name} from './packages/${dirent.name}/lib'`);
imports.push(["import { QueryError, OAuthUnauthorizedClientError } from './packages/common/lib'"]);

const outs = `export default {\n${packages.map((dirent) => `  ${dirent.name}`).join(',\n')},
}`;

const content = `
${imports.join('\n')} \n
${outs}\n
export { QueryError, OAuthUnauthorizedClientError }
`;

writeFileSync('server.ts', content);
