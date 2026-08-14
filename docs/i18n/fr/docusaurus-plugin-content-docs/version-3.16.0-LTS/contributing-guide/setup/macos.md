---
id: macos 
title: Mac OS
---

Le guide suivant est destiné aux contributeurs souhaitant configurer ToolJet en local. Si vous souhaitez **auto-héberger** ToolJet, veuillez consulter la section **[Installation](/docs/setup/)**.


Pour configurer et exécuter ToolJet sur macOS pour le développement, commencez par ouvrir votre terminal et exécuter les commandes listées ci-dessous. Pour mieux comprendre le framework de ToolJet, nous vous conseillons de consulter notre [guide d'architecture](/docs/contributing-guide/setup/architecture) avant de continuer.

## Configuration

1. Configurer l'environnement

    1.1 Installer Homebrew
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    ```

    1.2 Installer Node.js (version : v22.15.1) et npm (version : v10.9.2)
    ```bash
    brew install nvm
    export NVM_DIR=~/.nvm
    source $(brew --prefix nvm)/nvm.sh
    nvm install 22.15.1
    nvm use 22.15.1
    npm install -g npm@10.9.2
    ```

    1.3 Installer Postgres
    :::tip
    ToolJet utilise une base de données postgres comme stockage persistant pour les données relatives aux utilisateurs et aux applications. Nous ne prévoyons pas de prendre en charge d'autres bases de données comme MySQL.
    :::

    ```bash
    brew install postgresql@13
    ```
    
    1.4 Installer PostgREST

    :::info
    Veuillez utiliser PostgREST version 12.2.0
    :::

    ```bash
    brew install postgrest
    ```

    1.5 Forker le dépôt :

    Rendez-vous sur le [dépôt GitHub de ToolJet](https://github.com/ToolJet/Tooljet), cliquez sur le bouton **Fork** pour créer une copie du dépôt sur votre propre compte GitHub.

    1.6 Cloner votre dépôt forké :

    Après avoir forké, clonez le dépôt forké sur votre machine locale en utilisant l'URL de votre dépôt forké.

    ```bash
    git clone https://github.com/<your-username>/ToolJet.git
    ```

2. Configurer les variables d'environnement

    Créez un fichier `.env` en copiant `.env.example`. Plus d'informations sur les variables pouvant être définies sont disponibles dans la [référence des variables d'environnement](/docs/setup/env-vars)
    ```bash
    cp .env.example .env
    ```

3. Renseigner les clés dans le fichier env
   :::info
   `SECRET_KEY_BASE` nécessite une clé de 64 octets. (Si vous avez `openssl` installé, exécutez `openssl rand -hex 64` pour créer une clé aléatoire sécurisée de 64 octets)

   `LOCKBOX_MASTER_KEY` nécessite une clé de 32 octets. (Exécutez `openssl rand -hex 32` pour créer une clé aléatoire sécurisée de 32 octets)
   :::

   Exemple :
   ```bash
    cat .env
    TOOLJET_HOST=http://localhost:8082
    LOCKBOX_MASTER_KEY=1d291a926ddfd221205a23adb4cc1db66cb9fcaf28d97c8c1950e3538e3b9281
    SECRET_KEY_BASE=4229d5774cfe7f60e75d6b3bf3a1dbb054a696b6d21b6d5de7b73291899797a222265e12c0a8e8d844f83ebacdf9a67ec42584edf1c2b23e1e7813f8a3339041
    NODE_ENV=development
    # DATABASE CONFIG
    PG_HOST=localhost
    PG_PORT=5432
    PG_USER=postgres
    PG_PASS=postgres
    PG_DB=tooljet_development
    TOOLJET_DB=tooljet_db
    TOOLJET_DB_USER=postgres
    TOOLJET_DB_HOST=localhost
    TOOLJET_DB_PASS=postgres
    ORM_LOGGING=all
   ```

4. Installer et compiler les dépendances
    ```bash
    npm install
    npm install --prefix server
    npm install --prefix frontend
    npm run build:plugins
    ```

5. Configurer la base de données
    ```bash
    npm run --prefix server db:create
    npm run --prefix server db:reset
    ```
    :::info
    Si vous devez réinitialiser la base de données à tout moment, utilisez cette commande `npm run --prefix server db:reset`
    :::

6. Exécuter la compilation des plugins en mode watch
    ```bash
    cd ./plugins && npm start
    ```

7. Exécuter le serveur
    ```bash
    cd ./server && npm run start:dev
    ```

8. Exécuter le client
    ```bash
    cd ./frontend && npm start
    ```

    Le client démarrera sur le port 8082, vous pouvez y accéder en visitant : [http://localhost:8082](http://localhost:8082)

9. Créer des identifiants de connexion

    En visitant [http://localhost:8082](http://localhost:8082), vous devriez être redirigé vers la page de connexion. Cliquez sur le lien d'inscription et saisissez votre email. Les emails envoyés par le serveur en environnement de développement sont capturés et ouverts dans votre navigateur par défaut. Cliquez sur le lien d'invitation dans l'aperçu de l'email pour configurer le compte.

## Exécuter les tests

La configuration des tests nécessite la présence d'un fichier `.env.test` à la racine du projet.

Pour exécuter les tests unitaires
```bash
npm run --prefix server test
```

Pour exécuter les tests e2e
```bash
npm run --prefix server test:e2e
```

Pour exécuter un test unitaire spécifique
```bash
npm run --prefix server test <path-to-file>
```
