---
id: windows
title: Windows
---

Pour exécuter ToolJet, veuillez l'installer dans un environnement Ubuntu à l'aide du **[Sous-système Windows pour Linux 2](https://learn.microsoft.com/en-us/windows/wsl/install-manual#step-2---check-requirements-for-running-wsl-2)**. Vous pouvez obtenir l'environnement Ubuntu depuis le **Microsoft Store** en visitant ce [lien](https://apps.microsoft.com/store/detail/ubuntu-22042-lts/9PN20MSR04DW).

Après avoir installé avec succès l'environnement Ubuntu, vous aurez accès à une fenêtre de terminal similaire à celle illustrée ci-dessous :

<div style={{textAlign: 'center'}}>
  <img className="screenshot-full" src="/img/contributing-guide/windows/wsl2.png" alt="Windows setup" />
</div>

:::warning
Si vous configurez ToolJet sur une machine Windows, assurez-vous que les fins de ligne dans le fichier **.env** sont réglées sur LF. Par défaut, elles peuvent être réglées sur CRLF, ce qui n'est pas compatible sauf si configuré spécifiquement pour les machines Windows.
:::

Une fois l'environnement configuré, vous pouvez suivre les étapes décrites dans la documentation Ubuntu à **[Guide de contribution - Installation Ubuntu](/docs/contributing-guide/setup/ubuntu)**.