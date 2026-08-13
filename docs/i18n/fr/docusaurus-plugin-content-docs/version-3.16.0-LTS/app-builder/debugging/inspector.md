---
id: inspector
title: Inspecter les valeurs
---

L'Inspector de ToolJet est un utilitaire intégré qui offre une visibilité en temps réel sur les données et l'état de votre application. Avec l'Inspector, les développeurs peuvent rapidement diagnostiquer les problèmes, comprendre le flux des données, et s'assurer que tous les composants, requêtes et variables fonctionnent comme prévu.
 
L'Inspector est accessible depuis la barre latérale gauche de l'App Builder. Il est divisé en six sections principales, chacune offrant une perspective différente sur l'environnement d'exécution de votre application :

- [Queries](#queries)
- [Components](#components)
- [Globals](#globals)
- [Variables](#variables)
- [Page](#page)
- [Constants](#constants)

## Accéder à l'Inspector

Les valeurs affichées dans l'inspector peuvent être référencées dans d'autres composants et requêtes pour créer des applications interactives. Vous pouvez accéder à l'état actuel des composants, requêtes, variables, du handle de page, et plus encore, directement depuis l'inspector.

Vous pouvez référencer une valeur en utilisant la notation par points (par ex., `{{components.numberInput1.value}}`), ou survoler n'importe quelle propriété dans l'inspector pour copier son chemin de référence. Cela facilite la connexion des composants, la réutilisation des données, et la configuration de la logique à travers toute votre application sans écrire de code supplémentaire.

Par exemple, imaginons que vous ayez un **Table** affichant une liste d'utilisateurs, et que vous souhaitiez récupérer les détails d'un utilisateur particulier lorsqu'il est sélectionné. Vous pouvez référencer les données de la ligne sélectionnée en utilisant le chemin de référence dans l'Inspector. 

Vous pouvez soit saisir ce chemin manuellement, soit survoler la propriété dans l'Inspector pour copier directement son chemin. Ce chemin peut ensuite être utilisé dans votre requête pour référencer la valeur. De plus, vous pouvez ajouter un gestionnaire d'événement au tableau pour exécuter automatiquement cette requête chaque fois qu'un utilisateur est sélectionné.

<img className="screenshot-full img-s" src="/img/app-builder/debugging/inspector/copy-path.png" alt="Events Architecture Diagram"/>

### Queries {#queries}

Sous la section Queries, vous pouvez inspecter les détails de n'importe quelle requête que vous avez créée. Les données d'une requête ne sont visibles qu'après l'exécution de la requête. Cela vous permet de vérifier le résultat et de résoudre tout problème lié à la récupération ou à la manipulation des données. L'Inspector expose les propriétés suivantes pour chaque requête :

- **isLoading** – un booléen indiquant si la requête est actuellement en cours d'exécution. Cela peut être utilisé pour contrôler l'état de chargement des composants qui dépendent du résultat de la requête.
- **data** – les données transformées renvoyées par la requête.
- **rawData** – la réponse originale récupérée depuis la source de données.
- **id** – un identifiant unique automatiquement attribué à chaque requête dans ToolJet.

Consultez le guide [Lier des données à un composant](/docs/app-builder/connecting-with-data-sources/binding-data-to-components) pour apprendre à lier les données d'une requête à un composant.

### Components {#components}

La section Components fournit une vue détaillée de chaque composant présent sur le canevas de votre application. Vous pouvez voir l'état actuel, les propriétés et les valeurs de chaque composant, ce qui vous aide à comprendre comment les données circulent dans votre application et comment les composants interagissent entre eux. Seuls les composants de la page actuelle sont visibles dans cette section.

Chaque composant expose un ensemble différent d'états et de CSA selon sa fonctionnalité. Par exemple :
- Un composant **Text** expose un état `text` et une CSA `setText`.
- Un composant **Checkbox** expose un état `label` et une CSA `setValue`.

Pour en savoir plus sur un composant spécifique et ses propriétés exposées, consultez le guide de [chaque composant](/docs/app-builder/building-ui/component-library).

Consultez le guide [Accéder à l'état des composants](/docs/app-builder/building-ui/component-state) pour apprendre à utiliser l'état des composants.

### Globals {#globals}

En utilisant les propriétés Globals dans l'Inspector, vous pouvez consulter divers détails sur votre application et son environnement, tels que :
- **App Version** - stocke le nom de la version actuelle de l'application.
- **Current User** - informations sur l'utilisateur connecté, y compris l'email, le nom, l'avatar, les groupes, les rôles et les détails SSO. Utile pour créer une UI basée sur les rôles ou afficher du contenu personnalisé.
- **Environment** - indique l'environnement ToolJet actuel — développement, staging ou production.
- **Mode** - indique si l'application est ouverte dans l'éditeur ou non.
- **Theme** - fait référence au thème d'UI actif (clair ou sombre). Vous pouvez l'utiliser pour styliser dynamiquement les composants selon le thème sélectionné.
- **URL Params** - il s'agit des paramètres de requête ajoutés à l'URL de la page, couramment utilisés pour transmettre des données entre les pages.

### Variables {#variables}

La section Variables de l'Inspector vous permet de consulter toutes les variables au niveau de l'application disponibles au sein de l'application actuelle. Ces variables peuvent être utilisées pour stocker et partager des données entre les composants et les requêtes. Vous pouvez inspecter leurs valeurs actuelles ici, ce qui facilite le débogage et la gestion du comportement dynamique de votre application.

### Page {#page}

La section Page affiche les propriétés spécifiques à la page (telles que le handle et le nom de la page) ainsi que les variables au niveau de la page. Contrairement aux variables au niveau de l'application, les variables au niveau de la page ne sont accessibles qu'au sein de leurs pages respectives.

- **handle** - le handle de page est un identifiant unique utilisé pour générer une URL partageable pour la page. Il est ajouté comme slug à la fin de l'URL de votre application.
- **id** - un identifiant unique automatiquement attribué à chaque page dans ToolJet.
- **name** - le nom d'affichage de la page, affiché dans le menu de navigation de l'application. Défini par l'utilisateur.
- **variables** - liste des variables au niveau de la page, sous forme de paires clé-valeur.

### Constants {#constants}

Les Workspace Constants sont des valeurs prédéfinies que vous pouvez utiliser dans différentes applications au sein de votre espace de travail. Elles sont utiles pour stocker des données fréquemment utilisées telles que des URL d'API, des paramètres de configuration, ou des informations sensibles comme des clés API et des identifiants de base de données. Dans l'inspector, vous pouvez consulter toutes les constantes sous forme de paires clé-valeur ; les valeurs des constantes secrètes sont masquées pour des raisons de sécurité.
