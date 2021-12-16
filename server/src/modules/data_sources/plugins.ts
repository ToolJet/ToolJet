const { readdirSync } = require('fs');
const { join, resolve, relative } = require('path');

async function getPluginClasses() {
  console.log('Loading plugins from the plugins directory 🔌');

  console.log('22', __dirname);
  const pluginEntryPoint = resolve(join(__dirname, '..', '..', '..', 'plugins', 'datasources'));
  const directories = readdirSync(pluginEntryPoint, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const classes = {};

  for (const directory of directories) {
    const pluginClassObject = await import(`${pluginEntryPoint}/${directory}`);
    classes[directory] = pluginClassObject.default;
  }

  console.log('Loaded plugins: ');
  console.log(directories);

  return classes;
}

export const allPlugins = getPluginClasses();
