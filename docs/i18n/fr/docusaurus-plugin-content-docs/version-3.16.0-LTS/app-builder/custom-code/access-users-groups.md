---
id: access-currentuser
title: Activer/Désactiver un composant selon les propriétés de l'utilisateur actuel
---

ToolJet fournit plusieurs **variables exposées** accessibles depuis les composants et les requêtes. L'une de ces variables exposées est globals, qui donne accès aux informations de l'utilisateur actuellement connecté via globals.currentUser.

Pour explorer les variables exposées, cliquez sur l'icône **Inspector** dans la barre latérale gauche.

## Variables exposées sous globals.currentUser

L'objet `globals.currentUser` contient les informations sur l'utilisateur actuellement connecté.

- **email** : `{{globals.currentUser.email}}`
- **firstName** : `{{globals.currentUser.firstName}}`
- **lastName** : `{{globals.currentUser.lastName}}`
- **groups** : `{{globals.currentUser.groups}}`
- **role** : `{{globals.currentUser.role}}`
- **ssoUserInfo** : `{{globals.currentUser.ssoUserInfo}}`

### À propos de groups

La variable `groups` est un tableau contenant les noms des groupes auxquels appartient l'utilisateur. Exemple d'utilisation :

```js
{{ globals.currentUser.groups.includes("admin") }}
```


## Exemple : désactiver un bouton si l'utilisateur n'est pas administrateur

Dans cet exemple, nous allons désactiver le bouton *Add new item* pour les utilisateurs qui ne font pas partie du groupe *admin*.

1. Cliquez sur la poignée du **Button** pour ouvrir ses propriétés et accédez à la propriété **Disable**.

    <img className="screenshot-full img-m" src="/img/how-to/access-currentuser/v2/button.png" alt="Properties of button" />

2. **Configurer la propriété Disable**  
    Définissez le champ Disable pour vérifier si l'utilisateur appartient au groupe admin. Si l'utilisateur ne fait pas partie du groupe admin, le bouton sera désactivé. Vous pouvez utiliser le code suivant.
    ```javascript
    {{ !globals.currentUser.groups.includes("admin") }}
    ```
    <img className="screenshot-full img-m" src="/img/how-to/access-currentuser/v2/disable.png" alt="Disable Property of button" />

3. Après la publication de l'application, les utilisateurs non administrateurs verront le bouton dans un état désactivé.

    <img className="screenshot-full img-m" src="/img/how-to/access-currentuser/v2/released.png" alt="Released button disabled when user is not admin" />
