---
id: upgrade-to-lts
title: Mise à niveau de ToolJet vers la version LTS
slug: /setup/upgrade-to-lts/
---

ToolJet a publié sa première version à support à long terme (LTS), qui offre un support et une stabilité étendus pour vos environnements. La mise à niveau vers cette version LTS vous garantit de bénéficier des dernières fonctionnalités et mises à jour de sécurité tout en conservant un environnement stable et supporté.

### Vérifier la dernière version LTS

ToolJet publiera de nouvelles versions LTS tous les 3 à 5 mois, avec une fin de vie d'au moins 18 mois. Pour vérifier la dernière version LTS, consultez la page [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis

:::warning Critique : sauvegardez votre instance PostgreSQL

Avant de démarrer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** pour éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (base de données applicative) - Contient les utilisateurs, les applications et les configurations
2. **TOOLJET_DB** (base de données interne) - Contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de poursuivre la mise à niveau.
:::

- **Exigence ToolJet 3.0+ :** Le déploiement de ToolJet Database est obligatoire à partir de ToolJet 3.0. Pour plus d'informations sur les changements majeurs, consultez le [guide de migration ToolJet 3.0](/docs/setup/upgrade-to-v3/).

- Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord mettre à niveau vers cette version avant de passer à la version LTS.

### Processus de mise à niveau

Le processus de mise à niveau dépend de votre méthode de déploiement. Vous pouvez suivre le processus de mise à niveau dans les guides de configuration respectifs :

- [Mettre à niveau ToolJet sur DigitalOcean](/docs/setup/digitalocean#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur Docker](/docs/setup/docker#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur AWS AMI](/docs/setup/ami#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur AWS ECS](/docs/setup/ecs#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur OpenShift](/docs/setup/openshift#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur Helm](/docs/setup/helm#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur Kubernetes](/docs/setup/kubernetes#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur Kubernetes (GKE)](/docs/setup/kubernetes-gke#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur Kubernetes (AKS)](/docs/setup/kubernetes-aks#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur Azure Container Apps](/docs/setup/azure-container#upgrading-to-the-latest-lts-version)
- [Mettre à niveau ToolJet sur Google Cloud Run](/docs/setup/google-cloud-run#upgrading-to-the-latest-lts-version)

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [Communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
