---
id: prompting101
title: Prompting 101
---

Le prompting est la façon dont vous communiquez avec l'IA de ToolJet pour créer des applications internes. Considérez-le comme le fait de donner des instructions détaillées à un développeur hautement qualifié qui comprend la plateforme mais a besoin de contexte sur vos besoins métier spécifiques.

L'IA traduit ensuite ces exigences en une application pleinement fonctionnelle en utilisant le créateur d'applications low-code de ToolJet.

## Pourquoi un bon prompting est important

**Le défi** : Des invites génériques produisent des applications génériques. Demander simplement "un système CRM" ou "un outil de gestion de projet" produit des applications basiques, semblables à des modèles, qui ne reflètent pas vos processus métier réels. <br/>
**La solution** : Un prompting contextuel qui fournit le contexte métier, les besoins des utilisateurs et des workflows spécifiques produit des applications qui semblent conçues sur mesure pour votre organisation.

### Exemple d'impact réel

#### Invite générique

**Invite :** "Créer un système de gestion de la clientèle" <br/>
**Résultat** : Formulaires et listes de contacts basiques qui pourraient convenir à n'importe qui. <br/>

#### Invite contextuelle

**Invite** : "Notre agence de design doit suivre plus de 50 projets clients simultanés, gérer des workflows d'approbation créative, et éviter les conflits de ressources entre notre équipe de 12 personnes..."  <br/>
**Résultat** : Application spécialisée de gestion de projet avec workflows d'approbation, calendriers de ressources et outils de communication client.

## Ce que ToolJet gère déjà

Ne gaspillez pas votre invite à décrire ceci - c'est déjà intégré à la plateforme :

### ToolJet fournit automatiquement

<div style={{ display: 'flex' }} >

<div style = {{ width:'50%' }} >

- L'authentification et les systèmes de connexion des utilisateurs
- Le contrôle d'accès basé sur les rôles et les permissions
- L'intégration de base de données et le stockage de données

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

- Les intégrations API avec des services externes
- Les fonctionnalités de sécurité et le chiffrement des données

</div>

</div>

### À ne pas inclure dans vos invites

<div style={{ display: 'flex' }} >

<div style = {{ width:'50%' }} >

- "Créer la connexion et l'authentification des utilisateurs"
- "Ajouter des permissions basées sur les rôles"

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

- "Créer des intégrations API"
- "Inclure des fonctionnalités de sécurité"

</div>

</div>

### Concentrez-vous plutôt sur

<div style={{ display: 'flex' }} >

<div style = {{ width:'50%' }} >

- Les workflows et processus métier
- La saisie manuelle de données et les formulaires
- La logique métier personnalisée

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

- Les besoins spécifiques en matière de rapports
- Les exigences d'interface utilisateur

</div>

</div>

## La formule en 3 sections

Structurez vos invites avec ces trois sections pour de meilleurs résultats :

### 1. Contexte métier

Expliquez pourquoi vous avez besoin de cet outil et quels problèmes il résout.
#### Bon exemple
"Notre équipe commerciale suit actuellement les prospects dans des feuilles de calcul répartis sur 5 fichiers différents, ce qui cause des incohérences de données et des suivis manqués. Nous avons besoin d'une gestion centralisée des prospects qui évite les doublons et offre une visibilité sur notre pipeline commercial."

#### À éviter
"Créer un système CRM."

### 2. Personas utilisateurs

Définissez qui utilisera l'outil et ce qu'ils doivent accomplir.

#### Bon format

- Commerciaux - Doivent enregistrer de nouveaux prospects, mettre à jour les coordonnées et suivre l'avancement des transactions
- Responsables commerciaux - Nécessitent une visibilité sur le pipeline, des indicateurs de performance d'équipe et des rapports de prévision
- Équipe marketing - Doit voir les sources de prospects, les taux de conversion et l'efficacité des campagnes

### 3. Parcours utilisateurs et fonctionnalités

Décrivez comment les utilisateurs interagiront avec l'outil à travers des workflows spécifiques.

#### Bon format

- Parcours de capture de prospects - Importer des prospects depuis diverses sources, les assigner aux commerciaux, définir des rappels de suivi
- Parcours de gestion de pipeline - Faire avancer les transactions à travers les étapes, mettre à jour les probabilités, enregistrer les interactions
- Parcours de reporting - Générer des rapports de pipeline hebdomadaires, suivre les métriques de conversion, analyser les sources de prospects

## Utilisation efficace des crédits

