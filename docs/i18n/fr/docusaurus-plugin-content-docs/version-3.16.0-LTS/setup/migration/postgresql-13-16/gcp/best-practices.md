---
id: best-practices
title: Bonnes pratiques et ressources supplémentaires
slug: /setup/postgresql-13-16/gcp/best-practices/
---

## Liste de contrôle post-mise à niveau

- [ ] Mise à niveau de la base de données vers PostgreSQL 16 effectuée avec succès
- [ ] Certificat SSL correctement configuré et accessible
- [ ] Connexions SSL vérifiées
- [ ] L'application démarre sans erreurs SSL
- [ ] Les opérations de base de données fonctionnent correctement
- [ ] Connexion SSL vérifiée dans les journaux
- [ ] Tests de performance effectués
- [ ] Vérification des sauvegardes effectuée
- [ ] Surveillance et alertes mises à jour
- [ ] Documentation mise à jour avec la nouvelle configuration
- [ ] Équipe formée à la nouvelle configuration

## Bonnes pratiques de sécurité

1. **Ne désactivez jamais la vérification SSL** : évitez `NODE_TLS_REJECT_UNAUTHORIZED=0`
2. **Utilisez Cloud SQL Proxy dès que possible** : il gère automatiquement le chiffrement et l'authentification
3. **Stockage sécurisé des certificats** : utilisez Google Secret Manager pour les certificats
4. **Activez les journaux d'audit Cloud SQL** : surveillez les accès et les modifications de la base de données
5. **Utilisez l'authentification IAM à la base de données** : lorsque cela est possible, utilisez IAM au lieu de mots de passe
6. **Audits de sécurité réguliers** : surveillez les journaux de connexion pour détecter les problèmes SSL
7. **Sécurité réseau** : utilisez une adresse IP privée pour Cloud SQL dès que possible
8. **Chiffrement des sauvegardes** : assurez-vous que les sauvegardes sont chiffrées

## Optimisation des performances

### Paramètres de performance Cloud SQL

```bash
# Optimize Cloud SQL instance for PostgreSQL 16
gcloud sql instances patch your-instance-id \
  --database-flags=shared_preload_libraries=pg_stat_statements \
  --database-flags=log_statement=all \
  --database-flags=log_min_duration_statement=1000
```

### Surveillance et alertes

```bash
# Set up monitoring for Cloud SQL
gcloud alpha monitoring policies create --policy-from-file=cloudsql-policy.yaml
```

Exemple de politique de surveillance (`cloudsql-policy.yaml`) :
```yaml
displayName: "Cloud SQL PostgreSQL Monitoring"
conditions:
- displayName: "High CPU Utilization"
  conditionThreshold:
    filter: 'resource.type="cloudsql_database" AND metric.type="cloudsql.googleapis.com/database/cpu/utilization"'
    comparison: COMPARISON_GT
    thresholdValue: 0.8
    duration: 300s
```

## Ressources supplémentaires

- [Documentation Google Cloud SQL PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Documentation Cloud SQL SSL/TLS](https://cloud.google.com/sql/docs/postgres/configure-ssl-instance)
- [Documentation Google Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Documentation des variables d'environnement ToolJet](https://docs.tooljet.com/docs/setup/env-vars/)
- [Documentation GKE Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [Documentation de sécurité Cloud Run](https://cloud.google.com/run/docs/securing/service-identity)

:::note
**Remarque importante** : la configuration du certificat SSL est essentielle pour sécuriser les connexions à Cloud SQL PostgreSQL 16. Envisagez d'utiliser Cloud SQL Proxy pour des connexions à la base de données simplifiées et sécurisées, sans gestion manuelle des certificats SSL.
:::