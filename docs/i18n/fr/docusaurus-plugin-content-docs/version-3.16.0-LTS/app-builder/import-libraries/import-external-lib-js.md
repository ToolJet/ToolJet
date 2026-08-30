---
id: runjs
title: Utiliser RunJS
---


ToolJet vous permet d'utiliser des bibliothèques JavaScript externes telles que Compromise pour le traitement du langage naturel ou PapaParse pour l'analyse de données CSV dans votre application. Vous pouvez importer des bibliothèques globalement afin qu'elles soient disponibles dans toutes les queries, ou les charger à la demande à l'intérieur d'une query RunJS.

## Importer des bibliothèques globalement

La section **Libraries** dans la barre latérale gauche vous permet d'enregistrer une bibliothèque externe une seule fois au niveau de l'application. Les bibliothèques enregistrées sont chargées au démarrage de l'application et disponibles via leur nom de variable dans toutes les queries et transformations RunJS — aucun code d'import par query n'est nécessaire.

### Ajouter une bibliothèque

1. Ouvrez **Libraries** depuis la barre latérale gauche. <br/>
    <img className="screenshot-full img-s" src="/img/app-builder/import-lib/left-nav.png" alt="Libraries Tab on the Left Navigation Bar" />
2. Cliquez sur le bouton **Add new library**. <br/>
    <img className="screenshot-full img-s" src="/img/app-builder/import-lib/add-lib.png" alt="Click on Add Library Button" />
