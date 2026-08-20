---
id: print-multi-tabs-report
title: Imprimer des données depuis plusieurs onglets
---

Ce guide vous accompagne dans la création d'un rapport PDF complet qui combine le contenu de tous les onglets de votre application ToolJet. Cela est particulièrement utile lors de la création d'applications telles que des générateurs de factures, des dossiers d'employés, des rapports multi-sections, etc.

## Prérequis

Avant de commencer, assurez-vous d'avoir :

- Une application ToolJet avec un **composant Tabs** contenant plusieurs onglets
- Des données chargées et affichées dans vos onglets (provenant d'une requête de base de données, d'une API ou d'une autre source de données)
- Une familiarité de base avec :
  - La création de boutons et l'ajout de gestionnaires d'événements
  - L'écriture de requêtes JavaScript simples dans ToolJet
  - L'utilisation de variables pour stocker des données temporaires

## Configuration de l'application

Pour ce guide, nous allons utiliser un **système de gestion des leads** comme exemple. L'application dispose d'un composant Tabs avec 4 onglets.

Chaque onglet affiche les données de la table de base de données `leads` à l'aide d'une requête appelée `fetchData`.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/print-multitabs/v2/appUI.png" alt="Lead management application with tabs" />

:::note
Vous pouvez adapter cette approche à n'importe quelle application comportant des onglets. Ajustez simplement le nombre d'onglets dans les requêtes pour correspondre à votre configuration.
:::

## Étape 1 : Ajouter le bouton de téléchargement du PDF

Commencez par ajouter un bouton qui déclenchera l'ensemble du processus d'impression. Vous pouvez placer ce bouton n'importe où dans votre application, généralement en haut de vos onglets ou dans une barre d'outils.

Après avoir ajouté le bouton, configurez deux gestionnaires d'événements :

**Événement 1 : Stocker l'onglet actuel**

Ajoutez un événement **On click** avec l'action **Set variable**. Définissez la clé sur `lastSelectedTab` et la valeur sur `{{components.tabs.currentTab}}`. Cela enregistre la sélection d'onglet actuelle de l'utilisateur afin que nous puissions le ramener à cet onglet après l'impression.

**Événement 2 : Démarrer le processus d'impression**  

Ajoutez un autre événement **On click** avec l'action **Run query** et sélectionnez la requête `viewTabs`. Cela lance le processus d'itération des onglets. Nous allons créer cette requête à l'étape suivante.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/print-multitabs/v2/buttonEvents.png" alt="Download PDF button event handlers" />

**Remarque :** Vous devrez d'abord créer la requête `viewTabs` (voir l'étape suivante) avant de pouvoir la sélectionner dans ce gestionnaire d'événements.

## Étape 2 : Créer la requête d'itération des onglets

La requête `viewTabs` gère le processus d'itération qui parcourt chaque onglet. Elle utilise une variable appelée `tabIndex` pour suivre l'onglet en cours de traitement.

Créez une nouvelle requête **JavaScript (RunJS)** nommée `viewTabs` avec le code suivant :

```js
if ((variables?.tabIndex ?? undefined) == undefined) {
  await actions.setVariable("tabIndex", "0");
} else if (parseInt(variables.tabIndex) < 4){
  await actions.setVariable("tabIndex", (parseInt(variables.tabIndex) + 1).toString());
}
```

**Comment cela fonctionne :**
- La première fois qu'elle s'exécute, `tabIndex` n'existe pas, nous l'initialisons donc à "0" (le premier onglet)
- Lors des exécutions suivantes, nous incrémentons `tabIndex` de 1
- L'itération se poursuit tant que `tabIndex` est inférieur à 4 (le nombre total d'onglets)
- Les gestionnaires d'événements que nous allons ajouter ensuite appelleront cette requête de manière récursive pour traiter chaque onglet

:::note Important
Remplacez `4` par le nombre réel d'onglets de votre application.
:::

Ajoutez maintenant trois gestionnaires d'événements à cette requête pour contrôler ce qui se passe après son exécution réussie :

**Gestionnaire d'événement 1 : Basculer vers l'onglet actuel**

Ajoutez un événement **Query Success** avec l'action **Control component**. Sélectionnez le composant `tabs`, choisissez l'action **Set current tab**, et définissez l'Id sur `{{variables.tabIndex}}`. Dans le champ **Run only if**, saisissez `{{parseInt(variables.tabIndex) < 4}}`. Cet événement fait basculer l'onglet visible pour correspondre au `tabIndex` que nous venons de définir, et la condition garantit que nous ne changeons d'onglet que tant que nous sommes dans la plage d'onglets.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/print-multitabs/v2/q1.png" alt="viewTabs Event 1" />

**Gestionnaire d'événement 2 : Capturer le code HTML de l'onglet**

Ajoutez un autre événement **Query Success** avec l'action **Run query**. Sélectionnez la requête `getTabsHTML`, définissez **Debounce** sur `100` millisecondes, et dans le champ **Run only if**, saisissez `{{parseInt(variables.tabIndex) < 4}}`. Après avoir basculé vers l'onglet, nous devons lui laisser un instant pour se rendre avant de capturer son contenu. Le debounce de 100 ms garantit que l'onglet est entièrement rendu. Nous allons créer la requête `getTabsHTML` à l'étape 3.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/print-multitabs/v2/q2.png" alt="viewTabs Event 2" />

**Gestionnaire d'événement 3 : Générer le PDF**

Ajoutez un troisième événement **Query Success** avec l'action **Run query**. Sélectionnez la requête `printPDF` et dans le champ **Run only if**, saisissez `{{parseInt(variables.tabIndex) === 4}}`. Cela ne s'exécute qu'une fois que nous avons terminé de parcourir tous les onglets (lorsque `tabIndex` est égal à 4), déclenchant la génération du PDF. Nous allons créer la requête `printPDF` à l'étape 4.

