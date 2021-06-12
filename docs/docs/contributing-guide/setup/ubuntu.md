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

3. ## Install Ruby on Rails dependencies
    ```bash
    $ bundle
    ```

4. ## install React dependencies 
    ```bash 
    $ npm install
    ```

5. ## Setup Rails server  
    ```bash 
    $ bundle exec rake db:create
    $ bundle exec rake db:reset
    $ bundle exec rails server
    ```

6. ## Create login credentials 

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
    OrganizationUser.create(user: User.first, organization: Organization.first, role: 'admin')
    ```

7. ## Running the React frontend ( Client )
    ```bash 
    $ cd ./frontend && npm start
    ```

The client will start running on the port 8082, you can access the client by visiting:  [https://localhost:8082](https://localhost:8082 )