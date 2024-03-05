---
id: codespaces
title: GitHub Codespaces
---

Follow the steps below to set up ToolJet on GitHub Codespaces. We recommend reading our guide on [architecture](https://docs.tooljet.com/docs/contributing-guide/setup/architecture) of ToolJet before proceeding.

Open the terminal and run the commands below.

## Setting up

### 1. Set up the environment 

1. Install Node.js ( version: v18.18.2 ) and npm (version: v9.8.1)

```
nvm install 18.18.2
nvm use 18.18.2
npm install -g npm@9.8.1
```

2. Install Postgres

```
sudo sh -c 'echo "deb [http://apt.postgresql.org/pub/repos/apt](http://apt.postgresql.org/pub/repos/apt) $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

wget --quiet -O - [https://www.postgresql.org/media/keys/ACCC4CF8.asc](https://www.postgresql.org/media/keys/ACCC4CF8.asc) | sudo apt-key add -

sudo apt-get update

sudo apt-get install postgresql-13 postgresql-contrib-13
```

To start the postgresql service run the below command: 

```
sudo service postgresql start
```

If you wish to change the password of the installed postresql service run the below commands:

```
sudo su

sudo -u postgres psql

\password postgres  

\q
```

### 2. Set up environment variables

Create a `.env` file by running the command `touch .env`. More information on the variables that can be set is given in the [environment variables reference](https://docs.tooljet.com/docs/setup/env-vars)

**For basic set-up you add the below env variables:**

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

> `SECRET_KEY_BASE` requires a 64 byte key. (If you have `openssl` installed, run `openssl rand -hex 64` to create a 64 byte secure random key)
>
> `LOCKBOX_MASTER_KEY` requires a 32 byte key. (Run `openssl rand -hex 32` to create a 32 byte secure random key)

### 3.  Install and build dependencies

Make sure node version is set to 18.18.2 before running the below command:

```
npm install
npm install --prefix server
npm install --prefix frontend
npm run build:plugins
```


### 4. Set up database

```
npm run --prefix server db:create
npm run --prefix server db:migrate
```

If at any point you need to reset the database, use this command `npm run --prefix server db:reset`

### 5. Build client

```
cd ./frontend && NODE=production npm run build
```

### 6. Run server

```
cd ./server && npm run start:prod
```

The client will start on the **port 3000**, you can access the client by visiting the url created by codespace - `https://<url>/apps/tooljet`