3. Entrez un **Variable name** — le nom que vous utiliserez pour appeler la bibliothèque dans votre code (par exemple, `Papa`).
4. Entrez l'**URL CDN** d'une build UMD ou IIFE de la bibliothèque (par exemple, depuis [jsDelivr](https://www.jsdelivr.com/) ou [cdnjs](https://cdnjs.com/)). <br/>
    <img className="screenshot-full img-s" src="/img/app-builder/import-lib/add-var-name.png" alt="Add Variable Details" />
5. Cliquez sur **+ Add library**.

ToolJet récupère et valide la bibliothèque. Si l'opération réussit, la bibliothèque est enregistrée dans la définition de l'application et est immédiatement disponible dans vos queries.

:::info
Seules les builds UMD ou IIFE minifiées sont prises en charge. Les modules ESM et CommonJS ne sont pas compatibles. Utilisez la build `.min.js` de jsDelivr ou cdnjs.
:::

Une fois ajoutée, utilisez la bibliothèque via son nom de variable directement dans n'importe quelle query ou transformation RunJS :

```js
// Using PapaParse added with variable name "Papa"
const csvData = components.filepicker1.file[0].content;
const result = Papa.parse(csvData, { header: true, skipEmptyLines: true });
return result;
```

### Supprimer une bibliothèque

Cliquez sur l'icône de corbeille à côté du nom de la bibliothèque dans la liste **Libraries** pour la supprimer. La bibliothèque est désenregistrée de l'application immédiatement.

## JavaScript préchargé

La section **Preloaded JavaScript** (au sein de Libraries) vous permet d'écrire du JavaScript qui s'exécute une seule fois après le chargement de toutes les bibliothèques enregistrées, avant l'exécution de toute query. Utilisez-la pour l'initialisation de bibliothèques qui doit se produire avant le lancement de votre application — par exemple, l'extension d'un plugin ou la configuration des valeurs par défaut d'une bibliothèque.

Pour ouvrir l'éditeur Preloaded JavaScript, cliquez sur **{ }** à l'intérieur de la section Libraries.

**Exemple — étendre Day.js avec le plugin UTC :**

```js
dayjs.extend(dayjs_utc);
```

**Exemple — configurer une valeur par défaut d'une bibliothèque :**

```js
Papa.LocalChunkSize = 20480;
```

Cliquez sur **Save script** pour l'enregistrer. Le script s'exécute automatiquement au démarrage de l'application après le chargement des bibliothèques.

:::info
Le Preloaded JavaScript a accès à toutes les variables de bibliothèques enregistrées ainsi qu'aux mêmes bibliothèques intégrées disponibles dans RunJS (Moment.js, Lodash, Axios).
:::

## Importer des bibliothèques via une query RunJS

Pour les bibliothèques dont vous n'avez besoin que dans une seule query, vous pouvez les charger dynamiquement à l'intérieur d'une query RunJS en utilisant `document.createElement('script')`.

### Créer une query RunJS

Ouvrez le panneau de queries et créez une nouvelle query **RunJS**.

### Comment importer des bibliothèques

Ce guide vous accompagne dans le processus d'importation de bibliothèques à l'aide de RunJS. Nous utiliserons les bibliothèques suivantes à titre de démonstration :

- [Compromise](https://github.com/spencermountain/compromise) : pour le traitement du langage naturel
- [PapaParse](https://www.papaparse.com/) : pour l'analyse de données CSV

### Créer une query RunJS

Ouvrez le panneau de queries et créez une nouvelle query **RunJS**.

### Ajouter l'extrait de code suivant

```js
// Function to add script dynamically
function addScript(src) {
  return new Promise((resolve, reject) => {
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute('src', src);
    scriptTag.addEventListener('load', resolve);
    scriptTag.addEventListener('error', reject);
    document.body.appendChild(scriptTag);
  });
}

try {
  await addScript('https://cdn.jsdelivr.net/npm/compromise@13.11.3/builds/compromise.min.js');
  await addScript('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');
  await actions.showAlert("success", "Compromise and PapaParse imported");
} catch (error) {
  console.error(error);
}
```

Après avoir ajouté le code, cliquez sur le bouton **Run** dans le panneau de queries. Une alerte apparaîtra avec le message "Compromise and PapaParse imported".

 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/import_library.png" alt="Use FlattenJS" />
:::tip
Activez l'option **Run this query on application load** dans les paramètres de la query pour que les bibliothèques soient disponibles dans toute l'application dès son chargement.
:::

## Cas d'usage

Voyons comment vous pouvez appliquer ces bibliothèques dans des cas d'usage réels.

### Extraire des éléments d'action à partir de notes de réunion avec Compromise (NLP)

Supposons que vous construisiez un outil interne de gestion de projet où les utilisateurs collent des notes de réunion brutes. Vous souhaitez extraire automatiquement les éléments d'action, les dates et les noms d'équipe. Vous pouvez utiliser le code suivant pour traiter les notes à l'aide du NLP :

```js
const notes = nlp("Met with John, Priya, and Marcus from the marketing team on Thursday. Discussed launch strategy for the Q3 campaign. Priya will draft the blog post by next Tuesday. John to prepare budget estimates. Marcus will handle email outreach by Friday. Next sync on July 10th.");

const people = notes.people().out('array');
const actions = notes.sentences().filter(s => s.has('#Verb')).out('array');

return { people, actions };
```

Prévisualisez le résultat dans le gestionnaire de queries ou cliquez sur **Run** dans le panneau de queries pour voir le résultat comme indiqué ci-dessous.


 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/extract_tags.png" alt="Use compromise" />

### Importer en masse des données d'employés dans un annuaire

Supposons que votre équipe RH conserve les dossiers des employés dans des feuilles de calcul et souhaite un moyen d'importer rapidement ces données dans votre application interne d'annuaire des employés. Vous pouvez utiliser le code suivant pour nettoyer les données :

```js
const csvData = components.filepicker1.file[0].content;

const parsedData = Papa.parse(csvData, {
  header: true,
  skipEmptyLines: true
});

return parsedData;
```

 <img className="screenshot-full img-full" src="/img/app-builder/custom-code/csv_parse_js.png" alt="Use Compromise" />

## Bibliothèques JavaScript intégrées

ToolJet est livré avec quelques bibliothèques JavaScript essentielles préchargées dans l'environnement RunJS, afin que vous n'ayez pas besoin de les importer manuellement :
- [Moment.js](https://momentjs.com/docs/) – pour le formatage et la manipulation des dates/heures
- [Lodash](https://lodash.com/docs/) – pour travailler avec des tableaux, des objets et des collections
- [Axios](https://axios-http.com/docs/intro) – pour effectuer des requêtes HTTP

Vous pouvez utiliser ces bibliothèques directement dans RunJS pour simplifier votre logique, transformer des données ou vous intégrer à des API.

Exemple :

```js
// Format Timestamps for UI Display
const raw = '2025-06-05T15:42:00Z';
return moment(raw).format('MMM D, YYYY, h:mm A');// "Jun 5, 2025, 9:12 PM"

//  Deep Comparison of Records with Lodash
const a = { name: 'Alice', dept: { id: 1, name: 'HR' } };
const b = { name: 'Alice', dept: { id: 1, name: 'HR' } };

return _.isEqual(a, b); // true

// Posting JSON Data with Error Handling
axios.post('https://api.company.com/inventory', {
  name: 'Laptop',
  quantity: 10,
}).then(res => res.data)
  .catch(err => console.error(err.response.data));
```

Utilisez RunJS pour importer et exploiter facilement des bibliothèques JavaScript externes dans votre application ToolJet pour un traitement de données et une logique avancés.
