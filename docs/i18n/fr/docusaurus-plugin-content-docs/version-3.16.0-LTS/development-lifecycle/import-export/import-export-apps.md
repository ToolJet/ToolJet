---
id: importing-exporting-applications
title: Applications
---

Cette documentation explique le processus d'exportation et d'importation d'applications dans ToolJet.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Exporter des applications

- Accédez au tableau de bord.
- Cliquez sur l'icône des paramètres située dans le coin supérieur droit de l'application.
- Cliquez sur le bouton **Export app**.

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/import-export-apps/export-app-button-v2.png" alt="Export App Button" />
</div>

- Si vous sélectionnez `Export All`, toutes les versions de l'application seront exportées au format JSON. Si vous sélectionnez `Export selected version`, seule la version sélectionnée sera exportée au format JSON.
- Cocher la case `Export ToolJet table schema` exportera également les schémas de table de la base de données ToolJet associés avec votre application. Dans ce cas, lorsque vous importez l'application dans un espace de travail, les tables de la base de données ToolJet associées seront également créées.


<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/import-export-apps/export-options-v2.png" alt="Export App Options" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Importer des applications

- Accédez au tableau de bord.
- Cliquez sur les points de suspension du bouton **Create new app** et sélectionnez `Import`.

<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/import-export-apps/import-button-v2.png" alt="Import App Button" />
</div>

- Après avoir cliqué sur `Import`, choisissez le fichier JSON pertinent que vous avez précédemment téléchargé lors du processus d'exportation de l'application.


<div style={{textAlign: 'center', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/v2-beta/app-builder/import-export-apps/select-app-to-import.png" alt="Select App To Import" />
</div>

</div>

## Comportement des modules lors de l'importation et de l'exportation d'applications

**Importation** :

- Lorsque vous importez une application, la plateforme vérifie automatiquement s'il existe des modules portant des noms correspondants dans votre espace de travail ou votre instance. Si un module portant le même nom existe déjà, l'application importée se connecte au module existant, évitant ainsi la duplication.
- Cependant, si aucun module correspondant n'est trouvé, la plateforme crée un nouveau module à partir du fichier JSON importé.
- Cette approche garantit que vos applications s'importent en douceur tout en maintenant la cohérence et en évitant les modules redondants.

**Exportation** :

- Lorsque vous exportez une application, tous les modules associés liés à l'application sont automatiquement inclus dans l'exportation.
- Cela garantit que tous les composants ou fonctionnalités réutilisables créés sous forme de modules sont préservés et peuvent être importés en toute transparence avec l'application dans un autre espace de travail.