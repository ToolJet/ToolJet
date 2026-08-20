---
id: generate-file
title: Generate file
---

L'action **Generate file** construit dynamiquement un fichier CSV, texte ou PDF et permet à l'utilisateur de le télécharger.

## Configuration

| Paramètre | Description | Par défaut |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| Type      | Type de fichier à générer. Types : `CSV`, `Text` et `PDF`                                                                                                | — |
| File name | Nom du fichier à générer                                                                                                                            | — |
| Data      | Données qui seront utilisées pour construire le fichier. Leur format dépend du type de fichier, comme indiqué dans la section suivante                                | — |
| Debounce  | Temps en millisecondes à attendre avant d'exécuter l'action | Vide (pas de délai) |

<img className="screenshot-full img-s" src="/img/actions/generate-file/generate-file.png" alt="ToolJet - Action reference - generate-file" />

### Format des données CSV

Pour utiliser le format de fichier `CSV`, le champ data doit contenir un tableau d'objets. ToolJet suppose que les clés de chaque objet sont identiques et représentent les en-têtes de colonnes du fichier CSV.

Exemple :

```javascript
{
  {
    [
      { name: "John", email: "john@tooljet.com" },
      { name: "Sarah", email: "sarah@tooljet.com" },
    ];
  }
}
```

L'utilisation de l'extrait de code ci-dessus générera un fichier CSV avec le contenu suivant :

```csv
name,email
John,john@tooljet.com
Sarah,sarah@tooljet.com
```

### Format des données Text

Pour utiliser le format de fichier `Text`, le champ data doit contenir une chaîne de caractères.

Si vous souhaitez générer un fichier texte à partir d'un tableau d'objets, vous devez convertir les données en chaîne de caractères (stringify) avant de les fournir.

Par exemple, si vous utilisez le composant table pour fournir les données, vous pouvez saisir **`{{JSON.stringify(components.table1.currentPageData)}}`** dans le champ Data.

### Format des données PDF

Le format de données PDF prend en charge deux types d'entrées : soit une `string`, soit un `array of objects`. Lorsqu'un tableau d'objets est utilisé, le PDF résultant affichera les données sous forme de tableau avec des colonnes et des lignes. En revanche, si une chaîne de caractères est fournie, le PDF généré consistera en texte brut.

## Déclenchement via RunJS

```js
actions.generateFile('<fileName>', '<fileType>', '<data>');
```

`fileName` est le nom à donner au fichier (chaîne de caractères), `fileType` est l'un des types `csv`, `plaintext` ou `pdf`, et `data` correspond aux données à stocker dans le fichier.

```js
// CSV
actions.generateFile('csvfile1', 'csv', '{{components.table1.currentPageData}}');

// Text
actions.generateFile('textfile1', 'plaintext', '{{JSON.stringify(components.table1.currentPageData)}}');

// PDF
actions.generateFile('pdffile1', 'pdf', '{{components.table1.currentPageData}}');
```

:::info
Pour une référence rapide complète de la syntaxe RunJS de toutes les actions, consultez [Run Actions from RunJS](/docs/actions/run-actions-from-runjs/).
:::
