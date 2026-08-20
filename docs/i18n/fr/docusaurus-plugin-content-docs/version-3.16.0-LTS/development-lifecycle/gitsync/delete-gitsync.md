---
id: delete-gitsync
title: Supprimer la configuration
---

Dans ToolJet, GitSync peut être activé, désactivé ou supprimé selon vos besoins.

- **Activé (Enabled)** : lorsque GitSync est activé, les utilisateurs peuvent envoyer des modifications (commit) vers le dépôt git.
- **Désactivé (Disabled)** : 
    - **Utilisateurs non-administrateurs** : les utilisateurs ne pourront pas envoyer de modifications (commit) vers le dépôt git. Ils verront une boîte de dialogue indiquant que la fonctionnalité GitSync n'est pas configurée et qu'ils doivent contacter l'administrateur pour la configurer.
    - **Pour les utilisateurs administrateurs** : les utilisateurs verront une boîte de dialogue avec un lien pour configurer la fonctionnalité GitSync.
- **Supprimer la configuration GitSync** : la suppression de la configuration GitSync ne supprimera pas les applications du dépôt git. Les applications resteront disponibles dans le dépôt git dans le même état qu'avant la suppression de la configuration GitSync.

## Activer/Désactiver GitSync

Pour activer ou désactiver la fonctionnalité GitSync, accédez à l'onglet **Configure git sync** sur la page **Workspace settings**, puis activez ou désactivez les **Repository connections** que vous souhaitez utiliser pour l'espace de travail selon vos besoins.
<img className="screenshot-full img-s" src="/img/gitsync/delete/enable-gitsync.png" alt="GitSync" />

## Supprimer la configuration GitSync

Pour supprimer la configuration GitSync, accédez à l'onglet **Configure git sync** sur la page **Workspace settings**, puis cliquez sur le bouton **Delete configuration**. Cela supprimera la clé SSH de la configuration ToolJet et la fonctionnalité GitSync sera désactivée.

<div style={{ display:"flex", justifyContent:"left", gap:"1rem", marginTop:'15px', marginBottom:'15px' }}>
<img className="screenshot-full img-s" src="/img/gitsync/delete/delete-ssh.png" alt="GitSync" />

<img className="screenshot-full img-s" src="/img/gitsync/delete/delete-github.png" alt="GitSync" />
</div>
