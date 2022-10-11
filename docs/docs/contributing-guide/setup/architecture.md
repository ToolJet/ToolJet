---
id: architecture
title: Architecture
---
# Introduction

ToolJet has two main components: **ToolJet Server** and **ToolJet Client**.

### 1. ToolJet Server  

ToolJet server is a Node.js API application. Server is responsible for authentication, authorization, persisting application definitions, running queries, storing data source credentials securely and more. 

**Dependencies:**
- **PostgreSQL** - ToolJet server persists data to a postgres database. 
- **Email service** (SMTP/Sendgrid/Mailgun/etc) - Required to send user invitations and password reset emails.   
    
### 2. ToolJet Client  

ToolJet client is a ReactJS application. Client is responsible for visually editing the applications, building & editing queries, rendering applications, executing events and their trigger, etc.

## Requirements

1. **Node version 14.x**
