---
id: py
title: Python
---

<br/>

Les workflows ToolJet vous permettent d'installer des **packages Python** depuis [PyPI](https://pypi.org/) afin que chaque nœud Python du workflow puisse les utiliser. Les packages sont installés une seule fois par version de workflow et disponibles dans tous les nœuds Python.

:::info
La prise en charge des bibliothèques externes pour les workflows est disponible sur les plans **Enterprise Edition**.
:::

## Ajouter des packages

1. Ouvrez votre workflow dans l'éditeur.
2. Cliquez sur l'icône **Packages** dans la barre latérale gauche pour ouvrir le panneau du gestionnaire de packages, puis passez à l'onglet **Python**.
3. Saisissez les packages nécessaires au format `requirements.txt` — un package par ligne avec un identifiant de version.

```
pydash==8.0.3
requests==2.31.0
numpy>=1.24.0
```

4. Cliquez sur **Install**. ToolJet installe les packages et génère un bundle en arrière-plan.

:::warning
PyPI ne propose pas d'API de recherche publique. Vous devez connaître le nom exact et la version exacte du package que vous souhaitez installer. Vous pouvez rechercher des packages sur [pypi.org](https://pypi.org/).
:::
<!-- 
## Bundle Status

After installing or updating packages, ToolJet generates a bundle in the background. The package manager panel displays the current status:

| Status | Meaning |
|--------|---------|
| **None** | No packages have been added yet. |
| **Building** | The bundle is being generated. Python nodes will use the previous bundle (if any) until the new one is ready. |
| **Ready** | The bundle is built and available for all Python nodes in this workflow version. |
| **Failed** | Bundle generation encountered an error. Check the error message in the panel and try rebuilding. |

You can manually trigger a rebuild by clicking the **Rebuild** button in the package manager panel. -->

## Utiliser des packages dans les nœuds Python

Une fois que le statut du bundle est **Ready**, vous pouvez `import` directement les packages dans n'importe quel nœud Python :

```python
import pydash

orders = getOrders["data"]
grouped = pydash.group_by(orders, "status")

result = {
    "pending": grouped.get("pending", []),
    "shipped": grouped.get("shipped", [])
}
```

Les packages sont disponibles pour tous les nœuds Python du workflow — vous n'avez pas besoin de les installer séparément pour chaque nœud.

## Mettre à jour ou supprimer des packages

1. Ouvrez le panneau du gestionnaire de packages et passez à l'onglet **Python**.
2. Modifiez la liste des requirements — mettez à jour les versions ou supprimez des lignes selon vos besoins.
3. Cliquez sur **Install**. Le bundle est régénéré automatiquement avec la liste de dépendances mise à jour.
<!-- 
## Sandbox and Security

Python nodes execute inside a secure sandbox powered by [NsJail](https://github.com/google/nsjail). The sandbox enforces the following restrictions at runtime:

| Restriction | Limit |
|-------------|-------|
| Execution timeout | 10 seconds |
| CPU time | 5 seconds |
| Memory (address space) | 512 MB |
| Network access | None — fully isolated |
| File creation size | 1 MB |
| Sub-processes | 5 |

The sandbox prevents user code from accessing environment variables, the host filesystem, or the network. Use datasource nodes to fetch external data before passing it to a Python node. -->

### Déploiements auto-hébergés

NsJail nécessite la prise en charge des **conteneurs privilégiés** (plus précisément la capacité Linux `SYS_ADMIN`) pour créer les espaces de noms (namespaces) qu'il utilise pour l'isolation. La plupart des déploiements Docker et Kubernetes standards prennent en charge cela nativement.

Cependant, certaines plateformes cloud managées n'autorisent pas les conteneurs privilégiés :

- **AWS ECS Fargate** — ne prend pas en charge le mode privilégié
- **Google Cloud Run** — ne prend pas en charge les conteneurs privilégiés
- **Plateformes avec des politiques de sécurité de pod restrictives** — peuvent bloquer les capacités requises

Si votre environnement de déploiement ne prend pas en charge NsJail, vous avez deux options :

**Option A : Contourner le sandbox**

Définissez la variable d'environnement suivante sur votre serveur ToolJet :

```
TOOLJET_WORKFLOW_SANDBOX_BYPASS=true
```

Cela désactive NsJail et exécute le code Python directement sur l'hôte. N'utilisez cette option que si vous faites confiance à tous les utilisateurs pouvant créer des workflows, car leur code s'exécutera sans isolation.

:::danger
Exécuter du code sans le sandbox supprime toutes les restrictions d'exécution. Le code utilisateur peut alors accéder aux variables d'environnement, au système de fichiers et au réseau. N'activez cette option que dans des environnements où tous les auteurs de workflows sont dignes de confiance.
:::

**Option B : Déployer un worker avec accès privilégié**

Déployez ToolJet en **mode worker** sur une plateforme qui prend en charge les conteneurs privilégiés (par exemple, un hôte Docker standard ou un cluster Kubernetes avec des contextes de sécurité appropriés), et redirigez l'exécution des workflows Python vers ce worker. Cela vous permet de conserver le déploiement principal de ToolJet sur une plateforme managée tout en bénéficiant d'une exécution en sandbox.
<!-- 
## Limitations

- **Enterprise only** — package management is not available in the Community Edition.
- **PyPI packages only** — packages must be published to the [Python Package Index](https://pypi.org/).
- **Bundle per workflow version** — each workflow version maintains its own independent set of dependencies.
- **Prebuilt wheels only** — packages that require C/C++ compilation during installation may not be supported. Pure Python packages and packages with prebuilt manylinux/musllinux wheels work.
- **No network at runtime** — installed packages that make network calls at import time or runtime will fail inside the sandbox. -->

<br/>
---

## Besoin d'aide ?

- Contactez-nous via notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Ou envoyez-nous un e-mail à [support@tooljet.com](mailto:support@tooljet.com)
- Vous avez trouvé un bug ? Merci de le signaler via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
