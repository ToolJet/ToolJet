---
id: pages
title: Pages et navigation
---

ToolJet permet la création d'applications multi-pages, vous aidant à décomposer votre application en différentes sections. Plutôt que de tout construire sur un seul écran, vous pouvez créer des pages distinctes pour organiser différentes fonctionnalités ou permettre la navigation au sein de votre application.

Vous pouvez ajouter les éléments suivants au menu de navigation dans ToolJet :

1. **New Page** : Créez de nouvelles pages pour prendre en charge les applications multi-pages et organiser les fonctionnalités plus efficacement.
2. **Web Pages** : Ajoutez des URL externes au menu de navigation pour rediriger les utilisateurs vers des pages web spécifiques.
3. **ToolJet Application** : Créez un lien vers d'autres applications ToolJet directement depuis le menu de navigation. Remarque : L'application doit être une application publiée (released) au sein du même workspace.
4. **Custom Navigation** : Ajoutez une navigation personnalisée en utilisant l'événement OnClick et les actions disponibles. Les éléments de ce type ne peuvent pas être définis comme page d'accueil ni désactivés.
5. **Nav Group** : Regroupez les éléments de navigation associés pour simplifier la navigation dans les applications complexes. Par exemple, tous les éléments liés à l'administration peuvent être regroupés dans un groupe, et les éléments liés aux utilisateurs dans un autre.

Ce guide explique le fonctionnement des pages et du menu de navigation, ainsi que la manière de créer et de gérer de nouveaux éléments de navigation.

## Propriétés de la page

Chaque page dans ToolJet dispose de propriétés qui définissent son identité et son comportement. Ces propriétés aident à organiser, référencer et sécuriser les pages au sein de votre application.

<img className="screenshot-full img-m" src="/img/app-builder/multi-page/dropdown.png" alt="App Builder: Canvas"/>

### Name

Un nom d'affichage pour la page, affiché dans le menu de navigation de l'application. Il est également utilisé pour référencer la page au sein de l'application ToolJet. Vous pouvez éventuellement ajouter une icône pour faciliter l'identification de la page dans le menu. Le nom et l'icône de la page peuvent être mis à jour à l'aide du menu kebab (trois points) situé à côté du nom de la page, puis en sélectionnant **Edit Page Details**.

<img className="screenshot-full img-m" src="/img/app-builder/multi-page/page-name.png" alt="App Builder: Canvas"/>

### Handle

Le handle de la page est un identifiant unique utilisé pour générer une URL partageable pour la page. Il est ajouté sous forme de slug à la fin de l'URL de votre application. Par défaut, il est généré automatiquement à partir du nom de la page. Vous pouvez le modifier manuellement depuis l'option **Edit Page Details**.

### Home Page

La page d'accueil (home page) est la page d'atterrissage par défaut au lancement de l'application. Une seule page peut être désignée comme page d'accueil dans votre application. Elle ne peut pas être supprimée, désactivée ou masquée du menu des pages. Une page peut être définie comme page d'accueil à l'aide du menu kebab (trois points) situé à côté du nom de la page ou en sélectionnant l'option **Edit Page Details**.

### Permissions

Les permissions de page contrôlent qui peut accéder à une page particulière. Vous pouvez choisir de :

- Autoriser l'accès à tous les utilisateurs ayant accès à l'application
- Restreindre l'accès à des utilisateurs sélectionnés
- Restreindre l'accès à des [groupes d'utilisateurs](/docs/user-management/role-based-access/user-roles) sélectionnés

Pour configurer les permissions de page, cliquez sur le menu kebab (trois points) situé à côté du nom de la page, sélectionnez **Page Permission**, puis sélectionnez une option de permission dans la fenêtre contextuelle.

### Disable Page

**Disable Page** vous permet de désactiver une page, la rendant inaccessible dans l'application publiée. Une page définie comme Home ne peut pas être désactivée.

### Hide Page on Navigation Menu

Vous pouvez masquer une page du menu de navigation dans l'application publiée. Cependant, les pages masquées restent accessibles via l'action Switch Page ou en accédant directement à l'URL de la page. Les pages définies comme Home ne peuvent pas être masquées.

## En-tête et menu de navigation

### En-tête de l'application

La section d'en-tête de l'application vous permet de contrôler ce qui est affiché dans l'en-tête de l'application.

<img className="screenshot-full img-m" src="/img/app-builder/multi-page/app-header.png" alt="App Builder: Canvas"/>

- **Show app header** : Activez cette option pour afficher l'en-tête de l'application.
- **Show logo** : Activez cette option pour afficher le logo de l'application. Vous pouvez mettre à jour le logo depuis les paramètres de [marque blanche](/docs/tj-setup/org-branding/white-labeling/).
- **Title** : Définissez un titre pour l'application. Celui-ci sera affiché dans l'en-tête de l'application.

### Menu de navigation

Le **menu de navigation** permet aux utilisateurs de naviguer entre les pages, les pages web externes et les autres applications ToolJet au sein de votre application. Vous pouvez personnaliser son apparence et son fonctionnement, ou même y masquer certaines pages.

#### Show Navigation Menu
Activez cette option pour afficher le menu de navigation. Lorsqu'elle est désactivée, aucun menu de navigation ne sera affiché, mais les utilisateurs pourront toujours naviguer à l'aide d'événements et d'URL de page.

