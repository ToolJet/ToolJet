---
id: compliance
title: Conformité
---

## Sécurité des données inégalée avec la conformité SOC 2 Type II

Avec la conformité SOC 2 Type II, ToolJet garantit le plus haut niveau de sécurité des données. Le respect des normes SOC 2 Type II reflète les mesures rigoureuses de protection des données mises en place, couvrant tout, du chiffrement aux contrôles d'accès robustes. Cela garantit également un niveau constant de disponibilité du service et d'intégrité des processus, instaurant la confiance de nos clients et parties prenantes quant à la gestion sécurisée de leurs informations sensibles.

:::tip TRUST CENTER
Pour la documentation de sécurité la plus récente et les certifications de conformité, visitez [trust.tooljet.com](https://trust.tooljet.com/).
:::

## Protection des données
Nous prenons des mesures étendues pour protéger vos données. Toutes les données transmises entre les utilisateurs et nos serveurs sont chiffrées via TLS pour empêcher tout accès non autorisé pendant le transit. Les données sensibles stockées sur nos serveurs sont chiffrées au repos, conformément aux protocoles standards de l'industrie. L'accès à ces données est étroitement contrôlé par des permissions basées sur les rôles, garantissant que seul le personnel autorisé peut accéder aux informations sensibles.

Nous respectons également une **politique de suppression des données conforme au RGPD**, garantissant que les données personnelles sont définitivement supprimées de nos serveurs à la demande de l'utilisateur ou à la fin de la période de conservation des données. Par ailleurs, nous maintenons des journaux d'audit complets pour suivre les accès et modifications des données à des fins de surveillance et de conformité.

## Conformité et certifications
Nous respectons des normes mondialement reconnues en matière de sécurité des données et de conformité. ToolJet répond aux exigences des certifications suivantes :

**RGPD** : ToolJet est entièrement conforme au Règlement général sur la protection des données (RGPD), garantissant que vos données personnelles sont traitées et stockées de manière sécurisée.

**SOC 2** : Nous faisons l'objet d'audits SOC 2 Type II réguliers pour valider notre engagement à maintenir des normes élevées de sécurité, de disponibilité et de confidentialité.

**ISO 27001** : ToolJet suit la norme ISO 27001 pour la gestion de la sécurité de l'information, garantissant une approche systématique de la gestion des informations sensibles.

## Réponse aux incidents
Nous surveillons en permanence nos systèmes pour détecter toute activité suspecte ou incident de sécurité. En cas de violation de sécurité, nous disposons d'un plan de réponse aux incidents détaillé. Ce plan garantit qu'une action immédiate est entreprise pour contenir la violation, communiquer avec les parties concernées et mettre en œuvre des mesures de remédiation pour prévenir de futurs incidents.

## Pratiques de développement sécurisées
Nous respectons des normes mondialement reconnues en matière de sécurité des données et de conformité. ToolJet répond aux exigences des certifications ci-dessous.

Nous faisons l'objet d'**audits SOC 2 Type II** réguliers pour valider notre engagement à maintenir des normes élevées de sécurité, de disponibilité et de confidentialité.

## Responsabilité de l'utilisateur
Nous encourageons tous nos utilisateurs à adopter de bonnes pratiques de sécurité pour renforcer davantage la sécurité. Cela comprend la création de mots de passe forts et uniques pour les comptes ToolJet et l'activation de l'authentification à deux facteurs pour une protection supplémentaire. Les utilisateurs doivent également maintenir leurs appareils et applications à jour pour se protéger contre les vulnérabilités.


## Stockage des données

ToolJet ne stocke pas les données renvoyées par vos sources de données. Le serveur ToolJet agit comme un proxy et transmet les données telles quelles au client ToolJet. Les identifiants des sources de données sont gérés par le serveur et ne sont jamais exposés au client. Par exemple, si vous effectuez une requête API, la requête est exécutée depuis le serveur et non depuis le frontend.


## Identifiants des sources de données
Tous les identifiants des sources de données sont chiffrés de manière sécurisée à l'aide de `aes-256-gcm`. Les identifiants ne sont jamais exposés au frontend (le client ToolJet).

## Politique de confidentialité
ToolJet prend la confidentialité au sérieux. Nos politiques de confidentialité transparentes garantissent que les clients comprennent comment leurs données sont collectées, stockées et traitées. Nous respectons les réglementations en matière de confidentialité dans toutes les régions où nous opérons.

## Autres fonctionnalités de sécurité
- **TLS** : Si vous utilisez ToolJet Cloud, toutes les connexions sont chiffrées via TLS. Nous disposons également d'une documentation pour configurer TLS pour les installations auto-hébergées de ToolJet.
- **Journaux d'audit** : Les journaux d'audit sont disponibles dans l'édition entreprise de ToolJet. Chaque action utilisateur est journalisée avec les adresses IP et les informations utilisateur.
- **Journalisation des requêtes** : Toutes les requêtes vers le serveur sont journalisées. En auto-hébergé, vous pouvez facilement étendre ToolJet pour utiliser votre service de journalisation préféré. ToolJet est fourni avec une intégration Sentry intégrée.
- **IP en liste blanche** : Si vous utilisez ToolJet Cloud, vous pouvez mettre en liste blanche notre adresse IP (130.131.224.28) afin que vos sources de données ne soient pas exposées publiquement.
- **Sauvegardes** : ToolJet Cloud est hébergé sur AWS via EKS avec mise à l'échelle automatique et sauvegardes régulières.

Si vous constatez une vulnérabilité de sécurité, veuillez en informer l'équipe en envoyant un e-mail à [security@tooljet.com](mailto:security@tooljet.com). 
