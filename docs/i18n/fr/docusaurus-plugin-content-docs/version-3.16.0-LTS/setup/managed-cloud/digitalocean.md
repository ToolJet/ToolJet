---
id: digitalocean
title: DigitalOcean
slug: /setup/digitalocean/
---

Suivez les étapes ci-dessous pour déployer ToolJet sur un Droplet DigitalOcean.

:::warning
Pour utiliser les fonctionnalités de ToolJet AI dans votre déploiement, assurez-vous d'autoriser `https://api-gateway.tooljet.ai` et `https://python-server.tooljet.ai` dans vos paramètres réseau.
:::

**1. Accédez à la section Droplets dans DigitalOcean.**
<img className="screenshot-full" src="/img/setup/digitalocean/droplet_1.png" alt="create a Droplet" />

**2. Configurez le **Droplet** avec les options suivantes :**

- **Image** : Ubuntu
- **Plan** : choisissez un plan (par ex. Basic, 4 Go de RAM, 2 vCPU)
  <img className="screenshot-full img-full" src="/img/setup/digitalocean/droplet_plan.png" alt="use a droplet plan" />
- **Auth** : pour l'authentification, utilisez un mot de passe ou ssh
- Cliquez sur **Create Droplet** et notez l'adresse IP publique attribuée

**3. Créez un pare-feu pour les Droplets afin d'autoriser les ports requis :** <br/>
**Règles de pare-feu entrant requises**

- **Port 22 (SSH)** - TCP
  - CIDR autorisé : votre adresse IP uniquement
  - Objectif : accès administratif sécurisé au Droplet
- **Port 80 (HTTP)** - TCP
  - CIDR autorisé : `0.0.0.0/0` (toutes les sources)
  - Objectif : accès web public à ToolJet
- **Port 443 (HTTPS)** - TCP
  - CIDR autorisé : `0.0.0.0/0` (toutes les sources)
  - Objectif : accès web public sécurisé à ToolJet

:::tip
Pour une sécurité renforcée, limitez l'accès SSH (port 22) à votre adresse IP spécifique uniquement. Les ports HTTP et HTTPS doivent rester ouverts à toutes les sources pour permettre l'accès public à votre instance ToolJet.
:::

**4. Connectez-vous aux **Droplets** via SSH.**

**5. Installez Docker et Docker Compose avec les commandes suivantes :**

```bash
apt update && apt upgrade -y
apt install -y docker.io
```

Activez et démarrez Docker :

```bash
systemctl enable docker
systemctl start docker
```

Installez Docker Compose :

```bash
apt install -y curl
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

Vérifiez l'installation :

```bash
docker --version
docker-compose --version
```

**6. Mettez à jour `TOOLJET_HOST` dans le fichier `.env` :** <br/>
`TOOLJET_HOST=http://<public_ip>:80`

**7. Utilisez la [documentation Docker](https://docs.tooljet.com/docs/setup/docker) pour déployer ToolJet.**

## Mise à niveau vers la dernière version LTS {#upgrading-to-the-latest-lts-version}

:::info
S'il s'agit d'une nouvelle installation de l'application, vous pouvez démarrer directement avec la dernière version. Ce guide de mise à niveau concerne uniquement les installations existantes.
:::

De nouvelles versions LTS sont publiées tous les 3 à 5 mois avec une fin de vie d'au moins 18 mois. Pour connaître la dernière version LTS, consultez la page [ToolJet Docker Hub](https://hub.docker.com/r/tooljet/tooljet/tags). Les tags LTS suivent une convention de nommage avec le préfixe `LTS-` suivi du numéro de version, par exemple `tooljet/tooljet:ee-lts-latest`.

### Prérequis pour la mise à niveau

:::warning Critique : sauvegardez votre instance PostgreSQL

Avant de commencer le processus de mise à niveau, effectuez une **sauvegarde complète de votre instance PostgreSQL** pour éviter toute perte de données. Votre sauvegarde doit inclure les deux bases de données requises :

1. **PG_DB** (base de données de l'application) - contient les utilisateurs, les applications et les configurations
2. **TOOLJET_DB** (base de données interne) - contient les données de la fonctionnalité ToolJet Database

Assurez-vous que les deux bases de données sont incluses dans votre sauvegarde avant de procéder à la mise à niveau.
:::

- Les utilisateurs sur des versions antérieures à **v2.23.0-ee2.10.2** doivent d'abord effectuer une mise à niveau vers cette version avant de passer à la dernière version LTS.

## <br/>

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
