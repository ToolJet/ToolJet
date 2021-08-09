---
sidebar_position: 1
---

# Ubuntu
Follow these steps to setup and run ToolJet on Ubuntu. Open terminal and run the commands below.

1. ## Setting up the environment
    ### Install Node.js
    ```bash
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    ### Install Postgres
    ```bash
     sudo apt install postgresql postgresql-contrib
     sudo apt-get install libpq-dev
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
   ```

4. ## Install dependencies
    ```bash
    npm install --prefix server
    npm install --prefix frontend
    ```
5. ## Setup database
    ```bash
    npm run --prefix server db:reset
    npm run --prefix server start:dev
    ```
6. ## Running the server
    ```bash
    cd ./server && npm run start:dev
    ```

7. ## Running the client
    ```bash
    cd ./frontend && npm start
    ```

    The client will start running on the port 8082, you can access the client by visiting:  [https://localhost:8082](https://localhost:8082)

9. ## Creating login credentials
Visiting https://localhost:8082 should redirect you to the login page, click on the signup link and enter your email. The emails sent by the server in development environment are captured and are opened in your default browser. Click the invitation link in the email preview to setup the account.