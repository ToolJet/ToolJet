---
id: setup
title: Configuration SAML
---

<PlanBadge type="team" />

Security Assertion Markup Language (SAML) est un protocole qui facilite l'authentification SSO sécurisée en échangeant les données d'identité de l'utilisateur entre un fournisseur d'identité et un fournisseur de services. Intégrer SAML avec des fournisseurs tels qu'Okta, Active Directory Federation Services, Auth0 ou Azure AD vous permet de mettre en place une authentification fluide et sécurisée pour vos utilisateurs dans ToolJet.

## Configurer SAML

Pour activer l'authentification SAML, vous devez configurer les paramètres d'espace de travail suivants :

Rôle requis : **Admin** <br/>

1. Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2. Allez dans **Workspace settings > Workspace login**. <br/>
   (URL exemple - `https://app.corp.com/nexus/workspace-settings/workspace-login`)
   <img className="screenshot-full" src="/img/sso/saml/workspaceset-v3.png" alt="SSO :SAMP" />

3. Par défaut, SAML est désactivé. Activez l'interrupteur pour activer l'authentification SAML.
   <img className="screenshot-full img-m" src="/img/sso/saml/enable-v3.png" alt="SSO :SAMP" />

4. Saisissez les informations de configuration suivantes :
   - **SSO Name** : Saisissez le nom de votre fournisseur SAML. Ce nom sera affiché sur la page de connexion.
   - **Identity provider metadata** : Importez les données du fichier de métadonnées fourni par votre fournisseur SAML. Ce fichier contient les détails de configuration SAML.
   - **Enable group sync** : Activez l'interrupteur pour activer la synchronisation des groupes.
   - **Group Attribute** : Saisissez le nom de l'attribut contenant les informations de groupe de l'utilisateur. Cet attribut est utilisé pour associer l'utilisateur au groupe approprié.
   - **Redirect URL** : Copiez l'URL de redirection fournie et collez-la dans la page de configuration du fournisseur SAML.

   <br/>

   :::tip Télécharger les métadonnées depuis votre fournisseur d'identité
   Généralement, les métadonnées sont disponibles sous la forme d'un fichier XML que vous pouvez télécharger depuis le tableau de bord de votre fournisseur d'identité.

   Copiez les métadonnées du fichier XML et collez-les dans les paramètres de configuration SSO SAML de ToolJet. Veuillez vous assurer que les métadonnées sont collées dans le format correct, car elles contiennent des détails de configuration essentiels du fournisseur d'identité, nécessaires à l'authentification.

   De plus, vous pouvez souvent trouver ces données en accédant à `https://your-identity-provider/federationmetadata/2007-06/federationmetadata.xml`
   :::

5. Une fois configuré, cliquez sur **Save Changes**.

## Se connecter avec SAML

1. Allez dans l'onglet **Workspace login** et copiez l'**Login URL** fournie. Grâce à l'authentification SSO, nous vérifions si l'utilisateur existe déjà ; si c'est le cas, il peut se connecter facilement. Sinon, une erreur sera affichée.

2. L'**Login URL** obtenue peut être utilisée pour accéder à l'espace de travail. Veuillez noter que ToolJet prend en charge la connexion SAML au niveau de l'espace de travail, garantissant que les utilisateurs se connectent spécifiquement à l'espace de travail sélectionné. <br/>
   Ainsi, les utilisateurs peuvent désormais se connecter à votre espace de travail en utilisant l'Login URL fournie. La page de connexion affichera de manière visible le nom du fournisseur SAML configuré dans les paramètres de votre espace de travail.
   <img className="screenshot-full" src="/img/sso/saml/login-v2.png" alt="SSO :SAMP" />

3. Cliquez sur le bouton **Sign in with `SAML Name`** et vous serez redirigé vers la page de connexion du fournisseur SAML.

4. Saisissez vos identifiants et cliquez sur **Login**. Si l'utilisateur se connecte pour la première fois, il sera redirigé vers la page d'onboarding de ToolJet.

## Variables SSO personnalisées (attributs SAML)

ToolJet vous permet d'utiliser des variables SSO personnalisées fournies par votre fournisseur d'identité (IdP) lors de la connexion.

Pour le SSO basé sur SAML, ces valeurs proviennent des attributs SAML inclus dans l'assertion SAML. Après une authentification réussie, ToolJet les expose comme variables dans l'App Builder.

Vous pouvez accéder à ces variables en utilisant :

```js
{{globals.currentUser.ssoUserInfo.<variable_name>}}
```

:::note
Les attributs personnalisés doivent être explicitement configurés dans le fournisseur d'identité pour être inclus dans l'assertion SAML.
:::
