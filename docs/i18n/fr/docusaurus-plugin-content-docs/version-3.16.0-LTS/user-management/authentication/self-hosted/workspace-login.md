---
id: workspace-login
title: Workspace Login
---


Dans les déploiements auto-hébergés, la configuration peut se faire à deux niveaux : le **niveau instance**, qui s'applique globalement à tous les espaces de travail et n'est configurable que par le super admin, et le **niveau espace de travail**, qui remplace les paramètres au niveau instance pour des espaces de travail spécifiques et peut être configuré à la fois par les super admins et les admins d'espace de travail. Ce guide se concentre sur la configuration de l'authentification au niveau espace de travail.


## Configuration

Pour configurer l'authentification au niveau espace de travail

1.  Allez dans **Workspace Settings** > **Workspace login**. (URL d'exemple - `https://app.corp.com/nexus/workspace-settings/workspace-login`)
    
2.  Sur cette page, vous pouvez configurer les paramètres suivants :

<img className="screenshot-full img-l" src="/img/user-management/authentication/selfhosted/workspace-level.png" alt=" workspace level login" />
    

##   SSO (authentification unique)
    
- Le SSO facilite la gestion de l'accès des utilisateurs pour les organisations. Les utilisateurs peuvent utiliser une seule connexion pour différents outils, et les admins peuvent rapidement ajouter ou retirer un accès en cas de besoin. Cela améliore ainsi l'expérience d'intégration et de désactivation des utilisateurs de l'organisation.
        
- Au niveau espace de travail, vous pouvez activer le bouton bascule **Instance SSO** pour hériter du SSO configuré au niveau instance, ou vous pouvez également configurer le SSO au niveau espace de travail avec Google, GitHub, OpenID Connect, LDAP et SAML. Consultez la [documentation SSO](/docs/user-management/sso/overview) pour un guide détaillé sur la configuration du SSO.
        
##   Inscription sans invitation
    
- Cette fonctionnalité permet aux organisations de simplifier l'intégration en laissant les utilisateurs s'inscrire sans avoir besoin d'une invitation.
        
- La fonctionnalité **Enable Signup** permet aux utilisateurs de créer des comptes sans être invités.
        
- Lorsque des utilisateurs s'inscrivent avec cette fonctionnalité activée, ils sont assignés en tant qu'utilisateur final de cet espace de travail. L'admin de l'espace de travail peut ensuite modifier le [rôle](/docs/user-management/role-based-access/user-roles) de l'utilisateur une fois que celui-ci a été intégré à l'espace de travail. Consultez la [documentation sur l'inscription](/docs/user-management/onboard-users/self-signup-user#enable-sign-up-at-workspace-level) pour en savoir plus.
        
        
##   Connexion par mot de passe
    
- La connexion par mot de passe permet aux utilisateurs de se connecter avec leur e-mail et leur mot de passe. Cependant, les organisations peuvent aussi utiliser le SSO pour une meilleure sécurité et un meilleur contrôle.
        
- Activez ou désactivez ce paramètre pour **activer** ou **désactiver** la connexion par mot de passe sur la page de connexion. Veillez à désactiver la connexion par mot de passe uniquement lorsque votre SSO est configuré, sinon vous serez bloqué à l'extérieur.

- L'authentification par mot de passe de l'utilisateur sera désactivée après un nombre prédéfini de tentatives de connexion échouées afin de renforcer la sécurité. Par défaut, les utilisateurs disposent de **5 tentatives**, mais cela peut être ajusté à l'aide de la variable d'environnement `PASSWORD_RETRY_LIMIT`. Pour désactiver cette fonctionnalité, définissez `DISABLE_PASSWORD_RETRY_LIMIT` sur `true`.

        | Variable | Description | Default Value |
        | --------- |-------------|---------------|
        | `DISABLE_PASSWORD_RETRY_LIMIT` | Définissez sur `true` pour désactiver la fonctionnalité de limite de tentatives de mot de passe. | `false` |
        | `PASSWORD_RETRY_LIMIT` | Spécifie le nombre maximal de tentatives autorisées avant de désactiver l'authentification. | `5` |

    :::info
    Vous pouvez imposer une validation de mot de passe plus stricte en définissant la variable d'environnement `ENABLE_PASSWORD_COMPLEXITY_RULES = true`. Consultez [ce guide](/docs/setup/env-vars#configure-stronger-password-validation-rules) pour en savoir plus.
    :::

## Contraintes de domaine

Les contraintes de domaine vous permettent de contrôler quels domaines de messagerie peuvent se connecter via le SSO ou l'authentification par mot de passe. Ces règles s'appliquent indépendamment pour chaque méthode de connexion et permettent de garantir que seuls les domaines autorisés peuvent accéder à l'instance.

### Domaines autorisés

Les domaines autorisés peuvent être définis séparément pour la **connexion SSO** et la **connexion par mot de passe**, et chacun se comporte de manière similaire :

- **Domaines autorisés (connexion SSO)**  
  Si un ou plusieurs domaines autorisés sont ajoutés pour le SSO, seuls les utilisateurs de ces domaines pourront se connecter via le SSO. Tous les autres domaines seront bloqués pour l'authentification SSO.  
  Si la liste des domaines autorisés est laissée vide, les utilisateurs de n'importe quel domaine peuvent se connecter via le SSO.

- **Domaines autorisés (connexion par mot de passe)**  
  Si un ou plusieurs domaines autorisés sont ajoutés pour la connexion par mot de passe, seuls ces domaines sont autorisés à s'authentifier avec un mot de passe. Tous les autres domaines ne pourront pas se connecter avec un mot de passe.  
  Si la liste des domaines autorisés est vide, tous les domaines sont autorisés à utiliser la connexion par mot de passe, sauf si un domaine est explicitement restreint.

Vous pouvez ajouter plusieurs noms de domaine en les séparant par des virgules. Par exemple :
```js 
corp.com, example.com, corp.ai
```

### Domaines restreints (connexion par mot de passe uniquement)

Les domaines restreints s'appliquent uniquement à la connexion par mot de passe et servent à bloquer des domaines spécifiques pour la connexion avec un mot de passe. Cela est généralement configuré pour garantir que les utilisateurs internes utilisent toujours le SSO et ne peuvent pas le contourner en se connectant avec un mot de passe.

La restriction est toujours prioritaire sur les paramètres d'autorisation.  
Si un domaine est ajouté à la liste restreinte, qu'il s'agisse du niveau instance ou du niveau espace de travail, il ne pourra pas utiliser la connexion par mot de passe, même si ce même domaine apparaît dans la liste des domaines autorisés.

        
##  Connexion SSO automatique
    
- Cette fonctionnalité élimine la nécessité pour les utilisateurs d'interagir avec la page de connexion en les authentifiant directement via le fournisseur SSO configuré.
        
- Pour activer la connexion SSO automatique, assurez-vous que la connexion par mot de passe est désactivée et qu'un seul fournisseur SSO est configuré.
