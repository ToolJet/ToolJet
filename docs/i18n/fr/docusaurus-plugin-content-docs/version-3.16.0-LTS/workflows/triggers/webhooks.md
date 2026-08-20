---
id: webhook
title: Déclencher via un webhook
---

<br/>

Le déclencheur Webhook vous permet de démarrer l'exécution d'un workflow lorsqu'un service externe envoie une requête HTTP à une URL de webhook unique. Cela permet aux workflows de s'exécuter automatiquement en fonction d'événements externes.

## Créer un workflow avec un déclencheur Webhook

1. Accédez à la section Workflows depuis la barre de navigation du tableau de bord.
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/workflow-section.png" alt="Accéder à la section Workflow" />
2. Cliquez sur **Create new workflow**, saisissez un nom unique pour votre workflow, puis cliquez sur **+Create workflow** pour créer le workflow. <br/>
    <img className="screenshot-full img-s" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/new-wf.png" alt="Créer un nouveau workflow" />
3. Configurez votre workflow. Vous pouvez consulter la **[documentation sur l'aperçu des workflows](/docs/workflows/overview/)** pour apprendre à configurer un workflow.
    <img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/trigger-from-app/configure-wf.png" alt="Configurer le workflow" />
4. Accédez à la section Triggers et cliquez sur **Webhooks**. Par défaut, le déclencheur webhook est désactivé. Activez le bouton pour **activer** le déclencheur webhook.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/webhook/enable-modal.png" alt="Option Webhook dans le panneau de gauche" /> <br/>
    Une fois activé, vous pouvez choisir l'**Environment** pour modifier l'URL du point de terminaison webhook pour cet environnement spécifique. Par exemple, si vous choisissez l'environnement **Production**, vous pouvez faire **Copy URL** ou **Copy as cURL**, qui peut ensuite être utilisé pour déclencher l'environnement **Production** en conséquence. <br/>
    <img style={{ marginTop: '15px' }} className="screenshot-full img-m" src="/img/workflows/triggers/webhook/env.png" alt="Option Webhook dans le panneau de gauche" />
5. Des paramètres peuvent être transmis au workflow. La `key` du paramètre et son `type` peuvent être spécifiés dans le champ **Parameters**. Par exemple, si vous souhaitez transmettre les paramètres `name` et `emp_id` au workflow via les déclencheurs webhook, vous pouvez définir le champ **Parameters** comme suit :
    ```json
    "name": "string",
    "emp_id": "number"
    ```
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/params.png" alt="Option Webhook dans le panneau de gauche" /> <br/>
    Le champ **Test JSON parameters** peut être utilisé pour tester le déclencheur webhook. Vous pouvez saisir les valeurs des paramètres dans le champ **Test JSON parameters** et cliquer sur le bouton **Run** pour tester le déclencheur webhook. Le workflow sera exécuté avec les valeurs de paramètres spécifiées dans le champ **Test JSON parameters**.
    ```json
    {
        "name": "John Doe",
        "emp_id": 33
    }
    ```
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/test-json.png" alt="Option Webhook dans le panneau de gauche" />
6. Retrouvez l'URL du point de terminaison de l'API dans le champ **Endpoint**. Vous pouvez utiliser cette URL pour envoyer une requête POST afin de déclencher le workflow. Vous pouvez également cliquer sur le bouton **Copy** pour copier l'URL dans le presse-papiers. Vous pouvez sélectionner **Copy URL** ou **Copy as cURL** depuis le menu déroulant. L'option **Copy as cURL** copie l'URL sous forme de commande cURL qui inclura des détails tels que le **jeton API** et l'**environnement**. Voici un exemple d'URL de point de terminaison :
    ```
    http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:id/trigger
    ```
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/url.png" alt="Option Webhook dans le panneau de gauche" />
7. Le jeton API est utilisé pour authentifier la requête. Vous pouvez retrouver le jeton API dans le champ **API Token**. Vous pouvez également cliquer sur le bouton **Copy** pour copier le jeton API dans le presse-papiers.
    <img className="screenshot-full img-m" src="/img/workflows/triggers/webhook/api.png" alt="Option Webhook dans le panneau de gauche" />
    :::info
    Actuellement, l'authentification est obligatoire pour les webhooks. Utilisez un jeton bearer dans l'en-tête `Authorization` pour l'authentification. <br/>
    **Format :**
    `Authorization: Bearer <secret_token>`<br/>
    **Exemple :**`Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
    :::

## Déclencher un webhook

Examinons un exemple de déclenchement d'un webhook à l'aide de **Postman**. 

1. Rendez-vous sur [Postman](https://www.postman.com/), et cliquez sur **New Request**.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/postman.png" alt="Aperçu de Postman"/>
2. Sélectionnez la méthode **POST** et collez l'**URL du point de terminaison** copiée précédemment.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/postman-url.png" alt="Coller l'URL dans Postman"/>
3. Accédez à l'onglet **Authorization**, sélectionnez **Bearer Token** comme **Auth Type**, et saisissez le **jeton API**.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/api-token.png" alt="Saisir le jeton API"/>
4. Allez dans l'onglet **Body**, sélectionnez **Raw**, et saisissez les paramètres requis au format JSON.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/parameters-postman.png" alt="Saisir les paramètres dans postman"/>
5. Cliquez sur **Send** pour déclencher le webhook. Cela récupérera la réponse du workflow créé.
    <img style={{ marginTop: '15px' }} className="screenshot-full img-full" src="/img/workflows/trigger-using-webhook/response.png" alt="Réponse finale"/>

## Exécution asynchrone des requêtes de workflow

Par défaut, lorsqu'un workflow est déclenché via le point de terminaison `/trigger`, la requête attend que l'exécution complète soit terminée, ce qui peut entraîner des délais d'expiration si le workflow prend trop de temps.

Pour éviter cela, vous pouvez utiliser le point de terminaison `/trigger-async`. Il démarre le workflow en arrière-plan et répond immédiatement avec un `execution_id` et un `timestamp`. Vous pouvez ensuite suivre l'exécution séparément.

Vous devrez ajouter manuellement `/trigger-async` à l'URL du point de terminaison. L'URL finale devrait ressembler à ceci :
```
http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/trigger-async?environment=:environment
```

Une fois l'exécution démarrée, la réponse du webhook devrait se présenter au format suivant :
```json
{
  "workflow_execution_id": "abc123...",
  "timestamp": "2025-05-15T10:30:45Z"
}
```

Vous pouvez suivre l'exécution du workflow de deux manières : en diffusant les mises à jour en direct ou en interrogeant périodiquement le statut d'exécution.
- Diffuser les mises à jour en direct :
  ```
  http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/execution/:execution_id/stream
  ```
- Interroger le statut :
  ```
  http://{TOOLJET_HOST}/api/v2/webhooks/workflows/:workflow_id/status/:execution_id
  ```

## Restrictions d'utilisation des déclencheurs Webhook

Certaines restrictions sur l'utilisation des déclencheurs webhook sont configurables, à la fois au niveau de l'instance et au niveau de l'espace de travail, selon la licence. Les restrictions sont les suivantes :

- Nombre d'exécutions par mois
- Nombre d'exécutions par jour
- Nombre d'exécutions parallèles
- Temps d'exécution par workflow

Pour limiter les exécutions parallèles, les variables d'environnement suivantes peuvent être utilisées :

| <div style={{ width:"200px"}}> Variable d'environnement </div> | <div style={{ width:"100px"}}> Valeur </div> | <div style={{ width:"100px"}}> Description </div> |
| -------------------- | ----- | ----------- |
| WEBHOOK_THROTTLE_TTL | 60000 | Durée de vie en millisecondes des requêtes webhook |
| WEBHOOK_THROTTLE_LIMIT | 100 | Nombre maximal de requêtes dans le TTL qui seront limitées |

:::tip Mise en liste blanche des points de terminaison API
Pour les Virtual Private Clouds (VPC), restreignez l'accès uniquement au point de terminaison `{TOOLJET_HOST}/api/v2/workflows/*`.
:::