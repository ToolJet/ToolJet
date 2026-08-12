---
id: instances
title: Instances
---

<PlanBadge type="self-hosted" />

Les instances dans ToolJet font référence aux déploiements auto-hébergés de la plateforme ToolJet. Chaque instance fonctionne de manière indépendante et peut avoir ses propres configurations, données et base d'utilisateurs. Vous pouvez créer plusieurs [espaces de travail](/docs/tj-setup/workspaces) au sein d'une instance. Les espaces de travail sont des environnements collaboratifs qui permettent aux équipes de créer, personnaliser et déployer des applications, ainsi que de gérer les données, les workflows et les permissions.

En ce qui concerne les rôles, ToolJet propose un rôle de [Super Admin](/docs/user-management/role-based-access/super-admin), qui peut gérer les instances et dispose d'un accès complet à tous les espaces de travail, utilisateurs et groupes d'une instance. Au sein de chaque espace de travail, les utilisateurs peuvent se voir attribuer l'un des rôles prédéfinis (Admin, Builder ou End User), ou nous pouvons ajouter l'utilisateur à un groupe personnalisé créé avec des permissions personnalisées. Pour plus de détails sur la gestion des utilisateurs et des rôles au sein des espaces de travail, consultez la documentation [Utilisateurs et groupes de l'espace de travail](/docs/user-management/role-based-access/user-roles).

<img style={{ marginBottom:'15px'}} className="screenshot-full img-l" src="/img/tooljet-setup/instance/overview.png" alt="Marketplace Plugin: Amazon Redshift" />

## Pourquoi utiliser des instances ?

Les instances aident à :

- **Isolation des données** : garder les données séparées pour les équipes, départements ou clients.
- **Conformité** : héberger les données pour respecter les réglementations de votre organisation.
- **Confidentialité des données** : garantit que vos données restent privées. ToolJet n'a pas accès à vos données.

Consultez le [guide d'installation](/docs/setup/) pour découvrir les différentes options disponibles pour déployer ToolJet sur votre infrastructure.

## Choisir la configuration de votre instance

- **Instance unique :** idéale pour les équipes recherchant une installation rapide avec conformité des données, confidentialité et surcharge minimale.
- **Instances multiples :** adaptées si votre organisation souhaite :
  - Gérer des applications dans différents départements avec des configurations isolées.
  - Héberger des données dans plusieurs régions pour répondre aux exigences de conformité.
  - Mettre en place des environnements distincts (par exemple, développement, staging, production) pour des workflows SDLC plus stricts.

Le schéma ci-dessous illustre la configuration multi-instance.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/tooljet-setup/instance/multi-instance.png" alt="Marketplace Plugin: Amazon Redshift" />

Si vous souhaitez discuter de votre cas d'usage ou avez besoin d'aide, contactez-nous via [le support](mailto:support@tooljet.com).
