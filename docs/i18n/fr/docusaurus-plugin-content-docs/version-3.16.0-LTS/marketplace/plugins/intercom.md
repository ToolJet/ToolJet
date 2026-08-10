---
id: marketplace-plugin-intercom
title: Intercom
---

Grâce à ce plugin, vous pouvez intégrer Intercom à ToolJet pour gérer les conversations clients, les workflows de support et l'engagement des utilisateurs directement depuis vos applications.

:::info NOTE
Avant de suivre ce guide, il est supposé que vous avez déjà terminé le processus d'[Utilisation des plugins Marketplace](/docs/marketplace/marketplace-overview#configuring-plugins).
:::

## Connexion

Pour établir une connexion, vous devez d'abord créer une application dans Intercom et obtenir un **access token**.

### Comment obtenir l'access token

- Créez une application dans Intercom.
- Accédez à :
  **Settings > Integrations > Developer Hub**
- Sélectionnez **Create an app** depuis le workspace.
- Ouvrez l'onglet **Authentication**.
- Copiez l'**Access Token** généré et utilisez-le pour configurer la connexion dans ToolJet.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/marketplace/plugins/intercom/connection.png" alt="Marketplace: Intercom Connection" />

:::info
Pour plus d'informations, référez-vous **[ici](https://developers.intercom.com/docs/build-an-integration/learn-more/authentication#how-to-get-your-access-token)** pour savoir comment générer un access token.
:::

## Opérations prises en charge

ToolJet prend en charge plusieurs opérations Intercom via des appels REST API, vous permettant de gérer les conversations, contacts, entreprises, tickets, articles et autres ressources Intercom directement au sein de votre application.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/intercom/supported-ops.png" alt="Marketplace: Intercom operations"/>

| Méthode | API Endpoint            | Description                                                  |
| ------ | ----------------------- | ------------------------------------------------------------ |
| GET    | `/me`                   | Identifier un admin                                            |
| GET    | `/admins`               | Lister tous les admins                                              |
| GET    | `/articles`             | Lister tous les articles                                            |
| POST   | `/articles`             | Créer un article                                            |
| GET    | `/away_status_reasons`  | Lister tous les motifs d'absence                                 |
| GET    | `/internal_articles`    | Lister tous les articles internes                                   |
| POST   | `/internal_articles`    | Créer un article interne                                   |
| GET    | `/ip_allowlist`         | Récupérer les paramètres de la liste d'IP autorisées                                    |
| PUT    | `/ip_allowlist`         | Mettre à jour les paramètres de la liste d'IP autorisées                                 |
| POST   | `/companies`            | Créer ou mettre à jour une entreprise                                   |
| GET    | `/companies`            | Récupérer les entreprises                                           |
| GET    | `/contacts`             | Lister tous les contacts                                            |
| POST   | `/contacts`             | Créer un contact                                             |
| GET    | `/conversations`        | Lister toutes les conversations                                       |
| POST   | `/conversations`        | Créer une conversation                                        |
| GET    | `/data_attributes`      | Lister tous les attributs de données                                     |
| POST   | `/data_attributes`      | Créer un attribut de données                                      |
| POST   | `/events`               | Soumettre un événement de données                                             |
| GET    | `/events`               | Lister tous les événements de données                                         |
| POST   | `/messages`             | Créer un message                                             |
| GET    | `/segments`             | Lister tous les segments                                            |
| GET    | `/subscription_types`   | Lister les types d'abonnement                                      |
| POST   | `/phone_call_redirects` | Créer une redirection d'appel téléphonique                                        |
| GET    | `/calls`                | Lister tous les appels                                               |
| GET    | `/tags`                 | Lister tous les tags                                                |
| POST   | `/tags`                 | Créer ou mettre à jour un tag, taguer ou détaguer des entreprises, taguer des contacts |
| GET    | `/teams`                | Lister toutes les équipes                                               |
| GET    | `/ticket_states`        | Lister tous les états de ticket                                      |
| GET    | `/ticket_types`         | Lister tous les types de ticket                                       |
| POST   | `/ticket_types`         | Créer un type de ticket                                             |
| POST   | `/tickets`              | Créer un ticket                                             |
| PUT    | `/visitors`             | Mettre à jour un visiteur                                             |
| GET    | `/visitors`             | Récupérer un visiteur avec l'User ID                              |
| GET    | `/brands`               | Lister toutes les marques                                               |
| GET    | `/emails`               | Lister tous les paramètres d'e-mail                                          |

