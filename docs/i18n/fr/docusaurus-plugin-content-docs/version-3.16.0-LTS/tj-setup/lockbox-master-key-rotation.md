---
id: lockbox-master-key-rotation
title: Lockbox Master Key Rotation
---

<PlanBadge type="self-hosted" />

Ce guide explique comment effectuer en toute sécurité la rotation de la `LOCKBOX_MASTER_KEY` dans votre déploiement ToolJet auto-hébergé.

## Qu'est-ce que la Lockbox Master Key ?

La `LOCKBOX_MASTER_KEY` est une clé de chiffrement principale que ToolJet utilise pour chiffrer les données sensibles stockées dans votre base de données PostgreSQL. Elle utilise le chiffrement **AES-256-GCM** avec dérivation de clé **HKDF-SHA384**. La rotation périodique des clés est une pratique de sécurité importante pour maintenir la protection des données et répondre aux exigences de conformité.

## Prérequis

Avant de commencer le processus de rotation des clés, assurez-vous d'avoir :

- **Un utilisateur de base de données avec accès en lecture/écriture** - Le `PG_USER` doit disposer des permissions de lecture et d'écriture pour effectuer les transactions de base de données
- **Une interruption de service planifiée** - ToolJet doit être arrêté pour tout trafic entrant pendant la rotation
- **Une sauvegarde de la base de données** - Sauvegarde PostgreSQL complète (le script demandera une confirmation)
- **L'ancienne clé disponible** - La valeur actuelle de `LOCKBOX_MASTER_KEY` (il vous sera demandé de la saisir)
- **Une nouvelle clé générée** - Une nouvelle clé hexadécimale (voir les instructions de génération ci-dessous)
- **Un environnement de staging testé** - Testez d'abord la rotation avec l'indicateur `--dry-run`

:::tip Important
Testez toujours le processus de rotation dans un environnement de staging avant de l'exécuter en production.
:::

## Générer une nouvelle clé

Générez une clé de 256 bits cryptographiquement sécurisée à l'aide d'OpenSSL :

```bash
# Generate a new key
openssl rand -hex 32

# Example output:
cc41792c28a7ecd2e2c84089d25eb40e2f2e28660ca4a20a9d8d3a7df26b5776
```

:::info
Stockez cette nouvelle clé de manière sécurisée. Vous mettrez à jour votre configuration d'environnement avec celle-ci.
:::

## Procédure de rotation

:::info Support des déploiements
La rotation des clés est disponible pour tous les types de déploiement :
- **Docker Compose**, **Kubernetes**, **AWS EC2/serveur traditionnel** - Exécutez le script de rotation directement dans votre environnement
- **AWS ECS**, **Azure Container Instances**, **Google Cloud Run** - Exécutez la rotation via Docker depuis votre machine locale
:::

### Étapes de préparation

1. **Informer les utilisateurs** - Informez les utilisateurs de la fenêtre de maintenance à venir
2. **Arrêter le trafic entrant** - Assurez-vous qu'aucune écriture ne se produit pendant la rotation
3. **Sauvegarder la base de données** - Créez une sauvegarde PostgreSQL complète
4. **Mettre à jour la variable d'environnement** - Définissez `LOCKBOX_MASTER_KEY` avec la valeur de votre nouvelle clé
5. **Conserver l'ancienne clé accessible** - Il vous sera demandé de la saisir pendant la rotation

<details id="tj-dropdown">
    <summary>Déploiement Docker Compose</summary>

```bash
# Step 1: Stop the application
docker-compose down

# Step 2: Backup database (use your backup method)

# Step 3: Update .env file with NEW key
nano .env
# Update: LOCKBOX_MASTER_KEY=<new-key>

# Step 4: Run rotation in dry-run mode (test first)
docker-compose run --rm server npm run rotate:keys:prod -- --dry-run

# When prompted, enter your OLD key (current production key):
# Please enter the old key: <old-key-here>

# Step 5: If dry-run succeeds, run actual rotation
docker-compose run --rm server npm run rotate:keys:prod

# Step 6: Restart application
docker-compose up -d

# Step 7: Verify logs for errors
docker-compose logs -f server
```

</details>

