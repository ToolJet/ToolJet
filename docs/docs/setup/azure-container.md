---
id: azure-container
title: Azure container apps
---

# Deploying ToolJet on Azure container apps

:::info
Please note that you need to set up a PostgreSQL database manually to be used by ToolJet
:::

## Deploying ToolJet application

1. Open the Azure dashboard at https://portal.azure.com, navigate to Container Apps, and click on "Create container app".
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/setup/azure-container/step1.png" alt="Deploying ToolJet on Azure container apps" />

 </div>

2. Select the appropriate subscription and provide basic details such as the container name.
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/setup/azure-container/step2.png" alt="Deploying ToolJet on Azure container apps" />

 </div>

3. In the container tab, uncheck the "Use quickstart image" option to select the image source manually.
 <div style={{textAlign: 'center'}}>
 
 <img className="screenshot-full" src="/img/setup/azure-container/step3.png" alt="Deploying ToolJet on Azure container apps" />
 
 </div>
 
  - Make sure to provide the image tag, and then enter `npm run start:prod` in the "Command override" field.
  - Add the following ToolJet application variables under the "Environmental variable" section. You can refer to this [**documentation**](/docs/setup/env-vars) for more information on environment variables.
   <div style={{textAlign: 'center'}}>
 
   <img className="screenshot-full" src="/img/setup/azure-container/step4.png" alt="Deploying ToolJet on Azure container apps" />

   </div>

4. In the ingress tab, configure Ingress and Authentication settings as shown below. You can customize the security configurations as per your requirements. Make sure the port is set to 3000.
 <div style={{textAlign: 'center'}}>
 
 <img className="screenshot-full" src="/img/setup/azure-container/step4.png" alt="Deploying ToolJet on Azure container apps" />

 </div>

5. Click on "Review + create" and wait for the template to be verified and passed, as shown in the screenshot below.
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/setup/azure-container/step5.png" alt="Deploying ToolJet on Azure container apps" />

 </div>


6. Once the container is deployed, you can verify its status under revision management.
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/setup/azure-container/step6.png" alt="Deploying ToolJet on Azure container apps" />

 </div>

You can access ToolJet via the application URL provided in the overview tab.
