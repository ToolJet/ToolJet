# Helm installation

This chart can be used to install ToolJet in a Kubernetes Cluster via [Helm v3](https://helm.sh).\
This setup is very rudimentary and comes with an included PostgreSQL server out of the box.

## Installation

To install, follow these steps:

1) Clone the repo and `cd` into this directory
2) Run `helm dependency update`
3) Recommended but optional:\
Patch the values in `values.yaml` file (usernames & passwords, persistence, ...).
4) Run `helm install -n $NAMESPACE --create-namespace $RELEASE .`\
You need to replace these variables with your configuration values.
5) The database won't be seeded yet. For that, shell into the `tooljet` pod and run `npm run db:seed` in the `/app` folder. You can now login with user `dev@tooljet.io` and password `password`.
