---
id: overview
title: Overview
---

L'authentification dans ToolJet garantit un accès sécurisé à vos applications et à vos données. Dans les déploiements auto-hébergés, l'authentification peut être configurée à deux niveaux :

-   **Niveau instance :** S'applique globalement à tous les espaces de travail au sein de l'instance. Seul le super admin peut configurer ce niveau.
    
-   **Niveau espace de travail :** Remplace la configuration au niveau instance pour les espaces de travail où elle est appliquée. Les super admins et les admins d'espace de travail peuvent tous deux la configurer.
    

## Scénarios de configuration de l'authentification

ToolJet prend en charge des configurations d'authentification flexibles, permettant des configurations au niveau instance, au niveau espace de travail, ou une combinaison des deux. Vous pouvez configurer le [SSO](/docs/user-management/sso/overview) ou la connexion par e-mail et mot de passe aux deux niveaux. Voici quelques scénarios courants pour vous guider dans votre configuration.

### 1\. Connexion au niveau instance uniquement

La configuration de connexion au niveau instance est un paramètre global qui s'applique à tous les espaces de travail au sein d'une instance ToolJet.
    

**Exemple :** Imaginez une entreprise, Nexus Corp, qui souhaite créer une application interne avec ToolJet pour trois départements : Marketing, Ventes et Ingénierie. Pour garantir une meilleure collaboration, ils doivent isoler les applications et les sources de données pour chaque département. Puisque tous ces départements utilisent le même système de connexion car ils appartiennent à la même entreprise, une configuration au niveau instance est adaptée à ce scénario. Voici comment cela peut être mis en place :

-   Créer trois espaces de travail - un pour chaque département : Marketing, Ventes et Ingénierie. Cela garantit que les applications et les sources de données de chaque département restent isolées.
    
-   Puisque tous les espaces de travail appartiennent à une seule instance de l'entreprise, configurez l'authentification au niveau instance. Par exemple, si l'entreprise utilise Google Workspace, elle peut configurer le SSO Google au niveau instance.
    
-   Cela permet aux utilisateurs de tous les espaces de travail de se connecter en utilisant le même système d'authentification.

<img className="screenshot-full img-l" src="/img/user-management/authentication/selfhosted/nexus.png" alt="only instance level login" />


### 2\. Connexion au niveau espace de travail uniquement

La connexion au niveau espace de travail permet à chaque espace de travail de définir ses propres configurations d'authentification, en remplaçant les paramètres globaux au niveau instance. Cette approche est idéale pour les organisations ayant des besoins d'authentification variés entre départements ou équipes.
    

**Exemple :** Prenons le cas d'une entreprise de services, Pixel Technologies Inc., qui sert trois entreprises clientes : GreenTech Ltd., BlueWave Corp. et EcoBuild Enterprises. Pour fournir des solutions personnalisées, Tech Solutions Inc. doit isoler les applications, les utilisateurs, les sources de données et la configuration du contrôle d'accès pour chaque entreprise cliente. Dans ce scénario, l'entreprise de services peut effectuer la configuration suivante :

-   Créer un espace de travail pour chaque entreprise cliente : GreenTech Ltd., BlueWave Corp. et EcoBuild Enterprises. Cela garantit que les applications et les sources de données de chaque client restent isolées.
    
-   Configurer des paramètres de connexion individuels au niveau espace de travail pour chaque espace de travail. Par exemple, GreenTech Ltd. peut utiliser le SSO Google, BlueWave Corp. peut préférer Azure AD, et EcoBuild Enterprises pourrait utiliser à la fois le SSO SAML et un système d'authentification personnalisé par e-mail et mot de passe.

<img className="screenshot-full img-l" src="/img/user-management/authentication/selfhosted/pixel.png" alt="only instance level login" />

### 3\. Connexion au niveau instance et au niveau espace de travail (configuration mixte)

Dans cette configuration, certains espaces de travail héritent de la configuration au niveau instance, tandis que d'autres la remplacent par des paramètres de connexion spécifiques à l'espace de travail.
    

**Exemple :** Prenons le cas d'une grande entreprise, Global Dynamics Ltd., avec trois départements : Marketing, Ingénierie et RH. Pour garantir une meilleure collaboration, ils doivent isoler les applications et les sources de données pour chaque département. Global Dynamics Ltd. souhaite maintenir une connexion distincte pour les applications liées au département RH afin de respecter des exigences strictes de sécurité et de conformité. Pour les autres départements, ils préfèrent utiliser une authentification commune au niveau instance.

Dans de tels scénarios où l'entreprise souhaite mettre en place une configuration d'authentification mixte, elle peut effectuer la configuration suivante.

-   Créer trois espaces de travail - un pour chaque département : Marketing, Ingénierie et RH. Cela garantit que les applications et les sources de données de chaque département restent isolées.
    
-   Les espaces de travail Marketing et Ingénierie peuvent hériter de la configuration au niveau instance. Par exemple, ils utilisent Google OAuth configuré au niveau instance.
    
-   L'espace de travail RH, en raison de politiques de conformité et de sécurité, nécessite des paramètres de connexion isolés. Il configure donc des paramètres de connexion au niveau espace de travail, comme l'authentification SAML, qui remplaceront la configuration au niveau instance.

<img className="screenshot-full img-l" src="/img/user-management/authentication/selfhosted/global.png" alt="only instance level login" />
