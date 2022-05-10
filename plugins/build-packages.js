const { includes, excludes } = require('./configs.json');
const { execSync } = require('child_process');

let scope, ignore;

if (includes && includes.length > 0) {
  scope = includes.map((e) => `--scope @tooljet-plugins/${e}`).join(' ');
}

if (!scope && excludes && excludes.length > 0) {
  ignore = excludes.map((e) => `--ignore @tooljet-plugins/${e}`).join(' ');
}

const buildCommand = `lerna ${
  scope
    ? `--scope @tooljet-plugins/common --scope @tooljet-plugins/restapi ${scope} `
    : ignore
    ? `--scope @tooljet-plugins/common --scope @tooljet-plugins/restapi ${ignore} `
    : ''
}run build --stream`;
execSync(buildCommand);
