const fs = require('fs');
const convertAppDefinitionFromSinglePageToMultiPage = require('../lib/single-page-to-and-from-multipage-definition-conversion.ts');

fs.readdir('./', function (err, files) {
  //handling error
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }
  //listing all files using forEach
  for (const file of files) {
    fs.readFile(file + '/definition.json', 'utf8', (err, data) => {
      if (!err) {
        const appData = JSON.parse(data);
        const newAppData = {
          ...appData,
          //appVersions: appData.appVersions?.map(convertAppDefinitionFromSinglePageToMultiPage),
          editingVersion: convertAppDefinitionFromSinglePageToMultiPage(appData.editingVersion),
        };

        console.log({ newAppData });
      }
    });
  }
});