### À faire
- **Rédigez des invites précises avec un contexte détaillé** <br/>
    Une invite précise coûte moins de crédits car l'IA résout l'ambiguïté en moins d'allers-retours. Au lieu de "Créer un tableau de bord pour suivre les nouvelles inscriptions utilisateurs chaque jour", incluez votre contexte métier, le problème que vous résolvez, et à quoi le résultat doit ressembler : "Créer un tableau de bord pour suivre les nouvelles inscriptions utilisateurs chaque jour. J'ai besoin d'un graphique des inscriptions quotidiennes sur les 30 derniers jours, d'un résumé du total d'utilisateurs ce mois-ci par rapport au mois dernier, et d'un tableau montrant le nom, l'e-mail, la date d'inscription et le type de plan de chaque nouvel utilisateur. Permettez-moi de filtrer par plage de dates et par plan." cela dépense des crédits pour construire, pas pour clarifier.
- **Restez concis** <br/>
    Chaque mot de votre invite est traité à un coût. Visez environ 500 mots ou moins. Coller des PRD ou des documents de spécification complets fait augmenter l'utilisation des crédits sans améliorer le résultat ; n'extrayez que ce qui est pertinent pour la tâche en cours.
- **Limitez le nombre de tâches par invite** <br/>
    Regrouper plusieurs exigences dans une seule invite force l'IA à raisonner sur une portée plus large, consommant plus de crédits et produisant souvent un résultat de moindre qualité. Envoyez une seule tâche ciblée à la fois.
- **Divisez les opérations en tâches plus petites** <br/>
    Une seule grande opération utilise plus de crédits et est plus difficile à corriger si quelque chose se passe mal. Diviser le travail en étapes plus petites signifie que vous ne dépensez des crédits que sur ce que vous avez validé, et non sur la refonte d'un résultat surchargé.
- **Démarrez une nouvelle conversation pour des tâches différentes** <br/>
    Le contexte complet d'une conversation est transmis à chaque nouveau message, donc plus l'historique est long, plus chaque tour coûte de crédits. Une fois une tâche terminée, démarrez une nouvelle conversation plutôt que de poursuivre le même fil pour un travail non lié.

### À éviter

- Les invites vagues qui nécessitent plusieurs tours de clarification, chaque tour coûtant des crédits
- Les listes de fonctionnalités sans contexte ("a besoin de formulaires, de tableaux et de rapports"), l'IA dépense des crédits à deviner l'intention
- Coller des PRD complets ou de longs documents de spécification, les jetons excédentaires ajoutent un coût sans bénéfice de qualité
- Regrouper des tâches non liées dans une seule invite, une portée plus large signifie plus de traitement et une consommation de crédits plus élevée
- Sur-spécifier les détails de mise en page de l'interface, cela ajoute de la longueur et du coût à l'invite sans impact significatif, car l'IA gère les décisions de conception

## Quelle doit être la longueur de mon invite ?

### Invites courtes (2-3 phrases par section)
- Idéal pour : Des outils simples avec des workflows simples
- Risque : Peut manquer de détails nécessaires pour une logique métier complexe

### Invites moyennes (1 paragraphe par section)
- Idéal pour : La plupart des outils internes
- Point idéal : Fournit suffisamment de contexte sans être excessif
- Cette longueur produit généralement les résultats les plus utilisables

### Invites longues (2-3 paragraphes par section)

- Idéal pour : Des workflows complexes avec plusieurs types d'utilisateurs
- Risque : Peut créer des interfaces trop compliquées

:::tip Astuce de pro
Les invites précises utilisent moins de crédits IA. Les invites vagues font travailler l'IA plus dur, consommant plus de crédits en essayant de combler les lacunes.
:::

## Définir la portée de votre application

### Commencez petit, puis itérez

Commencez par une version simple (3-4 pages) couvrant les workflows essentiels, puis ajoutez des fonctionnalités supplémentaires. Cette approche :
- Facilite le test et l'amélioration de l'application
- Réduit la complexité et les erreurs potentielles
- Vous permet de valider les workflows avant d'étendre

## Exemple complet : avant et après

### Avant (générique)
"Créer un système de gestion de projet avec des tâches, des délais et des fonctionnalités de collaboration d'équipe."

### Après (contextuel)

#### Contexte métier
Notre agence marketing gère simultanément plus de 15 campagnes clients, mais les détails des projets sont dispersés entre fils d'e-mails, Google Docs et conversations Slack, causant des livrables manqués et une confusion des membres de l'équipe quant aux priorités.

#### Personas utilisateurs
- Chargés de compte - Doivent suivre l'avancement des campagnes, les approbations client et le statut des livrables
- Équipe créative - Nécessitent des briefs clairs, des workflows d'approbation d'actifs et une visibilité sur les délais
- Directeurs de projet - Doivent voir l'allocation des ressources, la rentabilité des campagnes et la charge de travail de l'équipe

#### Parcours utilisateurs et fonctionnalités

