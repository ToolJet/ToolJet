---
id: self-hosted
title: Self-Hosted
---

Ce guide explique les différents types de licences disponibles et fournit des instructions pour mettre à niveau votre licence pour ToolJet auto-hébergé. ToolJet auto-hébergé fonctionne selon un modèle de licence, et vous pouvez contacter **[l'équipe ToolJet](mailto:support@tooljet.com)** pour générer la clé. Pour obtenir de l'aide dans le choix d'un plan adapté, consultez la page **[Tarifs ToolJet](https://www.tooljet.com/pricing)** ou contactez **[l'équipe ToolJet](mailto:support@tooljet.com)**.

<div style={{paddingTop:'24px'}}>

## Types de licences

ToolJet propose trois types de licences - **Basic**, **Trial** et **Paid**. Celles-ci peuvent être catégorisées davantage en différents plans d'abonnement. Consultez la page **[Tarifs ToolJet](https://www.tooljet.com/pricing)** pour plus de détails sur les différents plans d'abonnement.

### Licence Basic

Il s'agit d'une licence gratuite permettant à un utilisateur d'accéder aux offres de base telles que la création d'applications, des groupes d'utilisateurs prédéfinis, le support communautaire, etc. Ceci est idéal pour les particuliers ou les petites équipes qui n'ont besoin que de l'essentiel. Aucune clé de licence n'est requise pour cette option.

### Licence Trial

ToolJet propose une licence d'essai valable 14 jours, pendant laquelle les utilisateurs peuvent accéder à toutes les fonctionnalités premium et évaluer ToolJet selon leurs besoins. Vous pouvez contacter **[l'équipe ToolJet](mailto:support@tooljet.com)** pour générer une clé de licence d'essai.

### Licence Paid

ToolJet propose divers plans d'abonnement pour les licences payantes. Consultez la page **[Tarifs ToolJet](https://www.tooljet.com/pricing)** pour plus de détails sur les différents plans d'abonnement. Une fois que vous avez choisi le plan adapté à vos besoins, vous pouvez contacter **[l'équipe ToolJet](mailto:support@tooljet.com)** pour finaliser le processus d'intégration.

</div>

## Système de crédits IA

Consultez le guide [Comprendre les crédits IA](/docs/build-with-ai/ai-credits#credit-allocation) pour plus d'informations.

## Mettre à jour la clé de licence

Une fois que vous avez reçu la clé de licence de l'équipe ToolJet, vous pouvez mettre à jour la clé de licence en suivant les étapes suivantes :

Rôle requis : **Super Admin**

1. Accédez à la page Settings. <br/>
   (Exemple d'URL - `https://app.corp.com/instance-settings/license`)

2. Dans l'onglet de la clé de licence, mettez à jour la clé de licence fournie.
   <img className="screenshot-full" src="/img/licensing/self-hosted-license.png" alt="Licensing" />

3. Dans l'onglet de licence de la page Settings, vous pouvez accéder à l'onglet des limites, qui fournit des détails sur le nombre total d'utilisateurs, de builders et d'end users disponibles. Vous pouvez également voir la date d'expiration de votre clé de licence.
   <img className="screenshot-full" src="/img/licensing/selfhosted-limits.png" alt="Licensing" />

## Migration vers le nouveau plan tarifaire

À partir de la version **`v3.5.20-ee-lts`**, la licence Basic comportera les limitations suivantes, et les utilisateurs d'une version précédente seront impactés comme suit :

| Ressource     | Limite autorisée | Impact sur les utilisateurs existants                                                                                                                                      |
| ------------ | :-----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Super Admin  |       1       | Aucun impact                                                                                                                                                     |
| Builder      |       2       | Tous les builders seront automatiquement archivés, à l'exception de deux builders aléatoires (dont 1 Super Admin).                                                        |
| End User     |      50       | Tous les utilisateurs au-delà de 50 seront archivés automatiquement.                                                                                                           |
| Applications |       2       | Toutes les applications précédemment créées resteront accessibles, mais les utilisateurs ne pourront pas créer de nouvelles applications s'ils en ont déjà deux ou plus. |
| Workflows    |       2       | Les utilisateurs peuvent créer jusqu'à deux workflows.                                                                                                                          |
| Workspaces   |       1       | Tous les espaces de travail précédemment créés resteront accessibles, mais les utilisateurs ne pourront pas créer de nouvel espace de travail.                                                         |

### Désarchiver les utilisateurs souhaités impactés par le nouveau plan tarifaire

Si un utilisateur est automatiquement archivé en raison du nouveau plan tarifaire, le Super Admin peut [archiver](/docs/user-management/onboard-users/archive-user#instance-level) un Builder ou un End User actif pour libérer un emplacement, puis [désarchiver](/docs/user-management/onboard-users/archive-user#instance-level-1) l'utilisateur souhaité.

Si vous avez des questions, n'hésitez pas à rejoindre notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) ou à nous envoyer un e-mail à [support@tooljet.com](mailto:support@tooljet.com).

## FAQ

<details id="tj-dropdown">
    <summary>
     **Que se passe-t-il si mon abonnement expire ?**
    </summary>

Si votre clé de licence payante ou d'essai expire, votre instance reviendra au plan Basic. Vous perdrez l'accès aux fonctionnalités premium telles que la connexion SSO OpenID et les journaux d'audit, mais aucune donnée ne sera perdue. Vous pouvez renouveler à tout moment pour retrouver l'accès aux fonctionnalités premium.

</details>

:::caution
**Veuillez garder à l'esprit que votre clé de licence est privée et qu'il est strictement interdit de la partager avec des tiers.**
:::
