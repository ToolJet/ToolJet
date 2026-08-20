---
id: architecture
title: Architecture
---
# Introduction

ToolJet comporte deux composants principaux : le **ToolJet Server** et le **ToolJet Client**.

### 1. ToolJet Server  

Le ToolJet server est une application API Node.js. Le serveur est responsable de l'authentification, de l'autorisation, de la persistance des définitions d'applications, de l'exécution des queries, du stockage sécurisé des identifiants des sources de données, et plus encore.

**Dépendances :**
- **PostgreSQL** - le ToolJet server persiste les données dans une base de données postgres.
- **Service d'e-mail** (SMTP/Sendgrid/Mailgun/etc.) - requis pour envoyer les invitations utilisateur et les e-mails de réinitialisation de mot de passe.
- **PostgREST** - serveur web autonome qui convertit une base de données PostgreSQL en API RESTful interrogeables pour ToolJet Database.
    
### 2. ToolJet Client  

Le ToolJet client est une application ReactJS. Le client est responsable de l'édition visuelle des applications, de la création et de l'édition des queries, du rendu des applications, de l'exécution des événements et de leurs déclencheurs, etc.

## Prérequis

1. **Node version 22.15.1**
2. **npm version 10.9.2**
