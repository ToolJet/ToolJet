---
sidebar_position: 4
---

# AWS EC2

:::info
You should setup a PostgreSQL database manually to be used by the ToolJet server.
:::

Follow the steps below to deploy ToolJet on AWS EC2 machines

1. Setup a PostgreSQL database.(Please make sure that the EC2 machine which runs the ToolJet application is able to connect to the database.)

2. Login to your aws management console and go to the EC2 management page.

3. Under the Images section, click on the `AMIs` button.

4. Now, from the AMI search page, select the search type as "Public Images" and input `AMI Name : tooljet_latest_ubuntu_bionic` in the    search bar.

5. Select the ToolJet app's AMI and bootup an EC2 machine.

  Create or use security groups which at the very least, allow the following inbound rules:

   protocol| port     | allowed_cidr|
   ----| -----------  | ----------- |
   tcp | 22           | yourIP/32  |
   tcp | 80           | 0.0.0.0/0   |
   tcp | 443          | 0.0.0.0/0   |


6. Once the machine boots up, ssh into the machine by running `ssh -i <path_to_pem_file> ubuntu@<public_ip_of_the_machine>`

7. cd into the `app` directory by running `cd ~/app`. Now, modify the `.env` file in the directory by running `vim .env`.

   The provided `.env` file looks like this:
   ```
   TOOLJET_HOST=http://<example>
   LOCKBOX_MASTER_KEY=<example>
   SECRET_KEY_BASE=<example>
   PG_DB=tooljet_prod
   PG_USER=<pg user name>
   PG_HOST=<pg host>
   PG_PASS=<pg user password>
   ```
   ( Read [environment variables reference](/docs/deployment/env-vars)  )

8. The value in `TOOLJET_HOST` determines where you can access the ToolJet client. It can either be the public ipv4 address of your machine or a custom domain that you want to use.

   Example:

   `TOOLJET_HOST=http://12.34.56.78` or
   `TOOLJET_HOST=https://yourdomain.com`

   We use a lets encrypt plugin on top of nginx to create TLS certificates on the fly.
   :::info
   Please make sure that `TOOLJET_HOST` starts with either `http://` or `https://`
   :::

9. Once you've configured all the variables in `.env`, run `./setup_app.rb` to setup the app and start all the required services.

10. If you've set a custom domain for `TOOLJET_HOST`, please make a new A record entry in your dns settings to point to the public ip address of the ec2 machine.

12. You're all done, ToolJet client would now be served at the value you've set in `TOOLJET_HOST`.
