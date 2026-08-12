---
id: authentication
title: Authentication
---

La source de données REST API de ToolJet prend en charge divers types d'authentification pour authentifier l'utilisateur auprès du service REST API. Les types d'authentification pris en charge sont Basic, Bearer et OAuth 2.0.

## Authentification de base (Basic)

La source de données REST API de ToolJet prend en charge l'authentification Basic comme type d'authentification. L'authentification Basic est un schéma d'authentification simple intégré au protocole HTTP.

### Configurer la source de données REST API avec l'authentification Basic

1. Accédez à la page **Data Sources** depuis le tableau de bord ToolJet, sélectionnez la catégorie **API** dans la barre latérale et choisissez la source de données **REST API**.
2. Dans le champ **Base URL**, saisissez l'URL de base. L'URL de base spécifie l'adresse réseau du service API. Par exemple, `http://localhost:3001/api/basic-auth`
3. Saisissez les **Headers** si nécessaire. Les en-têtes sont des paires clé-valeur à inclure comme en-têtes avec les requêtes REST API.
4. Sélectionnez le type **Authentication** _Basic_ dans le menu déroulant.
5. Saisissez le **Username** et le **Password** dans les champs correspondants. Le nom d'utilisateur et le mot de passe sont les identifiants nécessaires pour authentifier l'utilisateur.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/auth-connection.png" alt="ToolJet - Data source - REST API" />

## Authentification par jeton Bearer

La source de données REST API de ToolJet prend en charge Bearer Token comme type d'authentification. Le jeton Bearer est un jeton de sécurité émis par le serveur d'authentification au client. Le client utilise ensuite le jeton pour accéder aux ressources protégées hébergées par le serveur de ressources.

### Configurer la source de données REST API avec Bearer Token

1. Accédez à la page **Data Sources** depuis le tableau de bord ToolJet, sélectionnez la catégorie **API** dans la barre latérale et choisissez la source de données **REST API**.
2. Dans le champ **Base URL**, saisissez l'URL de base. L'URL de base spécifie l'adresse réseau du service API. Par exemple, `http://localhost:3001/api/bearer-auth`
3. Saisissez les **Headers** si nécessaire. Les en-têtes sont des paires clé-valeur à inclure comme en-têtes avec les requêtes REST API.
4. Sélectionnez le type **Authentication** _Bearer_ dans le menu déroulant.
5. Saisissez le **Token** dans le champ. Le jeton est un jeton de sécurité émis par le serveur d'authentification au client. Le client utilise ensuite le jeton pour accéder aux ressources protégées hébergées par le serveur de ressources.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/auth-bearer.png" alt="ToolJet - Data source - REST API" />

6. Vous avez désormais la possibilité de sélectionner le **SSL Certificate** si nécessaire. Le certificat SSL est utilisé pour vérifier le certificat du serveur. Par défaut, il est défini sur _None_. Vous pouvez fournir le **CA Certificate** ou le **Client Certificate** depuis le menu déroulant.

   1. **CA Certificate** : Nécessite un certificat CA pour vérifier le certificat du serveur. Copiez le contenu du fichier `server.crt` et collez-le dans le champ **CA Cert**. Le fichier `server.crt` est le fichier de certificat utilisé pour vérifier le certificat du serveur.

   2. **Client Certificate** : Nécessite un certificat client pour s'authentifier auprès du serveur. Les fichiers **client.key**, **client.crt** et **server.crt** sont les fichiers de certificat utilisés pour s'authentifier auprès du serveur. Copiez le contenu du fichier **client.key** et collez-le dans le champ **Client Key**. Copiez le contenu du fichier **client.crt** et collez-le dans le champ **Client Cert**. Copiez le contenu du fichier **server.crt** et collez-le dans le champ **CA Cert**.

   <img className="screenshot-full img-l" src="/img/datasource-reference/rest-api/auth-bearer-certs.png" alt="ToolJet - Data source - REST API" />

7. Une fois que vous avez configuré la source de données REST API, cliquez sur le bouton **Save**.

### Authentifier la REST API

Créez une requête pour effectuer une requête `GET` vers l'URL, et elle renverra un message de succès si le jeton est valide.

<img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/auth-get-url.png" alt="ToolJet - Data source - REST API" />

## Authentification OAuth 2.0

La source de données REST API de ToolJet prend en charge OAuth 2.0 comme type d'authentification. Les types d'octroi OAuth 2.0 pris en charge sont Authorization Code et Client Credentials.

