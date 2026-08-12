---
id: s3-custom-endpoints
title: Use Custom Endpoint for S3 Hosts
---

Dans ce guide, nous allons voir comment se connecter à différents **stockages d'objets compatibles S3** en utilisant un point de terminaison personnalisé. Ici, nous utilisons Minio, car il s'agit d'un stockage d'objets compatible S3.

## Connexion

- Allez sur le tableau de bord ToolJet et créez une nouvelle application.
- Dans la barre latérale gauche, allez dans **Data Sources** et ajoutez une nouvelle source de données AWS S3.
- Saisissez les identifiants pour configurer la source de données.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/how-to/s3-custom/connection.png" alt="Custom Endpoint - S3 hosts" />

- Pour obtenir les **Credentials**, à savoir la **Access Key** et la **Secret Key**, vous devez vous rendre dans la console Minio afin de générer les clés.
- Activez le bouton bascule **Custom Endpoint**, puis saisissez l'URL de l'hôte personnalisé, c'est-à-dire l'endroit où l'API de votre serveur Minio est exposée.
- Une fois les informations saisies, vous pouvez cliquer sur le bouton **Test Connection** pour vérifier la connexion.

## Quand utiliser des points de terminaison personnalisés

Des points de terminaison S3 personnalisés sont nécessaires lorsque vous connectez ToolJet à des services de stockage compatibles avec l'API S3 mais qui n'utilisent pas le format d'endpoint AWS S3 par défaut.

Vous devez configurer un point de terminaison personnalisé dans les scénarios suivants :

- Utilisation de fournisseurs de stockage compatibles S3 tels que **MinIO**, **DigitalOcean Spaces**, **Wasabi** ou **Ceph**
- Connexion à un déploiement S3 sur site ou privé
- Utilisation d'un point de terminaison VPC ou d'un routage réseau privé
- Utilisation d'URL de point de terminaison AWS S3 non standard

Si vous utilisez le service Amazon S3 standard (par exemple, `https://s3.amazonaws.com` ou des endpoints AWS basés sur une région), un point de terminaison personnalisé n'est pas nécessaire.

## Accès de style chemin (Path-Style) vs style hôte virtuel (Virtual-Host-Style)

S3 prend en charge deux modèles d'accès par URL pour adresser les objets dans ToolJet. Le style correct dépend de votre fournisseur de stockage.

### Style hôte virtuel (par défaut pour AWS S3)
Dans le style hôte virtuel, le nom du bucket fait partie du domaine. C'est le modèle d'accès par défaut utilisé par AWS S3.

```yaml
https://bucket-name.s3.amazonaws.com/object-key
```

### Accès de style chemin (Path-Style)
Dans l'accès de style chemin, le nom du bucket apparaît dans le chemin de l'URL. De nombreux fournisseurs compatibles S3 exigent un accès de style chemin.

```yaml
https://s3.amazonaws.com/bucket-name/object-key
```

L'accès de style chemin est généralement requis pour :
- MinIO
- Les déploiements S3-compatibles locaux
- Certains systèmes de stockage cloud privés

## Exemple de configuration (MinIO)

Voici un exemple de configuration pour connecter ToolJet à un serveur MinIO hébergé localement :

| Champ | Valeur |
|-------|-------|
| Endpoint | `http://localhost:9000` |
| Access Key | `minioadmin` |
| Secret Key | `minio-admin` |
| Region | `us-east-1` |
