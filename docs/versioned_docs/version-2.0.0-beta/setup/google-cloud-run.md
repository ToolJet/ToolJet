---
id: google-cloud-run
title: Google Cloud Run
---

# Deploying ToolJet on Google Cloud Run

:::info
You should setup a PostgreSQL database manually to be used by ToolJet.
:::

Follow the steps below to deploy ToolJet on Cloud run with `gcloud` CLI.


## Deploying ToolJet application

1. Cloud Run requires prebuilt image to be present within cloud registry. You can pull specific tooljet image from docker hub and then tag with your project to push it to cloud registry.

   ```bash
   gcloud auth configure-docker
   docker pull tooljet/tooljet-ce:latest
   docker tag tooljet/tooljet-ce:latest gcr.io/<replace-your-project-id>/tooljet/tooljet-ce:latest
   docker push gcr.io/<replace-your-project-id>/tooljet/tooljet-ce:latest
   ```

  Please run the above command by launching GoogleCLI which will help to push the Tooljet application image to Google container registry. 

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/CLI.png" alt="CLI" />
  </div>


2. Create new cloud run service

	Select and add the pushed Tooljet application image as shown below.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/tooljet-app-service.png" alt="tooljet-app-service" />
  </div>

3. Ingress and Authentication can set as shown below. But also can be changed to your preferred security options.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/ingress-auth.png" alt="ingress-auth" />
  </div>

4. Under containers tab, please make sure the port is set 8080 and command `npm, run, start:prod` is entered in container argument field with CPU capacity is set to 2GiB.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-tooljet.png" alt="port-and-capacity-tooljet" />
  </div>


5. Under environmental variable please add the below Tooljet application variables. You can also refer env variable [**here**](/docs/setup/env-vars). 

  Update `TOOLJET_HOST` environment variable if you want to use the default url assigned with Cloud run after the initial deploy.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/env-variable-tooljet.png" alt="env-variable-tooljet" />
  </div>