#### ADMIN_ID
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| PUT | `/admins/{admin_id}/away` | Définir un admin comme absent |
| GET | `/admins/{admin_id}` | Récupérer un admin |

#### ACTIVITY_LOGS
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/admins/activity_logs` | Lister tous les journaux d'activité |

#### CONTENT_IMPORT_SOURCES
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/ai/content_import_sources` | Lister les sources d'import de contenu |
| POST | `/ai/content_import_sources` | Créer une source d'import de contenu |
| DELETE | `/ai/content_import_sources/{source_id}` | Supprimer une source d'import de contenu |
| GET | `/ai/content_import_sources/{source_id}` | Récupérer une source d'import de contenu |
| PUT | `/ai/content_import_sources/{source_id}` | Mettre à jour une source d'import de contenu |

#### EXTERNAL_PAGES
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/ai/external_pages` | Lister les pages externes |
| POST | `/ai/external_pages` | Créer une page externe (ou mettre à jour une page externe via son ID externe) |
| DELETE | `/ai/external_pages/{page_id}` | Supprimer une page externe |
| GET | `/ai/external_pages/{page_id}` | Récupérer une page externe |
| PUT | `/ai/external_pages/{page_id}` | Mettre à jour une page externe |

#### ARTICLE_ID
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/articles/{article_id}` | Récupérer un article |
| PUT | `/articles/{article_id}` | Mettre à jour un article |
| DELETE | `/articles/{article_id}` | Supprimer un article |

#### SEARCH
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/articles/search` | Rechercher des articles |
| GET | `/internal_articles/search` | Rechercher des articles internes |
| POST | `/contacts/search` | Rechercher des contacts |
| POST | `/conversations/search` | Rechercher des conversations |
| POST | `/calls/search` | Lister les appels avec transcriptions |
| POST | `/tickets/search` | Rechercher des tickets |

#### REPORTING_DATA
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/export/reporting_data/enqueue` | Ajouter à la file un nouveau job d'export de données de reporting |
| GET | `/export/reporting_data/{job_identifier}` | Récupérer le statut du job d'export |
| GET | `/export/reporting_data/get_datasets` | Lister les datasets et attributs disponibles |
| GET | `/download/reporting_data/{job_identifier}` | Télécharger les données du job d'export terminé |

#### COLLECTIONS
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/help_center/collections` | Lister toutes les collections |
| POST | `/help_center/collections` | Créer une collection |
| GET | `/help_center/collections/{collection_id}` | Récupérer une collection |
| PUT | `/help_center/collections/{collection_id}` | Mettre à jour une collection |
| DELETE | `/help_center/collections/{collection_id}` | Supprimer une collection |

#### HELP_CENTERS
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/help_center/help_centers/{help_center_id}` | Récupérer un Help Center |
| GET | `/help_center/help_centers` | Lister tous les Help Centers |

#### INTERNAL_ARTICLE_ID
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/internal_articles/{internal_article_id}` | Récupérer un article interne |
| PUT | `/internal_articles/{internal_article_id}` | Mettre à jour un article interne |
| DELETE | `/internal_articles/{internal_article_id}` | Supprimer un article interne |

#### COMPANY_ID
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/companies/{company_id}` | Récupérer une entreprise par ID |
| PUT | `/companies/{company_id}` | Mettre à jour une entreprise |
| DELETE | `/companies/{company_id}` | Supprimer une entreprise |
| GET | `/companies/{company_id}/contacts` | Lister les contacts rattachés aux entreprises |
| GET | `/companies/{company_id}/segments` | Lister les segments rattachés aux entreprises |
| GET | `/companies/{company_id}/notes` | Lister toutes les notes de l'entreprise |

#### LIST
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/companies/list` | Lister toutes les entreprises |

#### SCROLL
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/companies/scroll` | Parcourir (scroll) toutes les entreprises |

