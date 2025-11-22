import { writeFileSync } from 'node:fs';
import { getPackages } from './util.js';

const packages = await getPackages();

const imports = packages.map((dirent) => `import ${dirent.name} from './packages/${dirent.name}/lib/index.js'`);
imports.push(["import { QueryError, OAuthUnauthorizedClientError } from './packages/common/lib/index.js'"]);

const outs = `export default {\n${packages.map((dirent) => `  ${dirent.name}`).join(',\n')},
}`;

const content = `
${imports.join('\n')} \n
${outs}\n
export { QueryError, OAuthUnauthorizedClientError }
`;

writeFileSync('./server.ts', content);
