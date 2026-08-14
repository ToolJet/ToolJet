---
id: example-configuration
title: Exemple de Configuration
---


Dans ce guide, vous apprendrez comment migrer des applications à l'aide de GitSync dans une installation ToolJet multi-instance à travers un exemple pratique.

Vertex Solutions, une entreprise qui développe des applications internes avec ToolJet, dispose de trois instances ToolJet pour les environnements de **développement, de staging et de production**. Elle a configuré GitSync sur les trois instances avec GitHub en suivant les instructions de configuration fournies dans la documentation [GitSync](/docs/development-lifecycle/gitsync/overview).

## Création de l'Application

L'entreprise souhaite créer un **Système de Gestion des Stocks**. Un développeur commence par cliquer sur **Create New App** sur le tableau de bord. Dans la fenêtre modale qui apparaît, il saisit le nom de l'application et sélectionne la case **Commit changes** pour enregistrer l'application dans le dépôt Git configuré. En cliquant sur **Create App**, l'application sera ajoutée à votre dépôt Git avec un message de commit.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/create-app.png" alt="self-hosted-env-concept" />

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/create-app-github.png" alt="self-hosted-env-concept" />

-   Les développeurs construisent ensuite l'application dans l'App Builder en glissant-déposant des composants et en ajoutant les requêtes pertinentes. Une fois les modifications terminées, ils peuvent utiliser le bouton GitSync dans la barre supérieure pour effectuer un push d'un commit vers le dépôt Git.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/appbuilder-1.png" alt="self-hosted-env-concept" />


-   Une fois le commit effectué, les mises à jour apparaissent dans le dépôt Git, affichant le message de commit, l'auteur et l'horodatage.
<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/github-2.png" alt="self-hosted-env-concept" />
-   Le développement est terminé et l'application est prête à être récupérée (pull) dans l'instance de staging pour être testée.
    

## Importation de l'Application dans le Staging

Après avoir configuré GitSync pour l'instance de staging avec le même dépôt Git que l'instance de développement, les testeurs peuvent importer l'application en suivant ces étapes :

-   Accéder au **tableau de bord ToolJet** de l'instance de staging.
    
-   Cliquer sur les **trois points** situés à côté du bouton **Create New App**.
-   Sélectionner **Import from Git Repository** pour récupérer l'application.
 <img  className="screenshot-full img-m" src="/img/development-lifecycle/environments/import-1.png" alt="self-hosted-env-concept" />   
-   Choisir l'application dans la liste déroulante. Le nom de l'application et les détails du dernier commit apparaissent.
    
-   Cliquer sur **Import App** pour l'importer dans l'instance de staging.
<img style={{ marginBottom:'15px' }} className="screenshot-full img-m" src="/img/development-lifecycle/environments/import-2.png" alt="self-hosted-env-concept" />

- Une fois les applications importées dans l'instance de staging, toutes les sources de données sont également importées. Toutefois, pour des raisons de sécurité, les mots de passe et les secrets présents dans la configuration des sources de données ne sont pas inclus.
- Pour garantir le bon fonctionnement de l'application dans l'instance de staging et permettre son test avec les données de staging, les utilisateurs doivent ressaisir ces informations dans la configuration.
- Après avoir ajouté la configuration de la source de données, les testeurs peuvent vérifier les fonctionnalités de l'application. L'application s'ouvrira en mode lecture seule.

### Itération et Correction des Problèmes

Si les testeurs trouvent des bugs ou demandent des modifications, les développeurs créent une **nouvelle version** dans l'instance de développement.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/iterate-1.png" alt="self-hosted-env-concept" />

Lors du commit d'une nouvelle version via **GitSync** :

-   Le fichier JSON à l'intérieur du dossier de l'application est mis à jour avec le nom de la version.
    
-   Le fichier **meta.json** dans le dossier .meta est modifié avec le nouvel identifiant et le nom de la version.
<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/iterate-github.png" alt="self-hosted-env-concept" />

Après avoir apporté les modifications nécessaires, les développeurs effectuent un commit des mises à jour vers le dépôt Git.

### Récupération des Mises à Jour dans le Staging

Les testeurs de l'**instance de staging** mettent à jour l'application en :

-   Cliquant sur le bouton **GitSync** dans la barre supérieure.
    
-   Une fenêtre modale apparaît avec une option pour **Check for Updates**.
<img  className="screenshot-full img-m" src="/img/development-lifecycle/environments/check-updates.png" alt="self-hosted-env-concept" />
    
-   En cliquant sur **Check for Updates**, les dernières modifications sont récupérées depuis le dépôt Git.
    
-   Les détails du commit (message, auteur, date) sont affichés.
    
-   En cliquant sur **Pull Changes**, les dernières mises à jour sont synchronisées dans l'instance de staging.

<img className="screenshot-full img-m" src="/img/development-lifecycle/environments/update-app.png" alt="self-hosted-env-concept" />

### Déploiement en Production

Une fois que l'application a passé les tests en staging, elle est importée dans l'**instance de production** en utilisant le même processus GitSync. L'application est ensuite publiée, la rendant disponible pour les utilisateurs finaux.
