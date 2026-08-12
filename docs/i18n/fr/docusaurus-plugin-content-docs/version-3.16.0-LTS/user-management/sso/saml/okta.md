---
id: okta
title: Okta
---

Okta peut être configuré comme fournisseur d'identité pour SAML, un protocole d'authentification qui vérifie de manière sécurisée l'identité des utilisateurs via un fournisseur de confiance. Ce document explique comment obtenir les identifiants requis depuis la console développeur Okta. Consultez le guide **[Configuration SAML](/docs/user-management/sso/saml/setup)** pour configurer SAML dans votre application.

## Générer les métadonnées

1. Connectez-vous à la [console développeur Okta](https://developer.okta.com/).

2. Accédez à la section **Applications** et cliquez sur **Create App Integration**.
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/oidc/okta/create-app.png" alt="Okta: SSO"/>

3. Sélectionnez **SAML 2.0** comme **Sign-in method**. Cliquez sur le bouton **Next**.    
    <img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/saml/signin-method.png" alt="Okta: SSO" />

4. Configurez les **General Settings** :
    - **App Name** : Saisissez le nom de l'application qui sera affiché sur la page de connexion.
    - **App Logo (optional)** : Téléchargez un logo qui sera affiché sur la page de connexion. <br/><br/>
    <img className="screenshot-full" src="/img/user-management/sso/saml/okta-general-settings.png" alt="Okta General Settings" />


5. Dans l'onglet **Configure SAML**, configurez les champs suivants : <br/><br/>
    **General** : 
    - **Single sign-on URL** : URL de redirection copiée depuis la page de configuration SAML dans ToolJet.
    - **Audience URI** (SP Entity ID) : entityID présent dans le fichier XML.
    - **Default RelayState** : Laissez ce champ vide. 
    - **Name ID format** : EmailAddress.
    - **Application username** : Email.
    - **Update application username on** : Create and update. <br/><br/>
    <img className="screenshot-full img-l" src="/img/user-management/sso/saml/okta-configure-saml-general.png" alt="Okta Configure SAML General" />

    **Attribute Statements** :

    | Name | Name format | Value |
    | --- | --- | ---- |
    | email | Unspecified | user.email |
    | name | Unspecified | user.firstName |

    <img className="screenshot-full img-l" src="/img/user-management/sso/saml/okta-configure-saml-attribute.png" alt="Okta Configure SAML ATTRIBUTE STATEMENTS" />

    **Group Attribute Statements** :

    | Name | Name format | Filter | Value |
    | --- | --- | --- | --- |
    | groups | Unspecified | Matches regex | ".*" |

    <img className="screenshot-full img-l" src="/img/user-management/sso/saml/okta-grp-attribute.png" alt="Okta Configure SAML ATTRIBUTE STATEMENTS" />

6. Vérifiez et cliquez sur le bouton **Next**.

7. Cliquez sur le bouton **Finish** pour terminer la configuration de l'application Okta.

8. Accédez à l'onglet **Sign On** et assurez-vous que **Application username format** est défini sur **Email**, sinon cliquez sur le bouton **Edit** et mettez à jour.

9. Copiez l'**Metadata URL**. Cette URL permet de récupérer le fichier de métadonnées XML de l'application Okta.
    <img className="screenshot-full img-m" src="/img/user-management/sso/saml/okta-sign-on.png" alt="Okta Sign On" />

10. Collez l'URL de métadonnées dans le champ **Identity provider metadata** de la configuration SAML de ToolJet.

11. Assurez-vous que l'Audience URI (SP Entity ID) du fichier XML est bien ajouté dans l'onglet Configure SAML de la configuration de l'application Okta.

12. Testez la configuration SAML en vous connectant à ToolJet à l'aide de l'URL de connexion.
    <img className="screenshot-full" src="/img/sso/saml/login-v2.png" alt="SSO :SAMP" />
