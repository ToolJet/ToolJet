---
id: instance-login
title: Instance Login
---

Dans les déploiements auto-hébergés, la configuration peut se faire à deux niveaux : le **niveau instance**, qui s'applique globalement à tous les espaces de travail et n'est configurable que par le super admin, et le **niveau espace de travail**, qui remplace les paramètres au niveau instance pour des espaces de travail spécifiques et peut être configuré à la fois par les super admins et les admins d'espace de travail. Ce guide se concentre sur la configuration de l'authentification au niveau instance.

## Configuration

Pour configurer l'authentification au niveau instance

1.  Allez dans **Settings** > **Instance login**.  (URL d'exemple - `https://app.corp.com/instance-settings/instance-login`)
    
2.  Sur cette page, vous pouvez configurer les paramètres suivants :

<img className="screenshot-full img-l" src="/img/user-management/authentication/selfhosted/instance-level.png" alt="only instance level login" />

##   SSO (authentification unique)
    
- Le SSO facilite la gestion de l'accès des utilisateurs pour les organisations. Les utilisateurs peuvent utiliser une seule connexion pour différents outils, et les admins peuvent rapidement ajouter ou retirer un accès en cas de besoin. Cela améliore ainsi l'expérience d'intégration et de désactivation des utilisateurs de l'organisation.
        
- Au niveau instance, vous pouvez configurer le SSO avec Google, GitHub et OpenID Connect. Consultez la [documentation SSO](/docs/user-management/sso/overview) pour un guide détaillé sur la configuration du SSO.

- Vous pouvez également configurer Google ou GitHub avec des variables d'environnement. Pour définir Google comme SSO par défaut, utilisez la variable d'environnement suivante.

    | Variable | Description | 
    | --------- |:-----:|
    | SSO_GOOGLE_OAUTH2_CLIENT_ID | ID client OAuth de Google |

-  Pour définir GitHub comme SSO par défaut, utilisez les variables d'environnement suivantes :

    | Variable | Description | 
    | --------- |:-----:|
    | SSO_GIT_OAUTH2_CLIENT_ID | ID client OAuth de GitHub |
    | SSO_GIT_OAUTH2_CLIENT_SECRET | Secret client OAuth de GitHub |
    | SSO_GIT_OAUTH2_HOST | Nom d'hôte OAuth de GitHub si GitHub est auto-hébergé |
        

## Inscription sans invitation
    
- Cette fonctionnalité permet aux organisations de simplifier l'intégration en laissant les utilisateurs s'inscrire sans avoir besoin d'une invitation.
        
- La fonctionnalité **Enable Signup** permet aux utilisateurs de créer des comptes sans être invités.
        
- Cette fonctionnalité n'est disponible que lorsque l'option Personal Workspace est activée dans les paramètres Manage Instance. Lorsque des utilisateurs s'inscrivent avec cette fonctionnalité activée, un nouvel espace de travail personnel est automatiquement créé pour eux, et ils sont désignés admin de cet espace de travail. Consultez la [documentation sur l'inscription](/docs/user-management/onboard-users/self-signup-user#enable-sign-up-at-instance-level) pour en savoir plus.
        
##   Connexion par mot de passe
    
- La connexion par mot de passe permet aux utilisateurs de se connecter avec leur e-mail et leur mot de passe. Cependant, les organisations peuvent aussi utiliser le SSO pour une meilleure sécurité et un meilleur contrôle.
        
- Activez ou désactivez ce paramètre pour **activer** ou **désactiver** la connexion par mot de passe sur la page de connexion. Veillez à désactiver la connexion par mot de passe uniquement lorsque votre SSO est configuré, sinon vous serez bloqué à l'extérieur.

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

        
##   Activer la configuration de connexion de l'espace de travail
    
- Cette fonctionnalité permet aux admins d'espace de travail de personnaliser les paramètres de connexion pour leurs espaces de travail spécifiques. Elle est utile lorsque différents espaces de travail au sein de la même instance nécessitent des configurations de connexion distinctes.
        
- Une fois activée, les paramètres spécifiques à l'espace de travail remplaceront la configuration au niveau instance pour ces espaces de travail.
        
##  Connexion SSO automatique
    
- Cette fonctionnalité élimine la nécessité pour les utilisateurs d'interagir avec la page de connexion en les authentifiant directement via le fournisseur SSO configuré.
        
- Pour activer la connexion SSO automatique, assurez-vous que la connexion par mot de passe est désactivée et qu'un seul fournisseur SSO est configuré.
        
##   URL de déconnexion personnalisée
    
- Une URL de déconnexion personnalisée permet aux organisations de rediriger les utilisateurs vers une page spécifique après leur déconnexion. Cela peut être utile pour rediriger les utilisateurs vers un portail d'entreprise ou un formulaire de retour d'expérience.
        
- Saisissez l'URL de déconnexion souhaitée dans le champ **Custom Logout URL** pour configurer cela.
