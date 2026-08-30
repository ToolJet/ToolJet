---
id: ssh-config
title: Configurer le gestionnaire de dépôt Git
---

Pour configurer un gestionnaire Git avec ToolJet à l'aide de GitSync, vous avez besoin de l'URL SSH du gestionnaire Git, puis vous devez déployer la clé SSH générée par ToolJet. Vous pouvez utiliser n'importe quel gestionnaire Git (basé sur le cloud ou auto-hébergé) qui respecte les protocoles Git standard. Dans ce guide, nous aborderons la configuration pour GitHub, GitLab et Gitea.

## Générer l'URL SSH {#generating-ssh-url}

### GitHub

1. **Créer un nouveau dépôt** <br/>
    Créez un nouveau dépôt sur votre GitHub. Le dépôt peut être public ou privé. Vous pouvez également utiliser un dépôt existant. Assurez-vous que le dépôt est vide et que le nom de la branche par défaut est **master**.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/new-repo.png" alt="GitSync" />

2. **Obtenir l'URL SSH** <br/>
    Lorsqu'un dépôt est créé, GitHub affiche un écran contenant l'URL SSH.
    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/ssh.png" alt="GitSync" />

    OU
    
    Si vous utilisez un dépôt existant, vous pouvez obtenir l'URL en cliquant sur le bouton **Code**.
    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/ssh-code.png" alt="GitSync" />

### GitLab

1. **Créer un nouveau dépôt** <br/>
    Créez un nouveau dépôt sur votre GitLab. Le dépôt peut être public ou privé. Vous pouvez également utiliser un dépôt existant. Assurez-vous que le dépôt est vide et que le nom de la branche par défaut est **master**.
    <img className="screenshot-full" src="/img/gitsync/gitlab/repo.png" alt="GitSync" />

2. **Obtenir l'URL SSH** <br/>
    Sur GitLab, vous pouvez obtenir l'URL en cliquant sur le bouton **Clone** et en sélectionnant l'option **SSH**.
    <img className="screenshot-full" src="/img/gitsync/gitlab/gitlabssh.png" alt="GitSync" />

### Gitea

1. **Créer un nouveau dépôt** <br/>
    Créez un nouveau dépôt sur votre Gitea. Vous pouvez également utiliser un dépôt existant. Assurez-vous que le dépôt est vide et que le nom de la branche par défaut est **master**.
    <img className="screenshot-full" src="/img/gitsync/gitea/new-repo.png" alt="GitSync" />

2. **Obtenir l'URL SSH** <br/>
    Lorsqu'un dépôt est créé, Gitea affiche un écran contenant l'URL SSH. 
    <img className="screenshot-full" src="/img/gitsync/gitea/ssh-url.png" alt="GitSync" />


## Déployer la clé SSH {#deploy-the-ssh-key}

### GitHub

1. Accédez à l'onglet **Settings** du dépôt GitHub, puis cliquez sur l'onglet **Deploy keys**. Cliquez sur le bouton **Add deploy key**. 
    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/deploy-ssh.png" alt="GitSync" />

2. Saisissez un titre pour la clé SSH dans le champ **Title**. 
        
3. Collez la clé SSH générée par ToolJet. 

4. Assurez-vous que la case **Allow write access** est cochée, notamment lorsque vous configurez la fonctionnalité GitSync pour [envoyer des modifications vers Git (push)](/docs/development-lifecycle/gitsync/push). Cependant, il n'est pas obligatoire de cocher cette option lors de la configuration de la fonctionnalité GitSync pour [récupérer des modifications depuis Git (pull)](/docs/development-lifecycle/gitsync/pull).
        
5. Enfin, cliquez sur le bouton **Add key**.
    <img className="screenshot-full" src="/img/development-lifecycle/gitsync/config/add-key.png" alt="GitSync" />

### GitLab

Vous disposez de deux options pour ajouter la clé SSH à GitLab : vous pouvez soit l'ajouter globalement pour accéder à tous vos dépôts, soit la déployer pour un dépôt spécifique.

#### Option 1 : Ajouter en tant que clé SSH globale à l'utilisateur
        
Utilisez cette option pour accéder à tous vos dépôts.

1. Cliquez sur votre avatar dans le coin supérieur gauche et sélectionnez **Edit Profile**.

2. Accédez à l'onglet **SSH Keys** et cliquez sur le bouton **Add new key**.
    <img className="screenshot-full" src="/img/gitsync/gitlab/addingssh.png" alt="GitLab SSH Key" />

3. Dans le champ **Key**, collez la clé SSH que vous avez générée depuis ToolJet.

4. Donnez à votre clé un titre descriptif.
        
5. Définissez le **Usage type** sur **Authentication & signing**.
        
6. Vous pouvez éventuellement définir une date d'expiration.
        
7. Cliquez sur **Add key** pour enregistrer.
    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/gitsync/gitlab/activessh.png" alt="GitLab SSH Key" />

#### Option 2 : Ajouter en tant que clé de déploiement (Deploy Key) 

Utilisez cette option pour accéder uniquement à un dépôt spécifique.

1. Accédez au dépôt auquel vous souhaitez ajouter la clé.
        
2. Cliquez sur l'onglet **Settings** et sélectionnez **Repository**.

3. Une fois dans les **Repository Settings**, développez la section **Deploy Keys**.
        
4. Cliquez sur le bouton **Add new deploy key**.

5. Donnez à votre clé un titre descriptif.

6. Dans le champ **Key**, collez la clé SSH que vous avez générée dans l'onglet Configure Git de ToolJet lors de l'étape précédente.

7. Activez la case **Grant write permissions to this key**. Cette autorisation est nécessaire pour envoyer (push) des modifications vers le dépôt.

8. Cliquez sur **Add key** pour enregistrer.
    <img className="screenshot-full" src="/img/gitsync/gitlab/deploy-keys.png" alt="GitLab Deploy Key" />

### Gitea

1. Accédez à l'onglet **Settings** du dépôt Gitea, puis cliquez sur l'onglet **Deploy keys**. Cliquez sur le bouton **Add deploy key**. 
    <img className="screenshot-full" src="/img/gitsync/gitea/deploy-ssh.png" alt="GitSync" />

2. Saisissez un titre pour la clé SSH dans le champ **Title**. 
        
3. Collez la clé SSH générée par ToolJet. 

4. Assurez-vous que la case **Allow write access** est cochée, notamment lorsque vous configurez la fonctionnalité GitSync pour [envoyer des modifications vers Git (push)](/docs/development-lifecycle/gitsync/push). Cependant, il n'est pas obligatoire de cocher cette option lors de la configuration de la fonctionnalité GitSync pour [récupérer des modifications depuis Git (pull)](/docs/development-lifecycle/gitsync/pull).
        
5. Enfin, cliquez sur le bouton **Add Deploy key**.
    <img className="screenshot-full" src="/img/gitsync/gitea/final.png" alt="GitSync" />
