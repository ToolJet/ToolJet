---
sidebar_position: 1
---

# Ubuntu
Follow these steps to setup and run ToolJet on Ubuntu. Open terminal and run the commands below.

1. ## Setting up the environment

    ### Install RVM
    RVM is used to manage Ruby versions on your local machine. Skip this step if you are using rbenv or any other tool to manage ruby versions.
    ```bash
    $ sudo apt-get install software-properties-common
    $ sudo apt-add-repository -y ppa:rael-gc/rvm
    $ sudo apt-get update
    $ sudo apt-get install rvm
    ```

    ### Install Ruby using RVM
    ```bash
    $ rvm install ruby-2.7.3
    $ rvm use 2.7.3
    ```

    ### Install Node.js
    ```bash
    $ curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
    $ sudo apt-get install -y nodejs
    ```

    ### Install Postgres
    ```bash
    $ sudo apt install postgresql postgresql-contrib
    $ sudo apt-get install libpq-dev
    ```

2. ## Setup environment variables
    Create a `.env` file by copying `.env.example`. More information on the variables that can be set is given here: env variable reference
    ```bash
    $ cp .env.example .env
    ```


3. ## Populate the keys in the env file.
   Run `openssl rand -hex 64` to create secure secrets and use them as the values for `LOCKBOX_MASTER_KEY` and `SECRET_KEY_BASE`.

   Example:
   ```bash
   $ cat .env
   TOOLJET_HOST=http://localhost:8082
   LOCKBOX_MASTER_KEY=c92bcc7f112ffbdd131d1fb6c5005e372b8802f85f6c4586e5a88f57a541382841c8c99e5701b84862e448dd5db846f705321a41bd48a0fed1b58b9596a3877f
   SECRET_KEY_BASE=4229d5774cfe7f60e75d6b3bf3a1dbb054a696b6d21b6d5de7b73291899797a222265e12c0a8e8d844f83ebacdf9a67ec42584edf1c2b23e1e7813f8a3339041
   ```

4. ## Install Ruby on Rails dependencies
    ```bash
    $ bundle
    ```

5. ## install React dependencies
    ```bash
    $ npm install
    ```

6. ## Setup Rails server
    ```bash
    $ bundle exec rake db:create
    $ bundle exec rake db:reset
    $ bundle exec rails server
    ```

7. ## Create login credentials

    1.  Open rails console using:

    ```bash
    $ bundle exec rails console
    ```

    2.  Create a new organization
    ```ruby
    Organization.create(name: 'Dev')
    ```

    3.  Create a new user
    ```ruby
    User.create(first_name: 'dev', email: 'dev@tooljet.io', password: 'password', organization: Organization.first)
    ```

    4. Add user to the organization as admin
    ```ruby
    OrganizationUser.create(user: User.first, organization: Organization.first, role: 'admin', status: 'active')
    ```

8. ## Running the React frontend ( Client )
    ```bash
    $ cd ./frontend && npm start
    ```

The client will start running on the port 8082, you can access the client by visiting:  [https://localhost:8082](https://localhost:8082)
