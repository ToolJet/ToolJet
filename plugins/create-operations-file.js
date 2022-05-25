const { readdirSync, writeFileSync, existsSync } = require('fs');

const packages = readdirSync('./packages', { withFileTypes: true }).filter(
  (dirent) => dirent.isDirectory() && dirent.name !== 'common'
);

packages.forEach((dirent) => {
  if (existsSync(`./packages/${dirent.name}/dist/operations/index.js`)) {
    console.log(`Building operations.json for : ${dirent.name}`);
    import(`./packages/${dirent.name}/dist/operations/index.js`)
      .then((module) => {
        writeFileSync(`./packages/${dirent.name}/lib/operations.json`, JSON.stringify(module.default.default), {
          encoding: 'utf8',
        });
      })
      .catch((err) => {
        console.error(dirent.name, err);
        throw err;
      });
  }
});