<details id="tj-dropdown">
    <summary>Déploiement Kubernetes</summary>

```bash
# Step 1: Scale down deployment
kubectl scale deployment tooljet --replicas=0 -n tooljet

# Step 2: Backup database (use your backup method)

# Step 3: Update secret with new key
kubectl edit secret tooljet-secrets -n tooljet
# Update LOCKBOX_MASTER_KEY with new key (base64 encoded: echo -n '<new-key>' | base64)

# Step 4: Scale up single pod for rotation
kubectl scale deployment tooljet --replicas=1 -n tooljet

# Step 5: Run rotation (dry-run first)
kubectl exec -it deployment/tooljet -n tooljet -- npm run rotate:keys:prod -- --dry-run

# When prompted, enter OLD key

# Step 6: Run actual rotation
kubectl exec -it deployment/tooljet -n tooljet -- npm run rotate:keys:prod

# Step 7: Scale deployment back up
kubectl scale deployment tooljet --replicas=3 -n tooljet

# Step 8: Verify logs
kubectl logs -f deployment/tooljet -n tooljet
```

</details>

<details id="tj-dropdown">
    <summary>Déploiement AWS EC2 / serveur traditionnel</summary>

```bash
# Step 1: Stop ToolJet service
sudo systemctl stop nest

# Step 2: Backup database (use your backup method)

# Step 3: Update .env file with NEW key
cd ~/app
nano .env
# Update: LOCKBOX_MASTER_KEY=<new-key>

# Step 4: Run rotation (dry-run first)
npm run rotate:keys:prod -- --dry-run

# When prompted, enter OLD key

# Step 5: Run actual rotation
npm run rotate:keys:prod

# Step 6: Restart service
sudo systemctl start nest

# Step 7: Check service status and logs
sudo systemctl status nest
journalctl -u nest -f
```

</details>

<details id="tj-dropdown">
    <summary>Déploiements serverless (AWS ECS, Azure Container Instances, GCP Cloud Run)</summary>

Pour les déploiements serverless, exécutez le script de rotation depuis votre machine locale à l'aide de Docker. Cette approche fonctionne en se connectant directement à votre base de données cloud.

#### Prérequis

- Docker installé sur votre machine locale
- Détails de connexion à la base de données (hôte, port, identifiants)
- Accès réseau à votre base de données depuis votre machine
- Nouvelle LOCKBOX_MASTER_KEY générée

#### Étapes générales

**Étape 1 : Arrêter le trafic entrant**
- Réduisez votre service à 0 réplique ou activez le mode maintenance

**Étape 2 : Sauvegarder votre base de données**
- Utilisez les outils de sauvegarde de votre fournisseur cloud

**Étape 3 : Créer un fichier `.env` avec les identifiants de votre base de données et la nouvelle clé**

```bash
cat > rotation.env << EOF
PG_HOST=your-database-host.com
PG_PORT=5432
PG_DB=tooljet
PG_USER=tooljet_user
PG_PASS=your-password
LOCKBOX_MASTER_KEY= # New generated key using the command openssl rand -hex 32
EOF
```

