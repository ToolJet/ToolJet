---
id: creating-managing-queries
title: Créer et gérer des queries
---

Une query est un moyen d'interagir avec vos **[sources de données](/docs/data-sources/overview)** et sert de lien entre l'interface utilisateur de votre application et vos données. Les queries connectent votre application aux sources de données configurées telles que SQL, NoSQL, les bases de données vectorielles, les API, les feuilles de calcul et les services cloud. Qu'il s'agisse de récupérer des enregistrements depuis votre collection MongoDB ou de mettre à jour des données dans une base SQL, vous pouvez utiliser des queries pour interagir avec elles.

Les queries sont créées dans le panneau des queries, situé en bas de l'App Builder, où vous pouvez soit utiliser un générateur visuel basé sur des formulaires, soit écrire du code/SQL manuellement.

<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/query-panel.png" alt="App Builder: Query Panel"/>

## Créer une nouvelle query

- Cliquez sur le bouton **+** dans le panneau des queries pour ouvrir un menu listant les sources de données disponibles, ou vous pouvez ajouter une nouvelle source de données en cliquant sur le bouton **+ Add new Data Source**.
- Sélectionnez la source de données souhaitée.

<img className="screenshot-full img-s" src="/img/app-builder/connecting-with-datasouces/create-query.png" alt="App Builder: Create queries"/>

## Dossiers de queries

Les dossiers de queries vous permettent de regrouper des queries associées dans des dossiers nommés à l'intérieur du panneau des queries, facilitant la gestion et la navigation lorsqu'une application contient un grand nombre de queries.

### Créer un dossier

Cliquez sur l'icône **+** dans l'en-tête du panneau des queries. Dans le menu qui apparaît, sélectionnez **New Folder**.

:::info Règles de nommage des dossiers
- Seules les lettres (a–z, A–Z) et les chiffres (0–9) sont autorisés — pas d'espaces ni de caractères spéciaux.
- Ne peut pas commencer par un chiffre.
- Doit comporter entre 1 et 32 caractères.
- Doit être unique — ne peut pas partager de nom avec un autre dossier ou une autre query.
:::

<img className="screenshot-full img-s" src="/img/app-builder/connecting-with-datasouces/query-folder-create.png" alt="App Builder: Create a query folder"/>

### Ajouter des queries à un dossier

Il existe trois façons d'ajouter des queries à un dossier.

