---
sidebar_position: 1
sidebar_label: Architecture
---

# Deploying ToolJet
&nbsp

## Architecture

ToolJet have two main components: ToolJet Server and ToolJet Client.

1.  ToolJet Server  
    ToolJet server is a Ruby on Rails API-only application. Server is responsible for authentication, authorization, persisting application definitions, running queries, storing datasource credentials securely and more. 

    Dependencies:
    1.  PostgreSQL - ToolJet server persists data to a postgres database. 
    2.  Email service (SMTP/Sendgrid/Mailgun/etc) - Required to send user invitations and password reset emails.
    
2. ToolJet Client  
    ToolJet client is a ReactJS application. Client is responsible for visually editing the applications, building & editing queries, rendering applications, executing events and their trigger, etc.

## Requirements

1.  Ruby version 2.7 or later
2.  Node version 14.x or higher 