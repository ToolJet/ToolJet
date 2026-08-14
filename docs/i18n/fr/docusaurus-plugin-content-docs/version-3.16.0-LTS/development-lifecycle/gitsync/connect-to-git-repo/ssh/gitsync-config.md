---
id: gitsync-config
title: Configurer GitSync
---

<PlanBadge type="enterprise" />

Dans ce guide, nous allons découvrir comment configurer GitSync en utilisant GitHub comme gestionnaire de dépôt. Par défaut, GitSync est configuré pour la branche **main**, mais celle-ci peut être remplacée par une autre branche ; reportez-vous à la section **[Configurer GitSync sur une branche différente](#configuring-gitsync-on-a-different-branch)** pour plus d'informations.

Pour plus d'informations sur l'utilisation d'autres gestionnaires de dépôt, tels que GitLab ou Gitea, reportez-vous au guide **[Configuration SSH pour le gestionnaire de dépôt Git](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config)**.

## Configurer GitSync dans ToolJet

Rôle requis : **Admin**

1. **Créer un nouveau dépôt** <br/>
    Créez un nouveau dépôt sur votre GitHub. Le dépôt peut être public ou privé. Vous pouvez également utiliser un dépôt existant. Assurez-vous que le dépôt est vide.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/new-repo.png" alt="GitSync" />

2. **Obtenir l'URL SSH** <br/>
    Lorsqu'un dépôt est créé, GitHub affiche un écran contenant l'URL SSH.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/ssh.png" alt="GitSync" />

    OU
    
    Si vous utilisez un dépôt existant, vous pouvez obtenir l'URL en cliquant sur le bouton **Code**.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/ssh-code.png" alt="GitSync" />

    Pour générer l'URL SSH pour un autre gestionnaire de dépôt Git, tel que GitLab et Gitea, suivez le guide **[Configuration SSH](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#generating-ssh-url)**.

3. Accédez aux **Workspace settings**, puis cliquez sur l'onglet **Configure git sync**. Sélectionnez Git SSH Protocol comme mode de connexion (Repository Connection). <br/>
    (Exemple d'URL - `https://app.corp.com/nexus/workspace-settings/configure-git`)

    <img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/gitsync/ssh/gitsync-home.png" alt="Git Sync" />


4. Saisissez l'**URL SSH** du dépôt dans le champ **Git repo URL**.

5. Cliquez sur le bouton **Generate SSH key**, puis copiez la clé SSH générée. La clé SSH est utilisée pour authentifier ToolJet auprès du dépôt.

    <img className="screenshot-full img-l" src="/img/gitsync/ssh/ssh-url.png" alt="GitSync" />

    Il existe deux types de clés SSH générées :
    - **ED25519** : il s'agit d'un algorithme sécurisé et efficace utilisé pour générer des clés SSH. Il est recommandé d'utiliser ce type de clé. Les fournisseurs VCS comme GitHub et GitLab recommandent d'utiliser ce type de clé
    - **RSA** : il s'agit d'un algorithme plus ancien utilisé pour générer des clés SSH. Il n'est pas recommandé d'utiliser ce type de clé. Des fournisseurs comme Bitbucket recommandent d'utiliser ce type de clé. <br/> <br/>

    <img className="screenshot-full img-l" src="/img/gitsync/ssh/ssh-key.png" alt="GitSync" />

6. Accédez à l'onglet **Settings** du dépôt GitHub, puis cliquez sur l'onglet **Deploy keys**. Cliquez sur le bouton **Add deploy key**. Saisissez un titre pour la clé SSH dans le champ **Title**. Collez la clé SSH générée par ToolJet.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/deploy-ssh.png" alt="GitSync" /> 

7. Assurez-vous que la case **Allow write access** est cochée, notamment lorsque vous configurez la fonctionnalité GitSync pour [envoyer des modifications vers Git (push)](/docs/development-lifecycle/gitsync/push). Cependant, il n'est pas obligatoire de cocher cette option lors de la configuration de la fonctionnalité GitSync pour [récupérer des modifications depuis Git (pull)](/docs/development-lifecycle/gitsync/pull). Enfin, cliquez sur le bouton **Add key**.
    <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/add-key.png" alt="GitSync" />

    Pour déployer la clé SSH pour un autre gestionnaire de dépôt Git, tel que GitLab et Gitea, suivez le guide **[Configuration SSH](/docs/development-lifecycle/gitsync/connect-to-git-repo/ssh/ssh-config#deploy-the-ssh-key)**.

8. Après avoir déployé la clé SSH, accédez à l'onglet **Configure git** sur ToolJet, puis cliquez sur le bouton **Finalize setup**. Si la clé SSH est configurée correctement, un message de succès s'affiche.
    <img className="screenshot-full img-l" src="/img/gitsync/ssh/config-success.png" alt="GitSync" />

## Configurer GitSync sur une branche différente {#configuring-gitsync-on-a-different-branch}

GitSync de ToolJet vous permet de synchroniser vos applications avec un dépôt Git afin de permettre le contrôle de version et la collaboration en équipe. Par défaut, GitSync fonctionne sur la branche `main`, mais dans les configurations multi-environnements (comme staging, production ou développement de fonctionnalités), les équipes ont souvent besoin de se synchroniser avec des branches personnalisées. ToolJet prend en charge cela en vous permettant de configurer une branche Git personnalisée pour la synchronisation.

ToolJet prend en charge la définition de la branche Git directement via l'interface utilisateur lors de la configuration de GitSync pour un espace de travail.

- Vous trouverez un champ optionnel Target Branch lors de la configuration de GitSync.
- Saisissez simplement le nom de la branche souhaitée (par exemple, develop, release/v1, etc.).
- Si ce champ est laissé vide :
    - Pour les nouveaux utilisateurs, la branche par défaut sera **main**.
    - Pour les utilisateurs existants, la valeur par défaut sera master, afin de maintenir la rétrocompatibilité.

C'est désormais la méthode privilégiée pour définir la branche cible.

 <img className="screenshot-full img-l" src="/img/development-lifecycle/gitsync/config/custom-branch.png" alt="GitSync" />

:::note
Les utilisateurs existants de GitSync qui souhaitent utiliser une branche Git personnalisée doivent d'abord créer une nouvelle branche personnalisée à partir de la branche main dans le gestionnaire de dépôt Git.
:::
