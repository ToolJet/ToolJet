---
id: tooljet-domain-change
title: Changement de domaine ToolJet 
---

Nous mettons à jour notre domaine de `tooljet.ai` vers `tooljet.com`.

## Ce que cela signifie pour vous

Si votre organisation utilise l'**authentification unique (SSO)** pour accéder à ToolJet, vous devrez mettre à jour vos URL de redirection SSO pour continuer à vous connecter après le changement de domaine.

- Ce changement s'applique **uniquement aux utilisateurs de ToolJet Cloud**.
- Si vous ne mettez **pas** à jour votre configuration SSO, **la connexion SSO cessera de fonctionner** après le changement de domaine.

## Comment y remédier

Vous devrez régénérer et mettre à jour l'URL de redirection pour **chaque fournisseur SSO** que vous avez configuré.

### Étapes

1. Connectez-vous à ToolJet sur **`https://app.tooljet.ai`**.
2. Allez dans : **Paramètres du workspace → Connexion au workspace**.
3. Sous les fournisseurs SSO (Google, OIDC, SAML, etc.) :
   - Cliquez sur chaque fournisseur configuré.
   - Copiez la nouvelle URL de redirection 
4. Allez dans la console d'administration de votre fournisseur SSO (par exemple, Google, Okta, Azure AD).
5. Mettez à jour l'URL de redirection/callback avec la nouvelle URL **`tooljet.com`**.
6. Enregistrez les modifications.
7. Testez la connexion SSO pour vous assurer que tout fonctionne correctement.

Pour les détails de configuration spécifiques à chaque fournisseur, reportez-vous à vos guides de configuration **[SSO](/docs/user-management/sso/overview)** habituels.
