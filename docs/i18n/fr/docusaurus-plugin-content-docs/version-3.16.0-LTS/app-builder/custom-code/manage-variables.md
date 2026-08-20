---
id: managing-variables
title: Gérer les variables
---

Les variables dans ToolJet vous permettent de stocker et de gérer des données temporaires entre les pages ou au sein d'une seule page. Elles sont utiles pour transmettre des valeurs entre composants, conserver un état, et créer des applications dynamiques.

Ce guide explique comment gérer les [variables](/docs/app-builder/events/use-case/variables) à l'aide de code dans vos applications.

## Définir, récupérer et supprimer des variables

Définir, récupérer et supprimer des variables vous permet de contrôler l'état d'une variable. Utilisez set pour créer des variables ou mettre à jour leurs valeurs, get pour y accéder depuis des composants ou des requêtes, et unset pour les supprimer. 

### Définir des variables

Pour définir une variable dans une application à l'aide de code dans une requête RunJS ou RunPy, utilisez la fonction `setVariable` en passant le nom et la valeur de la variable. 

```js
actions.setVariable("<variableName>", "<variableValue>")
```

**Exemple :** si vous créez un outil interne de gestion des commandes et souhaitez stocker l'*orderId* d'une commande nouvellement créée. Vous pouvez utiliser le code suivant :

```js
actions.setVariable('currentOrderId', 'ORD-10293')
```

De la même manière, si vous souhaitez définir une variable de page, utilisez la fonction `setPageVariable` :

```js
actions.setPageVariable("<variableName>", "<variableValue>")
``` 

**Exemple :** si vous souhaitez définir une variable de page nommée *userPreferences*, avec un objet contenant toutes les préférences utilisateur, comme `{theme:'dark', language:'en'}`, vous pouvez utiliser le code suivant :

```js
actions.setPageVariable('userPreferences', { theme: 'dark', language: 'en' });
```

### Récupérer des variables
Pour accéder aux variables, vous pouvez utiliser les fonctions `getVariable` et `getPageVariable`. Ces fonctions prennent un seul argument : le nom de la variable. 

```js
// To get app-level variable
actions.getVariable("<variableName>");

// To get page-level variable
actions.getPageVariable("<variableName>");
``` 

**Exemple :** si vous avez précédemment stocké une variable nommée *currentOrderId* et souhaitez maintenant y accéder, vous pouvez utiliser le code ci-dessous :

```js
const orderId = actions.getVariable('currentOrderId');
```

### Supprimer des variables
Pour supprimer (unset) une variable, vous pouvez utiliser les fonctions `unsetVariable` et `unsetPageVariable`. Ces fonctions prennent un seul argument : le nom de la variable.

```js
// To delete app-level variable
actions.unsetVariable("<variableName>")

// To delete page-level variable
actions.unsetPageVariable("<variableName>")
```

**Exemple :** si vous souhaitez supprimer une variable de page nommée *userPreference*, vous écririez :

```js
actions.unsetPageVariable('userPreferences');
```

## Cas d'usage

### Partager des données entre les pages

Vous pouvez partager des données entre différentes pages en définissant une variable sur une page et en y accédant sur une autre. 

Par exemple, dans un système de gestion de contenu, la page d'accueil peut afficher une liste d'articles (comme illustré dans l'image ci-dessous). Lorsqu'un utilisateur clique sur le bouton **View Post**, il est redirigé vers une nouvelle page pour voir le contenu complet. Pour permettre cela, le *postId* est stocké en tant que variable globale afin d'être accessible à la fois depuis la page d'accueil et depuis la page de détails de l'article.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/manage_var_cms.png" alt=" CMS Page"/>

Sur la page d'accueil, vous pourriez ajouter un gestionnaire d'événement de clic sur le bouton **View Post** qui définit une variable appelée *selectedListViewIndex* avec l'ID de l'article sélectionné. Ensuite, sur la deuxième page, vous pourriez récupérer cette variable et l'utiliser pour récupérer l'article complet depuis la base de données.

<img className="screenshot-full img-l" style={{marginBottom:"15px"}} src="/img/app-builder/custom-code/manage_var_cms_inspector.png" alt="CMS variable"/>

```js
// Saving the post ID to a variable
actions.setVariable("selectedListViewIndex", components.postList.selectedRow.id); 

// Retrieving the post ID
const postId = actions.getVariable("selectedListViewIndex");
```

### Configurer le payload d'un formulaire pour un formulaire en plusieurs étapes

Si vous créez un **Form** en plusieurs étapes, chaque étape peut nécessiter des champs différents et apparaître sur des pages séparées. Vous pouvez utiliser des variables pour construire le payload en fonction de la page actuellement active.

Supposons que votre **Form** comporte trois étapes : informations personnelles, parcours scolaire et expérience professionnelle. Chaque étape possède son propre ensemble de champs. Si vous souhaitez construire un payload final à envoyer comme corps de requête lorsque le bouton de soumission est cliqué à la dernière étape, vous pouvez créer une requête RunJS qui vérifie quelle étape est active et construit le payload en conséquence. Voici comment vous pourriez l'implémenter :

```js
let payload = {};

if (page.handle === "personalDetails") {
    payload.firstName = components.firstName.value;
    payload.lastName = components.lastName.value;
    payload.email = components.email.value;
} 
else if (page.handle === "education") {
    payload.educationLevel = components.educationLevel.value;
    payload.major = components.major.value;
    payload.graduationYear = components.graduationYear.value;
} 
else if (page.handle === "workExperience") {
    payload.companyName = components.companyName.value;
    payload.startDate = components.startDate.value;
    payload.endDate = components.endDate.value;
    payload.jobTitle = components.jobTitle.value;
}

actions.setVariable("formPayload", payload);
```

Vous pouvez maintenant transmettre ce payload à une requête qui l'envoie à votre endpoint d'API backend.

Les variables permettent de conserver des données entre les pages, tandis que les variables de page permettent de gérer une logique localisée, propre à chaque page. Utilisez les variables de page pour un état d'UI temporaire et spécifique à une page, et utilisez les variables au niveau de l'application lorsque les données doivent persister sur plusieurs pages.

