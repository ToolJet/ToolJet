---
id: ldap
title: LDAP
---

<PlanBadge type="team" />

Lightweight Directory Access Protocol (LDAP) est un protocole utilisé pour accéder à et gérer les informations d'annuaire, permettant une authentification centralisée et une gestion des utilisateurs. En configurant LDAP avec des services d'annuaire, vous pouvez simplifier l'authentification sécurisée des utilisateurs et le contrôle d'accès dans ToolJet.

## Configurer le SSO LDAP

Pour configurer LDAP comme Single Sign-On (SSO) pour ToolJet, suivez ces étapes :

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace settings > Workspace login**. <br/>
(Exemple d'URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)

<img className="screenshot-full" src="/img/sso/ldap/url-v4.png" alt="SSO :LDAP"/>

3. Pour **activer** LDAP, actionnez le bouton bascule. Ensuite, ajoutez la configuration :
   - **Name** : Saisissez le nom du SSO.
   - **Hostname** : Indiquez le nom d'hôte ou l'adresse IP de votre serveur LDAP.
   - **Port** : Saisissez le numéro de port du serveur LDAP.
   - **Base DN** : Saisissez le nom distinctif de base (base distinguished name).
   - **SSL** : Actionnez cette option pour activer le SSL. Après l'avoir activé, vous pouvez sélectionner le type de SSL : **None** ou **Certificates**. Si vous choisissez Certificates, vous devrez fournir la **Client Key**, le **Client Certificate**, et le **Server Certificate**.
     <br/>
     <img className="screenshot-full img-m" src="/img/sso/ldap/fields-v3.png" alt="SSO :LDAP"/>

4. Après avoir effectué les configurations nécessaires, cliquez sur le bouton **Save Changes** situé en bas.

5. Ensuite, rendez-vous sur **Workspace login** et copiez la **Login URL** fournie.
6. La **Login URL** obtenue peut être utilisée pour accéder au workspace. Veuillez noter que ToolJet prend en charge la connexion LDAP au niveau du workspace, et non au niveau de l'instance. Ainsi, les utilisateurs seront connectés spécifiquement au workspace choisi.
   <img className="screenshot-full" src="/img/sso/ldap/login-v2.png" alt="SSO :LDAP"/>

7. Cliquez sur le bouton **Sign in with `<LDAP Name>`**, puis saisissez votre nom d'utilisateur et votre mot de passe pour vous connecter au workspace. Pour la connexion, ToolJet utilise le **common name (cn)** associé à chaque utilisateur du serveur LDAP comme **Username**. Lors de la première connexion, les utilisateurs seront redirigés vers la page **Workspace Invite**, tandis que les connexions suivantes les mèneront directement au tableau de bord ToolJet.

:::info
Lors de la première connexion, ToolJet effectue des vérifications supplémentaires. Il vérifie les groupes d'utilisateurs sur le serveur LDAP, et si le groupe correspondant existe dans le workspace ToolJet, l'utilisateur sera automatiquement ajouté à ce groupe. De plus, ToolJet recherche également la photo de profil de l'utilisateur sur le serveur LDAP et met à jour le compte ToolJet en conséquence.
:::

### Synchronisation des groupes

ToolJet prend en charge la synchronisation des groupes d'utilisateurs depuis votre annuaire LDAP. - La synchronisation des groupes est activée par défaut. - Lorsqu'elle est activée, les utilisateurs sont automatiquement ajoutés aux groupes ToolJet correspondants lors de la connexion. - La synchronisation des groupes peut être désactivée à l'aide du bouton bascule _Enable group sync_ dans la configuration LDAP.

    <img className="screenshot-full img-m" src="/img/sso/ldap/fields-v3-group-sync.png" alt="SSO :LDAP"/>

Si elle est désactivée, les utilisateurs seront toujours authentifiés via LDAP, mais aucune appartenance à un groupe ne sera synchronisée.

## Prise en charge de plusieurs unités organisationnelles

L'implémentation du SSO LDAP de ToolJet prend en charge l'authentification à travers plusieurs unités organisationnelles (Organizational Units, OU). Cela permet à ToolJet de rechercher parmi plusieurs noms distinctifs de base (base Distinguished Names, DN) pour localiser et authentifier les utilisateurs, facilitant ainsi la prise en charge de structures d'annuaire complexes.

### Comment activer la prise en charge multi-OU

Pour activer la prise en charge de plusieurs OU, les admins peuvent configurer une liste de base DNs à l'aide d'une variable d'environnement. ToolJet tentera d'authentifier les utilisateurs par rapport à chaque base DN dans l'ordre où elles sont définies.

**Variable d'environnement**
Définissez la variable d'environnement `TOOLJET_LDAP_BASE_DNS__<workspace_slug>` avec un tableau JSON de base DNs. Assurez-vous de remplacer `<workspace_slug>` par le slug de votre workspace.

Exemple :

```javascript
TOOLJET_LDAP_BASE_DNS__nexus_corps =
  '["ou=team1,dc=company,dc=com","ou=team2,dc=company,dc=com"]';
```

ToolJet parcourra la liste fournie lors des tentatives de connexion, en vérifiant chaque base DN jusqu'à ce qu'un utilisateur correspondant soit trouvé ou que toutes les options soient épuisées.

**Remarques**

- Si `TOOLJET_LDAP_BASE_DNS__<workspace_slug>` n'est pas défini, ToolJet reviendra par défaut au comportement à OU unique afin de maintenir la rétrocompatibilité.
- L'ordre des base DNs importe — l'authentification suivra la séquence définie dans le tableau.
