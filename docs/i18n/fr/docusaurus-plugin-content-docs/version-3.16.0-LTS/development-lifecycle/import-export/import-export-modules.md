---
id: import-export-modules
title: Modules
---

ToolJet vous permet d'exporter et d'importer des modules, ce qui facilite le partage, la réutilisation ou la migration de modules entre différents espaces de travail.

Ce guide vous explique les étapes pour exporter un module existant et l'importer dans un autre espace de travail.

## Exporter des modules

- Accédez à l'onglet **Modules** depuis le tableau de bord.
- Cliquez sur l'icône de menu de la carte du module que vous souhaitez exporter.
- Cliquez sur le bouton **Export module**.
  <img className="screenshot-full img-m" style={{ marginTop: '15px' }} src="/img/app-builder/modules/export-module-card.png" alt="Export Module Button" />
- Le module sélectionné sera exporté sous forme de fichier JSON.
- Ce fichier inclura tous les composants, la logique, les requêtes et les propriétés définis dans le module.

Une fois téléchargé, vous pouvez utiliser ce fichier pour importer le module dans n'importe quel autre espace de travail ToolJet.


## Importer des modules

- Accédez à l'onglet **Modules**.
- Cliquez sur l'icône de menu à côté du bouton **Create new module** dans le coin supérieur droit.
  <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/modules/import-module.png" alt="Import Module Button" />
- Choisissez le fichier JSON du module que vous avez précédemment exporté.

Une fois importé, le module apparaîtra dans votre liste de modules et pourra être utilisé dans l'ensemble de vos applications.


## Comportement des modules lors de l'importation et de l'exportation d'applications

### Importation

- Lorsque vous importez une application, la plateforme vérifie automatiquement s'il existe des modules portant des noms correspondants dans votre espace de travail ou votre instance. Si un module portant le même nom existe déjà, l'application importée se connecte au module existant, évitant ainsi la duplication.
- Cependant, si aucun module correspondant n'est trouvé, la plateforme crée un nouveau module à partir du fichier JSON importé.
- Cette approche garantit que vos applications s'importent en douceur tout en maintenant la cohérence et en évitant les modules redondants.

### Exportation

- Lorsque vous exportez une application, tous les modules associés liés à l'application sont automatiquement inclus dans l'exportation.
- Cela garantit que tous les composants ou fonctionnalités réutilisables créés sous forme de modules sont préservés et peuvent être importés en toute transparence avec l'application dans un autre espace de travail.