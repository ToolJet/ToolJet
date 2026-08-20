---
id: setup
title: Configuration OpenID Connect
---

<PlanBadge type="team" />

OpenID Connect (OIDC) est un protocole d'authentification qui aide les applications à vérifier l'identité des utilisateurs via un fournisseur d'identité. En configurant OIDC avec des fournisseurs d'identité tels que **[Azure AD](/docs/user-management/sso/oidc/azuread)**, **[Google](/docs/user-management/sso/oidc/google)** ou **[Okta](/docs/user-management/sso/oidc/okta)**, vous pouvez mettre en place une authentification simple et sécurisée pour vos utilisateurs dans ToolJet.

:::info Configurer OIDC avec un identifiant autre qu'un e-mail
ToolJet permet également de configurer OIDC en utilisant un identifiant autre qu'un e-mail (par exemple, un ID d'employé). Pour en savoir plus, consultez [cette section](/docs/user-management/sso/oidc/setup#configuring-tooljet-oidc-with-non-email-identifier).
:::

## Type d'octroi (Grant Type)

#### Authorization Code

Choisissez cette option lors de la configuration du SSO pour des applications côté serveur où vous pouvez stocker le Client Secret en toute sécurité. Cette option est idéale pour les configurations d'entreprise où ToolJet peut gérer le secret en toute sécurité et communiquer avec votre fournisseur d'identité.

#### Authorization Code with PKCE

Choisissez cette option lors de la configuration du SSO pour des clients publics tels que les applications s'exécutant dans le navigateur, les applications mobiles, ou les environnements où le stockage sécurisé d'un Client Secret n'est pas possible. PKCE garantit une authentification sécurisée sans exposer de secrets.

## Configurer OIDC

Suivez ces étapes pour activer OIDC dans votre système :

Rôle requis : <br/>
&nbsp;&nbsp;&nbsp;&nbsp; Au niveau de l'instance : **Super Admin** <br/>
&nbsp;&nbsp;&nbsp;&nbsp; Au niveau de l'espace de travail : **Admin**

1.  Cliquez sur l'icône des paramètres (⚙️) en bas à gauche de votre tableau de bord.

2.  Au niveau de l'instance : <br/>
    Allez dans **Settings > Instance login**. <br/>
    (URL exemple - `https://app.corp.com/instance-settings/instance-login`)

        Au niveau de l'espace de travail : <br/>
        Allez dans **Workspace Settings > Workspace login**. <br/>
        (URL exemple - `https://app.corp.com/nexus/workspace-settings/workspace-login`)

3.  À droite, vous verrez des interrupteurs permettant d'activer le SSO via différents clients. Tous les interrupteurs de client sont désactivés par défaut. Activez l'interrupteur en face de OpenID Connect.
    <img className="screenshot-full img-full" src="/img/user-management/sso/oidc/sso-menu.png" alt="Add user button" />

4.  Après l'avoir activé, une fenêtre modale apparaîtra. Cliquez sur **App provider** et remplissez les champs de paramètres tels que Name, Client ID et Well known URL. En haut à droite de la fenêtre modale, un interrupteur permet d'activer ce fournisseur. Activez-le, puis, sans saisir aucun paramètre, cliquez sur le bouton Save changes. Cela génèrera une URL de redirection, dont vous aurez besoin pour obtenir les identifiants du fournisseur d'identité.
    <img className="screenshot-full img-m" src="/img/user-management/sso/oidc/multi-tenant/config-v2.png" alt="Add user button" />

5.  Ouvrez à nouveau la fenêtre modale et choisissez le Grant type. ToolJet prend en charge Authorization Code, qui nécessite un Client ID et un Client Secret, et Authorization Code with PKCE, qui ne nécessite pas de Client Secret.

6.  Après avoir sélectionné le grant type, fournissez le Client ID, le Client Secret / Code Verifier, et l'URL Well-Known de votre fournisseur d'identité. Une fois cela fait, cliquez sur Save changes en bas de la fenêtre modale.

Une fois enregistré, le SSO OIDC sera activé avec succès en utilisant votre fournisseur d'identité configuré, permettant à vos utilisateurs de s'authentifier facilement via OpenID Connect pour une sécurité et une simplicité d'utilisation accrues.

## Configurer plusieurs fournisseurs OIDC

<PlanBadge type="enterprise" />

ToolJet vous permet de configurer plusieurs configurations OpenID Connect (OIDC) simultanément. Cela vous permet d'authentifier les utilisateurs à l'aide de différents fournisseurs d'identité tels qu'Okta, Auth0, Microsoft Entra ID, Google, ou plusieurs tenants d'un même fournisseur au sein du même espace de travail ToolJet.

Chaque fournisseur OIDC est configuré indépendamment et peut être activé ou désactivé selon les besoins, ce qui permet aux organisations de prendre en charge plusieurs sources d'authentification pour différentes équipes ou groupes d'utilisateurs.

Pour ajouter un nouveau fournisseur, cliquez sur **Add provider** dans le coin inférieur droit de la fenêtre modale de configuration OIDC.
<img className="screenshot-full img-m" src="/img/user-management/sso/oidc/multi-tenant/multiple_oidc.png" alt="Add user button" />
<br /> <br />
Lors de la connexion, les utilisateurs peuvent choisir leur fournisseur OIDC préféré, ce qui facilite la prise en charge de plusieurs fournisseurs au sein d'un même espace de travail ToolJet.
<img className="screenshot-full" src="/img/user-management/sso/oidc/multi-tenant/sign_in_page.png" alt="Add user button" />

## Configurer OIDC ToolJet avec un identifiant autre qu'un e-mail {#configuring-tooljet-oidc-with-non-email-identifier}

ToolJet prend en charge l'authentification des utilisateurs à l'aide d'un identifiant autre qu'un e-mail. ToolJet génère une adresse e-mail fictive pour l'utilisateur en utilisant le nom de domaine configuré et l'identifiant unique. Par exemple, si l'identifiant unique d'un utilisateur est _1234_ et que le domaine est défini sur _example.com_, l'adresse e-mail fictive créée sera *1234@example.com*.  
Les utilisateurs peuvent continuer à se connecter avec leur identifiant autre qu'un e-mail via SSO. Cette fonctionnalité permet à votre équipe d'accéder à ToolJet en utilisant n'importe quel identifiant unique à la place d'une adresse e-mail, comme un ID d'employé ou un ID d'étudiant.

#### Configurer les variables d'environnement

Pour activer ce comportement, vous devez configurer les variables d'environnement suivantes :

- `SSO_UNIQUE_ID_FIELD`  
  Définissez cette variable avec le nom du champ identifiant unique reçu par ToolJet depuis votre fournisseur d'identité (IdP), tel que _employee_id_ ou _student_id_.
- `SSO_CUSTOM_EMAIL_DOMAIN`  
  Définissez cette variable avec un nom de domaine. ToolJet utilise ce domaine pour générer des adresses e-mail fictives pour les utilisateurs.

**Exemple : Connexion avec Keycloak**  
Dans cet exemple, nous configurons un IdP avec Keycloak et configurons une instance ToolJet avec les variables d'environnement suivantes :

- `SSO_UNIQUE_ID_FIELD: employee_id`
- `SSO_CUSTOM_EMAIL_DOMAIN: organisation.com`

Avec cette configuration, employee_id est utilisé comme identifiant de connexion pour ToolJet. Dans Keycloak, Employee ID est un attribut utilisateur personnalisé.

- Nous avons créé un utilisateur sur notre serveur Keycloak avec les identifiants suivants :
  <img className="screenshot-full img-m" src="/img/user-management/sso/oidc/uniqueID/keycloakUser.png" alt="Keycloak User Credentials" />

- Nous nous connectons à notre instance ToolJet en utilisant Keycloak et sommes redirigés vers la page de connexion Keycloak.
  <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/uniqueID/signInWithKeycloak.png" alt="Sign In with Keycloak" />

- Sur la page de connexion Keycloak, nous nous connectons en utilisant les identifiants Keycloak. Nous saisissons l'employee_id à la place de l'e-mail et nous connectons.
  <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/uniqueID/keycloakLogin.png" alt="Sign In with Keycloak" />

- Après une connexion réussie, vous êtes redirigé vers votre espace de travail ToolJet. Pour vérifier la configuration, vous pouvez consulter l'adresse e-mail fictive générée dans _Profile settings_.
  <img className="screenshot-full img-l" src="/img/user-management/sso/oidc/uniqueID/userProfile.png" alt="Sign In with Keycloak" />
