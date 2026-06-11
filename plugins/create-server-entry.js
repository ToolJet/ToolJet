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