:::info
Vous pouvez également utiliser la fonctionnalité [Auto-sort Queries](/docs/build-with-ai/generate-applications#auto-sort-queries) de ToolJet AI pour ajouter des queries dans le dossier grâce à l'IA.
:::

- **Créer directement à l'intérieur d'un dossier** : Cliquez sur le menu à trois points d'un dossier et sélectionnez **Add new query**. La nouvelle query sera créée à l'intérieur de ce dossier.
  <img className="screenshot-full img-m" src="/img/app-builder/connecting-with-datasouces/query-folder-add-query.png" alt="App Builder: Add query to folder"/>
- **Déplacer une query existante** : Cliquez sur le menu à trois points d'une query et sélectionnez **Move to a folder**, puis choisissez le dossier de destination. <br/>
  <img className="screenshot-full img-s" src="/img/app-builder/connecting-with-datasouces/query-add-folder.png" alt="App Builder: Add query to folder"/>
- **Glisser-déposer** : Faites glisser une query existante depuis la liste et déposez-la dans le dossier cible.

### Renommer un dossier

Cliquez sur le menu à trois points d'un dossier et sélectionnez **Rename**. Saisissez le nouveau nom et appuyez sur **Entrée** pour confirmer, ou appuyez sur **Échap** pour annuler.

### Supprimer un dossier

Cliquez sur le menu à trois points d'un dossier et sélectionnez **Delete**. Vous serez invité à choisir l'une des deux options suivantes :

- **Delete** : Supprime le dossier. Toutes les queries qu'il contient sont déplacées au niveau racine.
- **Delete folder and queries** : Supprime définitivement le dossier ainsi que toutes les queries qu'il contient.

<img className="screenshot-full img-m" src="/img/app-builder/connecting-with-datasouces/query-folder-delete.png" alt="App Builder: Delete query folder" />

## Configurer la query

L'interface de configuration des queries dépend du type de source de données. Si vous utilisez une source de données SQL, vous pouvez configurer votre query soit en mode GUI, soit en mode SQL. Les autres sources de données se configurent via une interface graphique basée sur des formulaires.

### Mode GUI

- Pour la source de données Postgres, en mode GUI (comme illustré dans l'image ci-dessous), vous devrez sélectionner les opérations que vous souhaitez effectuer, puis remplir les champs requis.
  <img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/gui-mode.png" alt="App Builder: configure PostgreSQL queries"/>

- Dans cet exemple utilisant la source de données AWS S3, vous pouvez effectuer l'opération **Upload object** pour téléverser un fichier dans un bucket S3. Vous devrez fournir des détails comme le nom du bucket, la clé et d'autres paramètres pertinents selon l'opération sélectionnée.

    <img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/aws-gui.png" alt="App Builder: configure AWS S3 queries"/>

### Mode SQL

Pour des sources de données telles que MYSQL, PostgreSQL ou SQL Server, vous pouvez choisir le mode SQL, où vous pouvez écrire la requête SQL pour effectuer l'opération souhaitée.

<img className="screenshot-full img-full" src="/img/app-builder/connecting-with-datasouces/sql-mode.png" alt="App Builder: configure PostgreSQL queries"/>

<!-- ## JavaScript and Python queries

You can also create JavaScript or Python queries to manipulate your data from other queries, write business logic, or integrate third-party libraries. Learn more about them in **[Running JavaScript](/docs/data-sources/run-js)** and **[Running Python](/docs/data-sources/run-py)** documentation. -->

## Paramètres personnalisés

Vous avez souvent besoin qu'une query récupère des données différentes selon la saisie de l'utilisateur, l'état d'un composant ou une autre logique. Les paramètres personnalisés vous permettent de transmettre des valeurs dynamiques à une query, la rendant réutilisable sans coder les valeurs en dur.

Supposons que vous ayez une query qui récupère les détails des employés en fonction du département. Plutôt que de créer une query distincte pour chaque département, vous pouvez définir un paramètre comme `departmentName`, et l'utiliser pour filtrer les résultats dynamiquement.

Pour ajouter des paramètres, cliquez simplement sur le bouton **+ Add** situé à côté du label Parameters dans l'éditeur de query.

Pour chaque paramètre, vous devez spécifier :

- **Name** : L'identifiant du paramètre.
- **Default value** : Cette valeur peut être une chaîne constante, un nombre ou un objet.

**Syntaxe pour utiliser le paramètre :** Employez `parameters.<identifier>` dans votre query. Il est important de noter que les paramètres ne peuvent être utilisés qu'au sein de la query spécifique où ils sont définis.

Pour en savoir plus, consultez **[Utiliser des paramètres personnalisés](/docs/app-builder/connecting-with-data-sources/use-custom-parameters)**.

<img className="screenshot-full" src="/img/v2-beta/app-builder/querypanel/newui3/queryparams-v2.png" alt="Custom Parameters" style={{marginBottom:'15px'}}/>

## Aperçu et exécution

Avant de connecter une query à l'interface utilisateur de votre application, utilisez le bouton Preview pour vérifier ce qu'elle renvoie. Ceci est particulièrement utile lorsque vous travaillez avec des API externes ou du SQL complexe. Vous pouvez inspecter la réponse brute ou JSON, déboguer tout problème, et vous assurer que les données correspondent à ce dont vos composants ont besoin.

Une fois que tout semble correct, utilisez le bouton Run pour exécuter la query et vérifier comment elle interagit avec vos composants et les autres queries.

### Interrompre une query

Si une query prend trop de temps, par exemple une requête SQL sans clause `LIMIT` qui finit par récupérer des millions de lignes, vous n'avez pas besoin d'attendre qu'elle se termine, ni d'actualiser l'application pour l'arrêter.

- Si une query déclenchée via **Run** ou **Preview** est toujours active après 3 secondes, un bouton **Abort** apparaît à côté de Run et Preview.
- Cliquez sur **Abort**, ou utilisez le raccourci **⌘ + .** (Mac) / **Ctrl + .** (Windows/Linux), pour arrêter d'attendre la réponse.
- Pendant l'exécution d'une query, les contrôles **Run**, **Preview** et de génération de query par IA sont désactivés jusqu'à ce que vous l'interrompiez ou qu'elle se termine d'elle-même.

:::note
Abort annule la requête en attente uniquement côté client. Cela arrête l'app-builder d'attendre une réponse, mais la source de données sous-jacente peut continuer à traiter la query de son côté jusqu'à ce qu'elle se termine.
:::

Abort n'est pas disponible pour les queries **RunJS**, **RunPy** et **Workflow**, car elles ne s'exécutent pas comme des requêtes réseau annulables.

Les queries peuvent également être interrompues de manière programmatique en utilisant `queries.<queryName>.abort()`, ou en tant qu'action d'événement. Pour en savoir plus, consultez **[Exécuter des actions depuis RunJS](/docs/actions/run-actions-from-runjs#abort-query)** et la **[référence de l'action Abort Query](/docs/actions/abort-query)**.

## Permission au niveau de la query

Vous pouvez configurer des permissions au niveau de la query pour permettre uniquement à certains utilisateurs finaux ou groupes d'utilisateurs sélectionnés d'exécuter la query.

### Configurer une permission au niveau de la query

Suivez ces étapes pour configurer une permission au niveau de la query :

**Rôle requis** : Admin ou Builder

1. Sélectionnez la query, puis cliquez sur le menu kebab (trois points) situé à côté du nom de la query dans le panneau des queries. <br/>
   <img className="screenshot-full img-l" style={{ marginTop: '15px' }} src="/img/app-builder/connecting-with-datasouces/query-permission-kebab.png" alt="App Builder: Create queries"/>
2. Sélectionnez **Query permission**. <br/>
   <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/connecting-with-datasouces/query-permission.png" alt="App Builder: Component library"/>
3. Sélectionnez le **Type** :
   - **All users with access to the app** : Accorde l'accès à tous les utilisateurs qui peuvent accéder à l'application.
   - **Users** : Sélectionnez des utilisateurs spécifiques dans la liste déroulante. Remarque : Ces utilisateurs doivent déjà avoir accès à l'application.
   - **User groups** : Restreint l'accès aux membres des groupes d'utilisateurs sélectionnés. Remarque : Les groupes d'utilisateurs sélectionnés doivent avoir accès à l'application.
     <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/app-builder/connecting-with-datasouces/permission-type.png" alt="App Builder: Component library"/>

**Remarque** : Si les permissions d'une query ont été configurées par un administrateur et que le builder ne figure pas parmi les utilisateurs ou groupes autorisés, le builder ne pourra pas exécuter ou modifier la query ou ses permissions.

## Déclencheurs (Triggers)

Les triggers vous permettent de contrôler quand et comment une query s'exécute au sein de votre application. Vous les trouverez sous l'onglet **Settings** de l'éditeur de query. Voici les triggers disponibles :

### Run This Query on Application Load

Utilisez cette option lorsque vous souhaitez que les données soient disponibles dès le chargement de la page, comme récupérer automatiquement les données du tableau de bord d'un utilisateur ou alimenter les options d'une liste déroulante sans nécessiter de saisie utilisateur.

### Request Confirmation Before Running Query

Pour les actions qui modifient ou suppriment des données, activez cette option pour demander confirmation aux utilisateurs avant l'exécution de la query. Elle agit comme une protection contre les clics accidentels qui pourraient altérer des enregistrements critiques.

**Interrupteur statique (Static toggle)** : Activez l'interrupteur pour toujours demander une confirmation.

**fx (expression dynamique)** : Cliquez sur le bouton **fx** situé à côté de l'interrupteur pour passer en mode expression. Lorsque fx est actif, l'interrupteur est visuellement désactivé et un champ de saisie de code apparaît où vous pouvez saisir n'importe quelle expression qui s'évalue en booléen — par exemple, `{{components.userRole.value === 'admin'}}` ne demanderait une confirmation qu'aux utilisateurs admin. Désactiver fx évalue l'expression actuelle en booléen afin qu'aucun état ne soit perdu.

**Confirmation message** : Lorsque la confirmation est activée (via l'interrupteur statique ou fx), un champ **Confirmation message** apparaît en dessous. Saisissez ici un texte pour remplacer l'invite par défaut. Le champ prend en charge les expressions `{{}}`, donc les messages peuvent être dynamiques — par exemple, `Delete {{components.table1.selectedRow.name}}?`. S'il est laissé vide, le message par défaut est affiché : *Do you want to run this query — queryName?*

<img className="screenshot-full img-l" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/confirm.png" alt="App Builder: confirmation dialog"/>

### Show Notification on Success

Informez les utilisateurs lorsque des actions se terminent avec succès. Cela améliore l'expérience utilisateur en fournissant un retour en temps réel. Vous pouvez personnaliser le message et sa durée d'affichage.
<img className="screenshot-full img-l" style={{ marginBottom:'15px'}} src="/img/app-builder/connecting-with-datasouces/notification.png" alt="App Builder: notification on query run"/>

### Retry on Network Errors

Ce paramètre n'est disponible que pour les queries REST API. Il vous permet de relancer automatiquement les requêtes REST API en cas de certaines erreurs réseau ou de codes de statut HTTP spécifiques. Par défaut, il relance une requête API échouée jusqu'à 3 fois avant de la marquer comme échouée. Consultez la [documentation REST API](/docs/data-sources/restapi/querying-rest-api/#retry-on-network-errors) pour plus de détails.

### Disable Query

Utilisez cette option pour empêcher conditionnellement l'exécution d'une query. Saisissez une expression de code dans le champ **Disable query** — lorsque l'expression s'évalue à `true`, l'exécution de la query est bloquée.

```js
// Example: disable during an active edit session
{{components.editModeToggle.value === true}}
```

Lorsqu'une expression de désactivation est définie, le champ optionnel **Disable message** devient actif. Saisissez ici un message qui sera présenté aux utilisateurs finaux lorsqu'ils tentent d'exécuter la query désactivée. S'il est laissé vide, le message par défaut est : *This query is disabled*.

```js
// Example: dynamic disable message
Editing is in progress — save your changes before running this query.
```

:::tip
Laissez le champ **Disable query** vide pour que la query reste toujours activée.
:::
