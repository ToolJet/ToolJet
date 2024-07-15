---
id: macos 
title: Mac OS
---

The following guide is intended for contributors to set-up ToolJet locally. If you're interested in **self-hosting** ToolJet, please refer to the **[Setup](/docs/setup/)** section.


To set up and run ToolJet on macOS for development, begin by opening your terminal and executing the commands listed below. For a better understanding of ToolJet's framework, we advise reviewing our [architecture guide](/docs/contributing-guide/setup/architecture) before proceeding.

## Setting up

1. Set up the environment

    1.1 Install Homebrew
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
    ```

    1.2 Install Node.js ( version: v18.18.2 ) and npm (version: v9.8.1)
    ```bash
    brew install nvm
    export NVM_DIR=~/.nvm
    source $(brew --prefix nvm)/nvm.sh
    nvm install 18.18.2
    nvm use 18.18.2
    npm install -g npm@9.8.1
    ```

    1.3 Install Postgres
    :::tip
    ToolJet uses a postgres database as the persistent storage for storing data related to users and apps. We do not plan to support other databases such as MySQL.
    :::

    ```bash
    brew install postgresql@13
    ```
    
    1.4 Install PostgREST(optional)

    :::info 
    Required only if ToolJet Database is being used. 
    :::

    To install a specific version of PostgRest using Homebrew:

    ```bash
    brew install postgrest@<version>
    ```
    To find out which versions are available, you can search with:

    ```bash
    brew search postgrest
    ```

    Once PostgREST is installed, you can start the PostgREST service using Homebrew services:

    ```
    brew services start postgrest
    ```

    Run the following command to check the status of the PostgREST service and other Homebrew-managed services:

    ```
    brew services list
    ```

    1.5 Clone the repository
    ```bash
    git clone https://github.com/tooljet/tooljet.git
    ```

3. Set up environment variables

    Create a `.env` file by copying `.env.example`. More information on the variables that can be set is given in the [environment variables reference](/docs/setup/env-vars)
    ```bash
    cp .env.example .env
    ```

4. Populate the keys in the env file
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
    PG_HOST=localhost
    PG_PORT=5432
    PG_USER=postgres
    PG_PASS=postgres
    PG_DB=tooljet_development
    ORM_LOGGING=all
   ```

5. Install and build dependencies
    ```bash
    npm install
    npm install --prefix server
    npm install --prefix frontend
    npm run build:plugins
    ```

6. Set up database
    ```bash
    npm run --prefix server db:create
    npm run --prefix server db:reset
    ```
    :::info
    If at any point you need to reset the database, use this command `npm run --prefix server db:reset`
    :::

7. Run plugins compilation in watch mode
    ```bash
    cd ./plugins && npm start
    ```

8. Run the server
    ```bash
    cd ./server && npm run start:dev
    ```

9. Run the client
    ```bash
    cd ./frontend && npm start
    ```

    The client will start on the port 8082, you can access the client by visiting:  [http://localhost:8082](http://localhost:8082)

10. Create login credentials

    Visiting [http://localhost:8082](http://localhost:8082) should redirect you to the login page, click on the signup link and enter your email. The emails sent by the server in development environment are captured and are opened in your default browser. Click the invitation link in the email preview to setup the account.

## Running tests

Test config requires the presence of `.env.test` file at the root of the project.

To run the unit tests
```bash
npm run --prefix server test
```

To run e2e tests
```bash
npm run --prefix server test:e2e
```

To run a specific unit test
```bash
npm run --prefix server test <path-to-file>
```
