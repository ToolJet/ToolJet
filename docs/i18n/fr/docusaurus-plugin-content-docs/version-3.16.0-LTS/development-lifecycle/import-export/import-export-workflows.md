---
id: import-export-workflows
title: Workflows
---

<PlanBadge type="self-hosted" />

ToolJet permet d'exporter des workflows sous forme de fichiers JSON et de les importer dans n'importe quel espace de travail ToolJet.

## Exporter des workflows

Pour exporter un workflow depuis votre espace de travail ToolJet :
1. Accédez à l'onglet **Workflows** depuis le tableau de bord.
2. Cliquez sur le menu kebab (trois points verticaux) situé dans le coin supérieur droit du workflow que vous souhaitez exporter.
3. Sélectionnez **Export Workflow** dans le menu. Un fichier `.json` contenant la configuration du workflow sera téléchargé sur votre système.
    <img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/workflows/import-export/export.png" alt="Navigate to Workflow Section" />

Ce fichier pourra ensuite être importé dans n'importe quel espace de travail ToolJet pour reproduire la même configuration de workflow.

## Importer des workflows

Pour importer un workflow dans votre espace de travail ToolJet :
1. Accédez à l'onglet **Workflows** depuis le tableau de bord.
2. Cliquez sur le menu kebab (trois points verticaux) à côté du bouton **Create new workflow** et sélectionnez **Import from device**.
    <img style={{marginTop:'15px'}} className="screenshot-full img-full" src="/img/workflows/import-export/import.png" alt="Navigate to Workflow Section" />
3. Choisissez le fichier `.json` du workflow que vous souhaitez importer depuis votre système local.
4. Cliquez sur le bouton **Import workflow** pour terminer le processus d'importation.
    <img style={{marginTop:'15px'}} className="screenshot-full img-s" src="/img/workflows/import-export/import-modal.png" alt="Navigate to Workflow Section" />

Une fois importé, le workflow apparaîtra dans votre espace de travail et pourra être modifié ou déclenché comme n'importe quel autre workflow.