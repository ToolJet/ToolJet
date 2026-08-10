---
id: tooljet-subpath
title: Déployer ToolJet sur un sous-chemin
slug: /setup/tooljet-subpath/
---

ToolJet peut désormais être déployé sur un sous-chemin plutôt qu'à la racine (`/`) d'un domaine public. Exemple d'URL d'installation sur un sous-chemin : **`http://www.yourcompany.com/apps/tooljet`**

Vous devrez configurer les variables d'environnement suivantes si l'installation de ToolJet se trouve sur un sous-chemin de domaine :

```bash
TOOLJET_HOST=https://www.yourcompany.com
SUB_PATH=/apps/tooljet/
```

**Détails des variables d'environnement :**

- **TOOLJET_HOST** : l'URL publique de votre domaine (par exemple, `https://www.yourcompany.com`)
- **SUB_PATH** : le sous-chemin où ToolJet sera accessible. Doit inclure un `/` final et ne s'applique que lorsque le serveur sert le client front-end (par exemple, `/apps/tooljet/`)

Pour d'autres variables d'environnement, reportez-vous à notre [documentation sur les variables d'environnement](/docs/setup/env-vars).

## Mise à niveau vers la dernière version LTS

:::info
S'il s'agit d'une nouvelle installation de l'application, vous pouvez démarrer directement avec la dernière version. Ce guide de mise à niveau concerne uniquement les installations existantes.
:::

De nouvelles versions LTS sont publiées tous les 3 à 5 mois, avec une fin de vie d'au moins 18 mois. Pour connaître la dernière version LTS, consultez la page [*Docker Hub de ToolJet*](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis pour la mise à niveau

:::warning
**Critique : sauvegardez votre instance PostgreSQL**

Avant de démarrer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** afin d'éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (base de données applicative) - contient les utilisateurs, les applications et les configurations
2. **TOOLJET_DB** (base de données interne) - contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de procéder à la mise à niveau.
:::

- Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord effectuer une mise à niveau vers cette version avant de passer à la dernière version LTS.
- **Exigence ToolJet 3.0+ :** le déploiement de ToolJet Database est obligatoire à partir de ToolJet 3.0. Pour plus d'informations sur les changements majeurs, consultez le [*guide de migration ToolJet 3.0*](../migration/upgrade-to-v3.md).

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
