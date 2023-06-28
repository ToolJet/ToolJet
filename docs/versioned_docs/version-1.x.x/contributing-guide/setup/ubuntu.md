---
id: ubuntu
title: Ubuntu
---

# Ubuntu
Follow these steps to setup and run ToolJet on Ubuntu. Open terminal and run the commands below.

## Setting up

1. Set up the environment

    1.1 Install Node.js
    ```bash
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Ensure you have the correct version of npm, or it will cause an error about fsevents.
    npm i -g npm@7.20.0
    ```

    1.2 Install Postgres
    ```bash
    sudo apt install postgresql postgresql-contrib
    sudo apt-get install libpq-dev
    ```

2. Set up environment variables

    Create a `.env` file by copying `.env.example`. More information on the variables that can be set is given in the [environment variables reference](/docs/setup/env-vars)
    ```bash
    cp .env.example .env
    ```

3. Populate the keys in the env file
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
   ```

4. Install and build dependencies
    ```bash
    npm install
    npm install --prefix server
    npm install --prefix frontend
    npm run build:plugins
    ```

5. Set up database
    ```bash
    npm run --prefix server db:create
    npm run --prefix server db:reset
    ```
    :::info
    If at any point you need to reset the database, use this command `npm run --prefix server db:reset`
    :::

6. Run plugins compilation in watch mode
    ```bash
    cd ./plugins && npm start
    ```

7. Run the server
    ```bash
    cd ./server && npm run start:dev
    ```

8. Run the client
    ```bash
    cd ./frontend && npm start
    ```


    The client will start running on the port 8082, you can access the client by visiting:  [https://localhost:8082](https://localhost:8082)

9. Create login credentials

    Visiting https://localhost:8082 should redirect you to the login page, click on the signup link and enter your email. The emails sent by the server in development environment are captured and are opened in your default browser. Click the invitation link in the email preview to setup the account.


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
