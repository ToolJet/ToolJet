---
sidebar_position: 1
---

# Mac OS
Follow these steps to setup and run ToolJet on Mac OS for development purposes. Open terminal and run the commands below. We recommend reading our guide on [architecture](/docs/deployment/architecture) of ToolJet before proceeding.

1. ## Setting up the environment
    ### Install Homebrew
    ```bash
     /bin/bash -c "(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    ```
    ### Install Node.js ( version: v14.17.3 )
    ```bash
    brew install nvm
    export NVM_DIR=~/.nvm
    source $(brew --prefix nvm)/nvm.sh
    nvm install 14.17.3
    nvm use 14.17.3
    ```

    ### Install Postgres
    :::tip
    ToolJet uses a postgres database as the persistent storage for storing data related to users and apps. We do not plan to support other databases such as MySQL.
    :::

    ```bash
    brew install postgresql
    ```
2. ## Setup environment variables
    Create a `.env` file by copying `.env.example`. More information on the variables that can be set is given here: env variable reference
    ```bash
     cp .env.example .env
    ```

3. ## Populate the keys in the env file.
   :::info
   `SECRET_KEY_BASE` requires a 64 byte key. (If you have `openssl` installed, run `openssl rand -hex 64` to create a 64 byte secure   random key)

   `LOCKBOX_MASTER_KEY` requires a 32 byte key. (Run `openssl rand -hex 32` to create a 32 byte secure random key)
   :::

   Example:
   ```bash
   cat .env
   TOOLJET_HOST=http://localhost:8082
   LOCKBOX_MASTER_KEY=1d291a926ddfd221205a23adb4cc1db66cb9fcaf28d97c8c1950e3538e3b9281
   SECRET_KEY_BASE=4229d5774cfe7f60e75d6b3bf3a1dbb054a696b6d21b6d5de7b73291899797a222265e12c0a8e8d844f83ebacdf9a67ec42584edf1c2b23e1e7813f8a3339041
   NODE_ENV=development
   # DATABASE CONFIG
   PG_HOST=postgres
   PG_PORT=5432
   PG_USER=postgres
   PG_PASS=postgres
   PG_DB=tooljet_development
   ORM_LOGGING=all
   ```

4. ## Install dependencies
    ```bash
    npm install --prefix server
    npm install --prefix frontend
    ```
5. ## Setup database
    ```bash
    npm run --prefix server db:reset
    ```
6. ## Install webpack & nest-cli
    ```bash
    npm install -g webpack
    npm install -g webpack-cli
    npm install -g @nestjs/cli
    ```

7. ## Running the server
    ```bash
    cd ./server && npm run start:dev
    ```

8. ## Running the client
    ```bash
     cd ./frontend && npm start
    ```

    The client will start on the port 8082, you can access the client by visiting:  [https://localhost:8082](https://localhost:8082)

9. ## Creating login credentials
    Visiting [https://localhost:8082](https://localhost:8082) should redirect you to the login page, click on the signup link and enter your email. The emails sent by the server in development environment are captured and are opened in your default browser. Click the invitation link in the email preview to setup the account.


10. ## Running tests

Test config requires the presence of `.env.test` file at the root of the project.

To run the unit tests

```bash
$ npm run --prefix server test
```

To run e2e tests

```bash
npm run --prefix server test:e2e
```

To run a specific unit test
```bash
npm run --prefix server test <path-to-file>
```