**Étape 4 : Exécuter la rotation avec Docker (dry-run d'abord)**

```bash
docker run -it --rm \
  --env-file rotation.env \
  tooljet/tooljet:ee-lts-latest \
  npm run rotate:keys:prod -- --dry-run
```

Lorsque vous y êtes invité, saisissez votre ANCIENNE clé (clé de production actuelle).

**Étape 5 : Exécuter la rotation réelle** (supprimez `--dry-run`) :

```bash
docker run -it --rm \
  --env-file rotation.env \
  tooljet/tooljet:ee-lts-latest \
  npm run rotate:keys:prod
```

**Étape 6 : Mettre à jour votre déploiement** avec la nouvelle LOCKBOX_MASTER_KEY et redémarrer le service.

#### AWS ECS + RDS

**Accès à la base de données :**
- Autorisez temporairement votre IP dans le groupe de sécurité RDS
- Utilisez le endpoint RDS comme `PG_HOST`
- SSL est activé par défaut pour RDS

**Exemple de fichier `.env` :**
```bash
PG_HOST=tooljet-db.abc123.us-east-1.rds.amazonaws.com
PG_PORT=5432
PG_DB=tooljet
PG_USER=tooljet_user
PG_PASS=your-password
LOCKBOX_MASTER_KEY= # New generated key using the command openssl rand -hex 32
```

Puis exécutez : `docker run -it --rm --env-file rotation.env tooljet/tooljet:ee-lts-latest npm run rotate:keys:prod`

**Après la rotation :**
1. Mettez à jour la définition de tâche ECS avec le nouveau secret `LOCKBOX_MASTER_KEY`
2. Déployez la nouvelle définition de tâche
3. Remettez le service à l'échelle
4. Retirez votre IP du groupe de sécurité

#### Azure Container Instances + Azure Database for PostgreSQL

**Accès à la base de données :**
- Ajoutez temporairement votre IP aux règles de pare-feu d'Azure Database
- Utilisez le nom d'hôte Azure Database comme `PG_HOST`
- SSL est requis pour Azure Database

**Exemple de fichier `.env` :**
```bash
PG_HOST=tooljet-db.postgres.database.azure.com
PG_PORT=5432
PG_DB=tooljet
PG_USER=tooljet_user@tooljet-db
PG_PASS=your-password
LOCKBOX_MASTER_KEY= # New generated key using the command openssl rand -hex 32
```

Puis exécutez : `docker run -it --rm --env-file rotation.env tooljet/tooljet:ee-lts-latest npm run rotate:keys:prod`

**Après la rotation :**
1. Mettez à jour les variables d'environnement de l'instance de conteneur avec la nouvelle `LOCKBOX_MASTER_KEY`
2. Redémarrez l'instance de conteneur
3. Retirez votre IP des règles de pare-feu

#### GCP Cloud Run + Cloud SQL

**Option 1 : Utiliser Cloud SQL Proxy** (recommandé)

Démarrez le proxy Cloud SQL localement :
```bash
cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432
```

Créez un fichier `.env` pour localhost :
```bash
PG_HOST=localhost
PG_PORT=5432
PG_DB=tooljet
PG_USER=tooljet_user
PG_PASS=your-password
LOCKBOX_MASTER_KEY= # New generated key using the command openssl rand -hex 32
```

Exécutez la rotation :
```bash
docker run -it --rm \
  --network="host" \
  --env-file rotation.env \
  tooljet/tooljet:ee-lts-latest \
  npm run rotate:keys:prod
```

**Option 2 : Utiliser une IP publique**

- Activez l'IP publique pour l'instance Cloud SQL
- Ajoutez votre IP aux réseaux autorisés
- Créez un fichier `.env` avec l'IP publique de Cloud SQL comme `PG_HOST`

**Après la rotation :**
1. Mettez à jour les variables d'environnement du service Cloud Run avec la nouvelle `LOCKBOX_MASTER_KEY`
2. Déployez la nouvelle révision
3. Retirez l'accès réseau temporaire

</details>

## Comprendre le processus de rotation

Le script de rotation effectue automatiquement les étapes suivantes :

1. **Valide la nouvelle clé** - Vérifie que `LOCKBOX_MASTER_KEY` dans .env est correctement formatée
2. **Demande l'ancienne clé** - Invite interactive sécurisée pour votre clé de production actuelle
3. **Teste les deux clés** - Vérifie que les deux clés peuvent chiffrer et déchiffrer des données de test
4. **Confirmation de la sauvegarde** - Demande une confirmation manuelle que la sauvegarde de la base de données existe
5. **Connexion à la base de données** - Établit une connexion à la base de données PostgreSQL
6. **Vérification** - Déchiffre des données d'échantillon avec la nouvelle clé pour confirmer le succès

:::note Sécurité des transactions
Toutes les tables sont soumises à la rotation dans une **transaction de base de données atomique unique**. Si une erreur se produit pendant la rotation, toutes les modifications sont automatiquement annulées et votre base de données reste inchangée. Cela garantit l'intégrité des données et empêche les états de chiffrement partiels.
:::

## Vérification après la rotation

### Vérifier les journaux de l'application

Après avoir redémarré l'application, surveillez les journaux pour détecter toute erreur de déchiffrement

```bash
# Docker Compose
docker-compose logs -f server

# Systemd service
journalctl -u nest -f

# Kubernetes
kubectl logs -f deployment/tooljet -n tooljet
```

:::warning
Si vous constatez des erreurs de déchiffrement dans les journaux, **arrêtez immédiatement l'application** et suivez la procédure de retour en arrière.
:::

### Indicateurs de succès

La rotation a réussi si :
- L'application démarre sans erreurs
- Aucune erreur de déchiffrement dans les journaux
- Toutes les sources de données se connectent avec succès
- L'authentification SSO fonctionne (si configurée)
- Les constantes d'organisation sont accessibles
- Les requêtes de la ToolJet Database s'exécutent (si utilisées)
- Les profils utilisateurs s'affichent correctement

## Procédure de retour en arrière

:::warning Critique
N'effectuez un retour en arrière que si des erreurs critiques surviennent après la rotation. Cela nécessite de restaurer la sauvegarde de la base de données.
:::

### Quand effectuer un retour en arrière

Effectuez un retour en arrière d'urgence si :
- L'application ne démarre pas après la rotation
- Des erreurs de déchiffrement persistantes apparaissent dans les journaux
- Les connexions aux sources de données échouent
- L'authentification SSO est cassée
- Les utilisateurs ne peuvent pas accéder aux données ou aux fonctionnalités

:::note Important
Stockez l'ancienne clé de chiffrement en toute sécurité pendant **24 à 48 heures** après la rotation, au cas où un retour en arrière d'urgence serait nécessaire. Après cette période, si la rotation a réussi, l'ancienne clé peut être supprimée définitivement.
:::

## Meilleures pratiques de sécurité

- **Ne jamais committer les clés dans le contrôle de version** - Utilisez toujours des fichiers .env ou des systèmes de gestion des secrets
- **Stocker l'ancienne clé en toute sécurité** - Conservez-la dans un gestionnaire de mots de passe chiffré pour un retour en arrière d'urgence
- **Tester d'abord en staging** - Utilisez toujours l'indicateur `--dry-run` avant la rotation en production

:::tip Gestion des secrets
Pour les déploiements d'entreprise, intégrez ToolJet avec un système de gestion des secrets :
- **AWS** : Utilisez AWS Secrets Manager avec rotation automatique
- **Azure** : Utilisez Azure Key Vault avec identités managées
- **GCP** : Utilisez Google Secret Manager avec Workload Identity
- **HashiCorp** : Utilisez Vault avec des secrets dynamiques
- **Kubernetes** : Utilisez External Secrets Operator avec votre fournisseur cloud
:::

## Questions fréquemment posées

<details id="tj-dropdown">
    <summary>Combien de temps prend la rotation des clés ?</summary>

Le temps de rotation dépend de la taille de votre base de données :

- **Petites bases de données** (&lt;1 000 lignes chiffrées) : 1 à 2 minutes
- **Bases de données moyennes** (1 000 à 10 000 lignes) : 2 à 5 minutes
- **Grandes bases de données** (&gt;10 000 lignes) : 5 à 15 minutes

Le mode **--dry-run** prend approximativement le même temps que la rotation réelle, car il traite toutes les données (mais effectue un retour en arrière au lieu de valider).

**Astuce** : Exécutez d'abord **--dry-run** pour obtenir une estimation précise du temps pour votre déploiement.

</details>

<details id="tj-dropdown">
    <summary>Puis-je effectuer une rotation des clés sans interruption de service ?</summary>

Non. L'application **doit être arrêtée pour tout trafic entrant** pendant la rotation des clés afin d'éviter :

- Les opérations d'écriture utilisant l'ancienne clé pendant la rotation
- Les incohérences de données entre les anciennes et les nouvelles données chiffrées
- Les états de chiffrement partiels
- Les conditions de concurrence entre la rotation et les écritures de l'application

Vous devez planifier une **fenêtre de maintenance**. L'interruption de service est généralement de :
- Temps de rotation + temps de redémarrage de l'application
- Généralement 5 à 10 minutes pour les déploiements de petite à moyenne taille
- Peut être plus longue pour les grandes bases de données

</details>

<details id="tj-dropdown">
    <summary>Que se passe-t-il si la rotation échoue à mi-parcours ?</summary>

Le script de rotation utilise une **transaction de base de données** pour la sécurité. Si une erreur se produit :

Toutes les modifications sont **automatiquement annulées**. La base de données reste dans son **état d'origine** avec l'ancien chiffrement. **Aucune donnée n'est perdue ou corrompue**. Vous pouvez **réessayer** après avoir corrigé le problème (mauvaise clé, connexion à la base de données, etc.)

</details>

<details id="tj-dropdown">
    <summary>Comment vérifier que la rotation a réussi ?</summary>

Vérifiez le succès de la rotation avec ces contrôles :

1. Le script affiche le message **ROTATION COMPLETED SUCCESSFULLY**
2. L'application démarre sans erreurs
3. Aucune erreur de déchiffrement dans les journaux pendant 24 heures
4. Les sources de données de test se connectent avec succès
5. La connexion SSO fonctionne (si configurée)
6. Les constantes d'organisation sont accessibles
7. Les requêtes de la ToolJet Database fonctionnent (si utilisées)
8. Les profils utilisateurs s'affichent correctement

Si tous les contrôles réussissent, la sauvegarde de la base de données peut être supprimée après 24 à 48 heures.

</details>

<details id="tj-dropdown">
    <summary>Puis-je automatiser la rotation des clés ?</summary>

Bien que le script de rotation puisse être exécuté de manière non interactive, cela n'est **pas recommandé** pour la plupart des organisations en raison de :

**Défis :**
- Le script nécessite une saisie interactive de l'ancienne clé (fonctionnalité de sécurité pour éviter l'exposition de la clé)
- Une confirmation de sauvegarde est requise
- Une coordination de l'interruption de service de l'application est nécessaire
- Risque d'échec automatisé sans supervision humaine

