---
id: ubuntu
title: Ubuntu
---

:::warning
Le guide suivant est destiné aux contributeurs souhaitant configurer ToolJet en local. Si vous souhaitez **auto-héberger** ToolJet, veuillez consulter la section **[Installation](/docs/setup/)**.
:::

Suivez ces étapes pour configurer et exécuter ToolJet sur Ubuntu. Ouvrez un terminal et exécutez les commandes ci-dessous.

## Configuration

1. Configurer l'environnement

    1.1 Installer NVM
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    ```

    Utilisez la commande pour charger NVM :
    ```bash
    source ~/.nvm/nvm.sh
    ```

    Fermez et rouvrez votre terminal pour commencer à utiliser nvm
    ```bash
    nvm install 22.15.1
    nvm use 22.15.1
    ```

    Assurez-vous d'avoir la bonne version de npm, sinon cela provoquera une erreur liée à fsevents.
    ```bash
    npm i -g npm@10.9.2
    ```

    1.2 Installer Postgres
    ```bash
    sudo apt install postgresql postgresql-contrib
    sudo apt-get install libpq-dev
    ```
    
    1.3 Installer PostgREST

    :::info
    Veuillez utiliser PostgREST version 12.2.0
    :::

    Veuillez suivre le guide d'installation de [PostgREST](https://postgrest.org/en/stable/install.html)

2. Configurer le dépôt :

    2.1 Forker le dépôt :

    Rendez-vous sur le [dépôt GitHub de ToolJet](https://github.com/ToolJet/Tooljet), cliquez sur le bouton **Fork** pour créer une copie du dépôt sur votre propre compte GitHub.

    2.2 Cloner votre dépôt forké :

    Après avoir forké, clonez le dépôt forké sur votre machine locale en utilisant l'URL de votre dépôt forké.

    ```bash
    git clone https://github.com/<your-username>/ToolJet.git
    ```
    
3. Configurer les variables d'environnement

    Créez un fichier `.env` en copiant `.env.example`. Plus d'informations sur les variables pouvant être définies sont disponibles dans la [référence des variables d'environnement](/docs/setup/env-vars)
    ```bash
    cp .env.example .env
    ```

4. Renseigner les clés dans le fichier env
   :::info
   `SECRET_KEY_BASE` nécessite une clé de 64 octets. (Si vous avez `openssl` installé, exécutez `openssl rand -hex 64` pour créer une clé aléatoire sécurisée de 64 octets)

   `LOCKBOX_MASTER_KEY` nécessite une clé de 32 octets. (Exécutez `openssl rand -hex 32` pour créer une clé aléatoire sécurisée de 32 octets)
   :::

    ToolJet nécessite que les variables d'environnement suivantes soient définies.   
   
   ```envs
   TOOLJET_HOST=http://localhost:8082
   LOCKBOX_MASTER_KEY= <generate using 'openssl rand -hex 32'>
   SECRET_KEY_BASE= <generate using 'openssl rand -hex 64'>
   NODE_ENV=development

   PG_HOST=localhost
   PG_PORT=5432
   PG_USER=postgres
   PG_PASS=postgres
   PG_DB=tooljet_development
   
   TOOLJET_DB=tooljet_db
   TOOLJET_DB_USER=postgres
   TOOLJET_DB_HOST=localhost
   TOOLJET_DB_PASS=postgres
   ```

   ToolJet nécessite deux bases de données distinctes pour fonctionner correctement : `pg_db` et `tooljet_db`.
   Bien que les deux bases de données puissent résider sur le même hôte PostgreSQL, elles doivent être des bases de données séparées pour éviter les conflits.

5. Installer et compiler les dépendances
    ```bash
    npm install
    npm install --prefix server
    npm install --prefix frontend
    npm run build:plugins
    ```
   
    :::note 
    Si la commande `npm run build:plugins` échoue parce que certains paquets sont manquants, essayez d'exécuter la commande suivante pour installer les paquets nécessaires :
    `sudo apt install build-essential`
    puis reprenez l'étape `npm run build:plugins`.
    :::

6. Configurer la base de données
    ```bash
    npm run --prefix server db:create
    npm run --prefix server db:reset
    ```
    :::info
    Si vous devez réinitialiser la base de données à tout moment, utilisez cette commande `npm run --prefix server db:reset`
    :::

7. Exécuter la compilation des plugins en mode watch
    ```bash
    cd ./plugins && npm start
    ```

8. Exécuter le serveur
    ```bash
    cd ./server && npm run start:dev
    ```

9. Exécuter le client
    ```bash
    cd ./frontend && npm start
    ```


    Le client démarrera sur le port 8082, vous pouvez y accéder en visitant : [http://localhost:8082](http://localhost:8082)

10. Créer des identifiants de connexion

    En visitant https://localhost:8082, vous devriez être redirigé vers la page de connexion. Cliquez sur le lien d'inscription et saisissez votre email. Les emails envoyés par le serveur en environnement de développement sont capturés et ouverts dans votre navigateur par défaut. Cliquez sur le lien d'invitation dans l'aperçu de l'email pour configurer le compte.


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
