---
id: cloud
title: ToolJet Cloud
---

Ce guide explique les différents types d'abonnements disponibles et fournit des instructions pour mettre à niveau votre abonnement pour ToolJet Cloud. Pour obtenir de l'aide dans le choix d'un plan adapté, consultez la page **[Tarifs ToolJet](https://www.tooljet.com/pricing)** ou **[contactez l'équipe ToolJet](mailto:support@tooljet.com)**.

## Types d'abonnements

ToolJet propose trois types d'abonnements - **Basic**, **Trial** et **Paid**. Ceux-ci peuvent être catégorisés davantage en différents plans selon les services et fonctionnalités. Consultez la page **[Tarifs ToolJet](https://www.tooljet.com/pricing)** pour plus de détails sur les différents plans.

### Abonnement Basic

Il s'agit d'un abonnement gratuit permettant à un utilisateur d'accéder aux offres de base telles que la création d'applications, un accès limité à la ToolJet Database, le support communautaire, etc. Ceci est idéal pour les particuliers ou les petites équipes qui n'ont besoin que de l'essentiel.

### Abonnement Trial

ToolJet propose un abonnement d'essai valable 14 jours, pendant lequel les utilisateurs peuvent accéder à toutes les fonctionnalités premium et évaluer ToolJet selon leurs besoins. Une fois la période d'essai terminée, les fonctionnalités premium, telles que la connexion SSO OpenID et les journaux d'audit, ne seront plus accessibles. Vous pouvez passer à un abonnement payant en cliquant simplement sur le bouton de mise à niveau.

### Abonnement Paid

ToolJet propose divers plans pour l'abonnement payant. Consultez la page **[Tarifs ToolJet](https://www.tooljet.com/pricing)** pour plus de détails sur les différents plans. Une fois que vous avez choisi le plan adapté à vos besoins, vous pouvez passer à un abonnement payant en cliquant simplement sur le bouton de mise à niveau.

## Système de crédits IA

Consultez le guide [Comprendre les crédits IA](/docs/build-with-ai/ai-credits#credit-allocation) pour plus d'informations.

## Mettre à niveau votre abonnement

### Démarrer l'abonnement d'essai

Si vous n'êtes pas actuellement sur un plan payant et que vous n'avez pas encore utilisé votre essai gratuit, vous verrez une bannière **Start Trial** dans le tableau de bord ToolJet. Cliquez sur le bouton **Start free trial** dans cette bannière pour démarrer votre essai gratuit.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/licensing/cloud-license.png" alt="TJ Dashboard: Start free trial" />

### Passer à un abonnement payant

Lorsque vous avez identifié le plan payant idéal pour répondre à vos besoins, l'étape suivante consiste à finaliser le processus d'achat, garantissant un accès continu aux fonctionnalités premium. Suivez ces étapes pour mettre à niveau votre abonnement :

Rôle requis : **Admin**

1. Cliquez sur l'icône d'engrenage (⚙️) en bas de la barre latérale gauche et sélectionnez **Settings** dans le menu déroulant.

2. Sur la page Settings, choisissez l'onglet **Subscription**. <br/>
   (Exemple d'URL - `https://app.corp.com/nexus/settings/subscription`)

3. L'onglet d'abonnement affiche une carte récapitulative de votre plan actuel. Repérez le bouton **Upgrade** dans le coin inférieur gauche et cliquez sur celui-ci.

4. Une fenêtre modale apparaîtra. Saisissez le nombre souhaité de sièges builder et end-user, puis cliquez sur le bouton **Upgrade** dans la fenêtre modale.

5. Vous serez redirigé vers une passerelle de paiement. Terminez le processus de paiement.

6. Une fois le paiement réussi, vous reviendrez à l'onglet d'abonnement de ToolJet. Un message de succès s'affichera, et votre carte récapitulative d'abonnement se mettra à jour peu après pour refléter votre nouveau plan.
   <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/licensing/cloud-license-price.png" alt="Dashboard"/>

Si vous avez décidé de passer au plan Pro ou à un plan Enterprise personnalisé, veuillez planifier un appel avec **[l'équipe ToolJet](mailto:support@tooljet.com)** et attendre une réponse de l'équipe dans un délai de 24 à 48 heures pour l'intégration.

## Limites mises à jour dans le nouveau plan tarifaire

À partir de la version `v3.5.34-cloud-lts`, publiée le 27 mai 2025, le nouveau plan tarifaire comportera les limitations suivantes, et les utilisateurs existants seront impactés comme suit :

| Ressource     | Limite autorisée | Impact sur les utilisateurs existants                                                                                                                                      |
| ------------ | :-----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Builder      |       2       | Tous les builders seront automatiquement archivés, à l'exception de deux builders aléatoires (dont 1 Admin).                                                              |
| End User     |      50       | Tous les utilisateurs au-delà de 50 seront archivés automatiquement.                                                                                                           |
| Applications |       2       | Toutes les applications précédemment créées resteront accessibles, mais les utilisateurs ne pourront pas créer de nouvelles applications s'ils en ont déjà deux ou plus. |

### Désarchiver les utilisateurs souhaités impactés par le nouveau plan tarifaire

Si un utilisateur est automatiquement archivé en raison du nouveau plan tarifaire, l'Admin peut [archiver](/docs/user-management/onboard-users/archive-user#instance-level) un Builder ou un End User actif pour libérer un emplacement, puis [désarchiver](/docs/user-management/onboard-users/archive-user#instance-level-1) l'utilisateur souhaité.

Si vous avez des questions, n'hésitez pas à rejoindre notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) ou à nous envoyer un e-mail à [support@tooljet.com](mailto:support@tooljet.com).

## FAQ

<details id="tj-dropdown">
    <summary>
     **Que se passe-t-il si mon abonnement expire ?**
    </summary>

Si votre clé de licence payante ou d'essai expire, votre instance reviendra au plan Basic. Vous perdrez l'accès aux fonctionnalités premium telles que la connexion SSO OpenID et les journaux d'audit, mais aucune donnée ne sera perdue. Vous pouvez renouveler à tout moment pour retrouver l'accès aux fonctionnalités premium.

</details>
