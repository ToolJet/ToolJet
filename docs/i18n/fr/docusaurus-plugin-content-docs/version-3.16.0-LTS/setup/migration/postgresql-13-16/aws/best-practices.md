---
id: best-practices
title: Bonnes pratiques et ressources supplémentaires
slug: /setup/postgresql-13-16/aws/best-practices/
---

## Liste de contrôle post-mise à niveau

- [ ] Mise à niveau de la base de données terminée avec succès
- [ ] Certificat SSL correctement configuré
- [ ] Variable d'environnement `NODE_EXTRA_CA_CERTS` définie
- [ ] L'application démarre sans erreurs SSL
- [ ] Les opérations de base de données fonctionnent correctement
- [ ] Connexion SSL vérifiée dans les journaux
- [ ] Tests de performance terminés
- [ ] Vérification de la sauvegarde terminée

## Bonnes pratiques de sécurité

1. **Ne jamais désactiver la vérification SSL** : Évitez `NODE_TLS_REJECT_UNAUTHORIZED=0`
2. **Utilisez le mode SSL verify-full** : Garantit une validation complète du certificat
3. **Maintenez les certificats à jour** : Surveillez AWS pour les mises à jour des certificats
4. **Stockage sécurisé des certificats** : Utilisez des permissions appropriées (644) et des volumes sécurisés
5. **Audits de sécurité réguliers** : Surveillez les journaux de connexion pour détecter les problèmes SSL

## Ressources supplémentaires

- [Notes de version AWS RDS PostgreSQL 16.9](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/)
- [Documentation AWS RDS SSL/TLS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL.html)
- [Documentation des variables d'environnement ToolJet](https://docs.tooljet.com/docs/setup/env-vars/)
- [Configuration TLS de Node.js](https://nodejs.org/api/tls.html)

:::note
**Remarque importante** : La variable d'environnement `NODE_EXTRA_CA_CERTS` est essentielle pour résoudre les problèmes de chaîne de certificats SSL avec PostgreSQL 16.9 sur AWS RDS. Cette configuration doit être correctement définie sur toutes les méthodes de déploiement pour garantir des connexions sécurisées à la base de données.
:::
