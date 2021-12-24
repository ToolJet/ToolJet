const { readdirSync, writeFileSync } = require('fs');

const packages = readdirSync('./packages', { withFileTypes: true })
.filter((dirent) => dirent.isDirectory() && dirent.name !== 'common')

const imports = packages.map((dirent) => `import ${dirent.name} from './packages/${dirent.name}/lib'`);

const outs = `export default {\n${packages.map((dirent) => dirent.name).join(',\n')} \n }`;

const content = `
${imports.join('\n')} \n
${outs}\n
`

 writeFileSync('index.ts', content)