---
id: best-practices
title: Bonnes pratiques et ressources supplémentaires
slug: /setup/postgresql-13-16/azure/best-practices/
---

## Liste de contrôle post-mise à niveau

- [ ] Mise à niveau de la base de données vers PostgreSQL 16 effectuée avec succès
- [ ] Variable d'environnement `PGSSLMODE=require` configurée
- [ ] Connexions SSL vérifiées et fonctionnelles
- [ ] L'application démarre sans erreurs SSL
- [ ] Les opérations de base de données fonctionnent correctement
- [ ] Connexion SSL vérifiée dans les journaux
- [ ] Tests de performance effectués
- [ ] Vérification des sauvegardes effectuée
- [ ] Surveillance et alertes mises à jour
- [ ] Documentation mise à jour avec la nouvelle configuration
- [ ] Équipe formée à la nouvelle configuration

## Bonnes pratiques de sécurité

1. **Exigez toujours des connexions SSL** : définissez `PGSSLMODE=require` pour toutes les connexions Azure PostgreSQL
2. **Utilisez Azure Key Vault** : stockez les mots de passe de base de données et la configuration sensible dans Azure Key Vault
3. **Activez les journaux d'audit Azure PostgreSQL** : surveillez les accès et les modifications de la base de données
4. **Sécurité réseau** : utilisez des points de terminaison privés dès que possible pour Azure PostgreSQL
5. **Audits de sécurité réguliers** : surveillez les journaux de connexion pour détecter les problèmes SSL
6. **Chiffrement des sauvegardes** : assurez-vous que les sauvegardes sont chiffrées (activé par défaut dans Azure)
7. **Utilisez l'authentification Azure AD** : lorsque cela est possible, utilisez Azure AD au lieu de mots de passe
8. **Mettez en place un RBAC approprié** : utilisez le RBAC Azure pour les autorisations de gestion des ressources

## Ressources supplémentaires

- [Documentation Azure Database for PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Mise à niveau de version majeure d'Azure PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-perform-major-version-upgrade)
- [Configuration SSL Azure PostgreSQL](https://docs.microsoft.com/en-us/azure/postgresql/concepts-ssl-connection-security)
- [Documentation des variables d'environnement ToolJet](https://docs.tooljet.com/docs/setup/env-vars/)
- [Documentation Azure Kubernetes Service](https://docs.microsoft.com/en-us/azure/aks/)
- [Documentation Azure Container Instances](https://docs.microsoft.com/en-us/azure/container-instances/)
- [Configuration ToolJet Kubernetes AKS](https://docs.tooljet.com/docs/setup/kubernetes-aks)
- [Configuration ToolJet Azure Container](https://docs.tooljet.com/docs/setup/azure-container)

:::note
**Remarque importante** : la variable d'environnement `PGSSLMODE=require` est obligatoire pour se connecter à Azure Database for PostgreSQL Flexible Server. Cela garantit l'établissement de connexions chiffrées SSL/TLS sécurisées et constitue une exigence pour toutes les bases de données Azure PostgreSQL.
:::
