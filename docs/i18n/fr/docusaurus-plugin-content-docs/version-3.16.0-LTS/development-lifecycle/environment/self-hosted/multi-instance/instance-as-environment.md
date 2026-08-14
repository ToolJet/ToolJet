---
id: instance-as-environment
title: Instance en tant qu'Environnement
---

<PlanBadge type="enterprise" />

Dans ce guide, vous apprendrez à gérer un déploiement ToolJet multi-instance. Une configuration multi-instance vous permet de déployer plusieurs instances ToolJet isolées, chacune fonctionnant comme un environnement distinct, tel que le développement, le staging et la production, afin de prendre en charge un cycle de vie de développement logiciel (SDLC) structuré. Dans cette configuration, chaque instance fonctionne de manière indépendante avec une isolation stricte des ressources, des utilisateurs et des applications.

## Mise en Place des Environnements Multi-Instance

Pour activer une configuration multi-instance, vous devez déployer des instances ToolJet distinctes sur votre infrastructure auto-hébergée. Consultez le guide de [configuration](/docs/setup/try-tooljet) pour en savoir plus sur les déploiements ToolJet auto-hébergés.

## Migrer des Applications entre Instances

La fonctionnalité GitSync de ToolJet permet de migrer des applications entre instances en poussant et récupérant les modifications via un dépôt Git. Elle prend en charge des fournisseurs Git tels que GitHub, GitLab, Gitea et Bitbucket. Pour les instructions de configuration, consultez la [documentation GitSync](/docs/development-lifecycle/gitsync/overview). Avec GitSync, les utilisateurs peuvent facilement transférer des applications entre instances en effectuant des commits et des push vers un dépôt partagé. Cela garantit qu'une fois qu'une application est développée dans l'instance de développement, elle peut être facilement synchronisée avec d'autres instances comme le staging et la production.

## Pousser et Récupérer des Applications entre Instances via GitSync

### Push des Modifications

GitSync permet aux utilisateurs de commit et de push des mises à jour depuis votre instance vers votre dépôt Git. Les nouvelles applications, les renommages et les créations de versions sont commités automatiquement, et vous pouvez également commit manuellement les modifications à l'aide du bouton GitSync dans l'App Builder. Consultez la documentation [Push-Gitsync](/docs/development-lifecycle/gitsync/push) pour en savoir plus.

### Pull des Modifications

GitSync vous permet de récupérer (pull) des mises à jour depuis un dépôt Git vers votre instance. Vous pouvez importer des applications depuis Git via le tableau de bord ToolJet. Une fois récupérée, l'application sera en mode lecture seule. Vous pouvez également vérifier les mises à jour disponibles, ce qui récupère les derniers commits avec des détails tels que l'auteur et la date. Si des mises à jour sont disponibles, vous pouvez récupérer les modifications et les synchroniser. Consultez la documentation [Pull-Gitsync](/docs/development-lifecycle/gitsync/pull) pour en savoir plus. Voici le schéma illustrant comment utiliser GitSync pour migrer vos applications entre instances.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/development-lifecycle/environments/multi-instance.png" alt="self-hosted-env-concept" />

Consultez le guide [Multi-Instance-Example](/docs/development-lifecycle/environment/self-hosted/multi-instance/example-configuration) pour apprendre à utiliser GitSync pour une configuration multi-instance dans ToolJet à travers un exemple pratique.