#### Position
Choisissez d'afficher le menu de navigation en haut ou sur le côté de l'application.

**Menu de navigation en haut (Top)** <br/>
<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/multi-page/top-nav.png" alt="App Builder: Canvas"/>

**Menu de navigation sur le côté (Side)** <br/>
<img className="screenshot-full img-full" src="/img/app-builder/multi-page/side-nav.png" alt="App Builder: Canvas"/>

#### Style

**Menu de navigation en haut (Top)** <br/>
Choisissez le style d'affichage du menu de navigation en haut : texte seul ou texte + icône. Le menu de navigation en haut ne peut pas être réduit (collapsed).

**Menu de navigation sur le côté (Side)** <br/>
Choisissez parmi les styles d'affichage suivants : texte seul, icône seule, ou texte + icône. Le menu de navigation latéral prend également en charge une mise en page réductible (collapsible).

## Gestionnaires d'événements

Le Page Event Handler vous permet de déclencher des actions automatiquement au chargement d'une page. Utilisez-le pour préparer des données, définir des valeurs par défaut ou exécuter toute logique requise.

Par exemple, il peut exécuter une query pour récupérer les dernières données de la base de données et les insérer dans un composant table. Cela garantit que la page est prête avec des informations à jour chaque fois qu'elle est chargée.

<img className="screenshot-full img-full" src="/img/app-builder/multi-page/page-event.png" alt="App Builder: Canvas"/>

## Variables exposées

Les variables exposées sont des valeurs d'une page accessibles dans toute l'application. Elles incluent des valeurs par défaut au niveau de la page comme le nom de la page, l'ID de la page et le handle de la page. En plus de celles par défaut, des variables de page personnalisées peuvent également être définies et consultées en tant que variables exposées.

| Variable  | Description | Comment y accéder |
| ----------- | ----------- | ------------- |
| handle | Représente le slug de la page au sein de l'application. Il est défini automatiquement à la création d'une page, mais peut être [renommé](#handle) depuis les options de la page. | `{{page.handle}}`|
| name | Indique le nom de la page. | `{{page.name}}` |
| id | Chaque page de l'application ToolJet reçoit un identifiant unique à sa création. | `{{page.id}}` |
| variables | L'objet variables contient toutes les variables créées pour une page spécifique à l'aide de l'action [Set Page Variable](/docs/actions/set-page-variable).  | `{{page.variables.<pageVariableName>}}`, où `<pageVariableName>` fait référence au nom de la variable. |

## Gérer un élément de navigation

### New Page

Vous pouvez ajouter une nouvelle page pour organiser la navigation de l'application ou pour séparer différentes parties de votre application. Pour ajouter une nouvelle page, cliquez sur le bouton **+ New page** en bas du panneau Pages and menu. Saisissez le nom de la page et appuyez sur Entrée pour créer la page.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/new-page.png" alt="App Builder: Canvas"/>

### Web Page

Pour lier une page web externe au menu de navigation, cliquez sur le menu kebab (trois points) situé à côté du bouton **+ New Page**, puis sélectionnez **Add nav item with URL**.
Saisissez un nom et indiquez l'URL. Vous pouvez également choisir d'ouvrir la page web dans un nouvel onglet ou dans le même onglet, et éventuellement sélectionner une icône pour l'élément de navigation.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/webpage-v2.png" alt="App Builder: Canvas"/>

### ToolJet App

Pour ajouter une application ToolJet au menu de navigation, cliquez sur le menu kebab (trois points) situé à côté du bouton **+ New Page**, puis sélectionnez **Add nav item ToolJet app**.
Saisissez un nom et sélectionnez l'application dans la liste déroulante. Seule l'application publiée (release) du même workspace apparaîtra dans la liste déroulante. Vous pouvez également choisir d'ouvrir l'application dans un nouvel onglet ou dans le même onglet, et éventuellement sélectionner une icône pour l'élément de navigation.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/tooljet-app-v2.png" alt="App Builder: Canvas"/>

### Custom Navigation

Pour ajouter un élément de navigation personnalisé au menu de navigation, cliquez sur le menu kebab (trois points) situé à côté du bouton **+ New Page**, puis sélectionnez **Add custom nav item**. Saisissez un nom et éventuellement sélectionnez une icône pour l'élément de navigation. Vous pouvez ensuite configurer le gestionnaire d'événement **On Click** pour déclencher n'importe quelle action disponible lorsque l'élément est cliqué.

Les éléments de ce type ne peuvent pas être définis comme page d'accueil ni désactivés.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/custom-nav-v2.png" alt="App Builder: Canvas"/>

### Nav Group

Les éléments de navigation associés peuvent être regroupés à l'aide d'un nav group. Pour ajouter un nouveau nav group, cliquez sur le menu kebab (trois points) situé à côté du bouton **+ New Page**, puis sélectionnez **Add nav group**. Saisissez le nom du groupe et appuyez sur Entrée pour créer le groupe. Vous pouvez ensuite glisser des éléments dans le dossier du groupe. Vous pouvez également ajouter une icône au groupe pour une meilleure identification visuelle.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/new-group-v2.png" alt="App Builder: Canvas"/>
