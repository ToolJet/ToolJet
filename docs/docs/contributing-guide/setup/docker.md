---
sidebar_position: 1
---

# Docker
Docker compose is the easiest way to setup ToolJet server and client locally.

## Prerequisites

Make sure you have the latest version of `docker` and `docker-compose` installed.

[Official docker installation guide](https://docs.docker.com/desktop/)
[Official docker-compose installation guide](https://docs.docker.com/compose/install/)

We recommend:
  ```bash
  $ docker --version
  Docker version 19.03.12, build 48a66213fe
  $ docker-compose --version
  docker-compose version 1.26.2, build eefe0d31
  ```

## Setting up

1. Close the repository
   ```bash
   $ git clone https://github.com/tooljet/tooljet.git
   ```

2. Create a `.env` file by copying `.env.example`. More information on the variables that can be set is given here: env variable reference
   ```bash
   $ cp .env.example .env
   ```

3. Populate the keys in the `.env` file.
   :::info
   `SECRET_KEY_BASE` requires a 64 byte key. (If you have `openssl` installed, run `openssl rand -hex 64` to create a 64 byte secure   random key)

   `LOCKBOX_MASTER_KEY` requires a 32 byte key. (Run `openssl rand -hex 32` to create a 32 byte secure random key) 
   :::

   Example:   
   ```bash
   $ cat .env
   TOOLJET_HOST=http://localhost:8082
   LOCKBOX_MASTER_KEY=1d291a926ddfd221205a23adb4cc1db66cb9fcaf28d97c8c1950e3538e3b9281
   SECRET_KEY_BASE=4229d5774cfe7f60e75d6b3bf3a1dbb054a696b6d21b6d5de7b73291899797a222265e12c0a8e8d844f83ebacdf9a67ec42584edf1c2b23e1e7813f8a3339041
   ```

4. Build docker images
   ```bash
   $ docker-compose build
   ```

5. ToolJet server is built using Ruby on Rails. You have to reset the database if building for the first time.
   ```bash
   $ docker-compose run server rails db:reset
   ```

6. Run ToolJet
   ```bash
   $ docker-compose up
   ```

7. ToolJet should now be served locally at `http://localhost:8082`. You can login using the default user created.   
  ```
  email: dev@tooljet.io   
  password: password
  ```


8.  To shut down the containers,
    ```bash
    $ docker-compose stop
    ```

## Running Rails tests

To run all the tests

```bash
$ docker-compose run server rails test
```

To run a specific test
```bash
$ docker-compose run server rails test <path-to-file>:<line:number>
```

## Troubleshooting

Please open a new issue at https://github.com/ToolJet/ToolJet/issues or join our slack channel (https://join.slack.com/t/tooljet/shared_invite/zt-r2neyfcw-KD1COL6t2kgVTlTtAV5rtg) if you encounter any issues when trying to run ToolJet locally.
