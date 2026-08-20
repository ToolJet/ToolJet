---
id: system-requirements
title: Exigences système 
slug: /setup/system-requirements/
---

Ce document couvre l'ensemble des exigences système pour l'auto-hébergement de ToolJet.

:::info
Le tag Docker officiel pour l'édition Enterprise est tooljet/tooljet:ee-lts-latest.
:::

## Systèmes d'exploitation

### Distribution Linux prise en charge

[Les images ToolJet](https://hub.docker.com/r/tooljet/tooljet/tags) peuvent s'exécuter sur n'importe quelle machine Linux avec une architecture x86 (64 bits). Assurez-vous que votre système répond aux exigences minimales spécifiées ci-dessous avant d'installer ToolJet.

### Microsoft Windows

ToolJet est développé pour les systèmes d'exploitation basés sur Linux. Merci d'envisager l'utilisation d'une machine virtuelle ou du sous-système Windows pour Linux 2 (WSL2) pour exécuter ToolJet sous Windows.

## Déploiements en VM :

- **Système d'exploitation :** Ubuntu 22.04 ou version ultérieure
- **Architecture du processeur :** x86 (arm64 n'est pas pris en charge)
- **RAM :** 4 Go
- **CPU :** 1 vCPU
- **Stockage :** au moins 8 Gio, mais peut être augmenté selon vos besoins.

## Déploiements orchestrés :

- Lorsque vous utilisez des frameworks d'orchestration de conteneurs comme Kubernetes, il est impératif de vous assurer que votre cluster héberge au moins un nœud disposant des spécifications ci-dessus pour exécuter les déploiements ToolJet sans problème.

Remarque : des ajustements peuvent être effectués en fonction des besoins spécifiques et de la charge attendue sur le serveur.

## Logiciels de base de données et de cache :

### PostgreSQL

- **Version :** PostgreSQL 16.x est recommandé
- **Spécifications minimales :**
  - **RAM :** 8 Go
  - **Stockage :** 20 Go minimum (doit évoluer en fonction du volume de données)
  - **CPU :** 2 vCPU

:::info
Si vous utilisez actuellement PostgreSQL 13.x, vous pouvez continuer à l'utiliser ; cependant, une mise à niveau vers la version 16.x est recommandée pour de meilleures performances et fonctionnalités. De plus, PostgreSQL 13.x a officiellement atteint sa fin de vie en novembre 2025.
:::

### Redis

- **Version :** Redis 7.x est requis
- **Spécifications minimales :**
  - **RAM :** 512 Mo (1 Go recommandé pour les charges de travail en production)
  - **Stockage :** 1 Go minimum
  - **CPU :** 1 vCPU

:::info
Redis est utilisé pour la mise en cache et la gestion des sessions dans ToolJet. Assurez-vous que Redis 7.x est installé et en cours d'exécution avant de déployer ToolJet.
:::

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