#### CONTACT_ID
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/contacts/{contact_id}/companies` | Rattacher un contact à une entreprise |
| GET | `/contacts/{contact_id}/companies` | Lister les entreprises rattachées à un contact |
| DELETE | `/contacts/{contact_id}/companies/{company_id}` | Détacher un contact d'une entreprise |
| GET | `/contacts/{contact_id}/notes` | Lister toutes les notes |
| POST | `/contacts/{contact_id}/notes` | Créer une note |
| GET | `/contacts/{contact_id}/segments` | Lister les segments rattachés à un contact |
| GET | `/contacts/{contact_id}/subscriptions` | Lister les abonnements d'un contact |
| POST | `/contacts/{contact_id}/subscriptions` | Ajouter un abonnement à un contact |
| DELETE | `/contacts/{contact_id}/subscriptions/{subscription_id}` | Retirer un abonnement d'un contact |
| GET | `/contacts/{contact_id}/tags` | Lister les tags rattachés à un contact |
| POST | `/contacts/{contact_id}/tags` | Ajouter un tag à un contact |
| DELETE | `/contacts/{contact_id}/tags/{tag_id}` | Retirer un tag d'un contact |
| PUT | `/contacts/{contact_id}` | Mettre à jour un contact |
| GET | `/contacts/{contact_id}` | Récupérer un contact |
| DELETE | `/contacts/{contact_id}` | Supprimer un contact |
| POST | `/contacts/{contact_id}/archive` | Archiver un contact |
| POST | `/contacts/{contact_id}/unarchive` | Désarchiver un contact |
| POST | `/contacts/{contact_id}/block` | Bloquer un contact |

#### MERGE
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/contacts/merge` | Fusionner un lead et un utilisateur |

#### FIND_BY_EXTERNAL_ID
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/contacts/merge` | Fusionner un lead et un utilisateur |

#### CONVERSATION_ID
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/contacts/find_by_external_id/{external_id}` | Récupérer un contact par External ID |
| POST | `/conversations/{conversation_id}/tags` | Ajouter un tag à une conversation |
| DELETE | `/conversations/{conversation_id}/tags/{tag_id}` | Retirer un tag d'une conversation |
| GET | `/conversations/{conversation_id}` | Récupérer une conversation |
| PUT | `/conversations/{conversation_id}` | Mettre à jour une conversation |
| DELETE | `/conversations/{conversation_id}` | Supprimer une conversation |
| POST | `/conversations/{conversation_id}/reply` | Répondre à une conversation |
| POST | `/conversations/{conversation_id}/parts` | Gérer une conversation |
| POST | `/conversations/{conversation_id}/customers` | Rattacher un contact à une conversation |
| DELETE | `/conversations/{conversation_id}/customers/{contact_id}` | Détacher un contact d'une conversation |
| POST | `/conversations/{conversation_id}/convert` | Convertir une conversation en ticket |

#### REDACT
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/conversations/redact` | Masquer une partie de conversation |

#### NOTIFY_NEW_CONVERSATION
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_channel_events/notify_new_conversation` | Notifier Intercom d'une nouvelle conversation créée dans un canal personnalisé |

#### NOTIFY_NEW_MESSAGE
| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_channel_events/notify_new_message` | Notifier Intercom d'un nouveau message dans une conversation de canal personnalisé |

#### NOTIFY_QUICK_REPLY_SELECTED

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_channel_events/notify_quick_reply_selected` | Notifier Intercom d'une réponse rapide dans une conversation de canal personnalisé |

#### NOTIFY_ATTRIBUTE_COLLECTED

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_channel_events/notify_attribute_collected` | Notifier Intercom d'une réponse de collecteur d'attribut dans une conversation de canal personnalisé |

#### CUSTOM_OBJECT_TYPE_IDENTIFIER

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/custom_object_instances/{custom_object_type_identifier}` | Créer ou mettre à jour une instance d'objet personnalisé |
| GET | `/custom_object_instances/{custom_object_type_identifier}` | Récupérer une instance d'objet personnalisé par External ID |
| DELETE | `/custom_object_instances/{custom_object_type_identifier}` | Supprimer une instance d'objet personnalisé par External ID |
| GET | `/custom_object_instances/{custom_object_type_identifier}/{custom_object_instance_id}` | Récupérer une instance d'objet personnalisé par ID |
| DELETE | `/custom_object_instances/{custom_object_type_identifier}/{custom_object_instance_id}` | Supprimer une instance d'objet personnalisé par ID |

#### DATA_ATTRIBUTE_ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| PUT | `/data_attributes/{data_attribute_id}` | Mettre à jour un attribut de données |

