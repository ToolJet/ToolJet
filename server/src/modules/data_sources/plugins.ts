import { readdirSync } from 'fs';

async function getPluginClasses() {
  console.log('Loading plugins from the plugins directory 🔌');

  const directories = readdirSync('./plugins/datasources', { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const classes = {};

  for (const directory of directories) {
    const pluginClassObject = await import(`../../../plugins/datasources/${directory}`);
    classes[directory] = pluginClassObject.default;
  }

  console.log('Loaded plugins: ');
  console.log(directories);

  return classes;
}

export const allPlugins = getPluginClasses();
