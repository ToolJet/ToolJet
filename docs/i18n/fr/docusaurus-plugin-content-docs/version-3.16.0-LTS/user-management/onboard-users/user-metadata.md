---
id: user-metadata
title: Metadata
---

Dans ToolJet, les métadonnées utilisateur vous permettent de stocker des informations supplémentaires sur les utilisateurs, telles que des détails personnels, des clés API ou des données spécifiques à un rôle. Ces données personnalisées sont stockées au niveau de l'espace de travail et peuvent être utilisées au sein de vos applications ToolJet. Toutes les valeurs de métadonnées sont chiffrées dans la base de données pour des raisons de sécurité, et dans l'interface utilisateur, les valeurs de métadonnées sont masquées afin de protéger les informations sensibles.

## Ajouter des métadonnées utilisateur

Les métadonnées utilisateur peuvent être ajoutées soit lors de l'invitation de l'utilisateur, soit après que l'utilisateur a rejoint l'espace de travail. Suivez ces étapes pour ajouter des métadonnées utilisateur :

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace settings > Users**. <br/> 
    (URL d'exemple - `https://app.corp.com/nexus/workspace-settings/users`)

3. Repérez l'utilisateur dont les métadonnées doivent être mises à jour, cliquez sur le menu à trois points (kebab) à la fin de sa ligne, et sélectionnez **Edit user details**.
    <img className="screenshot-full" src="/img/user-management/profile-management/user-details.png" alt="Edit User Details" />

4. Cliquez sur **+ Add more** sous User metadata, et saisissez la paire clé-valeur.
    <img className="screenshot-full" src="/img/user-management/profile-management/metadata.png" alt="Edit User Details" />

5. Cliquez sur le bouton **Update** en bas.

## Utiliser les métadonnées utilisateur dans l'App Builder

Les métadonnées utilisateur peuvent être accédées au sein de n'importe quelle application de l'espace de travail via la variable globale en utilisant la syntaxe suivante :

```js
{{globals.currentUser.metadata}}
```
Pour accéder à une paire clé-valeur spécifique des métadonnées, utilisez la syntaxe suivante :

```js
{{globals.currentUser.metadata.<key>}} // Remplacez <key> par la clé de la valeur de métadonnée 
```

:::info
Rappelez-vous que même si les valeurs de métadonnées sont masquées dans l'interface utilisateur, elles sont accessibles dans l'App Builder. Assurez-vous de gérer correctement toute information sensible dans la logique de votre application.
:::