#### SUMMARIES

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/events/summaries` | Créer des résumés d'événements |

#### CONTENT

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/export/content/data` | Créer un export de données de contenu |
| GET | `/export/content/data/{job_identifier}` | Afficher l'export de données de contenu |
| GET | `/download/content/data/{job_identifier}` | Télécharger l'export de données de contenu |

#### CANCEL

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/export/cancel/{job_identifier}` | Annuler l'export de données de contenu |

#### STATUS

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/jobs/status/{job_id}` | Récupérer le statut d'un job |

#### NEWS_ITEMS

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/news/news_items` | Lister tous les news items |
| POST | `/news/news_items` | Créer un news item |
| GET | `/news/news_items/{news_item_id}` | Récupérer un news item |
| PUT | `/news/news_items/{news_item_id}` | Mettre à jour un news item |
| DELETE | `/news/news_items/{news_item_id}` | Supprimer un news item |

#### NEWSFEEDS

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/news/newsfeeds/{newsfeed_id}/items` | Lister tous les éléments de newsfeed en direct |
| GET | `/news/newsfeeds` | Lister tous les newsfeeds |
| GET | `/news/newsfeeds/{newsfeed_id}` | Récupérer un newsfeed |

#### NOTE_ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/notes/{note_id}` | Récupérer une note |

#### SEGMENT_ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/segments/{segment_id}` | Récupérer un segment |

#### CALL_ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/calls/{call_id}` | Récupérer un appel |
| GET | `/calls/{call_id}/recording` | Récupérer l'enregistrement d'un appel par son ID |
| GET | `/calls/{call_id}/transcript` | Récupérer la transcription d'un appel par son ID |

#### TAG_ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/tags/{tag_id}` | Trouver un tag spécifique |
| DELETE | `/tags/{tag_id}` | Supprimer un tag |

#### TEAM_ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/teams/{team_id}` | Récupérer une équipe |

#### TICKET_TYPE_ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/ticket_types/{ticket_type_id}/attributes` | Créer un attribut pour un type de ticket |
| PUT | `/ticket_types/{ticket_type_id}/attributes/{attribute_id}` | Mettre à jour un attribut existant pour un type de ticket |
| GET | `/ticket_types/{ticket_type_id}` | Récupérer un type de ticket |
| PUT | `/ticket_types/{ticket_type_id}` | Mettre à jour un type de ticket |

#### TICKET_ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/tickets/{ticket_id}/reply` | Répondre à un ticket |
| POST | `/tickets/{ticket_id}/tags` | Ajouter un tag à un ticket |
| DELETE | `/tickets/{ticket_id}/tags/{tag_id}` | Retirer un tag d'un ticket |
| PUT | `/tickets/{ticket_id}` | Mettre à jour un ticket |
| GET | `/tickets/{ticket_id}` | Récupérer un ticket |
| DELETE | `/tickets/{ticket_id}` | Supprimer un ticket |

#### ENQUEUE

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/tickets/enqueue` | Mettre en file la création d'un ticket |

#### CONVERT

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/visitors/convert` | Convertir un visiteur |

#### ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/brands/{id}` | Récupérer une marque |
| GET | `/emails/{id}` | Récupérer un paramètre d'e-mail |

#### REGISTER

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| POST | `/fin_voice/register` | Enregistrer un appel Fin Voice |

#### COLLECT

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/fin_voice/collect/{id}` | Récupérer un appel Fin Voice par ID |

#### EXTERNAL_ID

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/fin_voice/external_id/{external_id}` | Récupérer un appel Fin Voice par ID externe |

#### PHONE_NUMBER

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/fin_voice/phone_number/{phone_number}` | Récupérer un appel Fin Voice par numéro de téléphone |

#### CONVERSATION

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/fin_voice/conversation/{conversation_id}` | Récupérer les appels Fin Voice par ID de conversation |

#### WORKFLOWS

| Méthode | API Endpoint | Description |
|--------|--------------|--------------|
| GET | `/export/workflows/{id}` | Exporter un workflow |

## Exemples de queries

Opération : GET /`me` 

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/intercom/get-me.png" alt="Marketplace: Intercom example queries" />

Opération : GET /`articles`

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/intercom/get-articles.png" alt="Marketplace: Intercom example queries" />

Opération : GET /`away_status_reasons` 

<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/marketplace/plugins/intercom/get-away-status.png" alt="Marketplace: Intercom example queries" />