<img className="screenshot-full img-full" src="/img/how-to/print-multitabs/v2/q3.png" alt="viewTabs Event 3" />

## Étape 3 : Créer la requête de capture HTML

La requête `getTabsHTML` capture le contenu HTML de l'onglet actuellement visible et le stocke dans un tableau. Chaque fois qu'elle s'exécute, elle ajoute le contenu d'un autre onglet à la collection.

Créez une nouvelle requête **JavaScript (RunJS)** nommée `getTabsHTML` avec le code suivant :

```js
actions.setVariable( // set tabsHtml variable
  "tabsHtml", 
  [...(variables?.tabsHtml ?? [])].concat([  // add html of the current tab to the tabsHtml variable
    ((variables?.tabIndex ?? -1) > 0 
      ? `<div style="top: ${ // add a div with height of 100vh to the html of the current tab
          variables?.tabIndex ?? -1 
        }00vh; position: absolute;">` // this will help to print data from all the tabs in one go
      : "") + 
      document.getElementsByClassName("widget-" + components.tabs.id)[0] // get the html of the current tab
        .innerHTML +
      "</div>", // add the html of the current tab to the tabsHtml variable
  ])
);
```

**Comment cela fonctionne :**
- Récupère le tableau `tabsHtml` existant (ou crée un tableau vide s'il n'existe pas)
- Trouve le composant Tabs dans le DOM à l'aide de sa classe de widget
- Extrait l'innerHTML de l'onglet actuel
- Enveloppe chaque onglet (sauf le premier) dans une div positionnée pour garantir des saut de page corrects dans le PDF
- Ajoute ce code HTML au tableau `tabsHtml`

Ajoutez maintenant un gestionnaire d'événement pour poursuivre la boucle :

**Gestionnaire d'événement : Passer à l'onglet suivant**

Ajoutez un événement **Query Success** avec l'action **Run query** et sélectionnez la requête `viewTabs`. Après avoir capturé le HTML de l'onglet actuel, cela déclenche à nouveau `viewTabs` pour incrémenter l'index et traiter l'onglet suivant.

<img className="screenshot-full img-full" src="/img/how-to/print-multitabs/v2/getTabsHtml.png" alt="getTabsHTML event handler" />

## Étape 4 : Créer la requête de génération du PDF

La requête `printPDF` prend tout le code HTML capturé dans le tableau `tabsHtml` et génère un document imprimable. Elle ouvre une nouvelle fenêtre de navigateur, y injecte le code HTML combiné ainsi que tous les styles de l'application, puis déclenche la boîte de dialogue d'impression.

Créez une nouvelle requête **JavaScript (RunJS)** nommée `printPDF` avec le code suivant :

```js
var printContents = variables.tabsHtml; // get the html of all the tabs from the tabsHtml variable

var winPrint = window.open("", "", "width=900,height=650"); // Open a New Window for Printing

var styles = document.querySelectorAll('link, style');
var stylesHtml = "";
for (var i = 0; i < styles.length; i++) {
  stylesHtml += styles[i].outerHTML;
}                                       // gather styles from the current page

stylesHtml += '<style>@page { size: landscape; }</style>'; // add landscape orientation to the page

winPrint.document.write(
  "<html><head>" +
    stylesHtml +
    "</head><body>" 
); // add styles to the page

for (var j = 0; j < printContents.length; j++) {
  winPrint.document.write(printContents[j]);
} // add html of all the tabs to the page

winPrint.document.write("</body></html>"); // Document Finalization and Printing
winPrint.document.close();
winPrint.focus();
winPrint.print();
```

**Comment cela fonctionne :**  
Cette requête ouvre une nouvelle fenêtre de navigateur pour l'aperçu d'impression et copie tous les styles CSS de votre application afin de garantir que le PDF s'affiche correctement. Elle définit l'orientation de la page en mode paysage (vous pouvez la remplacer par portrait si nécessaire), écrit tout le code HTML des onglets capturés dans la nouvelle fenêtre, puis déclenche la boîte de dialogue d'impression du navigateur.

Ajoutez maintenant trois gestionnaires d'événements pour nettoyer après l'impression :

**Gestionnaire d'événement 1 : Effacer la variable d'index d'onglet**

Ajoutez un événement **Query Success** avec l'action **Unset variable** et définissez la clé sur `tabIndex`.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/print-multitabs/v2/unsetVar1.png" alt="Unset tabIndex" />

**Gestionnaire d'événement 2 : Effacer le stockage HTML**

Ajoutez un autre événement **Query Success** avec l'action **Unset variable** et définissez la clé sur `tabsHtml`.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/print-multitabs/v2/unsetVar2.png" alt="Unset tabsHtml" />

**Gestionnaire d'événement 3 : Restaurer l'onglet d'origine**

Ajoutez un troisième événement **Query Success** avec l'action **Control component**. Sélectionnez le composant `tabs1`, choisissez l'action **Set current tab**, et définissez l'Id sur `{{variables.lastSelectedTab}}`. Cela ramène l'utilisateur à l'onglet qu'il consultait avant de cliquer sur le bouton d'impression.

<img className="screenshot-full img-full" src="/img/how-to/print-multitabs/v2/controlComp2.png" alt="Restore original tab selection" />

Vous avez implémenté avec succès une fonctionnalité d'impression PDF multi-onglets. Les utilisateurs peuvent désormais générer des rapports complets incluant le contenu de tous les onglets en un seul clic.