**Pour l'automatisation (utilisateurs avancés uniquement) :**
- Modifiez le script pour accepter l'ancienne clé via une variable d'environnement sécurisée
- Implémentez une vérification automatique des sauvegardes
- Assurez une surveillance et des alertes en cas d'échec

**Recommandation** : Une rotation manuelle avec des tests et une supervision appropriés est plus sûre pour la plupart des organisations. Les avantages en matière de sécurité d'une rotation manuelle rigoureuse l'emportent sur la commodité de l'automatisation.

</details>

<details id="tj-dropdown">
    <summary>La rotation affecte-t-elle les utilisateurs de ToolJet Cloud ?</summary>

**Non.** La rotation des clés concerne **uniquement les déploiements auto-hébergés**.

Les utilisateurs auto-hébergés doivent effectuer une rotation manuelle des clés comme documenté dans ce guide.

</details>

<details id="tj-dropdown">
    <summary>Que faire si je perds l'ancienne clé pendant la rotation ?</summary>

Si vous perdez l'ancienne clé de chiffrement :

**Impossible de déchiffrer les données existantes** - Les données chiffrées avec l'ancienne clé sont irrécupérables sans celle-ci
**Impossible d'effectuer la rotation** - La rotation nécessite à la fois l'ancienne et la nouvelle clé

**Prévention :**
- Stockez la LOCKBOX_MASTER_KEY dans un gestionnaire de mots de passe chiffré (1Password, LastPass, Bitwarden)
- Maintenez une sauvegarde sécurisée du fichier .env dans un stockage chiffré
- Utilisez un système de gestion des secrets (AWS Secrets Manager, Vault) avec sauvegarde/récupération
- Documentez l'emplacement de la clé dans un runbook pour la reprise après sinistre

**Si la clé est perdue :**
- Vérifiez le gestionnaire de mots de passe chiffré
- Vérifiez les sauvegardes sécurisées du fichier .env
- Vérifiez le système de gestion des secrets
- Vérifiez avec les membres de l'équipe ayant accès
- Si elle est réellement perdue et qu'aucune sauvegarde n'existe, une restauration de la base de données à partir d'une sauvegarde peut être nécessaire

</details>

--------

## Support

Si vous rencontrez des problèmes pendant la migration :

- **Communauté** : Rejoignez notre [communauté Slack](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- **Email** : hello@tooljet.com
- **GitHub Issues** : [Signaler des bugs](https://github.com/ToolJet/ToolJet/issues)
