---
id: openshift
title: Openshift
---

# Deploying ToolJet on Openshift

:::info 
You should setup a PostgreSQL database manually to be used by ToolJet.
:::

*If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.*

Follow the steps below to deploy ToolJet on Openshift.

1. Setup a PostgreSQL database ToolJet uses a postgres database as the persistent storage for storing data related to users and apps. We do not have plans to support other databases such as MySQL.

2. Create a Kubernetes secret with name `server`. For the minimal setup, ToolJet requires `pg_host`, `pg_db`, `pg_user`, `pg_password`, `secret_key_base` & `lockbox_key` keys in the secret.

Read **[environment variables reference](https://docs.tooljet.com/docs/setup/env-vars)**

3. Once you have logged into the Openshift developer dashboard click on `+Add` tab. Select import YAML from the local machine.

:::note
When entering one or more files and use --- to separate each definition
:::

Copy paste depolyment.yaml to the online editor 

```
https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/openshift/deployment.yaml
```


Copy paste the service.yaml to the online editor

```
https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/openshift/service.yaml
```

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/setup/openshift/online-yaml-editor.png" alt="online yaml editor" />
 
</div>

Once you have added the files click on create.

:info
If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. You can make use of kubernetes secrets to mount the certificate file onto the containers.
:::


4. Navigate to topology tab and use the visual connector to establish the connect between tooljet-deployment and postgresql as shown in the screenshot below. 

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/setup/openshift/toplogy.png" alt="toplogy" />
 
</div>

## ToolJet Database

You can know more about tooljet database [here](https://docs.tooljet.com/docs/tooljet-database)

If you intend to use this feature, you'd have to set up and deploy PostgREST server which helps querying ToolJet Database. Please [follow the instructions here](https://docs.tooljet.com/docs/setup/env-vars#tooljet-database) for additional environment variables configuration to be done.

```
https://raw.githubusercontent.com/ToolJet/ToolJet/main/deploy/openshift/postgrest.yaml
```