---
id: cloud-login
title: Cloud Authentication
---

Dans un déploiement cloud, vous pouvez configurer l'authentification sur vos espaces de travail, et celle-ci est gérée par les admins des groupes respectifs. Chaque espace de travail peut avoir une méthode d'authentification différente. Nous allons découvrir les méthodes d'authentification disponibles dans cette documentation.


## Configuration

Pour configurer l'authentification :

1.  Allez dans **Workspace Settings** > **Workspace login**. (URL d'exemple - `https://app.corp.com/nexus/workspace-settings/workspace-login`)
    
2.  Sur cette page, vous pouvez configurer les paramètres suivants :

<img className="screenshot-full img-l" src="/img/user-management/authentication/cloud/cloud-workspace.png" alt="cloud  workspace level login" />
    

##   SSO (authentification unique)
    
    *   Le SSO facilite la gestion de l'accès des utilisateurs pour les organisations. Les utilisateurs peuvent utiliser une seule connexion pour différents outils, et les admins peuvent rapidement ajouter ou retirer un accès en cas de besoin. Cela améliore ainsi l'expérience d'intégration et de désactivation des utilisateurs de l'organisation.
        
    *   Vous pouvez configurer le SSO avec Google, GitHub, OpenID Connect, LDAP et SAML. Consultez la [documentation SSO](/docs/user-management/sso/overview) pour un guide détaillé sur la configuration du SSO.

### Domaines autorisés (connexion SSO)
    
    *   Cette fonctionnalité permet de restreindre l'accès à la connexion à des domaines de messagerie spécifiques, garantissant que seuls les utilisateurs autorisés de votre organisation peuvent s'inscrire ou se connecter.
        
    *   Vous pouvez ajouter plusieurs domaines pour la connexion en spécifiant les noms de domaines autorisés, séparés par des virgules. **Exemple :** `corp.com`, `corp.io`, `corp.ai`

##   SSO par défaut (authentification unique)   
    *   ToolJet prend en charge Google et GitHub préconfigurés comme options SSO par défaut, qui peuvent être facilement activées depuis la page de connexion de l'espace de travail.
        

## Inscription sans invitation
    
    *   Cette fonctionnalité permet aux organisations de simplifier l'intégration en laissant les utilisateurs s'inscrire sans avoir besoin d'une invitation.
        
    *   La fonctionnalité **Enable Signup** permet aux utilisateurs de créer des comptes sans être invités.
        
    *   Lorsque des utilisateurs s'inscrivent avec cette fonctionnalité activée, ils sont assignés en tant qu'utilisateur final de cet espace de travail. L'admin de l'espace de travail peut ensuite modifier le [rôle](/docs/user-management/role-based-access/user-roles) de l'utilisateur une fois que celui-ci a été intégré à l'espace de travail.
        
## Connexion par mot de passe
    
    *   La connexion par mot de passe permet aux utilisateurs de se connecter avec leur e-mail et leur mot de passe. Cependant, les organisations peuvent aussi utiliser le SSO pour une meilleure sécurité et un meilleur contrôle.
        
    *   Activez ou désactivez ce paramètre pour **activer** ou **désactiver** la connexion par mot de passe sur la page de connexion. Veillez à désactiver la connexion par mot de passe uniquement lorsque votre SSO est configuré, sinon vous serez bloqué à l'extérieur.

## Contraintes de domaine

Les contraintes de domaine permettent aux admins d'espace de travail de contrôler quels domaines de messagerie sont autorisés à s'authentifier via le SSO ou la connexion par mot de passe. Ces paramètres permettent de garantir que seuls les utilisateurs de domaines approuvés peuvent se connecter, tout en offrant de la flexibilité pour les différents espaces de travail au sein du déploiement cloud.

### Domaines autorisés

Les domaines autorisés peuvent être configurés séparément pour la **connexion SSO** et la **connexion par mot de passe**, et chacun suit le même comportement :

- **Domaines autorisés (connexion SSO)**  
  Si un ou plusieurs domaines autorisés sont ajoutés pour le SSO, seuls les utilisateurs appartenant à ces domaines pourront se connecter via le SSO. Tous les autres domaines seront bloqués pour l'authentification SSO.  
  Lorsque la liste des domaines autorisés est vide, tout domaine est autorisé à utiliser le SSO.

- **Domaines autorisés (connexion par mot de passe)**  
  Si des domaines autorisés sont définis pour la connexion par mot de passe, seuls les utilisateurs de ces domaines peuvent se connecter avec un mot de passe. Tous les autres domaines ne seront pas autorisés à utiliser l'authentification par mot de passe.  
  Lorsque la liste des domaines autorisés est vide, tous les domaines sont autorisés à moins qu'un domaine ne soit explicitement restreint.

Vous pouvez ajouter plusieurs noms de domaine en les séparant par des virgules. Par exemple :
```js 
corp.com, example.com, corp.ai
```

### Domaines restreints (connexion par mot de passe uniquement)

Les domaines restreints s'appliquent uniquement à la connexion par mot de passe et servent à bloquer des domaines spécifiques pour l'authentification par mot de passe. Ce paramètre est souvent utilisé pour appliquer des règles d'accès plus strictes. Par exemple, pour garantir que les utilisateurs internes doivent utiliser le SSO et ne peuvent pas le contourner en se connectant avec un mot de passe.

Les restrictions sont prioritaires sur les paramètres d'autorisation.  
Si un domaine est ajouté à la liste restreinte pour la connexion par mot de passe, les utilisateurs de ce domaine ne pourront pas se connecter avec un mot de passe, même si ce même domaine figure dans la liste des domaines autorisés.


        
## Connexion SSO automatique
    
    *   Cette fonctionnalité élimine la nécessité pour les utilisateurs d'interagir avec la page de connexion en les authentifiant directement via le fournisseur SSO configuré.
        
    *   Pour activer la connexion SSO automatique, assurez-vous que la connexion par mot de passe est désactivée et qu'un seul fournisseur SSO est configuré.