:::tip
If you are using [Public IP](https://cloud.google.com/sql/docs/mysql/connect-run) for Cloud SQL, then database host connection (value for `PG_HOST`) needs to be set using unix socket format, `/cloudsql/<CLOUD_SQL_CONNECTION_NAME>`. Additionally you will also have to set this flag with the above command:
```
   --set-cloudsql-instances <CLOUD_SQL_CONNECTION_NAME> 
```
where `<CLOUD_SQL_CONNECTION_NAME>` is the name of the connection to your Cloud SQL instance, which you can find on its settings page. 
:::


6. Please go to the connection tab. Under Cloud SQL instance please select the PostgreSQL database which you have set-up.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/Cloud-SQL-instance.png" alt="Cloud-SQL-instance" />
  </div>


Click on deploy once the above parameters are set. 

:::info
Once the Service is created and live, to make the  Cloud Service URL public. Please follow the steps [**here**](https://cloud.google.com/run/docs/securing/managing-access) to make the service public.
:::



7. Create default user (Optional)

Signing up requires [SMTP configuration](https://docs.tooljet.com/docs/setup/env-vars#smtp-configuration--optional-) to be done, but if you want to start off with default user you can run the command by modifying the `args` flag for a one time usage.

   ```bash
   gcloud run deploy <replace-service-name> \
   --image gcr.io/<replace-your-project-id>/tooljet/tooljet-ce:latest \
   --args "npm,run,--prefix,server,db:seed"
   ```

The deployment will fail as it runs a seed script. Check logs to see that default user was created. Now run the following command to have the app deployed.

   ```bash
   gcloud run deploy <replace-service-name> \
   --image gcr.io/<replace-your-project-id>/tooljet/tooljet-ce:latest \
   --args "npm,run,start:prod"
   ```

The default username of the admin is `dev@tooljet.io` and the password is `password`.





## Deploying only ToolJet server

1. Cloud Run requires prebuilt image to be present within cloud registry. You can pull specific tooljet server image from docker hub and then tag with your project to push it to cloud registry.

   ```bash
  gcloud auth configure-docker
  docker pull tooljet/tooljet-server-ce:latest
  docker tag tooljet/tooljet-server-ce:latest gcr.io/<replace-your-project-id>/tooljet/tooljet-server-ce:latest
  docker push gcr.io/<replace-your-project-id>/tooljet/tooljet-server-ce:latest
   ```

  Please run the above command by launching GoogleCLI which will help to push the Tooljet Server image to Google container registry. 

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/CLI.png" alt="CLI" />
  </div>


2. Create new cloud run service

	Select and add the pushed Tooljet application image as shown below.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/tooljet-server-service.png" alt="tooljet-server-service" />
  </div>
  

3. Ingress and Authentication can set as shown below. But also can be changed to your preferred security options.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/ingress-auth.png" alt="ingress-auth" />
  </div>
  
  

4. Under containers tab, please make sure the port is set 8080 and command `npm, run, start:prod` is entered in container argument field with CPU capacity is set to 2GiB.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-tooljet.png" alt="port-and-capacity-tooljet" />
  </div>



5. Under environmental variable please add the below Tooljet application variables. You can also refer env variable [**here**](/docs/setup/env-vars). 

  Update `TOOLJET_HOST` environment variable if you want to use the default url assigned with Cloud run after the initial deploy.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/eenv-variable-tooljet-server.png" alt="env-variable-tooljet-server" />
  </div>

:::tip
If you are using [Public IP](https://cloud.google.com/sql/docs/mysql/connect-run) for Cloud SQL, then database host connection (value for `PG_HOST`) needs to be set using unix socket format, `/cloudsql/<CLOUD_SQL_CONNECTION_NAME>`. Additionally you will also have to set this flag with the above command:
```
   --set-cloudsql-instances <CLOUD_SQL_CONNECTION_NAME> 
```
where `<CLOUD_SQL_CONNECTION_NAME>` is the name of the connection to your Cloud SQL instance, which you can find on its settings page. 
:::

:::info
  If there are self signed HTTPS endpoints that Tooljet needs to connect to, please make sure that `NODE_EXTRA_CA_CERTS` environment variable is set to the absolute path containing the certificates. The certificate can be mount as a volume onto the container using secrets.
:::



6. Please go to the connection tab. Under Cloud SQL instance please select the PostgreSQL database which you have set-up.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/Cloud-SQL-instance.png" alt="Cloud-SQL-instance" />
  </div>


Click on deploy once the above parameters are set. 


:::info
Once the Service is created and live, to make the  Cloud Service URL public. Please follow the steps [**here**](https://cloud.google.com/run/docs/securing/managing-access) to make the service public.
:::



7. Create default user **(Optional)**

Signing up requires [SMTP configuration](https://docs.tooljet.com/docs/setup/env-vars#smtp-configuration--optional-) to be done, but if you want to start off with default user you can run the command by modifying the `args` flag for a one time usage.

   ```bash
   gcloud run deploy <replace-service-name> \
   --image gcr.io/<replace-your-project-id>/tooljet/tooljet-server-ce:latest \
   --args "npm,run,db:seed:prod"
   ```

The deployment will fail as it only runs a seed script. Check logs to see that default user was created. Now run the following command to have the app deployed.

   ```bash
   gcloud run deploy <replace-service-name> \
   --image gcr.io/<replace-your-project-id>/tooljet/tooljet-server-ce:latest \
   --args "npm,run,start:prod"
   ```

The default username of the admin is `dev@tooljet.io` and the password is `password`.





### Deploying ToolJet Database 

If you intend to use this feature, you'd have to set up and deploy PostgREST server which helps querying ToolJet Database.

#### PostgREST server 

1. Cloud Run requires prebuilt image to be present within cloud registry. You can pull specific PostgREST image from docker hub and then tag with your project to push it to cloud registry.

   ```bash
   gcloud auth configure-docker
   docker pull postgrest/postgrest:v10.1.1.20221215
   docker tag postgrest/postgrest:v10.1.1.20221215 gcr.io/tooljet-test-338806/postgrest/postgrest:v10.1.1.20221215
   docker push gcr.io/tooljet-test-338806/postgrest/postgrest:v10.1.1.20221215
   ```
  
  Please run the above command by launching googleCLI which will help to push the PostgREST image to Google container registry. 

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/CLI.png" alt="CLI" />
  </div>


2. Once the PostgREST image is pushed. Click on create service.

  Select and add the pushed PostgREST image as shown in below.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/create-service-cloud-run-postgrest.png" alt="create-service-cloud-run-postgrest" />
  </div>  


3. Ingress and Authentication can set as shown in the below. But also can be changed to your preferred security options.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/ingress-auth.png" alt="ingress-auth" />
  </div>


4. Under containers tab, please make sure the port is set 3000 and CPU capacity is set to 1GiB.

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/port-and-capacity-postgrest.png" alt="port-and-capacity-postgrest" />
  </div>


5. Under environmental variable please add the below PostgREST variables. You can also refer env variable [**here**](/docs/setup/env-vars#tooljet-database)

  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/env-variables-postgrest.png" alt="env-variables-postgrest" />
  </div>


6. Please go to the connection tab. Under Cloud SQL instance please select the PostgreSQL database which you have set-up for Tooljet application. 


  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/Cloud-SQL-instance.png" alt="Cloud-SQL-instance" />
  </div>


Click on deploy once the above parameters are set. 

:::info
Once the Service is created and live, to make the  Cloud Service URL public. Please follow the steps [**here**](https://cloud.google.com/run/docs/securing/managing-access) to make the service public.
:::



7. Additional Environmental variable to be added to Tooljet application or Tooljet Server connect to PostgREST server. You can also refer env variable [**here**](/docs/setup/env-vars#tooljet-database)


  <div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/cloud-run/env-for-tooljet.png" alt="env-for-tooljet" />
  </div>
