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

3. Build docker images 
```bash
$ docker-compose build 
```

4. ToolJet server is built using Ruby on Rails. You have to reset the database if building for the first time.
```bash
$ docker-compose run rails db:reset
```

5. Run ToolJet
```bash
$ docker-compose up
```

6. Creating login credentials 

    1.  Open rails console using: 

    ```bash 
    $ docker-compose run rails console
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

7.  To shut down the containers,
```bash
$ docker-compose down
```

## Running Rails tests 

To run all the tests 

```bash 
$ docker-compose run rails test 
```

To run a specific test 
```bash 
$ docker-compose run rails test <path-to-file>:<line:number>
```

## Troubleshooting

If there is any change to dockerfiles, Gemfile or package.json, rebuild the images using: 

```bash
$ docker-compose up --build
```