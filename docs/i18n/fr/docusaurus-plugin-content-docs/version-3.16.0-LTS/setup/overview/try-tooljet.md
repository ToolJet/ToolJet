---
id: try-tooljet
title: Essayer ToolJet
slug: /setup/try-tooljet/
---

:::warning
Pour utiliser les fonctionnalités ToolJet AI dans votre déploiement, veillez à ajouter `https://api-gateway.tooljet.ai` et `https://python-server.tooljet.ai` à la liste blanche dans vos paramètres réseau.
:::

## En local avec Docker

Vous pouvez exécuter la commande ci-dessous pour avoir ToolJet opérationnel immédiatement.

```bash
docker run \
  --name tooljet \
  --restart unless-stopped \
  -p 80:80 \
  --platform linux/amd64 \
  -v tooljet_data:/var/lib/postgresql/16/main \
  tooljet/try:ee-lts-latest
```

#### Informations de configuration

- Exécute le serveur ToolJet sur le port 80 de votre machine.
- Le conteneur dispose déjà de postgres configuré en interne. Toutes les données seront disponibles dans le volume docker `tooljet_data`.
- Vous pouvez utiliser l'option `--env` ou `--env-file` pour tester les différentes variables d'environnement mentionnées [ici](/docs/setup/env-vars).
- Utilisez `docker stop tooljet` pour arrêter le conteneur et `docker start tooljet` pour le redémarrer par la suite.

#### Configuration dynamique du port

Pour exécuter le serveur ToolJet sur un port différent, comme 8080 ou tout autre port de votre choix, utilisez la commande suivante :

```sh
docker run \
  --name tooljet \
  --restart unless-stopped \
  -p 8080:8080 \
  -e PORT=8080 \
  --platform linux/amd64 \
  -v tooljet_data:/var/lib/postgresql/16/main \
  tooljet/try:ee-lts-latest
```

- Cette commande démarrera le serveur ToolJet sur le port 8080.
- L'option `-e PORT=8080` définit la variable d'environnement `PORT` à 8080, ce qui permet au serveur ToolJet d'écouter sur le port 8080.

En suivant ces instructions, vous pouvez facilement exécuter le serveur ToolJet sur le port de votre choix, garantissant ainsi une flexibilité dans votre configuration.

_Si vous avez des questions, n'hésitez pas à rejoindre notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA) ou à nous envoyer un e-mail à support@tooljet.com._
