---
id: setup-rsyslog
title: Configurer la génération de fichiers journaux (Rsyslog)
---

Le **fichier journal** constitue un enregistrement complet des journaux d'audit, capturant des informations essentielles sur diverses activités au sein de ToolJet. Suivez le guide ci-dessous pour configurer et utiliser efficacement la fonctionnalité de fichier journal.

## Activation et configuration

### Configuration de la variable d'environnement

- Pour **activer** la fonctionnalité de fichier journal, définissez simplement la variable d'environnement `LOG_FILE_PATH` pour spécifier le chemin souhaité pour le fichier journal. Par exemple, si vous souhaitez utiliser `rsyslog` comme chemin de fichier journal, définissez `LOG_FILE_PATH` sur `rsyslog`.

  ```bash
  LOG_FILE_PATH='rsyslog'
  ```

  <img className="screenshot-full" src="/img/how-to/setup-rsyslog/envfile.png" alt="Configurer la génération de fichiers journaux" />

- Le chemin du fichier journal est relatif au répertoire personnel de la machine. Par exemple, si le répertoire personnel est `/home/tooljet`, le chemin du fichier journal sera `/home/tooljet/rsyslog`.

### Redémarrage du serveur
   
- Après avoir configuré la variable d'environnement du fichier journal, il est essentiel de **redémarrer le serveur** pour initier le processus de génération du fichier journal.

- Cette étape garantit que le serveur reconnaît la nouvelle configuration et commence à enregistrer les journaux d'audit.

## Rotation et organisation des journaux

### Rotation quotidienne des journaux

- Le fichier journal est conçu pour être rotaté quotidiennement, créant un nouveau fichier journal chaque jour. Cette configuration facilite la gestion et l'organisation efficaces des données d'audit.

### Structure du chemin du fichier journal

- Le chemin du fichier journal est déterminé par la variable `LOG_FILE_PATH`. Il est crucial de comprendre que ce chemin est relatif au répertoire personnel de la machine. Par exemple, si `LOG_FILE_PATH` est défini sur `rsyslog`, le chemin du fichier journal résultant sera structuré comme suit :  

  ```bash
  homepath/rsyslog/{process_id}-{date}/audit.log
  ```
  
  - `{process_id}` est un espace réservé pour l'identifiant de processus unique.
  - `{date}` représente la date actuelle.
  
  Ce chemin structuré garantit que les journaux d'audit sont organisés à la fois par processus et par date, simplifiant la traçabilité et l'analyse.

  <img className="screenshot-full" src="/img/how-to/setup-rsyslog/timestamp.png" alt="Configurer la génération de fichiers journaux" />

### Exemple de données de journal
   
Les données du journal capturent des détails essentiels, tels que l'ID utilisateur, l'ID organisation, l'ID ressource, le type de ressource, le type d'action, le nom de la ressource, l'adresse IP et des métadonnées supplémentaires.

<details id="tj-dropdown">
<summary>**Exemple de données de fichier journal**</summary>

```bash
{
  level: 'info',
  message: 'PERFORM APP_CREATE OF awdasdawdwd APP',
  timestamp: '2023-11-02 17:12:40',
  auditLog: {
    userId: '0ad48e21-e7a2-4597-9568-c4535aedf687',
    organizationId: 'cf8e132f-a68a-4c81-a0d4-3617b79e7b17',
    resourceId: 'eac02f79-b8e2-495a-bffe-82633416c829',
    resourceType: 'APP',
    actionType: 'APP_CREATE',
    resourceName: 'awdasdawdwd',
    ipAddress: '::1',
    metadata: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      tooljetVersion: '2.22.2-ee2.8.3'
    }
  },
  label: 'APP'
}
```

</details>

### Création de dossier

La fonctionnalité de fichier journal crée automatiquement un dossier dans le répertoire personnel avec le nom spécifié (par ex., `rsyslog`). Ce dossier sert de répertoire racine pour le stockage organisé des journaux d'audit.

<img className="screenshot-full" src="/img/how-to/setup-rsyslog/folder.png" alt="Configurer la génération de fichiers journaux" />