- Parcours de configuration de campagne - Créer des briefs de projet, définir des jalons de livrables, assigner des membres d'équipe et des délais
- Parcours de révision d'actifs - Téléverser des actifs créatifs, recueillir les retours clients, gérer les cycles de révision avec suivi des approbations
- Parcours de planification des ressources - Voir la capacité de l'équipe, assigner des tâches selon la disponibilité, suivre l'allocation du temps entre les campagnes

## Exemples concrets

### Exemple 1 : Portail de gestion des fournisseurs

#### Contexte métier :
Notre entreprise maintient des partenariats stratégiques avec de grands fournisseurs technologiques comme AWS, IBM, Microsoft et ServiceNow, essentiels pour notre stratégie de mise sur le marché. Actuellement, nous gérons les accords de partenariat, les exigences de certification et les opportunités de co-vente à travers plusieurs feuilles de calcul et fils d'e-mails, rendant difficile le suivi de l'attribution des revenus ou l'identification de nouvelles opportunités de collaboration.

#### Personas utilisateurs :
- Responsables de partenariat - Doivent gérer les relations avec les fournisseurs, suivre les opportunités de co-vente et assurer la conformité aux certifications
- Équipe de développement commercial - Nécessite une visibilité sur les revenus générés par les partenaires et les opportunités de vente conjointe
- Équipes commerciales - Doivent accéder aux ressources des partenaires, soumettre des enregistrements de transactions et exploiter les relations avec les fournisseurs
- Direction exécutive - A besoin de métriques de performance de partenariat et d'évaluation du ROI

#### Parcours utilisateurs et fonctionnalités :

- Parcours d'intégration de partenariat - Enregistrer de nouveaux partenariats fournisseurs avec classification par niveau, téléverser les termes du contrat, définir les exigences de certification, assigner des responsables de partenariat
- Parcours de gestion des opportunités - Enregistrer les opportunités de co-vente et les enregistrements de transactions, suivre les activités de vente conjointe et l'attribution des revenus, mettre à jour le statut des opportunités à travers le pipeline commercial
- Parcours de suivi des certifications - Surveiller l'avancement des certifications de l'équipe, suivre les dates de renouvellement, maintenir la documentation de conformité, générer des rapports de certification
- Parcours d'analyse de performance - Générer des rapports de ROI de partenariat, analyser l'efficacité de la co-vente, créer des tableaux de bord exécutifs, suivre l'atteinte des jalons

### Exemple 2 : Système de comptes à payer

#### Contexte métier :

Notre société de services financiers traite plus de 800 factures fournisseurs par mois à travers plusieurs unités commerciales, mais nous gérons les approbations par chaînes d'e-mails et suivons les paiements dans des feuilles de calcul déconnectées. Cela crée des risques de conformité pour les audits, retarde les paiements aux fournisseurs, et rend la clôture de fin de mois extrêmement difficile.

#### Personas utilisateurs :

- Commis aux comptes à payer - Doivent saisir les détails des factures, faire correspondre les factures aux bons de commande et planifier les paiements
- Responsables de département - Doivent examiner et approuver les factures dans les limites budgétaires et assurer la conformité aux politiques de dépenses
- Contrôleurs financiers - Nécessitent une visibilité sur les obligations de flux de trésorerie, les rapports d'ancienneté et les provisions de fin de mois
- CFO/Directeur financier - A besoin d'analyses de dépenses de haut niveau, d'informations sur les relations fournisseurs et de supervision de la conformité

#### Parcours utilisateurs et fonctionnalités :

- Parcours de traitement des factures - Enregistrer les détails des factures, faire correspondre avec les bons de commande, signaler les écarts, assigner la codification des dépenses
- Gestion du workflow d'approbation - Acheminer les factures à travers les chaînes d'approbation selon des seuils, suivre le statut des approbations, escalader les approbations en retard
- Parcours de planification des paiements - Planifier les paiements selon les conditions des fournisseurs, regrouper les paiements, suivre les confirmations, maintenir l'historique des paiements
- Parcours de reporting et d'analyse - Générer des rapports d'ancienneté, créer des analyses de dépenses par département, produire des rapports de piste d'audit, analyser les habitudes de paiement des fournisseurs

## Liste de vérification de démarrage rapide

Avant de soumettre votre invite, vérifiez que vous avez inclus :

- [ ] Le contexte métier expliquant le problème actuel
- [ ] Les points de friction spécifiques que vous rencontrez
- [ ] Tous les personas utilisateurs pertinents et leurs besoins
- [ ] Des parcours utilisateurs clairs décrivant comment les gens utiliseront l'application
- [ ] La terminologie spécifique à votre secteur que votre équipe utilise
- [ ] Une portée réaliste (commencez avec 3-4 pages essentielles)

**Rappel** : Vous n'avez pas besoin de formater votre invite en sections rigides. L'IA comprendra vos exigences quelle que soit la structure - ce qui compte le plus, c'est le contenu et le contexte que vous fournissez.
