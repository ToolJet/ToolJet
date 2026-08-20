---
id: codespaces
title: GitHub Codespaces
---

Suivez les étapes ci-dessous pour configurer ToolJet sur GitHub Codespaces. Nous vous recommandons de lire notre guide sur l'[architecture](https://docs.tooljet.com/docs/contributing-guide/setup/architecture) de ToolJet avant de continuer.

Ouvrez le terminal et exécutez les commandes ci-dessous.

## Configuration

### 1. Configurer l'environnement

1. Installez Node.js (version : v22.15.1) et npm (version : v10.9.2)

```
nvm install 22.15.1
nvm use 22.15.1
npm install -g npm@10.9.2
```

2. Installez Postgres

```
sudo sh -c 'echo "deb [http://apt.postgresql.org/pub/repos/apt](http://apt.postgresql.org/pub/repos/apt) $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

wget --quiet -O - [https://www.postgresql.org/media/keys/ACCC4CF8.asc](https://www.postgresql.org/media/keys/ACCC4CF8.asc) | sudo apt-key add -

sudo apt-get update

sudo apt-get install postgresql-13 postgresql-contrib-13
```

Pour démarrer le service postgresql, exécutez la commande ci-dessous :

```
sudo service postgresql start
```

Si vous souhaitez changer le mot de passe du service postgresql installé, exécutez les commandes ci-dessous :

```
sudo su

sudo -u postgres psql

\password postgres

\q
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` en exécutant la commande `touch .env`. Plus d'informations sur les variables pouvant être définies sont disponibles dans la [référence des variables d'environnement](https://docs.tooljet.com/docs/setup/env-vars)

**Pour une configuration de base, ajoutez les variables d'environnement suivantes :**

```
TOOLJET_HOST=http://localhost:3000

LOCKBOX_MASTER_KEY=

SECRET_KEY_BASE=

PG_USER=postgres

PG_HOST=localhost

PG_PASS=postgres

PG_DB=tooljet_prod

SUB_PATH=/apps/tooljet/

NODE_ENV=production

SERVE_CLIENT=true
```

> `SECRET_KEY_BASE` nécessite une clé de 64 octets. (Si vous avez `openssl` installé, exécutez `openssl rand -hex 64` pour créer une clé aléatoire sécurisée de 64 octets)
>
> `LOCKBOX_MASTER_KEY` nécessite une clé de 32 octets. (Exécutez `openssl rand -hex 32` pour créer une clé aléatoire sécurisée de 32 octets)

### 3. Installer et construire les dépendances

Assurez-vous que la version de node est bien réglée sur 22.15.1 avant d'exécuter la commande ci-dessous :

```
npm install
npm install --prefix server
npm install --prefix frontend
npm run build:plugins
```

### 4. Configurer la base de données

```
npm run --prefix server db:create
npm run --prefix server db:migrate
```

Si à un moment donné vous devez réinitialiser la base de données, utilisez cette commande `npm run --prefix server db:reset`

### 5. Construire le client

```
cd ./frontend && NODE=production npm run build
```

### 6. Exécuter le serveur

```
cd ./server && npm run start:prod
```

Le client démarrera sur le **port 3000** ; vous pouvez y accéder en visitant l'URL créée par codespace - `https://<url>/apps/tooljet`
