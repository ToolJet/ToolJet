
# ToolJet DB Postgrest

This module is required to setup ToolJet database

## Install postgrest
https://docs.postgrest.org/en/v12/explanations/install.html

## PostgREST configuration file - postgrest.conf
```
db-uri = "postgres://postgres:postgres@localhost:5432/tooljet_new_db"
db-pre-config = "postgrest.pre_config"
server-port = "3001"
jwt-secret = <add secret>
```

### ToolJet .env settings
```
PGRST_JWT_SECRET=Same value configured as jwt-secret
TOOLJET_DB=tooljet_new_db (Same value configured as db-uri db name)
PGRST_HOST=localhost:3001
TOOLJET_DB_USER=postgres
TOOLJET_DB_PASS=postgres
PGRST_DB_PRE_CONFIG=postgrest.pre_config
```

### Start Postgrest
```
postgrest postgrest.conf
```