- **Authorization Code Grant Type** : Ce type d'octroi est utilisé par les clients confidentiels et publics pour échanger un code d'autorisation contre un jeton d'accès.
- **Client Credentials Grant Type** : Ce type d'octroi est utilisé par les clients pour obtenir un jeton d'accès en dehors du contexte d'un utilisateur.

### Configurer Google Cloud Platform

:::info
Avant de configurer la source de données REST API dans ToolJet, nous devons configurer **Google Cloud Platform** pour recueillir les clés API nécessaires à l'accès d'autorisation.
:::

Google Cloud Platform donne accès à plus de 350 API et services qui permettent d'accéder aux données de notre compte Google et de ses services. Créons une application OAuth à laquelle nous accorderons la permission d'utiliser les données de notre profil Google, telles que le nom et la photo de profil.

1. Connectez-vous à votre compte [Google Cloud](https://cloud.google.com/), et depuis la console, créez un nouveau projet.
2. Naviguez vers **APIs and Services**, puis ouvrez la section **OAuth consent screen** depuis la barre latérale gauche.
3. Saisissez les détails de l'application et sélectionnez les scopes appropriés pour votre application. Nous sélectionnerons les scopes profile et email.
4. Une fois l'écran de consentement OAuth créé, créez de nouveaux identifiants pour l'**OAuth client ID** depuis la section **Credentials** dans la barre latérale gauche.
5. Sélectionnez le type d'application, saisissez le nom de l'application, puis ajoutez les URI suivantes sous Authorized Redirect URIs (Callback URL) :
   1. `https://app.tooljet.com/oauth2/authorize` (si vous utilisez ToolJet cloud)
   2. `http://localhost:8082/oauth2/authorize` (si vous utilisez ToolJet localement)

<img class="screenshot-full img-full" src="/img/how-to/oauth2-authorization/callback-url.png" alt="ToolJet - How To - REST API CallBack URL in OAuth 2.0"/>

6. Enregistrez, puis vous obtiendrez le **Client ID et Client secret** de votre application.

<img class="screenshot-full img-full" src="/img/how-to/oauth2-authorization/gcp.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0"/>

### Configurer l'application ToolJet avec l'API OAuth 2.0 de Google

### Type d'octroi : Authorization Code

Suivons les étapes pour autoriser ToolJet à accéder aux données de votre profil Google :

1. Accédez à la page **Data Sources** depuis le tableau de bord ToolJet, sélectionnez la catégorie API dans la barre latérale et choisissez la source de données **REST API**.
2. Dans le champ **Base URL**, saisissez l'URL de base `https://www.googleapis.com/oauth2/v1/userinfo` ; l'URL de base spécifie l'adresse réseau du service API.
3. Sélectionnez le type **Authentication** _OAuth 2.0_
4. Conservez les valeurs par défaut pour **Grant Type**, **Add Access Token To** et **Header Prefix**, à savoir _Authorization Code_, _Request Header_ et _Bearer_ respectivement.
5. Saisissez l'**Access Token URL** : `https://oauth2.googleapis.com/token` ; ce jeton permet aux utilisateurs de vérifier leur identité et, en retour, de recevoir un jeton d'accès unique.
6. Saisissez le **Client ID** et le **Client Secret** que nous avons générés depuis la [Google Console](http://console.developers.google.com/).
7. Dans le champ **Scope**, saisissez `https://www.googleapis.com/auth/userinfo.profile` ; Scope est un mécanisme d'OAuth 2.0 permettant de limiter l'accès d'une application au compte d'un utilisateur. Consultez les scopes disponibles pour l'[API Google OAuth2 ici](https://developers.google.com/identity/protocols/oauth2/scopes#oauth2).
8. Saisissez l'**Authorization URL :** `https://accounts.google.com/o/oauth2/v2/auth` ; l'URL d'autorisation demande l'autorisation à l'utilisateur et redirige pour récupérer un code d'autorisation depuis le serveur d'identité.
9. Créez trois **Custom Authentication Parameters :**
   1. **response_type** : code (`code` fait référence à l'Authorization Code)
   2. **client_id** : Client ID
   3. **redirect_url** : `http://localhost:8082/oauth2/authorize` si vous utilisez ToolJet localement, ou saisissez `https://app.tooljet.com/oauth2/authorize` si vous utilisez ToolJet Cloud.
10. Conservez la sélection par défaut pour **Client Authentication** et **enregistrez** la source de données.

<img class="screenshot-full img-l" src="/img/how-to/oauth2-authorization/restapi-v2.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0" />

### Type d'octroi : Client Credentials

Suivons les étapes pour autoriser ToolJet à accéder aux données de votre profil Google :

1. Accédez à la page **Data Sources** depuis le tableau de bord ToolJet, sélectionnez la catégorie API dans la barre latérale et choisissez la source de données **REST API**.
2. Dans le champ **Base URL**, saisissez l'URL de base `https://www.googleapis.com/oauth2/v1/userinfo` ; l'URL de base spécifie l'adresse réseau du service API.
3. Sélectionnez le type **Authentication** _OAuth 2.0_
4. Sélectionnez **Grant Type** _Client credentials_.
5. Saisissez l'**Access Token URL** : `https://oauth2.googleapis.com/token` ; ce jeton permet aux utilisateurs de vérifier leur identité et, en retour, de recevoir un jeton d'accès unique.
6. Saisissez le **Client ID** et le **Client Secret** que nous avons générés depuis la [Google Console](http://console.developers.google.com/).
7. Dans le champ **Scope**, saisissez `https://www.googleapis.com/auth/userinfo.profile` ; Scope est un mécanisme d'OAuth 2.0 permettant de limiter l'accès d'une application au compte d'un utilisateur. Consultez les scopes disponibles pour l'[API Google OAuth2 ici](https://developers.google.com/identity/protocols/oauth2/scopes#oauth2).
8. Saisissez l'**Audience**, utilisée pour spécifier le destinataire prévu du jeton d'accès et qui dépend du fournisseur d'identité (IdP) que vous utilisez.

<img class="screenshot-full img-full" src="/img/how-to/oauth2-authorization/restapi-client.png" alt="ToolJet - How To - REST API authentication using OAuth 2.0" />

### Authentifier la REST API

Créons une requête pour effectuer une requête `GET` vers l'URL ; une nouvelle fenêtre s'ouvrira et demandera à l'utilisateur de s'authentifier auprès de l'API.

- Ajoutez une nouvelle requête et sélectionnez la source de données REST API dans le menu déroulant
- Dans le menu déroulant **Method**, sélectionnez `GET` et activez l'option `Run query on application load?`
- Exécutez la requête.
- Une nouvelle fenêtre s'ouvrira pour l'authentification et, une fois l'authentification réussie, vous pouvez exécuter à nouveau la requête pour obtenir les données de l'utilisateur telles que le nom et la photo de profil.

## Authentification AWS Signature v4

AWS Signature Version 4 est un mécanisme d'authentification utilisé pour signer de manière sécurisée les requêtes envoyées à Amazon Web Services (AWS). Il garantit que les requêtes sont authentifiées à l'aide de vos identifiants AWS et protégées contre toute altération pendant le transit.

Cette méthode d'authentification est requise lors de l'interaction avec des services AWS tels que S3, Lambda, API Gateway, Bedrock, DynamoDB et autres nécessitant des requêtes signées.

### Configurer la source de données REST API avec AWS Signature v4

Pour configurer l'authentification AWS Signature Version 4 dans la source de données REST API :

- **Authentication type** : Sélectionnez `AWS v4` dans le menu déroulant.
- **Connect using credential provider chain** (facultatif) : Activez cette option si ToolJet s'exécute dans un environnement AWS (tel qu'EC2, ECS ou Lambda) et doit utiliser automatiquement des identifiants basés sur un rôle IAM. Lorsque cette option est activée, les champs Access Key ID et Secret Access Key ne sont pas requis.
- **Access Key ID** : Saisissez l'Access Key ID AWS associé à votre utilisateur ou rôle IAM.
- **Secret Access Key** : Saisissez la Secret Access Key AWS correspondante. Cette valeur est chiffrée et stockée de manière sécurisée.
- **Region** : Spécifiez la région AWS du service auquel vous accédez (par exemple, `us-east-1`, `ap-south-1`, `eu-west-1`).
- **Service** : Fournissez l'identifiant du service AWS utilisé pour la signature des requêtes (par exemple, `execute-api`, `s3`, `lambda`, `dynamodb`, `bedrock`).

  <img className="screenshot-full img-full" src="/img/datasource-reference/rest-api/awsv4-connection.png" alt="REST API- aws v4 data source configuration" />
