---
id: github-config
title: Configuration GitHub
sidebar_label: Configuration GitHub
---

<PlanBadge type="enterprise" />

La configuration GitHub pour GitSync introduit une manière plus flexible de connecter votre instance ToolJet à un dépôt Git. Elle fonctionne via HTTPS, ce qui vous permet d'éviter les blocages de port SSH, et vous permet de choisir les branches directement depuis l'interface utilisateur.

Rôle requis : **Admin**

### 1. Créer un nouveau dépôt et effectuer un commit initial
    Créez un nouveau dépôt sur votre GitHub. Le dépôt peut être public ou privé. Vous pouvez également utiliser un dépôt existant. Assurez-vous que le dépôt est vide, puis créez un commit initial (par exemple, en ajoutant un fichier **README.md**). Ce premier commit initialise le dépôt et crée la branche par défaut (comme **main**).

### 2. Créer l'application GitHub
    [Configurez une application GitHub](https://github.com/settings/apps/new) et assurez-vous qu'elle est créée par le même propriétaire que le dépôt Git. Si vous avez plusieurs instances ToolJet, utilisez cette même application GitHub sur toutes les instances. 
    <img className="screenshot-full img-l" src="/img/gitsync/github-config/github-app-register.png" alt="GitSync" />
    
    Saisissez les détails de votre application sur la page **Register new GitHub App** et veillez à décocher les cases **Expire user authorization tokens** et **Active** dans les sections **Identifying and authorizing users** et **Webhook** respectivement.

    Définissez l'URL de la page d'accueil (Homepage URL) sur l'URL de votre instance ToolJet. Pour ToolJet Cloud, utilisez `https://app.tooljet.com`. Pour un ToolJet auto-hébergé, utilisez l'URL de votre propre instance ToolJet.
    
    :::note
    Ajoutez les autorisations de dépôt (Repository permissions) suivantes :
        - Contents : Read & Write
        - Pull requests : Read & Write
    :::

    Après avoir créé l'application GitHub, vous serez redirigé vers la page **GitHub App Settings**. 

    :::note
    Veillez à copier l'**App ID**. 
    :::
    Ensuite, générez la **Private key** (clé `.pem`), téléchargez-la et conservez-la en lieu sûr. Cette information sera essentielle plus tard lors de la configuration de GitSync.
        <img className="screenshot-full img-l" src="/img/gitsync/github-config/github-app1.png" alt="GitSync" />

### 3. Installer l'application GitHub
    
    Pour installer votre application GitHub, suivez ces étapes :
    - Cliquez sur Install App sur la page **GitHub App Settings**.<br />
        <img className="screenshot-full img-s" style={{ marginTop:'15px'}}  src="/img/gitsync/github-config/github-app2.png" alt="GitSync" />
    - Cliquez sur le bouton **Install** à côté de votre organisation.
    - Sélectionnez l'option de dépôts et choisissez les dépôts que vous souhaitez connecter à ToolJet.
    - Vous serez redirigé vers la page d'installation. Le nombre à la fin de l'URL est l'**installation ID**. Conservez-le pour plus tard. <br/>
        ```
        https://github.com/settings/installations/:installation_id
        ```

### 4. Configurer GitHub dans GitSync 

Accédez à la page **Workspace settings** et cliquez sur l'onglet **Configure git**. Ensuite, saisissez les valeurs de configuration requises après avoir sélectionné GitHub comme fournisseur de dépôt.
    <img className="screenshot-full img-s" src="/img/gitsync/github-config/github-form-full.png" alt="GitSync" />

Le tableau ci-dessous décrit chaque valeur de configuration :

#### Dépôt

| **Paramètre** | **Description** |
|-------------|----------------|
| **Repo URL**  | L'URL du dépôt que vous avez créé pour l'utiliser avec ToolJet. (par exemple `https://github.com/your-org/repo-name.git`) |
| **Branch name** | Nom de la branche de votre dépôt. Par défaut, la branche main est utilisée. |

#### GitHub auto-hébergé (Optionnel)

| **Paramètre** | **Description** |
|-------------|-----------------|
| **GitHub enterprise URL** |    Le domaine utilisé pour accéder à votre instance GitHub auto-hébergée. Si vous utilisez GitHub Cloud, vous pouvez laisser ce champ vide. |
| **GitHub enterprise API URL** |  Le point de terminaison API de votre instance GitHub auto-hébergée.  Si vous utilisez GitHub Cloud, vous pouvez laisser ce champ vide. (par exemple `https://[hostname]/api/v3/`) |

#### Accès à l'application
| **Paramètre** | **Description**  |
|-------------|------------------|
| **GitHub app ID** | L'[ID de l'application GitHub](https://docs.github.com/en/developers/apps/identifying-and-authorizing-users-for-github-apps#authenticating-with-a-github-app). |
| **GitHub app installation ID** | L'[ID d'installation GitHub](https://docs.github.com/en/developers/apps/managing-github-apps/installing-github-apps#installing-a-github-app). |
| **GitHub app private key** | La clé privée que vous avez téléchargée après la création de l'application. |

Une fois les configurations nécessaires saisies, cliquez sur **Save Changes**. Votre instance ToolJet sera désormais connectée à votre dépôt GitHub.

:::note
Vous pouvez utiliser les mêmes identifiants pour configurer un dépôt spécifique sur plusieurs instances ou espaces de travail.
:::
