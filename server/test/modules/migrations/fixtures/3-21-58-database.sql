-- A ToolJet 3.21.58 (EE) database with synthetic seed data, for legacy-upgrade-equivalence.spec.ts.
-- Built by 3.21.58's own migrations and API: a git-off and a git-on workspace, each with released and draft
-- apps, a module, a workflow, data sources, a query and folders; the git-on one also has a feature branch,
-- NULL-branch drafts and the default-branch drafts 3.21.58's clone migration creates.
-- Secrets replaced with 'redacted'; sessions, audit logs and AI conversations emptied.
-- Delete with the spec when upgrades from 3.21.58 are no longer supported.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TYPE public."OrganizationConstantType" AS ENUM (
    'Global',
    'Secret'
);

CREATE TYPE public.ai_chat_prompts_provider_enum AS ENUM (
    'openai',
    'claude'
);

CREATE TYPE public.ai_conversation_messages_message_type_enum AS ENUM (
    'ai',
    'user'
);

CREATE TYPE public.ai_conversations_conversation_type_enum AS ENUM (
    'generate',
    'learn'
);

CREATE TYPE public.ai_response_votes_vote_type_enum AS ENUM (
    'up',
    'down'
);

CREATE TYPE public.app_builder_mode AS ENUM (
    'ai',
    'visual'
);

CREATE TYPE public.app_creation_mode AS ENUM (
    'GIT',
    'DEFAULT'
);

CREATE TYPE public.app_type AS ENUM (
    'front-end',
    'workflow',
    'module'
);

CREATE TYPE public.app_version_type AS ENUM (
    'version',
    'branch'
);

CREATE TYPE public.cloud_subscription_type AS ENUM (
    'monthly',
    'yearly'
);

CREATE TYPE public.component_permissions_type_enum AS ENUM (
    'SINGLE',
    'GROUP'
);

CREATE TYPE public.config_scope_enum AS ENUM (
    'organization',
    'instance'
);

CREATE TYPE public.custom_domains_status_enum AS ENUM (
    'pending_verification',
    'pending_ssl',
    'active',
    'failed',
    'deleted'
);

CREATE TYPE public.custom_styles_scope_enum AS ENUM (
    'workspace',
    'instance'
);

CREATE TYPE public.data_query_folder_mappings_child_type_enum AS ENUM (
    'query',
    'folder'
);

CREATE TYPE public.dimension_unit AS ENUM (
    'count',
    'percent'
);

CREATE TYPE public.event_handlers_target_enum AS ENUM (
    'page',
    'component',
    'data_query',
    'table_column',
    'table_action'
);

CREATE TYPE public.group_permissions_type AS ENUM (
    'custom',
    'default'
);

CREATE TYPE public.layout_type AS ENUM (
    'desktop',
    'mobile'
);

CREATE TYPE public.license_type AS ENUM (
    'trial',
    'enterprise',
    'business'
);

CREATE TYPE public.notification_type AS ENUM (
    'info',
    'success',
    'warning',
    'error'
);

CREATE TYPE public.onboarding_status_enum AS ENUM (
    'not_started',
    'account_created',
    'plan_selected',
    'onboarding_completed'
);

CREATE TYPE public.organization_subscription_invoices_status_enum AS ENUM (
    'draft',
    'open',
    'paid',
    'uncollectible',
    'void',
    'failed'
);

CREATE TYPE public.organization_subscription_invoices_type_enum AS ENUM (
    'recurring',
    'subscription'
);

CREATE TYPE public.page_open_in_enum AS ENUM (
    'new_tab',
    'same_tab'
);

CREATE TYPE public.page_permissions_type_enum AS ENUM (
    'SINGLE',
    'GROUP'
);

CREATE TYPE public.page_type_enum AS ENUM (
    'default',
    'group',
    'url',
    'app',
    'custom'
);

CREATE TYPE public.query_permissions_type_enum AS ENUM (
    'SINGLE',
    'GROUP'
);

CREATE TYPE public.resource_type AS ENUM (
    'app',
    'data_source',
    'workflow',
    'folder',
    'module'
);

CREATE TYPE public.scope AS ENUM (
    'local',
    'global'
);

CREATE TYPE public.selfhost_customer_licenses_license_type_enum AS ENUM (
    'trial',
    'business',
    'enterprise'
);

CREATE TYPE public.settings_type AS ENUM (
    'user',
    'system'
);

CREATE TYPE public.source AS ENUM (
    'signup',
    'invite',
    'google',
    'git',
    'openid',
    'ldap',
    'saml',
    'workspace_signup'
);

CREATE TYPE public.ssh_key_type AS ENUM (
    'rsa',
    'ed25519'
);

CREATE TYPE public.sso_type_enum AS ENUM (
    'google',
    'git',
    'form',
    'openid',
    'ldap',
    'saml'
);

CREATE TYPE public.status AS ENUM (
    'invited',
    'verified',
    'active',
    'archived'
);

CREATE TYPE public.stripe_invoice_type AS ENUM (
    'recurring',
    'subscription'
);

CREATE TYPE public.stripe_mode AS ENUM (
    'payment',
    'setup',
    'subscription'
);

CREATE TYPE public.stripe_payment_status AS ENUM (
    'success',
    'failed'
);

CREATE TYPE public.subscription_status AS ENUM (
    'active',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'past_due',
    'canceled',
    'unpaid'
);

CREATE TYPE public.subscription_type AS ENUM (
    'monthly',
    'yearly'
);

CREATE TYPE public.transaction_status_enum AS ENUM (
    'success',
    'failure'
);

CREATE TYPE public.transaction_type_enum AS ENUM (
    'debit',
    'credit',
    'refund'
);

CREATE TYPE public.type AS ENUM (
    'static',
    'default',
    'sample'
);

CREATE TYPE public.user_personal_access_tokens_scope_enum AS ENUM (
    'app',
    'workspace'
);

CREATE TYPE public.user_sessions_session_type_enum AS ENUM (
    'user',
    'pat'
);

CREATE TYPE public.user_type AS ENUM (
    'instance',
    'workspace'
);

CREATE TYPE public.variable_type AS ENUM (
    'client',
    'server'
);

CREATE TYPE public.version_status_enum AS ENUM (
    'DRAFT',
    'PUBLISHED'
);

CREATE TYPE public.wallet_type_enum AS ENUM (
    'recurring',
    'topup',
    'fixed'
);

CREATE TYPE public.white_labelling_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE'
);

CREATE TYPE public.workspace_status AS ENUM (
    'active',
    'archived'
);

CREATE FUNCTION public.bump_app_updated_at_from_version() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF NEW.app_id IS NOT NULL THEN
          UPDATE apps SET updated_at = NOW() WHERE id = NEW.app_id;
        END IF;
        RETURN NEW;
      END;
      $$;

CREATE FUNCTION public.bump_app_version_updated_at_direct() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF NEW.app_version_id IS NOT NULL THEN
          UPDATE app_versions SET updated_at = NOW() WHERE id = NEW.app_version_id;
        END IF;
        RETURN NEW;
      END;
      $$;

CREATE FUNCTION public.bump_app_version_updated_at_via_component() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF NEW.component_id IS NOT NULL THEN
          UPDATE app_versions
          SET updated_at = NOW()
          WHERE id = (
            SELECT p.app_version_id
            FROM components c
            JOIN pages p ON p.id = c.page_id
            WHERE c.id = NEW.component_id
          );
        END IF;
        RETURN NEW;
      END;
      $$;

CREATE FUNCTION public.bump_app_version_updated_at_via_page() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF NEW.page_id IS NOT NULL THEN
          UPDATE app_versions
          SET updated_at = NOW()
          WHERE id = (SELECT app_version_id FROM pages WHERE id = NEW.page_id);
        END IF;
        RETURN NEW;
      END;
      $$;

CREATE FUNCTION public.enforce_app_versions_app_name_branch_unique() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE
        v_app_type varchar;
      BEGIN
        IF NEW.app_name IS NULL
           OR NOT (
             NEW.version_type::text = 'branch'
             OR (NEW.version_type::text = 'version' AND NEW.branch_id IS NOT NULL)
           ) THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        -- Advisory lock keyed on the exact (case-sensitive) app_name so that
        -- concurrent inserts of the same name serialise, while case-different
        -- names ("MyApp" vs "myapp") acquire independent locks.
        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avn:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || NEW.app_name,
          0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE (
              av.version_type::text = 'branch'
              OR (av.version_type::text = 'version' AND av.branch_id IS NOT NULL)
            )
            AND av.app_name = NEW.app_name
            AND av.branch_id IS NOT DISTINCT FROM NEW.branch_id
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_app_name_branch_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$;

CREATE FUNCTION public.enforce_app_versions_default_branch_slug_unique() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE
        v_is_default boolean;
        v_app_type varchar;
      BEGIN
        IF NEW.branch_id IS NULL OR NEW.slug IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT is_default INTO v_is_default
        FROM organization_git_sync_branches
        WHERE id = NEW.branch_id;

        IF v_is_default IS NOT TRUE THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avdbs:' || v_app_type || '|' || LOWER(NEW.slug),
          0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          JOIN organization_git_sync_branches wb ON wb.id = av.branch_id AND wb.is_default = true
          WHERE LOWER(av.slug) = LOWER(NEW.slug)
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_default_branch_slug_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$;

CREATE FUNCTION public.enforce_app_versions_slug_branch_unique() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE
        v_app_type varchar;
      BEGIN
        IF NEW.version_type::text <> 'branch' OR NEW.slug IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avs:' || COALESCE(NEW.branch_id::text, '') || '|' || v_app_type || '|' || LOWER(NEW.slug),
          0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE av.version_type::text = 'branch'
            AND LOWER(av.slug) = LOWER(NEW.slug)
            AND av.branch_id IS NOT DISTINCT FROM NEW.branch_id
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_slug_branch_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$;

CREATE FUNCTION public.enforce_app_versions_slug_default_branch_unique() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE
        v_app_type varchar;
      BEGIN
        IF NEW.status::text <> 'DRAFT'
           OR NEW.branch_id IS NULL
           OR NEW.version_type::text <> 'version'
           OR NEW.slug IS NULL THEN
          RETURN NEW;
        END IF;

        SELECT type INTO v_app_type FROM apps WHERE id = NEW.app_id;
        IF v_app_type IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(hashtextextended(
          'avsdb:' || v_app_type || '|' || LOWER(NEW.slug),
          0
        ));

        IF EXISTS (
          SELECT 1
          FROM app_versions av
          JOIN apps a ON a.id = av.app_id
          WHERE av.status::text = 'DRAFT'
            AND av.branch_id IS NOT NULL
            AND av.version_type::text = 'version'
            AND LOWER(av.slug) = LOWER(NEW.slug)
            AND a.type = v_app_type
            AND av.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'app_versions_slug_default_branch_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$;

CREATE FUNCTION public.enforce_unique_active_default_dsv_name_per_org() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      DECLARE
        v_org_id uuid;
      BEGIN
        IF NEW.is_active IS NOT TRUE OR NEW.is_default IS NOT TRUE THEN
          RETURN NEW;
        END IF;

        SELECT organization_id INTO v_org_id
        FROM data_sources
        WHERE id = NEW.data_source_id;

        IF v_org_id IS NULL THEN
          RETURN NEW;
        END IF;

        PERFORM pg_advisory_xact_lock(
          hashtextextended(v_org_id::text || '|' || LOWER(NEW.name), 0)
        );

        IF EXISTS (
          SELECT 1
          FROM data_source_versions dsv
          JOIN data_sources ds ON ds.id = dsv.data_source_id
          WHERE ds.organization_id = v_org_id
            AND LOWER(dsv.name) = LOWER(NEW.name)
            AND dsv.is_active = true
            AND dsv.is_default = true
            AND dsv.id <> NEW.id
        ) THEN
          RAISE EXCEPTION 'data_source_version_default_name_organization_id_unique'
            USING ERRCODE = 'unique_violation';
        END IF;

        RETURN NEW;
      END;
      $$;

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE public.ai_chat_prompts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    prompt json,
    response json,
    provider public.ai_chat_prompts_provider_enum NOT NULL,
    operation_id character varying NOT NULL,
    organization_id uuid,
    selfhost_customer_id uuid,
    credits_used integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.ai_conversation_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ai_conversation_id uuid NOT NULL,
    prompt_id uuid,
    parent_id uuid,
    message_type public.ai_conversation_messages_message_type_enum NOT NULL,
    content text,
    "references" jsonb,
    metadata jsonb,
    deleted boolean DEFAULT false NOT NULL,
    is_latest boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.ai_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    app_id uuid NOT NULL,
    conversation_type public.ai_conversations_conversation_type_enum NOT NULL,
    user_id uuid NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    archived boolean DEFAULT false NOT NULL,
    preview text,
    metadata json DEFAULT '{}'::json
);

CREATE TABLE public.ai_response_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ai_conversation_message_id uuid NOT NULL,
    user_id uuid NOT NULL,
    vote_type public.ai_response_votes_vote_type_enum NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.app_environments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    "default" boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    organization_id uuid NOT NULL,
    priority integer DEFAULT 1,
    enabled boolean DEFAULT true NOT NULL
);

CREATE TABLE public.app_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    app_version_id uuid NOT NULL,
    user_id uuid NOT NULL,
    sequence_number bigint NOT NULL,
    parent_id uuid,
    history_type character varying NOT NULL,
    action_type character varying NOT NULL,
    operation_scope jsonb,
    description text NOT NULL,
    change_payload jsonb NOT NULL,
    is_ai_generated boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "CHK_43d5c002c59712659cc88306c6" CHECK (((history_type)::text = ANY (ARRAY[('snapshot'::character varying)::text, ('delta'::character varying)::text]))),
    CONSTRAINT check_history_payload_type CHECK ((jsonb_typeof(change_payload) = 'object'::text))
);

CREATE TABLE public.app_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    app_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.app_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying,
    definition json,
    app_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    current_environment_id uuid,
    global_settings json,
    show_viewer_navigation boolean DEFAULT true NOT NULL,
    home_page_id uuid,
    promoted_from uuid,
    page_settings json,
    parent_version_id uuid,
    status public.version_status_enum,
    description character varying(500),
    published_at timestamp without time zone,
    released_at timestamp without time zone,
    version_type public.app_version_type DEFAULT 'version'::public.app_version_type NOT NULL,
    created_by uuid,
    co_relation_id uuid,
    source_tag character varying(256),
    is_stub boolean DEFAULT false NOT NULL,
    branch_id uuid,
    pulled_at timestamp without time zone,
    module_reference_id uuid,
    slug character varying,
    app_name character varying,
    icon character varying,
    is_public boolean DEFAULT false,
    remote_updated_at timestamp without time zone,
    CONSTRAINT chk_app_versions_branch_metadata CHECK (((branch_id IS NULL) OR ((app_name IS NOT NULL) AND (slug IS NOT NULL)))),
    CONSTRAINT chk_app_versions_branch_type_implies_draft_branched CHECK (((version_type <> 'branch'::public.app_version_type) OR ((status = 'DRAFT'::public.version_status_enum) AND (branch_id IS NOT NULL)))),
    CONSTRAINT chk_app_versions_branched_implies_draft CHECK (((branch_id IS NULL) OR (status = 'DRAFT'::public.version_status_enum)))
);

CREATE TABLE public.apps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying,
    slug character varying,
    user_id uuid NOT NULL,
    current_version_id uuid,
    is_public boolean,
    organization_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    icon character varying(255) DEFAULT NULL::character varying,
    is_maintenance_on boolean DEFAULT false NOT NULL,
    type character varying DEFAULT 'front-end'::character varying NOT NULL,
    creation_mode public.app_creation_mode DEFAULT 'DEFAULT'::public.app_creation_mode NOT NULL,
    workflow_api_token character varying(64),
    workflow_enabled boolean DEFAULT false NOT NULL,
    co_relation_id uuid DEFAULT gen_random_uuid() NOT NULL,
    is_initialised_from_prompt boolean DEFAULT false NOT NULL,
    app_generated_from_prompt boolean DEFAULT false NOT NULL,
    ai_generation_metadata jsonb,
    app_builder_mode public.app_builder_mode DEFAULT 'visual'::public.app_builder_mode NOT NULL
);

CREATE TABLE public.apps_group_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    granular_permission_id uuid NOT NULL,
    can_edit boolean DEFAULT false,
    can_view boolean DEFAULT false,
    hide_from_dashboard boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    app_type public.app_type DEFAULT 'front-end'::public.app_type NOT NULL,
    can_access_development boolean DEFAULT true NOT NULL,
    can_access_staging boolean DEFAULT true NOT NULL,
    can_access_production boolean DEFAULT true NOT NULL,
    can_access_released boolean DEFAULT true NOT NULL
);

CREATE TABLE public.artifacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    message_id uuid NOT NULL,
    content jsonb NOT NULL,
    identifier character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    organization_id uuid,
    action_type character varying NOT NULL,
    resource_id uuid,
    resource_type character varying,
    resource_name character varying,
    ip_address character varying,
    metadata json,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    resource_data json
);

CREATE TABLE public.comment_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    comment_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid NOT NULL,
    app_versions_id uuid,
    organization_id uuid NOT NULL,
    comment character varying NOT NULL,
    is_read boolean DEFAULT false,
    user_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.component_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    component_id uuid NOT NULL,
    type public.component_permissions_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.component_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    component_permissions_id uuid NOT NULL,
    user_id uuid,
    permission_groups_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.components (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    type character varying NOT NULL,
    page_id uuid NOT NULL,
    parent character varying,
    properties json,
    general_properties json,
    styles json,
    general_styles json,
    display_preferences json,
    validation json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    co_relation_id uuid
);

CREATE TABLE public.credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    value_ciphertext character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.custom_domains (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    domain character varying(255) NOT NULL,
    provider_hostname_id character varying(255),
    status public.custom_domains_status_enum DEFAULT 'pending_verification'::public.custom_domains_status_enum NOT NULL,
    ssl_status character varying(50),
    verification_errors jsonb,
    cname_target character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.custom_styles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    styles character varying NOT NULL,
    scope public.custom_styles_scope_enum DEFAULT 'workspace'::public.custom_styles_scope_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.data_queries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data_source_id uuid,
    name character varying,
    options json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    co_relation_id uuid,
    app_version_id uuid
);

CREATE TABLE public.data_query_folder_mappings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    parent_id uuid,
    child_id uuid NOT NULL,
    child_type public.data_query_folder_mappings_child_type_enum NOT NULL,
    index integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    co_relation_id uuid
);

CREATE TABLE public.data_query_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    app_version_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    co_relation_id uuid
);

CREATE TABLE public.data_source_group_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data_source_id uuid NOT NULL,
    group_permission_id uuid NOT NULL,
    read boolean DEFAULT false NOT NULL,
    update boolean DEFAULT false NOT NULL,
    delete boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.data_source_user_oauth2s (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    data_source_id uuid NOT NULL,
    options_ciphertext character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.data_source_version_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data_source_version_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    options jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.data_source_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data_source_id uuid NOT NULL,
    version_from_id uuid,
    is_default boolean DEFAULT false NOT NULL,
    name character varying(255) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    meta_timestamp numeric(15,0) DEFAULT NULL::numeric,
    branch_id uuid,
    pulled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT data_source_versions_default_branch_null_check CHECK (((NOT is_default) OR (branch_id IS NULL))),
    CONSTRAINT data_source_versions_default_must_be_active_check CHECK (((NOT is_default) OR is_active))
);

CREATE TABLE public.data_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    kind character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    app_version_id uuid,
    plugin_id uuid,
    organization_id uuid,
    type public.type DEFAULT 'default'::public.type NOT NULL,
    scope public.scope DEFAULT 'local'::public.scope NOT NULL,
    co_relation_id uuid,
    is_dummy boolean DEFAULT false NOT NULL,
    CONSTRAINT chk_global_data_source_app_version_id CHECK (((scope <> 'global'::public.scope) OR (app_version_id IS NULL))),
    CONSTRAINT chk_static_type_global_scope CHECK (((type <> 'static'::public.type) OR (scope = 'global'::public.scope)))
);

CREATE TABLE public.data_sources_group_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    granular_permission_id uuid,
    can_configure boolean DEFAULT false,
    can_use boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.event_handlers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    index integer NOT NULL,
    event jsonb NOT NULL,
    app_version_id uuid NOT NULL,
    source_id character varying NOT NULL,
    target public.event_handlers_target_enum DEFAULT 'page'::public.event_handlers_target_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    co_relation_id uuid
);

CREATE TABLE public.files (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data bytea NOT NULL,
    filename character varying NOT NULL
);

CREATE TABLE public.folder_apps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folder_id uuid NOT NULL,
    app_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    branch_id uuid
);

CREATE TABLE public.folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying,
    organization_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    type character varying DEFAULT 'front-end'::character varying NOT NULL,
    created_by uuid
);

CREATE TABLE public.folders_group_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    granular_permission_id uuid NOT NULL,
    can_edit_folder boolean DEFAULT false,
    can_edit_apps boolean DEFAULT false,
    can_view_apps boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.granular_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid,
    name character varying(50) NOT NULL,
    type public.resource_type NOT NULL,
    is_all boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.group_admins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.group_apps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    app_id uuid,
    apps_group_permissions_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.group_data_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data_source_id uuid,
    data_sources_group_permissions_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.group_folders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    folder_id uuid,
    folders_group_permissions_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.group_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    group_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.instance_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying NOT NULL,
    value character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    label character varying,
    label_key character varying,
    data_type character varying,
    helper_text character varying,
    helper_text_key character varying,
    type public.settings_type DEFAULT 'user'::public.settings_type NOT NULL
);

CREATE TABLE public.internal_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    table_name character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    configurations jsonb DEFAULT '{"columns": {"column_names": {}, "configurations": {}}}'::jsonb NOT NULL,
    co_relation_id uuid
);

CREATE TABLE public.layouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type public.layout_type NOT NULL,
    top double precision,
    "left" double precision,
    width double precision,
    height double precision,
    component_id uuid NOT NULL,
    dimension_unit public.dimension_unit DEFAULT 'percent'::public.dimension_unit NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    co_relation_id uuid,
    width_px double precision,
    fill_width boolean
);

CREATE TABLE public.metadata (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;

CREATE TABLE public.module_origin_branch_staging (
    app_id uuid NOT NULL,
    origin_branch_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.notification_recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notification_id uuid NOT NULL,
    user_id uuid NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    type public.notification_type NOT NULL,
    title character varying NOT NULL,
    body text,
    link character varying,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.onboarding_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.org_environment_constant_values (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_constant_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    value character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.org_environment_variables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    variable_name character varying NOT NULL,
    value character varying NOT NULL,
    variable_type public.variable_type NOT NULL,
    encrypted boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.organization_ai_credit_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    amount numeric(12,2),
    ai_credits numeric(12,2) DEFAULT 0 NOT NULL,
    operation character varying(50) NOT NULL,
    wallet_type public.wallet_type_enum NOT NULL,
    transaction_type public.transaction_type_enum NOT NULL,
    status public.transaction_status_enum NOT NULL,
    organization_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.organization_ai_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    encrypted_key text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    provider character varying(50) DEFAULT 'anthropic'::character varying NOT NULL,
    CONSTRAINT chk_organization_ai_keys_provider CHECK (((provider)::text = ANY (ARRAY[('anthropic'::character varying)::text, ('gemini'::character varying)::text, ('tooljet_managed'::character varying)::text])))
);

CREATE TABLE public.organization_constants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    constant_name character varying NOT NULL,
    organization_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    type public."OrganizationConstantType" DEFAULT 'Global'::public."OrganizationConstantType" NOT NULL
);

CREATE TABLE public.organization_git_https (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_id uuid NOT NULL,
    https_url character varying NOT NULL,
    github_branch character varying NOT NULL,
    github_app_id character varying NOT NULL,
    github_installation_id character varying NOT NULL,
    github_enterprise_url character varying,
    github_enterprise_api_url character varying,
    github_private_key text NOT NULL,
    is_finalized boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_enabled boolean DEFAULT false
);

CREATE TABLE public.organization_git_ssh (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_id uuid NOT NULL,
    git_url character varying NOT NULL,
    ssh_private_key character varying NOT NULL,
    ssh_public_key character varying NOT NULL,
    key_type public.ssh_key_type DEFAULT 'ed25519'::public.ssh_key_type NOT NULL,
    is_finalized boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_enabled boolean DEFAULT false,
    git_branch character varying DEFAULT 'main'::character varying NOT NULL
);

CREATE TABLE public.organization_git_sync (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    auto_commit boolean DEFAULT false NOT NULL,
    is_branching_enabled boolean DEFAULT true NOT NULL,
    schema_version character varying DEFAULT '1.0.0'::character varying NOT NULL,
    use_env_config boolean DEFAULT false NOT NULL
);

CREATE TABLE public.organization_git_sync_branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    branch_name character varying(255) NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    source_branch_id uuid,
    app_meta_hash character varying(64) DEFAULT NULL::character varying,
    data_source_meta_hash character varying(64) DEFAULT NULL::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by character varying(255) DEFAULT NULL::character varying,
    module_meta_hash character varying(64) DEFAULT NULL::character varying
);

CREATE TABLE public.organization_gitlab (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_id uuid NOT NULL,
    gitlab_url character varying NOT NULL,
    gitlab_branch character varying NOT NULL,
    gitlab_project_id character varying NOT NULL,
    gitlab_project_access_token text,
    gitlab_enterprise_url character varying,
    is_finalized boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_enabled boolean DEFAULT false
);

CREATE TABLE public.organization_license (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    license_type public.license_type NOT NULL,
    expiry_date timestamp without time zone NOT NULL,
    license_key character varying,
    terms json NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expiry_with_grace_period timestamp without time zone NOT NULL,
    plan character varying(200) DEFAULT NULL::character varying
);

CREATE TABLE public.organization_subscription_invoices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying NOT NULL,
    invoice_id character varying,
    is_viewed boolean DEFAULT false NOT NULL,
    invoice_link character varying,
    paid_date timestamp with time zone,
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    invoice_due timestamp with time zone NOT NULL,
    status public.organization_subscription_invoices_status_enum NOT NULL,
    type public.organization_subscription_invoices_type_enum NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    organization_id uuid NOT NULL,
    organization_subscription_id uuid NOT NULL,
    user_id uuid NOT NULL
);

CREATE TABLE public.organization_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    subscription_id character varying NOT NULL,
    customer_id character varying NOT NULL,
    no_of_editors integer NOT NULL,
    no_of_readers integer NOT NULL,
    status public.subscription_status DEFAULT 'incomplete'::public.subscription_status NOT NULL,
    email character varying NOT NULL,
    company_name character varying NOT NULL,
    is_license_generated boolean DEFAULT false NOT NULL,
    subscription_type public.subscription_type NOT NULL,
    mode public.stripe_mode NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    plan character varying(200) DEFAULT NULL::character varying
);

CREATE TABLE public.organization_themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    organization_id uuid NOT NULL,
    definition json NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_basic boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.organization_tjdb_configurations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    pg_user character varying NOT NULL,
    pg_password character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.organization_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying NOT NULL,
    status character varying DEFAULT 'invited'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    invitation_token character varying,
    source public.source DEFAULT 'invite'::public.source NOT NULL,
    invitation_token_expiry timestamp with time zone
);

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying,
    domain character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    enable_sign_up boolean DEFAULT false NOT NULL,
    inherit_sso boolean DEFAULT true NOT NULL,
    slug character varying(50),
    owner_id uuid,
    status public.workspace_status DEFAULT 'active'::public.workspace_status NOT NULL,
    automatic_sso_login boolean DEFAULT false NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    last_accessed_at timestamp without time zone DEFAULT now() NOT NULL,
    password_allowed_domains character varying,
    password_restricted_domains character varying
);

CREATE TABLE public.organizations_ai_feature (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    balance numeric(12,2) NOT NULL,
    expiry_date timestamp without time zone,
    balance_renewed_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    wallet_type public.wallet_type_enum NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL
);

CREATE TABLE public.organizations_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    user_id uuid NOT NULL,
    subscription_id character varying NOT NULL,
    invoice_id character varying NOT NULL,
    invoice_paid_date timestamp without time zone NOT NULL,
    no_of_editors integer NOT NULL,
    no_of_readers integer NOT NULL,
    payment_status public.stripe_payment_status DEFAULT 'failed'::public.stripe_payment_status NOT NULL,
    email character varying NOT NULL,
    company_name character varying NOT NULL,
    is_license_generated boolean DEFAULT false NOT NULL,
    invoice_type public.stripe_invoice_type NOT NULL,
    subscription_type public.cloud_subscription_type NOT NULL,
    mode public.stripe_mode NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.page_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_id uuid NOT NULL,
    type public.page_permissions_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.page_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_permissions_id uuid NOT NULL,
    user_id uuid,
    permission_groups_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying NOT NULL,
    index integer NOT NULL,
    page_handle character varying NOT NULL,
    disabled boolean,
    app_version_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    auto_compute_layout boolean DEFAULT false NOT NULL,
    icon character varying,
    page_group_index integer,
    page_group_id character varying,
    is_page_group boolean DEFAULT false NOT NULL,
    url character varying,
    open_in public.page_open_in_enum DEFAULT 'new_tab'::public.page_open_in_enum NOT NULL,
    type public.page_type_enum DEFAULT 'default'::public.page_type_enum NOT NULL,
    app_id character varying DEFAULT ''::character varying NOT NULL,
    co_relation_id uuid,
    page_header jsonb,
    page_footer jsonb,
    target_corelation_id uuid,
    hidden jsonb
);

CREATE TABLE public.permission_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(50) NOT NULL,
    type public.group_permissions_type DEFAULT 'custom'::public.group_permissions_type NOT NULL,
    app_create boolean DEFAULT false,
    app_delete boolean DEFAULT false,
    org_constant_crud boolean DEFAULT false,
    data_source_create boolean DEFAULT false,
    data_source_delete boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    workflow_create boolean DEFAULT false NOT NULL,
    workflow_delete boolean DEFAULT false NOT NULL,
    app_promote boolean DEFAULT false NOT NULL,
    app_release boolean DEFAULT false NOT NULL,
    folder_create boolean DEFAULT false NOT NULL,
    folder_delete boolean DEFAULT false NOT NULL,
    tjdb_crud boolean DEFAULT false NOT NULL,
    module_create boolean DEFAULT false NOT NULL,
    module_delete boolean DEFAULT false NOT NULL
);

CREATE TABLE public.plugins (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plugin_id character varying NOT NULL,
    name character varying NOT NULL,
    repo character varying NOT NULL,
    description character varying NOT NULL,
    version character varying NOT NULL,
    index_file_id uuid NOT NULL,
    operations_file_id uuid NOT NULL,
    icon_file_id uuid NOT NULL,
    manifest_file_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    spec_files_map jsonb
);

CREATE TABLE public.query_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query_id uuid NOT NULL,
    type public.query_permissions_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.query_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query_permissions_id uuid NOT NULL,
    user_id uuid,
    permission_groups_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.selfhost_customer_licenses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(200) NOT NULL,
    license_key character varying(20000) NOT NULL,
    company_name character varying(200) NOT NULL,
    customer_id character varying(200) NOT NULL,
    license_type public.selfhost_customer_licenses_license_type_enum DEFAULT 'trial'::public.selfhost_customer_licenses_license_type_enum NOT NULL,
    hostname character varying(500) NOT NULL,
    subpath character varying(200),
    other_data json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.selfhost_customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    license_key character varying(10000) NOT NULL,
    host_name character varying(255) NOT NULL,
    subpath character varying(255) NOT NULL,
    license_type character varying(255) NOT NULL,
    expiry_date timestamp without time zone NOT NULL,
    users integer NOT NULL,
    builders integer NOT NULL,
    end_users integer NOT NULL,
    super_admin integer NOT NULL,
    license_details json NOT NULL,
    other_data json NOT NULL,
    metadata_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ai_api_key character varying(255) DEFAULT NULL::character varying
);

CREATE TABLE public.selfhost_customers_ai_credit_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    amount numeric(12,2),
    ai_credits numeric(12,2) DEFAULT 0 NOT NULL,
    operation character varying(50) NOT NULL,
    wallet_type public.wallet_type_enum NOT NULL,
    transaction_type public.transaction_type_enum NOT NULL,
    status public.transaction_status_enum NOT NULL,
    selfhost_customer_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.selfhost_customers_ai_feature (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    selfhost_customer_id uuid NOT NULL,
    balance numeric(12,2) NOT NULL,
    expiry_date timestamp without time zone,
    balance_renewed_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    wallet_type public.wallet_type_enum NOT NULL,
    total_amount numeric(12,2) DEFAULT 0 NOT NULL
);

CREATE TABLE public.sso_config_oidc_group_sync (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sso_config_id uuid NOT NULL,
    organization_id uuid,
    claim_name character varying,
    group_mapping jsonb,
    enable_group_sync boolean,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.sso_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    sso public.sso_type_enum NOT NULL,
    configs json,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    config_scope public.config_scope_enum DEFAULT 'organization'::public.config_scope_enum NOT NULL
);

CREATE TABLE public.sso_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sso character varying NOT NULL,
    response text NOT NULL,
    config_id uuid NOT NULL,
    expiry timestamp without time zone DEFAULT (CURRENT_TIMESTAMP + '00:15:00'::interval) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.threads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    x character varying,
    y character varying,
    app_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    app_versions_id uuid,
    user_id uuid,
    is_resolved boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    page_id character varying
);

CREATE TABLE public.user_ban_list (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying NOT NULL,
    info jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_details (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sso_user_info json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    user_metadata character varying(30000),
    organization_id uuid NOT NULL
);

CREATE TABLE public.user_mfa (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier character varying NOT NULL,
    type character varying DEFAULT 'email_otp'::character varying NOT NULL,
    resend_count integer DEFAULT 0 NOT NULL,
    last_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.user_personal_access_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    app_id uuid,
    token_hash character varying(256) NOT NULL,
    scope public.user_personal_access_tokens_scope_enum NOT NULL,
    session_expiry_minutes integer DEFAULT 60 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL
);

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device character varying DEFAULT 'unknown'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expiry timestamp without time zone NOT NULL,
    last_logged_in timestamp without time zone DEFAULT now() NOT NULL,
    session_type public.user_sessions_session_type_enum DEFAULT 'user'::public.user_sessions_session_type_enum NOT NULL,
    pat_id uuid
);

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name character varying,
    last_name character varying,
    email character varying,
    password_digest character varying,
    invitation_token character varying,
    forgot_password_token character varying,
    organization_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    role character varying DEFAULT ''::character varying NOT NULL,
    avatar_id uuid,
    password_retry_count smallint DEFAULT 0 NOT NULL,
    company_size character varying,
    company_name character varying,
    status public.status DEFAULT 'invited'::public.status NOT NULL,
    source public.source DEFAULT 'invite'::public.source NOT NULL,
    user_type public.user_type DEFAULT 'workspace'::public.user_type NOT NULL,
    phone_number character varying,
    onboarding_status public.onboarding_status_enum DEFAULT 'not_started'::public.onboarding_status_enum NOT NULL,
    auto_activated boolean DEFAULT false NOT NULL,
    invitation_token_expiry timestamp with time zone,
    forgot_password_token_expiry timestamp with time zone,
    password_expiry timestamp with time zone,
    expired_password_token character varying
);

CREATE TABLE public.white_labelling (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid,
    text character varying(50),
    logo character varying(1024),
    favicon character varying(1024),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    status public.white_labelling_status_enum DEFAULT 'ACTIVE'::public.white_labelling_status_enum NOT NULL,
    banner_image character varying(1024)
);

CREATE TABLE public.workflow_bundles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    app_version_id uuid NOT NULL,
    dependencies text NOT NULL,
    bundle_content text,
    bundle_size integer,
    bundle_sha character varying(64),
    generation_time_ms integer,
    error text,
    status character varying(20) DEFAULT 'none'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    language character varying(20) DEFAULT 'javascript'::character varying NOT NULL,
    runtime_version character varying(20),
    bundle_binary bytea
);

CREATE TABLE public.workflow_execution_edges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_on_workflow_definition character varying NOT NULL,
    source_workflow_execution_node_id uuid NOT NULL,
    target_workflow_execution_node_id uuid NOT NULL,
    source_handle character varying,
    workflow_execution_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.workflow_execution_nodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    type character varying DEFAULT false NOT NULL,
    id_on_workflow_definition character varying NOT NULL,
    definition json NOT NULL,
    executed boolean DEFAULT false NOT NULL,
    result character varying DEFAULT false,
    state json,
    workflow_execution_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

CREATE TABLE public.workflow_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    executing_user_id uuid,
    app_version_id uuid NOT NULL,
    executed boolean DEFAULT false NOT NULL,
    logs json,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    start_node_id uuid,
    status character varying DEFAULT 'success'::character varying NOT NULL
);

CREATE TABLE public.workflow_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    active boolean DEFAULT false NOT NULL,
    environment_id uuid NOT NULL,
    type character varying DEFAULT 'interval'::character varying NOT NULL,
    timezone character varying NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE public.workspace_ban_list (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    info jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);

INSERT INTO public.app_environments VALUES
	('6ffa73fc-57f9-4384-9132-e6e261ef8cf0', 'development', false, '2026-10-28 17:15:09.456', '2026-10-28 17:15:09.456', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 1, true),
	('88fd0e2b-afb0-4a4f-912d-65bf2152712b', 'staging', false, '2026-10-28 17:15:09.458', '2026-10-28 17:15:09.458', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 2, true),
	('52108afe-1776-4dcf-875a-834661c64263', 'production', true, '2026-10-28 17:15:09.459', '2026-10-28 17:15:09.459', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 3, true),
	('8ba17658-22fc-48d7-a315-0450a232c2a1', 'development', false, '2026-10-28 17:15:09.807', '2026-10-28 17:15:09.807', '8b930517-7801-4b07-bd19-7eea1b3beabd', 1, true),
	('49105c82-d28f-4a76-95c6-28101a0760f1', 'staging', false, '2026-10-28 17:15:09.807', '2026-10-28 17:15:09.807', '8b930517-7801-4b07-bd19-7eea1b3beabd', 2, true),
	('1070416b-edb6-4b4d-bd77-84027ee86ca2', 'production', true, '2026-10-28 17:15:09.808', '2026-10-28 17:15:09.808', '8b930517-7801-4b07-bd19-7eea1b3beabd', 3, true);

INSERT INTO public.app_history VALUES
	('e182d45b-047c-49b7-95ee-c63428a99a35', '2a03cb23-f76a-4708-a713-1ffc90c46bbb', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 1, NULL, 'snapshot', 'initial_snapshot', NULL, 'Initial app state', '{"pages": {"0c0ff636-cf85-4d37-9d80-5d98f74852d2": {"id": "0c0ff636-cf85-4d37-9d80-5d98f74852d2", "url": null, "icon": null, "name": "Home", "type": "default", "appId": "8dcf0e44-b815-4c8f-9047-0ed6af021a0e", "index": 1, "handle": "home", "hidden": false, "openIn": "new_tab", "disabled": false, "pageHeader": null, "isPageGroup": false, "pageGroupId": null, "pageGroupIndex": null, "autoComputeLayout": true, "targetCorelationId": null}}, "layouts": {}, "queries": {}, "version": {"id": "2a03cb23-f76a-4708-a713-1ffc90c46bbb", "name": "v1", "definition": null, "homePageId": "0c0ff636-cf85-4d37-9d80-5d98f74852d2", "pageSettings": null, "globalSettings": {"appMode": "light", "canvasMaxWidth": 100, "canvasMaxHeight": 2400, "appInMaintenance": false, "backgroundFxQuery": "", "canvasMaxWidthType": "%", "canvasBackgroundColor": "var(--cc-appBackground-surface)"}}, "components": {}, "queryFolders": {}, "eventHandlers": {}, "queryFolderMappings": {}}', false, '2026-10-28 11:45:09.962292+00', '2026-10-28 11:45:09.962292+00'),
	('4af3a296-2e01-4ad2-ab14-d1554b83cccf', '9df57db2-562e-450c-8c1c-fdd166fb742d', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 1, NULL, 'snapshot', 'initial_snapshot', NULL, 'Initial app state', '{"pages": {"d816915e-c1a0-4a49-b724-75a9a13966c0": {"id": "d816915e-c1a0-4a49-b724-75a9a13966c0", "url": null, "icon": null, "name": "Home", "type": "default", "appId": "cfeab0fe-4b83-49a4-8111-d945029c8404", "index": 1, "handle": "home", "hidden": false, "openIn": "new_tab", "disabled": false, "pageHeader": null, "isPageGroup": false, "pageGroupId": null, "pageGroupIndex": null, "autoComputeLayout": true, "targetCorelationId": null}}, "layouts": {}, "queries": {"5bd92e49-67b0-46cb-94c5-f65bf7d1cb62": {"id": "5bd92e49-67b0-46cb-94c5-f65bf7d1cb62", "name": "q_select", "options": {"mode": "sql", "query": "select 1 as x"}, "dataSourceId": "9867e0d2-4260-469f-a184-eefae5ca3174"}}, "version": {"id": "9df57db2-562e-450c-8c1c-fdd166fb742d", "name": "v1", "definition": null, "homePageId": "d816915e-c1a0-4a49-b724-75a9a13966c0", "pageSettings": null, "globalSettings": {"appMode": "light", "canvasMaxWidth": 100, "canvasMaxHeight": 2400, "appInMaintenance": false, "backgroundFxQuery": "", "canvasMaxWidthType": "%", "canvasBackgroundColor": "var(--cc-appBackground-surface)"}}, "components": {}, "queryFolders": {}, "eventHandlers": {}, "queryFolderMappings": {"a6e2c03f-9e6c-4578-8687-af8f3163b4b9": {"id": "a6e2c03f-9e6c-4578-8687-af8f3163b4b9", "index": 0, "childId": "5bd92e49-67b0-46cb-94c5-f65bf7d1cb62", "parentId": null, "childType": "query"}}}', false, '2026-10-28 11:45:10.656678+00', '2026-10-28 11:45:10.656678+00'),
	('a106777e-5780-4b65-b5cb-63e2cfabfe0b', '9df57db2-562e-450c-8c1c-fdd166fb742d', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 2, '4af3a296-2e01-4ad2-ab14-d1554b83cccf', 'delta', 'query_add', NULL, 'Added query q_select', '{"changes": [{"id": "5bd92e49-67b0-46cb-94c5-f65bf7d1cb62", "op": "add", "value": {"id": "5bd92e49-67b0-46cb-94c5-f65bf7d1cb62", "name": "q_select", "options": {"mode": "sql", "query": "select 1 as x"}, "dataSourceId": "9867e0d2-4260-469f-a184-eefae5ca3174"}, "entity": "query"}, {"id": "a6e2c03f-9e6c-4578-8687-af8f3163b4b9", "op": "add", "value": {"id": "a6e2c03f-9e6c-4578-8687-af8f3163b4b9", "index": 0, "childId": "5bd92e49-67b0-46cb-94c5-f65bf7d1cb62", "parentId": null, "childType": "query"}, "entity": "queryFolderMapping"}], "metadata": {"actionType": "query_add", "description": "Added query q_select", "affectedEntities": ["5bd92e49-67b0-46cb-94c5-f65bf7d1cb62", "a6e2c03f-9e6c-4578-8687-af8f3163b4b9"]}}', false, '2026-10-28 11:45:10.656678+00', '2026-10-28 11:45:10.656678+00'),
	('c8460d74-cb99-460d-b985-622fb2640f03', '00e2fada-ac33-4f18-a3a7-0b517e61e413', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 1, NULL, 'snapshot', 'initial_snapshot', NULL, 'Initial app state', '{"pages": {"5115aedc-9579-4053-b652-a3a77d20a7ab": {"id": "5115aedc-9579-4053-b652-a3a77d20a7ab", "url": null, "icon": null, "name": "Home", "type": "default", "appId": "7367e177-0da4-4f96-a526-a60cc9f1fc30", "index": 1, "handle": "home", "hidden": false, "openIn": "new_tab", "disabled": false, "pageHeader": null, "isPageGroup": false, "pageGroupId": null, "pageGroupIndex": null, "autoComputeLayout": true, "targetCorelationId": null}}, "layouts": {}, "queries": {}, "version": {"id": "00e2fada-ac33-4f18-a3a7-0b517e61e413", "name": "v1", "definition": null, "homePageId": "5115aedc-9579-4053-b652-a3a77d20a7ab", "pageSettings": null, "globalSettings": {"appMode": "light", "canvasMaxWidth": 100, "canvasMaxHeight": 2400, "appInMaintenance": false, "backgroundFxQuery": "", "canvasMaxWidthType": "%", "canvasBackgroundColor": "var(--cc-appBackground-surface)"}}, "components": {}, "queryFolders": {}, "eventHandlers": {}, "queryFolderMappings": {}}', false, '2026-10-28 11:45:12.026525+00', '2026-10-28 11:45:12.026525+00'),
	('332b3d8c-10e9-4032-a0cf-0e5d6d8aef02', '9df57db2-562e-450c-8c1c-fdd166fb742d', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 3, '4af3a296-2e01-4ad2-ab14-d1554b83cccf', 'delta', 'initial_snapshot', NULL, 'Initial app state', '{"changes": [], "metadata": {"actionType": "initial_snapshot", "description": "Initial app state", "affectedEntities": []}}', false, '2026-10-28 11:45:12.629927+00', '2026-10-28 11:45:12.629927+00'),
	('11233c44-9e40-4d00-878a-e9fc2e116ee9', 'e9df0342-efa3-4f60-b232-2c89defc7464', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 1, NULL, 'snapshot', 'initial_snapshot', NULL, 'Initial app state', '{"pages": {"e1c58128-07fc-4d33-a4cf-d6bc0faaf178": {"id": "e1c58128-07fc-4d33-a4cf-d6bc0faaf178", "url": null, "icon": null, "name": "Home", "type": "default", "appId": "0064fd95-e413-42ba-9261-e6ee88d2cd15", "index": 1, "handle": "home", "hidden": false, "openIn": "new_tab", "disabled": false, "pageHeader": null, "isPageGroup": false, "pageGroupId": null, "pageGroupIndex": null, "autoComputeLayout": true, "targetCorelationId": null}}, "layouts": {}, "queries": {}, "version": {"id": "e9df0342-efa3-4f60-b232-2c89defc7464", "name": "df169a32-40ad-4786-a084-55faff655332", "definition": {}, "homePageId": "e1c58128-07fc-4d33-a4cf-d6bc0faaf178", "pageSettings": {}, "globalSettings": {"appMode": "light", "canvasMaxWidth": 100, "canvasMaxHeight": 2400, "appInMaintenance": false, "backgroundFxQuery": "", "canvasMaxWidthType": "%", "canvasBackgroundColor": "var(--cc-appBackground-surface)"}}, "components": {}, "queryFolders": {}, "eventHandlers": {}, "queryFolderMappings": {}}', false, '2026-10-28 11:45:13.135397+00', '2026-10-28 11:45:13.135397+00'),
	('78ef63a1-130f-4b48-8653-0ebb1547687c', '2a03cb23-f76a-4708-a713-1ffc90c46bbb', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 2, 'e182d45b-047c-49b7-95ee-c63428a99a35', 'delta', 'query_add', NULL, 'Added query q_select', '{"changes": [{"id": "451137b1-ffd2-4fe7-96ca-0c53f0ef168f", "op": "add", "value": {"id": "451137b1-ffd2-4fe7-96ca-0c53f0ef168f", "name": "q_select", "options": {"mode": "sql", "query": "select 1 as x"}, "dataSourceId": "69dbfec8-ca9d-4a63-8b99-86899afe7f50"}, "entity": "query"}, {"id": "f5d60425-9b77-464a-9079-94c1e1816f99", "op": "add", "value": {"id": "f5d60425-9b77-464a-9079-94c1e1816f99", "index": 0, "childId": "451137b1-ffd2-4fe7-96ca-0c53f0ef168f", "parentId": null, "childType": "query"}, "entity": "queryFolderMapping"}], "metadata": {"actionType": "query_add", "description": "Added query q_select", "affectedEntities": ["451137b1-ffd2-4fe7-96ca-0c53f0ef168f", "f5d60425-9b77-464a-9079-94c1e1816f99"]}}', false, '2026-10-28 11:45:16.165677+00', '2026-10-28 11:45:16.165677+00');

INSERT INTO public.app_versions VALUES
	('83e0e06a-ee44-4553-82d0-88dac3c33be7', 'v1', NULL, '2aabf571-7291-4b4b-922f-eee12fc6582a', '2026-10-28 17:15:10.613', '2026-10-28 11:46:00.965481', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, '0ddb6c99-5263-426b-8eb9-2710a85d7fa0', NULL, NULL, NULL, 'PUBLISHED', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
	('5821cd4c-dc87-4e31-b92f-ad573cdbeeea', 'bc6d6cb4-114e-4226-ab6b-1ec68c8b8f36', NULL, '804238b6-0d6e-4363-a59b-50f9d89f8fcf', '2026-10-28 17:15:10.595', '2026-10-28 11:46:00.624723', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', false, 'd1702491-7abd-4eab-a395-c6e569851e61', NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, '31b785c9-8f44-4954-aaac-f60c4cd25148', NULL, '26f39078-c7cb-45b9-af29-861913c24489', '804238b6-0d6e-4363-a59b-50f9d89f8fcf', 'Module giton', 'home', false, '2026-10-28 11:46:41.846583'),
	('e9df0342-efa3-4f60-b232-2c89defc7464', 'df169a32-40ad-4786-a084-55faff655332', '{}', '0064fd95-e413-42ba-9261-e6ee88d2cd15', '2026-10-28 17:15:11.098', '2026-10-28 11:46:01.602908', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, 'e1c58128-07fc-4d33-a4cf-d6bc0faaf178', NULL, '{}', NULL, 'DRAFT', NULL, NULL, NULL, 'branch', NULL, NULL, NULL, false, '5b0b484a-ed07-4d19-b6f9-e3903783e141', NULL, NULL, '0064fd95-e413-42ba-9261-e6ee88d2cd15', 'Feature giton', 'home', false, NULL),
	('30a2a311-5ea4-46cc-a3bb-f5a0915701b5', '841e3541-d966-48f1-9d07-7284c840a88b', NULL, 'cfeab0fe-4b83-49a4-8111-d945029c8404', '2026-10-28 17:15:10.553', '2026-10-28 17:15:10.809', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, 'd816915e-c1a0-4a49-b724-75a9a13966c0', NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, '31b785c9-8f44-4954-aaac-f60c4cd25148', NULL, NULL, 'cfeab0fe-4b83-49a4-8111-d945029c8404', 'Released giton', 'home', false, '2026-10-28 11:46:41.846583'),
	('cec07005-b8a8-4c10-a7e2-735cbf791b36', 'v2', NULL, 'cfeab0fe-4b83-49a4-8111-d945029c8404', '2026-10-28 17:15:11.149', '2026-10-28 11:45:11.149448', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, 'fb0531db-191e-48c7-91a2-fd4a02108eaa', NULL, NULL, '9df57db2-562e-450c-8c1c-fdd166fb742d', 'DRAFT', NULL, NULL, NULL, 'version', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'baf67f94-617c-473c-be63-7d7ddb71a0ff', NULL, false, NULL, NULL, NULL, 'cfeab0fe-4b83-49a4-8111-d945029c8404', 'Released giton', 'home', false, NULL),
	('2a03cb23-f76a-4708-a713-1ffc90c46bbb', 'v1', NULL, '8dcf0e44-b815-4c8f-9047-0ed6af021a0e', '2026-10-28 17:15:09.941', '2026-10-28 11:46:11.254011', '52108afe-1776-4dcf-875a-834661c64263', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, '0c0ff636-cf85-4d37-9d80-5d98f74852d2', NULL, NULL, NULL, 'PUBLISHED', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, NULL, NULL, NULL, '8dcf0e44-b815-4c8f-9047-0ed6af021a0e', 'Released gitoff', 'home', false, NULL),
	('00e2fada-ac33-4f18-a3a7-0b517e61e413', 'v1', NULL, '7367e177-0da4-4f96-a526-a60cc9f1fc30', '2026-10-28 17:15:09.971', '2026-10-28 11:46:11.319328', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, '5115aedc-9579-4053-b652-a3a77d20a7ab', NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, NULL, NULL, NULL, '7367e177-0da4-4f96-a526-a60cc9f1fc30', 'Draft gitoff', 'home', false, NULL),
	('9df57db2-562e-450c-8c1c-fdd166fb742d', 'v1', NULL, 'cfeab0fe-4b83-49a4-8111-d945029c8404', '2026-10-28 17:15:10.553', '2026-10-28 17:15:10.809', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, 'd816915e-c1a0-4a49-b724-75a9a13966c0', NULL, NULL, NULL, 'PUBLISHED', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, NULL, NULL, NULL, 'cfeab0fe-4b83-49a4-8111-d945029c8404', 'Released giton', 'home', false, NULL),
	('27690053-b609-41d0-b0ca-ffb2f8df155d', 'v1', NULL, '804238b6-0d6e-4363-a59b-50f9d89f8fcf', '2026-10-28 17:15:10.595', '2026-10-28 11:46:00.624723', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', false, 'd1702491-7abd-4eab-a395-c6e569851e61', NULL, NULL, NULL, 'PUBLISHED', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, NULL, NULL, '26f39078-c7cb-45b9-af29-861913c24489', '804238b6-0d6e-4363-a59b-50f9d89f8fcf', 'Module giton', 'home', false, NULL),
	('e0a72ede-518f-4e03-b0cd-fccbfc072371', 'v1', NULL, 'bf4ddca6-357b-48c6-9b1c-785047ceae70', '2026-10-28 17:15:09.997', '2026-10-28 11:46:11.369911', '52108afe-1776-4dcf-875a-834661c64263', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', false, '1fa9285f-c049-44d2-9215-0b7a85d4ffe5', NULL, NULL, NULL, 'PUBLISHED', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, NULL, NULL, '9c4b5d71-5d7f-470a-849f-a3b51a7118f9', 'bf4ddca6-357b-48c6-9b1c-785047ceae70', 'Module gitoff', 'home', false, NULL),
	('ea3ea783-2dcd-455e-b5f8-4175ac817428', 'v1', NULL, '7c0994c4-8198-48a2-91af-bb12a566a3a2', '2026-10-28 17:15:10.576', '2026-10-28 11:46:00.864094', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, '7b3a34e3-6a26-4425-8488-65c16af9f89b', NULL, NULL, NULL, 'DRAFT', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, '31b785c9-8f44-4954-aaac-f60c4cd25148', NULL, NULL, '7c0994c4-8198-48a2-91af-bb12a566a3a2', 'Draft giton', 'home', false, NULL),
	('e56f8149-cc5f-409a-9e44-a8d8e33805fa', 'v1', NULL, '9b6eda5a-8748-4d54-8ba8-6a9031452f06', '2026-10-28 17:15:10.034', '2026-10-28 11:46:11.431768', '52108afe-1776-4dcf-875a-834661c64263', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, '5b1d3e7a-daab-445b-983b-491d85eb7dd3', NULL, NULL, NULL, 'PUBLISHED', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL);

INSERT INTO public.apps VALUES
	('7c0994c4-8198-48a2-91af-bb12a566a3a2', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.574', '2026-10-28 11:46:00.864094', NULL, false, 'front-end', 'DEFAULT', NULL, false, '95c9dfb3-a053-4c94-9634-252a022b1802', false, false, NULL, 'visual'),
	('2aabf571-7291-4b4b-922f-eee12fc6582a', 'Workflow giton', NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '83e0e06a-ee44-4553-82d0-88dac3c33be7', NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.611', '2026-10-28 11:46:00.965481', 'home', true, 'workflow', 'DEFAULT', '9a0f2a08-d98e-40a4-bb28-472194ac0107', false, 'cb1a5dd4-c1da-46ca-9987-18200da8fd1f', false, false, NULL, 'visual'),
	('0064fd95-e413-42ba-9261-e6ee88d2cd15', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:11.097', '2026-10-28 11:46:01.602908', NULL, false, 'front-end', 'DEFAULT', NULL, false, '92696df0-d212-4780-992d-d473d320de8a', false, false, NULL, 'visual'),
	('8dcf0e44-b815-4c8f-9047-0ed6af021a0e', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '2a03cb23-f76a-4708-a713-1ffc90c46bbb', NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:09.939', '2026-10-28 11:46:11.254011', NULL, false, 'front-end', 'DEFAULT', NULL, false, '9e13e34b-cc81-4fef-86ad-285bca453bc5', false, false, NULL, 'visual'),
	('7367e177-0da4-4f96-a526-a60cc9f1fc30', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:09.968', '2026-10-28 11:46:11.319328', NULL, false, 'front-end', 'DEFAULT', NULL, false, 'e3f06888-f944-4062-b3c0-02f2520f3004', false, false, NULL, 'visual'),
	('bf4ddca6-357b-48c6-9b1c-785047ceae70', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'e0a72ede-518f-4e03-b0cd-fccbfc072371', NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:09.994', '2026-10-28 11:46:11.369911', NULL, false, 'module', 'DEFAULT', NULL, false, '8754e504-3e25-45d3-95ff-6796a96cc8f9', false, false, NULL, 'visual'),
	('9b6eda5a-8748-4d54-8ba8-6a9031452f06', 'Workflow gitoff', NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'e56f8149-cc5f-409a-9e44-a8d8e33805fa', NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:10.031', '2026-10-28 11:46:11.431768', 'home', true, 'workflow', 'DEFAULT', '728c5846-ce69-4cc7-93d4-3fb62fb8b38b', false, '3501946e-c10c-422d-9fbc-52b594942d88', false, false, NULL, 'visual'),
	('804238b6-0d6e-4363-a59b-50f9d89f8fcf', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '27690053-b609-41d0-b0ca-ffb2f8df155d', NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.594', '2026-10-28 11:46:41.846583', NULL, false, 'module', 'DEFAULT', NULL, false, '790fe368-51d6-406e-941c-92a5c6cdd94d', false, false, NULL, 'visual'),
	('cfeab0fe-4b83-49a4-8111-d945029c8404', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '9df57db2-562e-450c-8c1c-fdd166fb742d', NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.552', '2026-10-28 11:46:41.846583', NULL, false, 'front-end', 'DEFAULT', NULL, false, 'baf67f94-617c-473c-be63-7d7ddb71a0ff', false, false, NULL, 'visual');

INSERT INTO public.apps_group_permissions VALUES
	('8724b865-0261-49a2-b7e2-12c14745e835', 'd5326592-5c91-496d-afb0-52dc80f2357f', false, true, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', 'front-end', false, false, false, true),
	('4d65b794-eb01-40bc-b0cc-b8e1323f298d', '18eb28ae-40ef-4f79-9d36-a284f736d740', false, true, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', 'workflow', true, true, true, true),
	('c2981009-9016-42d6-8ca1-b6095408971b', '36fbbe05-92c5-41e1-a3df-1d7ae3462106', true, false, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', 'front-end', true, true, true, true),
	('786ba919-59d0-4dcf-9183-b860fed035f4', '56e39bea-9cd5-422c-ae18-31bc85213a80', true, false, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', 'workflow', true, true, true, true),
	('9af3b0cd-9cc0-4b4a-ab70-5caab88ff6a8', '429866a5-0461-42ee-9778-96904d0db8f0', true, false, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', 'module', true, true, true, true),
	('a5885fe3-002b-4b8f-bd72-471aaff8f5f5', 'df77fa6f-5781-4a96-8c33-c77ab3b23974', true, false, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', 'front-end', true, true, false, true),
	('ac87c57e-b526-44a4-b31b-d2a75fe609f3', 'db57d495-55bf-42c3-b5fb-e78cdff2e0a3', true, false, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', 'workflow', true, true, true, true),
	('426b6475-2261-40a3-9745-b438913fd276', '82d8416e-7400-427a-b3c0-4b6510fcbcef', true, false, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', 'module', true, true, true, true),
	('1c520ed9-27d1-492e-8d30-5bfd94c562cf', '28706eca-cdeb-4700-9baa-07d67ae03328', false, true, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', 'front-end', false, false, false, true),
	('205037ad-df91-4c66-96b8-2646327ae99d', 'd9a4d38d-4852-499f-a9bb-dbe5f9471a64', false, true, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', 'workflow', true, true, true, true),
	('1fc99af0-0d26-4008-8834-72e4b7a44e00', 'b81e3ae0-3e19-4ae8-adc9-03f5fb7f524e', true, false, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', 'front-end', true, true, true, true),
	('e0f71b9c-32ea-4bc2-a47e-098ee57c9c30', '527687af-3dd3-4da8-bd42-0a27cf0234ca', true, false, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', 'workflow', true, true, true, true),
	('54ff8f3b-ae1c-421c-b05e-6ac0acddfeb6', '24ca9730-b9cd-4cdc-8c67-7454be276c7a', true, false, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', 'module', true, true, true, true),
	('7bcdbaa2-1f5d-4f8c-9002-0636ea986abd', '807a7a65-d92f-4489-91c1-c95d9838a7f0', true, false, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', 'front-end', true, true, false, true),
	('034e0b97-5bdd-4477-b6f7-a75a8c182a5f', 'd3852a0e-c410-4cc5-bc61-ac20d1f9d935', true, false, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', 'workflow', true, true, true, true),
	('26afadc5-6f6c-4287-bd2f-3f0646973505', '5fe86617-8684-4ee4-9644-51db59fdd85f', true, false, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', 'module', true, true, true, true);

INSERT INTO public.components VALUES
	('eef098e0-701b-48b8-bd1f-f61ce25c89a1', 'ModuleContainer', 'ModuleContainer', '1fa9285f-c049-44d2-9215-0b7a85d4ffe5', NULL, '{"inputItems":{"value":[]},"outputItems":{"value":[]},"visibility":{"value":"{{true}}"}}', '{}', '{"backgroundColor":{"value":"#fff"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{true}}"}}', '{}', '2026-10-28 11:45:09.993815', '2026-10-28 11:45:09.993815', NULL),
	('5e86d904-e978-4b84-9860-ad43b933aa48', 'ModuleContainer', 'ModuleContainer', 'd1702491-7abd-4eab-a395-c6e569851e61', NULL, '{"inputItems":{"value":[]},"outputItems":{"value":[]},"visibility":{"value":"{{true}}"}}', '{}', '{"backgroundColor":{"value":"#fff"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{true}}"}}', '{}', '2026-10-28 11:45:10.594367', '2026-10-28 11:45:10.594367', NULL);

INSERT INTO public.credentials VALUES
	('81608cb1-4834-4bd9-a593-9acabb48fc76', 'redacted', '2026-10-28 17:15:09.506', '2026-10-28 17:15:09.506'),
	('027fe569-c0db-4340-b78c-e20b5800b568', 'redacted', '2026-10-28 17:15:09.506', '2026-10-28 17:15:09.506'),
	('1c8dfce7-6bfa-42f2-83d7-1660dde0bb86', 'redacted', '2026-10-28 17:15:09.507', '2026-10-28 17:15:09.507'),
	('604c699f-ca5b-403d-93fe-1fe3f8c52f50', 'redacted', '2026-10-28 17:15:09.507', '2026-10-28 17:15:09.507'),
	('6219608b-64e0-49de-9fba-8b2517899a18', 'redacted', '2026-10-28 17:15:09.508', '2026-10-28 17:15:09.508'),
	('1536c0a4-5750-4a3c-bce2-4f6b3454bbd4', 'redacted', '2026-10-28 17:15:09.508', '2026-10-28 17:15:09.508'),
	('6938ccf0-407f-47ab-aecf-c67d50a9e9a9', 'redacted', '2026-10-28 17:15:09.508', '2026-10-28 17:15:09.508'),
	('42bcb431-850c-4522-aa65-6626aeecdef1', 'redacted', '2026-10-28 17:15:09.509', '2026-10-28 17:15:09.509'),
	('e405df31-d1e0-48d0-b934-080080a9c2f4', 'redacted', '2026-10-28 17:15:09.509', '2026-10-28 17:15:09.509'),
	('a1f4ae94-e8f5-448f-960e-e29f870aa73f', 'redacted', '2026-10-28 17:15:09.509', '2026-10-28 17:15:09.509'),
	('a9456c31-18fe-4410-a3fe-9148f3713833', 'redacted', '2026-10-28 17:15:09.51', '2026-10-28 17:15:09.51'),
	('092d5b07-8a2a-4365-8928-cfc718643c27', 'redacted', '2026-10-28 17:15:09.509', '2026-10-28 17:15:09.509'),
	('e1ba5033-7585-47b9-8729-0af22bdbfe5e', 'redacted', '2026-10-28 17:15:09.828', '2026-10-28 17:15:09.828'),
	('067788d4-1d38-45fd-b187-2e10006d2ee5', 'redacted', '2026-10-28 17:15:09.828', '2026-10-28 17:15:09.828'),
	('f0cd2f90-4c65-455d-8b9b-67706ed54cca', 'redacted', '2026-10-28 17:15:09.828', '2026-10-28 17:15:09.828'),
	('ca4e0e98-9c6b-4e5f-82fd-cf4ebcd97f0b', 'redacted', '2026-10-28 17:15:09.828', '2026-10-28 17:15:09.828'),
	('f361e1e2-71f1-46e3-bdca-e911479364e8', 'redacted', '2026-10-28 17:15:09.828', '2026-10-28 17:15:09.828'),
	('d5cdd1ff-04a8-41be-bd7a-8bf392c626a7', 'redacted', '2026-10-28 17:15:09.828', '2026-10-28 17:15:09.828'),
	('28e70384-d49a-4253-9cb8-ec84ccaab842', 'redacted', '2026-10-28 17:15:09.829', '2026-10-28 17:15:09.829'),
	('8b04e6f2-cae0-4a52-8dde-00e48d5d13a7', 'redacted', '2026-10-28 17:15:09.829', '2026-10-28 17:15:09.829'),
	('d70953ae-5e3a-4a92-a244-1bf12bbb5087', 'redacted', '2026-10-28 17:15:09.829', '2026-10-28 17:15:09.829'),
	('f3e56f79-eb30-49a5-b1a7-fde5e9fe72e3', 'redacted', '2026-10-28 17:15:09.829', '2026-10-28 17:15:09.829'),
	('0694a0f3-5292-4eba-a346-a0b8ef998886', 'redacted', '2026-10-28 17:15:09.829', '2026-10-28 17:15:09.829'),
	('e337f111-7b70-441f-8f7c-6db1c725b9e8', 'redacted', '2026-10-28 17:15:09.829', '2026-10-28 17:15:09.829'),
	('db7279c5-18ff-4cfe-afb4-d2636e6c3d80', 'redacted', '2026-10-28 17:15:09.917', '2026-10-28 17:15:09.917'),
	('db860f3a-b66d-46a4-a49f-8ce8bdeccb7d', 'redacted', '2026-10-28 17:15:09.919', '2026-10-28 17:15:09.919'),
	('0ad1bf9f-b257-4f56-8d2d-e99808733a43', 'redacted', '2026-10-28 17:15:09.919', '2026-10-28 17:15:09.919'),
	('83540e72-1562-4e47-b6ba-124d5fd5c161', 'redacted', '2026-10-28 17:15:10.538', '2026-10-28 17:15:10.538'),
	('1cffff65-e5d5-4d04-8919-85725a97adb2', 'redacted', '2026-10-28 17:15:10.539', '2026-10-28 17:15:10.539'),
	('4b294acf-2add-415c-a298-ab34a2b34470', 'redacted', '2026-10-28 17:15:10.539', '2026-10-28 17:15:10.539'),
	('80364f80-5688-4e5d-a88b-6c26b85aa24b', 'redacted', '2026-10-28 17:15:11.13', '2026-10-28 17:15:11.13'),
	('e44962d9-00f5-4166-a0ee-06572588dc16', 'redacted', '2026-10-28 17:15:11.131', '2026-10-28 17:15:11.131'),
	('728ba5f4-bb70-4ace-beaa-5c3f7a948c99', 'redacted', '2026-10-28 17:15:11.131', '2026-10-28 17:15:11.131');

INSERT INTO public.data_queries VALUES
	('451137b1-ffd2-4fe7-96ca-0c53f0ef168f', '69dbfec8-ca9d-4a63-8b99-86899afe7f50', 'q_select', '{"mode":"sql","query":"select 1 as x"}', '2026-10-28 17:15:10.082', '2026-10-28 17:15:10.082', NULL, '2a03cb23-f76a-4708-a713-1ffc90c46bbb'),
	('5bd92e49-67b0-46cb-94c5-f65bf7d1cb62', '9867e0d2-4260-469f-a184-eefae5ca3174', 'q_select', '{"mode":"sql","query":"select 1 as x"}', '2026-10-28 17:15:10.651', '2026-10-28 17:15:10.651', NULL, '9df57db2-562e-450c-8c1c-fdd166fb742d'),
	('427ae79c-40c3-4fa4-8cd4-d1e58d4ff95d', '9867e0d2-4260-469f-a184-eefae5ca3174', 'q_select', '{"mode":"sql","query":"select 1 as x"}', '2026-10-28 11:45:11.149448', '2026-10-28 11:45:11.149448', NULL, 'cec07005-b8a8-4c10-a7e2-735cbf791b36');

INSERT INTO public.data_query_folder_mappings VALUES
	('f5d60425-9b77-464a-9079-94c1e1816f99', NULL, '451137b1-ffd2-4fe7-96ca-0c53f0ef168f', 'query', 0, '2026-10-28 11:45:10.088203', '2026-10-28 11:45:10.088203', NULL),
	('a6e2c03f-9e6c-4578-8687-af8f3163b4b9', NULL, '5bd92e49-67b0-46cb-94c5-f65bf7d1cb62', 'query', 0, '2026-10-28 11:45:10.654296', '2026-10-28 11:45:10.654296', NULL),
	('2ff8248d-cd5b-4aec-ae3c-ac52f945cf48', NULL, '427ae79c-40c3-4fa4-8cd4-d1e58d4ff95d', 'query', 0, '2026-10-28 11:45:11.149448', '2026-10-28 11:45:11.149448', NULL);

INSERT INTO public.data_source_version_options VALUES
	('f3adbdca-52da-4594-8180-2154b85dff1e', 'a3ffacb1-ec7a-45f3-b60d-fdde52aa1b16', '88fd0e2b-afb0-4a4f-912d-65bf2152712b', '{"host": {"encrypted": true, "credential_id": "027fe569-c0db-4340-b78c-e20b5800b568"}, "port": {"encrypted": true, "credential_id": "6219608b-64e0-49de-9fba-8b2517899a18"}, "database": {"value": "sample_db", "encrypted": false}, "password": {"encrypted": true, "credential_id": "e405df31-d1e0-48d0-b934-080080a9c2f4"}, "username": {"encrypted": true, "credential_id": "6938ccf0-407f-47ab-aecf-c67d50a9e9a9"}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('0b29b820-d6fd-4df6-a525-16b0cc10cc05', 'a3ffacb1-ec7a-45f3-b60d-fdde52aa1b16', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{"host": {"encrypted": true, "credential_id": "81608cb1-4834-4bd9-a593-9acabb48fc76"}, "port": {"encrypted": true, "credential_id": "1536c0a4-5750-4a3c-bce2-4f6b3454bbd4"}, "database": {"value": "sample_db", "encrypted": false}, "password": {"encrypted": true, "credential_id": "a9456c31-18fe-4410-a3fe-9148f3713833"}, "username": {"encrypted": true, "credential_id": "a1f4ae94-e8f5-448f-960e-e29f870aa73f"}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('76836c2e-4cc7-448d-9a82-edd908f8401c', 'a3ffacb1-ec7a-45f3-b60d-fdde52aa1b16', '52108afe-1776-4dcf-875a-834661c64263', '{"host": {"encrypted": true, "credential_id": "1c8dfce7-6bfa-42f2-83d7-1660dde0bb86"}, "port": {"encrypted": true, "credential_id": "604c699f-ca5b-403d-93fe-1fe3f8c52f50"}, "database": {"value": "sample_db", "encrypted": false}, "password": {"encrypted": true, "credential_id": "092d5b07-8a2a-4365-8928-cfc718643c27"}, "username": {"encrypted": true, "credential_id": "42bcb431-850c-4522-aa65-6626aeecdef1"}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('559ec44d-5cc7-4f04-bb19-f1e4281da2e1', '060f4d4f-128e-4cc1-b22d-93f4a7a9f99e', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('6e91ee94-9f4d-4561-abfa-292f13a953d9', '060f4d4f-128e-4cc1-b22d-93f4a7a9f99e', '88fd0e2b-afb0-4a4f-912d-65bf2152712b', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('772ae57d-79ba-46ec-a148-4e5388cbb3a2', '060f4d4f-128e-4cc1-b22d-93f4a7a9f99e', '52108afe-1776-4dcf-875a-834661c64263', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('ad43743d-b6f1-4d8f-ba8f-a9c59a94702a', '3e640713-f441-434f-9455-a72b8a278158', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('10184499-612a-465d-81c1-6fcd626baa5e', '3e640713-f441-434f-9455-a72b8a278158', '88fd0e2b-afb0-4a4f-912d-65bf2152712b', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('caeee968-5c1b-4c78-a6b4-db073e702361', '3e640713-f441-434f-9455-a72b8a278158', '52108afe-1776-4dcf-875a-834661c64263', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('a4bebba2-72d4-4951-ba81-89607a0210f5', 'f7a2e310-baac-432a-b0ec-2d983c453e3b', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('b69d39f1-96f7-4d62-b93b-b8f1fc921fce', 'f7a2e310-baac-432a-b0ec-2d983c453e3b', '88fd0e2b-afb0-4a4f-912d-65bf2152712b', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('3a99bc2e-3ac7-42bc-b0b0-709cf26cf5ce', 'f7a2e310-baac-432a-b0ec-2d983c453e3b', '52108afe-1776-4dcf-875a-834661c64263', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('ce9ab790-586d-4c36-ab1d-7a5a3f69d0bb', '2cdaa077-ea59-4649-a730-46dcc2cfbcd4', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('89ac8493-3242-4929-bcac-96b74c9ace9c', '2cdaa077-ea59-4649-a730-46dcc2cfbcd4', '88fd0e2b-afb0-4a4f-912d-65bf2152712b', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('3b909693-4918-478f-9e3c-c675ce2e9da7', '2cdaa077-ea59-4649-a730-46dcc2cfbcd4', '52108afe-1776-4dcf-875a-834661c64263', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('d2903122-b8e7-4dd0-9ef1-540f17901afd', 'bc3f5d7e-dee8-45c9-aa95-6b0d8a921eaa', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('71fb3ba3-715e-4a3a-9d95-b2941005f5a9', 'bc3f5d7e-dee8-45c9-aa95-6b0d8a921eaa', '88fd0e2b-afb0-4a4f-912d-65bf2152712b', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('4c17a8fa-d8e5-4045-b971-23b3fe75b656', 'bc3f5d7e-dee8-45c9-aa95-6b0d8a921eaa', '52108afe-1776-4dcf-875a-834661c64263', '{}', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('35847a7f-2275-4559-a1c0-735fb4e0a252', '0f133aeb-4507-495e-a1c5-21ea9ebc7ffd', '49105c82-d28f-4a76-95c6-28101a0760f1', '{"host": {"encrypted": true, "credential_id": "e1ba5033-7585-47b9-8729-0af22bdbfe5e"}, "port": {"encrypted": true, "credential_id": "ca4e0e98-9c6b-4e5f-82fd-cf4ebcd97f0b"}, "database": {"value": "sample_db", "encrypted": false}, "password": {"encrypted": true, "credential_id": "f3e56f79-eb30-49a5-b1a7-fde5e9fe72e3"}, "username": {"encrypted": true, "credential_id": "28e70384-d49a-4253-9cb8-ec84ccaab842"}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('923d88a0-1566-465a-83f7-7e8865bbe381', '0f133aeb-4507-495e-a1c5-21ea9ebc7ffd', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"host": {"encrypted": true, "credential_id": "f0cd2f90-4c65-455d-8b9b-67706ed54cca"}, "port": {"encrypted": true, "credential_id": "d5cdd1ff-04a8-41be-bd7a-8bf392c626a7"}, "database": {"value": "sample_db", "encrypted": false}, "password": {"encrypted": true, "credential_id": "e337f111-7b70-441f-8f7c-6db1c725b9e8"}, "username": {"encrypted": true, "credential_id": "d70953ae-5e3a-4a92-a244-1bf12bbb5087"}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('dc8df797-e673-452a-a2ed-7ca9b90c7056', '0f133aeb-4507-495e-a1c5-21ea9ebc7ffd', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"host": {"encrypted": true, "credential_id": "067788d4-1d38-45fd-b187-2e10006d2ee5"}, "port": {"encrypted": true, "credential_id": "f361e1e2-71f1-46e3-bdca-e911479364e8"}, "database": {"value": "sample_db", "encrypted": false}, "password": {"encrypted": true, "credential_id": "0694a0f3-5292-4eba-a346-a0b8ef998886"}, "username": {"encrypted": true, "credential_id": "8b04e6f2-cae0-4a52-8dde-00e48d5d13a7"}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('5376f783-4048-4938-abde-efd230a13d01', 'a2e7def8-fc79-4010-8119-ae13ce6142a6', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('fbfc2d8a-ae15-4b83-8be6-b81fe87ab5f3', 'a2e7def8-fc79-4010-8119-ae13ce6142a6', '49105c82-d28f-4a76-95c6-28101a0760f1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('02ab9907-aef5-4351-920c-178069d30b6c', 'a2e7def8-fc79-4010-8119-ae13ce6142a6', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('5a8fbe84-04a9-43e8-8687-9a54b04d53e0', 'b0438ae8-e10c-4b8d-8e3e-29cfcb869eeb', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('bf22de47-40c0-4cae-8372-be4ecee3eae1', 'b0438ae8-e10c-4b8d-8e3e-29cfcb869eeb', '49105c82-d28f-4a76-95c6-28101a0760f1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('1640f717-f26d-4c21-af2f-b9bae26a0580', 'b0438ae8-e10c-4b8d-8e3e-29cfcb869eeb', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('4711918b-1e63-4f80-a826-4f036ca6a234', 'a3ab42e3-c60e-4819-8e48-8accb708421c', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('5bddccd1-d687-48ec-be2f-6b1172310e32', 'a3ab42e3-c60e-4819-8e48-8accb708421c', '49105c82-d28f-4a76-95c6-28101a0760f1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('4dfbc142-0b1e-4fc2-a013-7f961a9b9c27', 'a3ab42e3-c60e-4819-8e48-8accb708421c', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('1ed40db4-a197-4ddb-837e-ab9423e785ea', '0b2341e6-6eee-4c86-8686-044832d9a2db', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('e6ae475e-d79f-44b1-b34d-904508f0366d', '0b2341e6-6eee-4c86-8686-044832d9a2db', '49105c82-d28f-4a76-95c6-28101a0760f1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('bcce6509-0740-4f9c-a57c-57d2d9e653ec', '0b2341e6-6eee-4c86-8686-044832d9a2db', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('25134272-7292-4be4-8e09-c050239555ec', 'abe69b3b-c20c-4912-b888-13ee895978bb', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('1d3caa00-0adf-4b29-afa3-8a5ae65cf775', 'abe69b3b-c20c-4912-b888-13ee895978bb', '49105c82-d28f-4a76-95c6-28101a0760f1', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('9b19d373-e846-494c-bde6-2b3757f216e3', 'abe69b3b-c20c-4912-b888-13ee895978bb', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{}', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('b986ba67-f5b2-4eaa-b693-8ec1b1770177', '4f48ca44-b486-4fa5-a233-f38f29b03409', '52108afe-1776-4dcf-875a-834661c64263', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "db7279c5-18ff-4cfe-afb4-d2636e6c3d80"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:09.914037', '2026-10-28 17:15:09.918'),
	('d2fb9a72-6b7a-453a-b6a3-302e3e2d6e5e', '4f48ca44-b486-4fa5-a233-f38f29b03409', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "db860f3a-b66d-46a4-a49f-8ce8bdeccb7d"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:09.914037', '2026-10-28 17:15:09.92'),
	('50e4f49d-1104-4d6d-b71c-5fefc4ba0ee6', '4f48ca44-b486-4fa5-a233-f38f29b03409', '88fd0e2b-afb0-4a4f-912d-65bf2152712b', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "0ad1bf9f-b257-4f56-8d2d-e99808733a43"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:09.914037', '2026-10-28 17:15:09.92'),
	('262e0846-ff6d-4251-af44-8ca1d797b3e5', 'fac8faad-13f4-4c33-9f62-1e830bcf8c05', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "83540e72-1562-4e47-b6ba-124d5fd5c161"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:10.534644', '2026-10-28 17:15:10.539'),
	('5f4e5090-989d-4dbb-8da0-84151b18a79e', 'fac8faad-13f4-4c33-9f62-1e830bcf8c05', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "1cffff65-e5d5-4d04-8919-85725a97adb2"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:10.534644', '2026-10-28 17:15:10.54'),
	('044767a9-d188-4500-945e-547e6961bdb6', 'fac8faad-13f4-4c33-9f62-1e830bcf8c05', '49105c82-d28f-4a76-95c6-28101a0760f1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "4b294acf-2add-415c-a298-ab34a2b34470"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:10.534644', '2026-10-28 17:15:10.54'),
	('e0cd7179-c4ed-4168-a581-0dc41d3c9185', '2c9e999d-e599-47d4-93ec-209d21d5ba41', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "80364f80-5688-4e5d-a88b-6c26b85aa24b"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:11.126565', '2026-10-28 11:45:11.126565'),
	('2426ebf8-f433-431a-8e06-a8693fa0caed', '2c9e999d-e599-47d4-93ec-209d21d5ba41', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "e44962d9-00f5-4166-a0ee-06572588dc16"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:11.126565', '2026-10-28 11:45:11.126565'),
	('8924436c-5554-478f-a8fb-a3ccffdfc5c1', '2c9e999d-e599-47d4-93ec-209d21d5ba41', '49105c82-d28f-4a76-95c6-28101a0760f1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "728ba5f4-bb70-4ace-beaa-5c3f7a948c99"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:11.126565', '2026-10-28 11:45:11.126565'),
	('a14db5f1-41cf-4667-8b37-bf93c8afc00e', '125fb8c1-d338-475d-bffc-a9f3b85b7bb1', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "1cffff65-e5d5-4d04-8919-85725a97adb2"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:11.207146', '2026-10-28 11:45:11.207146'),
	('ab0d61f4-676f-4611-9908-f427ea908aa6', '125fb8c1-d338-475d-bffc-a9f3b85b7bb1', '49105c82-d28f-4a76-95c6-28101a0760f1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "4b294acf-2add-415c-a298-ab34a2b34470"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:11.207146', '2026-10-28 11:45:11.207146'),
	('afdbdac5-ec26-493a-9697-328c7f567e2d', '125fb8c1-d338-475d-bffc-a9f3b85b7bb1', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "83540e72-1562-4e47-b6ba-124d5fd5c161"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:11.207146', '2026-10-28 11:45:11.207146');

INSERT INTO public.data_source_versions VALUES
	('a3ffacb1-ec7a-45f3-b60d-fdde52aa1b16', 'fe0249a2-b9c4-4ff9-a6c5-b636866efd83', NULL, true, 'Sample data source', true, NULL, NULL, NULL, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('060f4d4f-128e-4cc1-b22d-93f4a7a9f99e', '3acff333-8cbb-4a04-899f-9627cd1e4f0e', NULL, true, 'restapidefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('3e640713-f441-434f-9455-a72b8a278158', 'a9a8732b-6f29-4370-834c-c3283c8e8044', NULL, true, 'runjsdefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('f7a2e310-baac-432a-b0ec-2d983c453e3b', '2f38eebe-2140-4b2b-9b1c-d67034062439', NULL, true, 'runpydefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('2cdaa077-ea59-4649-a730-46dcc2cfbcd4', '74a845e8-2a58-40b2-b883-43b2b5198944', NULL, true, 'tooljetdbdefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('bc3f5d7e-dee8-45c9-aa95-6b0d8a921eaa', '0a26627c-1474-471f-b258-3f845c24e890', NULL, true, 'workflowsdefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('0f133aeb-4507-495e-a1c5-21ea9ebc7ffd', '19661d4b-253b-47bf-a07d-1f66cca75a04', NULL, true, 'Sample data source', true, NULL, NULL, NULL, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('a2e7def8-fc79-4010-8119-ae13ce6142a6', '9914088c-ed38-4d33-b451-b7f3e17ec86d', NULL, true, 'restapidefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('b0438ae8-e10c-4b8d-8e3e-29cfcb869eeb', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', NULL, true, 'runjsdefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('a3ab42e3-c60e-4819-8e48-8accb708421c', 'e9037f8a-cca1-49c6-b34a-e43d2ef7df0c', NULL, true, 'runpydefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('0b2341e6-6eee-4c86-8686-044832d9a2db', '5fb8cb5d-cbc1-44d9-835f-a8d8ed820228', NULL, true, 'tooljetdbdefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('abe69b3b-c20c-4912-b888-13ee895978bb', 'ffe9652c-9980-4693-ba66-83493b1c1e12', NULL, true, 'workflowsdefault', true, NULL, NULL, NULL, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('4f48ca44-b486-4fa5-a233-f38f29b03409', '69dbfec8-ca9d-4a63-8b99-86899afe7f50', NULL, true, 'pg_gitoff', true, NULL, NULL, NULL, '2026-10-28 11:45:09.914037', '2026-10-28 11:45:09.914037'),
	('fac8faad-13f4-4c33-9f62-1e830bcf8c05', '9867e0d2-4260-469f-a184-eefae5ca3174', NULL, true, 'pg_giton', true, NULL, NULL, NULL, '2026-10-28 11:45:10.534644', '2026-10-28 11:45:10.534644'),
	('2c9e999d-e599-47d4-93ec-209d21d5ba41', '87918ee2-c38e-4ed3-8494-38ed82420eb1', NULL, false, 'pg_feature', true, NULL, '5b0b484a-ed07-4d19-b6f9-e3903783e141', NULL, '2026-10-28 11:45:11.126565', '2026-10-28 11:45:11.126565'),
	('125fb8c1-d338-475d-bffc-a9f3b85b7bb1', '9867e0d2-4260-469f-a184-eefae5ca3174', 'fac8faad-13f4-4c33-9f62-1e830bcf8c05', false, 'pg_giton', true, NULL, '31b785c9-8f44-4954-aaac-f60c4cd25148', NULL, '2026-10-28 11:45:11.207146', '2026-10-28 11:45:11.207146');

INSERT INTO public.data_sources VALUES
	('fe0249a2-b9c4-4ff9-a6c5-b636866efd83', 'Sample data source', 'postgresql', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'sample', 'global', NULL, false),
	('3acff333-8cbb-4a04-899f-9627cd1e4f0e', 'restapidefault', 'restapi', '2026-10-28 17:15:09.523', '2026-10-28 17:15:09.523', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'static', 'global', NULL, false),
	('a9a8732b-6f29-4370-834c-c3283c8e8044', 'runjsdefault', 'runjs', '2026-10-28 17:15:09.531', '2026-10-28 17:15:09.531', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'static', 'global', NULL, false),
	('2f38eebe-2140-4b2b-9b1c-d67034062439', 'runpydefault', 'runpy', '2026-10-28 17:15:09.533', '2026-10-28 17:15:09.533', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'static', 'global', NULL, false),
	('74a845e8-2a58-40b2-b883-43b2b5198944', 'tooljetdbdefault', 'tooljetdb', '2026-10-28 17:15:09.536', '2026-10-28 17:15:09.536', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'static', 'global', NULL, false),
	('0a26627c-1474-471f-b258-3f845c24e890', 'workflowsdefault', 'workflows', '2026-10-28 17:15:09.538', '2026-10-28 17:15:09.538', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'static', 'global', NULL, false),
	('19661d4b-253b-47bf-a07d-1f66cca75a04', 'Sample data source', 'postgresql', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'sample', 'global', NULL, false),
	('9914088c-ed38-4d33-b451-b7f3e17ec86d', 'restapidefault', 'restapi', '2026-10-28 17:15:09.837', '2026-10-28 17:15:09.837', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'static', 'global', NULL, false),
	('0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'runjsdefault', 'runjs', '2026-10-28 17:15:09.84', '2026-10-28 17:15:09.84', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'static', 'global', NULL, false),
	('e9037f8a-cca1-49c6-b34a-e43d2ef7df0c', 'runpydefault', 'runpy', '2026-10-28 17:15:09.842', '2026-10-28 17:15:09.842', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'static', 'global', NULL, false),
	('5fb8cb5d-cbc1-44d9-835f-a8d8ed820228', 'tooljetdbdefault', 'tooljetdb', '2026-10-28 17:15:09.844', '2026-10-28 17:15:09.844', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'static', 'global', NULL, false),
	('ffe9652c-9980-4693-ba66-83493b1c1e12', 'workflowsdefault', 'workflows', '2026-10-28 17:15:09.846', '2026-10-28 17:15:09.846', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'static', 'global', NULL, false),
	('69dbfec8-ca9d-4a63-8b99-86899afe7f50', 'pg_gitoff', 'postgresql', '2026-10-28 17:15:09.913', '2026-10-28 11:45:09.914037', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'default', 'global', '69dbfec8-ca9d-4a63-8b99-86899afe7f50', false),
	('9867e0d2-4260-469f-a184-eefae5ca3174', 'pg_giton', 'postgresql', '2026-10-28 17:15:10.534', '2026-10-28 11:45:10.534644', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'default', 'global', '9867e0d2-4260-469f-a184-eefae5ca3174', false),
	('87918ee2-c38e-4ed3-8494-38ed82420eb1', 'pg_feature', 'postgresql', '2026-10-28 17:15:11.125', '2026-10-28 11:45:11.126565', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'default', 'global', '87918ee2-c38e-4ed3-8494-38ed82420eb1', false);

INSERT INTO public.data_sources_group_permissions VALUES
	('e89bebc6-dbdb-41e7-845c-4108083ac39a', '92c27225-b008-4ff9-b444-aed976f9a2ef', true, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('c4222468-112d-4e6f-ad34-8f247f36b076', 'f35633a4-027e-43eb-9733-bb9acbc3a14f', true, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('192d069e-cf31-4a19-85c5-464aa6bdff7b', 'd548dea6-f782-45d2-b221-f33174e60678', true, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('0afecf94-272a-44c9-8c3d-4a8b5c4d51f1', '020efa8b-dddb-4057-8cd1-e44d16593000', true, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717');

INSERT INTO public.folder_apps VALUES
	('6b45e1bc-85a3-4aca-8a32-af45666c9cea', '225c1d1d-496d-4d3c-a133-2c65a7a293d3', '8dcf0e44-b815-4c8f-9047-0ed6af021a0e', '2026-10-28 11:45:10.131358', '2026-10-28 11:45:10.131358', NULL),
	('78d8de68-6cef-451e-8f1b-de1db9be8d91', '225c1d1d-496d-4d3c-a133-2c65a7a293d3', '7367e177-0da4-4f96-a526-a60cc9f1fc30', '2026-10-28 11:45:10.153792', '2026-10-28 11:45:10.153792', NULL),
	('773b85bd-c910-47f1-aa1a-b234b828dafa', 'a073905d-f908-41a2-9c70-e825b63c8e0b', '9b6eda5a-8748-4d54-8ba8-6a9031452f06', '2026-10-28 11:45:10.182507', '2026-10-28 11:45:10.182507', NULL),
	('7dab4a9b-3bd4-497d-a539-c8a5d28fa7c9', '8a837d19-110e-4073-a559-f93ee3fc3e81', 'cfeab0fe-4b83-49a4-8111-d945029c8404', '2026-10-28 11:45:10.693637', '2026-10-28 11:45:10.693637', NULL),
	('fa818c06-d1df-4076-9eb8-2113b0355c7b', '8a837d19-110e-4073-a559-f93ee3fc3e81', '7c0994c4-8198-48a2-91af-bb12a566a3a2', '2026-10-28 11:45:10.712331', '2026-10-28 11:45:10.712331', NULL),
	('aae39225-2f08-4317-ae0e-eee7d365c459', 'ca655e01-4944-4b1b-aee2-a311b76a2d7e', '2aabf571-7291-4b4b-922f-eee12fc6582a', '2026-10-28 11:45:10.737371', '2026-10-28 11:45:10.737371', NULL);

INSERT INTO public.folders VALUES
	('225c1d1d-496d-4d3c-a133-2c65a7a293d3', 'Folder gitoff', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:10.105', '2026-10-28 17:15:10.105', 'front-end', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e'),
	('a073905d-f908-41a2-9c70-e825b63c8e0b', 'WF Folder gitoff', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:10.163', '2026-10-28 17:15:10.163', 'workflow', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e'),
	('8a837d19-110e-4073-a559-f93ee3fc3e81', 'Folder giton', '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.671', '2026-10-28 17:15:10.671', 'front-end', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e'),
	('ca655e01-4944-4b1b-aee2-a311b76a2d7e', 'WF Folder giton', '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.719', '2026-10-28 17:15:10.719', 'workflow', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e');

INSERT INTO public.folders_group_permissions VALUES
	('3d3eb138-9ae6-4a9f-8a5c-a7ae56b0f5c9', '9efd17fd-72c7-4476-b031-597c0ff45f7d', false, false, true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('a94d8a84-b805-4eda-bab3-f99b57a7e1c2', '167d02b6-db89-4c0b-9b0d-daab32304afc', true, false, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('4be796d7-ee4a-41f6-b198-3f4c18145197', 'abf3cf2a-57a8-4b78-a6e0-f5081ce3237a', true, false, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('fa11b5a7-c16a-47f1-a929-2a3bb8231e2e', 'f18c2294-80b0-4e7a-b041-587d0e106fe4', false, false, true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('2e1f56d9-0ced-4a64-a10c-58523b134231', '17f9a704-9d88-4b6d-995c-2679459c8912', true, false, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('3e4ffe7f-bf22-497d-8e65-9d6fcf29c2fd', 'c4ecf6f7-8f32-4001-a1b9-5867595d3f6a', true, false, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717');

INSERT INTO public.granular_permissions VALUES
	('d5326592-5c91-496d-afb0-52dc80f2357f', 'bec7a639-bc4f-4d83-9635-0e4b6b2cc515', 'Apps', 'app', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('18eb28ae-40ef-4f79-9d36-a284f736d740', 'bec7a639-bc4f-4d83-9635-0e4b6b2cc515', 'Workflows', 'workflow', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('9efd17fd-72c7-4476-b031-597c0ff45f7d', 'bec7a639-bc4f-4d83-9635-0e4b6b2cc515', 'Folders', 'folder', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('36fbbe05-92c5-41e1-a3df-1d7ae3462106', 'd26f8423-1277-4ea9-bdd8-07916f1a4e37', 'Apps', 'app', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('92c27225-b008-4ff9-b444-aed976f9a2ef', 'd26f8423-1277-4ea9-bdd8-07916f1a4e37', 'Data sources', 'data_source', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('56e39bea-9cd5-422c-ae18-31bc85213a80', 'd26f8423-1277-4ea9-bdd8-07916f1a4e37', 'Workflows', 'workflow', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('167d02b6-db89-4c0b-9b0d-daab32304afc', 'd26f8423-1277-4ea9-bdd8-07916f1a4e37', 'Folders', 'folder', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('429866a5-0461-42ee-9778-96904d0db8f0', 'd26f8423-1277-4ea9-bdd8-07916f1a4e37', 'Modules', 'module', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('df77fa6f-5781-4a96-8c33-c77ab3b23974', 'eed3dee6-b46c-4eca-8fb5-ac70fb33e611', 'Apps', 'app', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('f35633a4-027e-43eb-9733-bb9acbc3a14f', 'eed3dee6-b46c-4eca-8fb5-ac70fb33e611', 'Data sources', 'data_source', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('db57d495-55bf-42c3-b5fb-e78cdff2e0a3', 'eed3dee6-b46c-4eca-8fb5-ac70fb33e611', 'Workflows', 'workflow', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('abf3cf2a-57a8-4b78-a6e0-f5081ce3237a', 'eed3dee6-b46c-4eca-8fb5-ac70fb33e611', 'Folders', 'folder', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('82d8416e-7400-427a-b3c0-4b6510fcbcef', 'eed3dee6-b46c-4eca-8fb5-ac70fb33e611', 'Modules', 'module', true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('28706eca-cdeb-4700-9baa-07d67ae03328', '21075232-5900-4475-ac90-96f9902dcad9', 'Apps', 'app', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('d9a4d38d-4852-499f-a9bb-dbe5f9471a64', '21075232-5900-4475-ac90-96f9902dcad9', 'Workflows', 'workflow', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('f18c2294-80b0-4e7a-b041-587d0e106fe4', '21075232-5900-4475-ac90-96f9902dcad9', 'Folders', 'folder', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('b81e3ae0-3e19-4ae8-adc9-03f5fb7f524e', 'ae2dfbd6-c28e-47c8-aea4-08348298a5a2', 'Apps', 'app', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('d548dea6-f782-45d2-b221-f33174e60678', 'ae2dfbd6-c28e-47c8-aea4-08348298a5a2', 'Data sources', 'data_source', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('527687af-3dd3-4da8-bd42-0a27cf0234ca', 'ae2dfbd6-c28e-47c8-aea4-08348298a5a2', 'Workflows', 'workflow', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('17f9a704-9d88-4b6d-995c-2679459c8912', 'ae2dfbd6-c28e-47c8-aea4-08348298a5a2', 'Folders', 'folder', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('24ca9730-b9cd-4cdc-8c67-7454be276c7a', 'ae2dfbd6-c28e-47c8-aea4-08348298a5a2', 'Modules', 'module', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('807a7a65-d92f-4489-91c1-c95d9838a7f0', 'b1d29dcd-b3b1-4ef5-9808-50d8666a5d24', 'Apps', 'app', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('020efa8b-dddb-4057-8cd1-e44d16593000', 'b1d29dcd-b3b1-4ef5-9808-50d8666a5d24', 'Data sources', 'data_source', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('d3852a0e-c410-4cc5-bc61-ac20d1f9d935', 'b1d29dcd-b3b1-4ef5-9808-50d8666a5d24', 'Workflows', 'workflow', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('c4ecf6f7-8f32-4001-a1b9-5867595d3f6a', 'b1d29dcd-b3b1-4ef5-9808-50d8666a5d24', 'Folders', 'folder', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('5fe86617-8684-4ee4-9644-51db59fdd85f', 'b1d29dcd-b3b1-4ef5-9808-50d8666a5d24', 'Modules', 'module', true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717');

INSERT INTO public.group_users VALUES
	('a9dc4844-b0a6-4f2a-8e15-0bf0e1129d78', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'd26f8423-1277-4ea9-bdd8-07916f1a4e37', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('118581c0-75af-47e2-a1b4-53daaa554434', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'ae2dfbd6-c28e-47c8-aea4-08348298a5a2', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717');

INSERT INTO public.instance_settings VALUES
	('5c2f2e0f-8a45-4a73-811c-4b37b7881253', 'ENABLE_MULTIPLAYER_EDITING', 'false', '2026-10-28 17:10:53.911', '2026-10-28 11:40:47.208371', 'Multiplayer editing', 'header.organization.menus.manageSSO.generalSettings.enableMultiplayerEditing', 'boolean', 'Work collaboratively and edit applications in real-time with multi-player editing', 'header.organization.menus.manageSSO.generalSettings.enableMultiplayerEditing', 'user'),
	('4cd10792-0e1a-4ed3-b9bb-25591f3076cd', 'ENABLE_COMMENTS', 'true', '2026-10-28 17:10:53.913', '2026-10-28 11:40:47.208371', 'Comments', 'header.organization.menus.manageSSO.generalSettings.comments', 'boolean', 'Collaborate with others by adding comments anywhere on the canvas', 'header.organization.menus.manageSSO.generalSettings.comments', 'user'),
	('5877916b-2201-4847-878f-2c923e41003c', 'CUSTOM_LOGOUT_URL', '', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'CUSTOM_LOGOUT_URL', 'header.organization.menus.instanceLogout.customLogoutUrl.label', 'text', 'Set a personalized logout URL for users logging out of this instance.', NULL, 'system'),
	('9fdf4da9-9bc6-4b9b-9eaa-0ec4fefa5089', 'ENABLE_WORKSPACE_LOGIN_CONFIGURATION', 'true', '2026-10-28 17:10:53.932', '2026-10-28 11:40:47.208371', 'Enable Workspace Login Configuration', 'header.organization.menus.manageSSO.generalSettings.enableWorkspaceLoginConfiguration', 'boolean', 'Allow workspace admin to configure their workspace’s login differently', 'header.organization.menus.manageSSO.generalSettings.enableWorkspaceLoginConfiguration', 'system'),
	('cabb6cdc-02fc-4e7d-95c8-6ed67915b430', 'SMTP_ENABLED', 'false', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'SMTP ENABLED', NULL, 'boolean', NULL, NULL, 'system'),
	('82e04795-2227-4c3b-a2f8-7fdf0a8b2a73', 'SMTP_DOMAIN', '', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'Host', NULL, 'text', NULL, NULL, 'system'),
	('e795eb1b-3b5e-454e-9644-3f6b4f1dffec', 'SMTP_PORT', '', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'Port', NULL, 'text', NULL, NULL, 'system'),
	('218f7a55-e533-4e2b-85c7-5e01e92e67c9', 'SMTP_USERNAME', '', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'User', NULL, 'text', NULL, NULL, 'system'),
	('82e2cef2-df1b-4f1d-aebe-a3c12f062b0c', 'SMTP_FROM_EMAIL', 'hello@tooljet.io', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'default from email', NULL, 'text', NULL, NULL, 'system'),
	('ef038706-db5d-4273-a10d-7d69142ac0da', 'ALLOWED_DOMAINS', '', '2026-10-28 17:10:53.936', '2026-10-28 11:40:47.208371', 'Allowed Domains', 'header.organization.menus.manageSSO.generalSettings.allowedDomains', 'text', 'Support multiple domains. Enter domain names separated by comma. example: tooljet.com,tooljet.io,yourorganization.com', 'header.organization.menus.manageSSO.generalSettings.allowedDomains', 'system'),
	('d4b6efdc-3a8a-4e71-be58-7be4fb82c3e3', 'AUTOMATIC_SSO_LOGIN', 'false', '2026-10-28 17:10:55.187', '2026-10-28 11:40:47.208371', 'Automatic SSO Login', 'header.organization.menus.manageSSO.generalSettings.AutomaticSsoLogin', 'boolean', 'This will simulate the configured SSO login, bypassing the login screen in ToolJet', 'header.organization.menus.manageSSO.generalSettings.AutomaticSsoLogin', 'system'),
	('71c9d85d-428a-406f-8ab6-d85b4a811fc0', 'SMTP_ENV_CONFIGURED', 'false', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'SMTP ENV CONFIGURED', NULL, 'boolean', NULL, NULL, 'system'),
	('804c9df3-175d-4857-85cb-1eed33a4ba3e', 'PASSWORD_ALLOWED_DOMAINS', '', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'Password Allowed Domains', NULL, 'text', NULL, NULL, 'system'),
	('413e9da9-c9c0-4272-a47d-b87ab7554322', 'PASSWORD_RESTRICTED_DOMAINS', '', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'Password Restricted Domains', NULL, 'text', NULL, NULL, 'system'),
	('742b1ba9-3235-480b-9ee5-e975ebaeeb29', 'LLM_KEY_ENV_CONFIGURED', 'false', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'LLM Key ENV Configured', NULL, 'boolean', NULL, NULL, 'system'),
	('62712de5-7cd8-47e3-9a26-8f7ab5a0e4d1', 'ENABLE_SIGNUP', 'false', '2026-10-28 17:10:53.934', '2026-10-28 11:45:09.603537', 'Enable SignUp', 'header.organization.menus.manageSSO.generalSettings.enableSignUp', 'boolean', 'Users will be able to sign up without being invited', 'header.organization.menus.manageSSO.generalSettings.enableSignUp', 'system'),
	('b75262e3-6ac1-427d-bcc9-f90186e740c3', 'ALLOW_PERSONAL_WORKSPACE', 'false', '2026-10-28 17:10:53.651', '2026-10-28 11:45:09.620382', 'Allow personal workspace', 'header.organization.menus.manageSSO.generalSettings.allowPersonalWorkspace', 'boolean', 'This feature will enable users to create their own workspace', 'header.organization.menus.manageSSO.generalSettings.allowPersonalWorkspaceDetails', 'user'),
	('beb62a54-bbfb-4d19-a4a0-cb0d9f3c54a5', 'LICENSE_KEY', '', '2026-10-28 17:10:53.825', '2026-10-28 11:40:47.208371', 'License Key', 'header.organization.menus.manageSSO.generalSettings.licenseKey', 'text_area', NULL, NULL, 'system'),
	('33cec37e-a200-4b8c-b278-589c94542ddc', 'SMTP_PASSWORD', '', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'Password', NULL, 'password', NULL, NULL, 'system');

INSERT INTO public.layouts VALUES
	('9643a962-6746-4ccb-9997-2baf59305828', 'desktop', 50, 3, 38, 400, '5e86d904-e978-4b84-9860-ad43b933aa48', 'count', '2026-10-28 11:46:00.624723', NULL, NULL, NULL),
	('5b0b404e-2779-4dc6-8484-09ab75964cb4', 'mobile', 50, 3, 38, 400, '5e86d904-e978-4b84-9860-ad43b933aa48', 'count', '2026-10-28 11:46:00.624723', NULL, NULL, NULL),
	('490320e8-4d10-4d02-be37-767b67c15a6c', 'desktop', 50, 3, 38, 400, 'eef098e0-701b-48b8-bd1f-f61ce25c89a1', 'count', '2026-10-28 11:46:11.127757', NULL, NULL, NULL),
	('99daf9b0-656c-482b-93c1-57f4b68049cb', 'mobile', 50, 3, 38, 400, 'eef098e0-701b-48b8-bd1f-f61ce25c89a1', 'count', '2026-10-28 11:46:11.127757', NULL, NULL, NULL);

INSERT INTO public.metadata VALUES
	('e9c3c870-7ac4-4182-8ac8-8268e2cec603', '{"edition":"ee"}', '2026-10-28 11:41:15.251478', '2026-10-28 11:41:15.251478');

INSERT INTO public.migrations VALUES
	(3, 1625814801415, 'MaybeCreateExtension1625814801415'),
	(4, 1625814801416, 'CreateOrganizations1625814801416'),
	(5, 1625814801417, 'CreateUsers1625814801417'),
	(6, 1625814801419, 'CreateApps1625814801419'),
	(7, 1625814801420, 'CreateAppVersions1625814801420'),
	(8, 1625814801421, 'CreateCredentials1625814801421'),
	(9, 1625814801422, 'CreateFolders1625814801422'),
	(10, 1625814801423, 'CreateFolderApps1625814801423'),
	(11, 1625814801424, 'CreateMetadata1625814801424'),
	(12, 1625814801425, 'CreateOrganizationUsers1625814801425'),
	(13, 1625814801426, 'CreateAppUsers1625814801426'),
	(14, 1625814801427, 'CreateDataSources1625814801427'),
	(15, 1625814801428, 'CreateDataQueries1625814801428'),
	(16, 1625814801429, 'CreateDataSourceUserOauth2s1625814801429'),
	(17, 1632047749315, 'AddSsoIdToUser1632047749315'),
	(18, 1632382322381, 'CreateGroupPermissions1632382322381'),
	(19, 1632383798339, 'CreateUserGroupPermissions1632383798339'),
	(20, 1632384954344, 'CreateAppGroupPermissions1632384954344'),
	(21, 1632740447353, 'CreateThreadMigration1632740447353'),
	(22, 1634626774513, 'CreateCommentMigration1634626774513'),
	(23, 1634724636255, 'AddAppCreateAndAppDeleteToGroupPermissions1634724636255'),
	(24, 1636607624055, 'AddFolderCreatePermissionToGroupPermissions1636607624055'),
	(25, 1637909008629, 'CreateAuditLogs1637909008629'),
	(26, 1639645231497, 'AddAppVersionIdColumnToDataSources1639645231497'),
	(27, 1639645243080, 'AddAppVersionIdColumnToDataQueries1639645243080'),
	(28, 1639734070614, 'AddApplicationIconColumn1639734070614'),
	(29, 1642432246029, 'CreateSSOField1642432246029'),
	(30, 1643117336290, 'AddRoleToUser1643117336290'),
	(31, 1645864719155, 'MultiOrganization1645864719155'),
	(32, 1646823984673, 'OrganizationConfigs1646823984673'),
	(33, 1649860649643, 'AddIsMaintenanceOnToApp1649860649643'),
	(34, 1650455299630, 'OrganizationEnableSignup1650455299630'),
	(35, 1651048832555, 'AddAvatarToUser1651048832555'),
	(36, 1651056032050, 'CreateFiles1651056032050'),
	(37, 1651056032052, 'CreatePlugins1651056032052'),
	(38, 1652541462886, 'CreateOrgEnvironmentVariablesTable1652541462886'),
	(39, 1652768881087, 'AddPluginToDataSource1652768881087'),
	(40, 1652768887877, 'AddPluginToDataQuery1652768887877'),
	(41, 1653391166172, 'AddFolderUpdateAndDeletePermissionToGroupPermissions1653391166172'),
	(42, 1654150623035, 'AddOrgEnvironmentVariablesGroupPermissions1654150623035'),
	(43, 1655320273619, 'PasswordPolicyRetryCount1655320273619'),
	(44, 1655726247638, 'AddUniqueConstraintToVersionName1655726247638'),
	(45, 1656083459220, 'tabsWidth1656083459220'),
	(46, 1656268228782, 'OrganizationsInheritSSO1656268228782'),
	(47, 1656312830147, 'CreateCommentUsers1656312830147'),
	(48, 1661342016413, 'AddOrganizationIdToDataSources1661342016413'),
	(49, 1661448846469, 'AddReadOnDashboardToAppGroupPermissions1661448846469'),
	(50, 1662542808902, 'CreateInstanceSettings1662542808902'),
	(51, 1664352379065, 'AddFieldsToUser1664352379065'),
	(52, 1664535394458, 'addForeignKeyForCommentUsers1664535394458');
INSERT INTO public.migrations VALUES
	(53, 1664535394459, 'addForeignKeyForPlugin1664535394459'),
	(54, 1666763190092, 'addUserStatusAndSource1666763190092'),
	(55, 1667070216520, 'createEnvironments1667070216520'),
	(56, 1667075911289, 'createDatasourceOptions1667075911289'),
	(57, 1667364798950, 'CreateInternalTables1667364798950'),
	(58, 1669280005881, 'AddPageIdToThreads1669280005881'),
	(59, 1671815159504, 'addDataSourceType1671815159504'),
	(60, 1673424772525, 'ChangeReadOnDashboardColumnName1673424772525'),
	(61, 1674131104527, 'addUserType1674131104527'),
	(62, 1674571190772, 'AddTypeToApp1674571190772'),
	(63, 1675073833444, 'AddTypeToFolder1675073833444'),
	(64, 1675179628075, 'AddScopeColumnToDataSources1675179628075'),
	(65, 1675664360064, 'addOpenidToSourceTypeIfNotExist1675664360064'),
	(66, 1675842611112, 'AddOrganizationIdInAppEnvironments1675842611112'),
	(67, 1676983958469, 'CreateWorkflowExecutionEntity1676983958469'),
	(68, 1676987682532, 'CreateWorkflowExecutionNodeEntity1676987682532'),
	(69, 1677077719475, 'CreateWorkflowExecutionEdgeEntity1677077719475'),
	(70, 1677232734374, 'AddStartNodeToWorkflowExecution1677232734374'),
	(71, 1677820920004, 'DropAppVersionIdInAppEnvironments1677820920004'),
	(72, 1678261179234, 'addUserSession1678261179234'),
	(73, 1678790363938, 'AddPhoneNumberToUsers1678790363938'),
	(74, 1680152466161, 'CreateDatasourceGroupPermission1680152466161'),
	(75, 1680156219906, 'addUserDetailsTable1680156219906'),
	(76, 1680160847536, 'AddDataSourceCreateAndDataSourceDeleteToGroupPermission1680160847536'),
	(77, 1685952833787, 'AddSlugToWorkspace1685952833787'),
	(78, 1686818129241, 'AddPriorityAndEnabledColumnsToAppEnvironments1686818129241'),
	(79, 1686827869361, 'CreateCustomStyles1686827869361'),
	(80, 1686829292855, 'AddCurrentEnvironmentIdToAppVersions1686829292855'),
	(81, 1687363681284, 'CreateOrgEnvironmentConstantsTable1687363681284'),
	(82, 1687383173997, 'AddOrgEnvironmentConstantGroupPermission1687383173997'),
	(83, 1689181992983, 'UpdateSourceEnumOfUsersTable1689181992983'),
	(84, 1691004576333, 'CreatePageTable1691004576333'),
	(85, 1691004706564, 'CreateEventHandlerTable1691004706564'),
	(86, 1691006886222, 'UpdateAppVersionEntity1691006886222'),
	(87, 1691006952074, 'CreateComponentTable1691006952074'),
	(88, 1691007037021, 'CreateLayoutTable1691007037021'),
	(89, 1693375209543, 'CreateAppGitTable1693375209543'),
	(90, 1693392455485, 'CreateSelfhostCustomerLicenses1693392455485'),
	(91, 1693813384059, 'AddSAMLToSourceEnumOfUsersTable1693813384059'),
	(92, 1694072385007, 'CreateSSOResponseTable1694072385007'),
	(93, 1695015661737, 'AddingWorkspaceGiTablet1695015661737'),
	(94, 1697017670727, 'AddCreationModeFieldInAppTable1697017670727'),
	(95, 1698603800358, 'AddOwnerInOrganization1698603800358'),
	(96, 1698825925206, 'AddWebhookDetailsToApps1698825925206'),
	(97, 1698848739145, 'AddOrganizationLicenseTable1698848739145'),
	(98, 1699893808728, 'AddPromotedFromToVersions1699893808728'),
	(99, 1700198867548, 'AddTableForOrganizationsPayments1700198867548'),
	(100, 1702196735455, 'AddAutoLayoutFlagToPagesTable1702196735455'),
	(101, 1702314869907, 'AddWhiteLabellingsettings1702314869907'),
	(102, 1704258217404, 'AddWorkSpaceStatusColumn1704258217404');
INSERT INTO public.migrations VALUES
	(103, 1706643884614, 'ChangeTypeOfFolderName1706643884614'),
	(104, 1707112483331, 'RenameWhiteLabellingTableColumns1707112483331'),
	(105, 1708320592518, 'AddKeyTypeColumnToOrgGitTable1708320592518'),
	(106, 1708320592518, 'AddAutoCommitColumnToOrgGitTable1708320592518'),
	(107, 1708701418094, 'UpdateSSOConfigsTable1708701418094'),
	(108, 1708923006176, 'CreateOrganizationSubscriptionTable1708923006176'),
	(109, 1708923006576, 'CreateInvoiceTable1708923006576'),
	(110, 1709794417386, 'AddUpdatedAtColumnToLayouts1709794417386'),
	(111, 1710321318372, 'AlterTypeColumnOfDataSourceTable1710321318372'),
	(112, 1714015513342, 'AddGroupPermissionsTable1714015513342'),
	(113, 1714015541245, 'AddGroupUsersTable1714015541245'),
	(114, 1714015564318, 'AddGranularPermissionsTable1714015564318'),
	(115, 1714015596201, 'AddAppsGroupPermissionsTable1714015596201'),
	(116, 1714015615904, 'AddGroupAppsTable1714015615904'),
	(117, 1714626631309, 'CreateSampleDataSourceToExistingWorkspace1714626631309'),
	(118, 1714999026964, 'AddWorkspaceSignupToSource1714999026964'),
	(119, 1716885935683, 'CreateOrganizationThemes1716885935683'),
	(120, 1716890766240, 'AddPageSettingsColumnToAppVersionTable1716890766240'),
	(121, 1716921638529, 'AddIconFieldToPagesTable1716921638529'),
	(122, 1716975639914, 'AddSourceToOrganizationUsers1716975639914'),
	(123, 1718264886184, 'EnableAggregationInTooljetDatabase1718264886184'),
	(124, 1718357264489, 'MoveHiddenFieldInAppVersionsToPageSettings1718357264489'),
	(125, 1718529294184, 'AddConfigurationColumnToInternalTables1718529294184'),
	(126, 1718704694211, 'addLastLoggedInToUserSession1718704694211'),
	(127, 1719246896935, 'AddPageGroupIndexColumntoPage1719246896935'),
	(128, 1721235304092, 'AddTooljetDatabaseTenantPasswordColumnToOrganizations1721235304092'),
	(129, 1721310882702, 'AddOrganizationIdAndUserMetadataInUserDetails1721310882702'),
	(130, 1721716375696, 'AddDataSourcesGroupPermissionsTable1721716375696'),
	(131, 1721716629902, 'AddGroupDataSourceTable1721716629902'),
	(132, 1722357506889, 'AddTypeInOrganizationConstants1722357506889'),
	(133, 1722729600000, 'IncreaseWhiteLabellingLogoFaviconSize1722729600000'),
	(134, 1722934934124, 'AddStatusToWorkflowExecution1722934934124'),
	(135, 1723720691704, 'AddAutomaticSsoLoginInOrganizations1723720691704'),
	(136, 1725283619932, 'IncreaseLiceseKeySize1725283619932'),
	(137, 1725539906587, 'CreateOnboardingDetailsTable1725539906587'),
	(138, 1725540058378, 'AddOnboardingStatusToUsers1725540058378'),
	(139, 1730434774100, 'AddWorkflowScheduleTable1730434774100'),
	(140, 1736486065698, 'AddSupportForInstanceLevelWhiteLabels1736486065698'),
	(141, 1737530238311, 'CreateTablesForToojetAiConversations1737530238311'),
	(142, 1738235725332, 'AddAutoActivatedToUsers1738235725332'),
	(143, 1738580108540, 'CreateSelfhostCustomers1738580108540'),
	(144, 1738580526309, 'CreateSelfhostCustomersAiFeature1738580526309'),
	(145, 1738580661737, 'CreateOrganizationsAiFeature1738580661737'),
	(146, 1739252958127, 'CreateAIChatPrompts1739252958127'),
	(147, 1739260800000, 'CreateCustomDomainsTable1739260800000'),
	(148, 1740028959193, 'AddUniqueConstraintToOrganizationId1740028959193'),
	(149, 1740401000000, 'AddIsDefaultToOrganizations1740401000000'),
	(150, 1741342800000, 'AddLastAccessedAtToOrganizations1741342800000'),
	(151, 1742209024000, 'CreateTableGithubSSH1742209024000'),
	(152, 1742215405123, 'CreateTableGithubHTTPS1742215405123');
INSERT INTO public.migrations VALUES
	(153, 1742215921099, 'AddGitTypeEnumColumn1742215921099'),
	(154, 1743251000000, 'CreateDataQueryFolderTables1743251000000'),
	(155, 1743997765065, 'AddCoRelationIdToAppEntities1743997765065'),
	(156, 1744097765065, 'UpdateContainerHeaderProperty1744097765065'),
	(157, 1744610362161, 'CreatePagePermissions1744610362161'),
	(158, 1744611380594, 'CreatePageUsers1744611380594'),
	(159, 1744630818000, 'AddEnabledFlagAppGit1744630818000'),
	(160, 1746518671022, 'CreateTableGitLab1746518671022'),
	(161, 1746520805456, 'AddResourceDataAudit1746520805456'),
	(162, 1746526306001, 'AddGitLabEnum1746526306001'),
	(163, 1746705301652, 'AddWorkflowPermissionsInGroupPermissions1746705301652'),
	(164, 1746705371665, 'AddWorkflowTypeInResourceType1746705371665'),
	(165, 1746705448788, 'AddAppTypeInAppsGroupPermissions1746705448788'),
	(166, 1746727457618, 'CreateUserPersonalAccessTokensTable1746727457618'),
	(167, 1746728003499, 'AddSessionTypeAndPatIdToUserSessions1746728003499'),
	(168, 1747133448781, 'AddPluginIdUniqueConstraint1747133448781'),
	(169, 1747759439358, 'CreateQueryPermissions1747759439358'),
	(170, 1747763331564, 'CreateQueryUsers1747763331564'),
	(171, 1747923859030, 'AddEnabledColumnProviderTable1747923859030'),
	(172, 1748501592120, 'AddSSHBranchColumn1748501592120'),
	(173, 1748509644056, 'CreateComponentPermissions1748509644056'),
	(174, 1748509665915, 'CreateComponentUsers1748509665915'),
	(175, 1749766539146, 'ModifyPagesTableForDifferentNavs1749766539146'),
	(176, 1749810303901, 'AddPromoteAndReleaseAppColumn1749810303901'),
	(177, 1752624000000, 'CreateSsoConfigOidcGroupSync1752624000000'),
	(178, 1753084800000, 'AllowMultipleOIDCConfigs1753084800000'),
	(179, 1755863999455, 'CreateWorkflowBundlesTable1755863999455'),
	(180, 1756984957003, 'CreateAppHistoryTable1756984957003'),
	(181, 1757059846627, 'AddWalletTypeToOrganizationAI1757059846627'),
	(182, 1757315333187, 'AddWalletTypeForSelfhostAI1757315333187'),
	(183, 1757488747540, 'AddOrganizationAICreditHistory1757488747540'),
	(184, 1757488858256, 'AddSelfhostAICreditHistory1757488858256'),
	(185, 1758793442012, 'AddAppVersionEntity1758793442012'),
	(186, 1761828716101, 'AddBranchingAndSchemaVersionToOrgGitSync1761828716101'),
	(187, 1761828800001, 'AddVersionTypeColumn1761828800001'),
	(188, 1762860937123, 'AddCreatedByToAppVersions1762860937123'),
	(189, 1763533360052, 'CreateUserMfa1763533360052'),
	(190, 1763549159927, 'AddCoRelationIdToAppEntities1763549159927'),
	(191, 1765630548010, 'AddSourceTagToAppVersions1765630548010'),
	(192, 1766135986762, 'AddWorkflowExecutionIndexes1766135986762'),
	(193, 1766224841342, 'AddPasswordDomainColumnsToOrganizations1766224841342'),
	(194, 1766500000000, 'AddFolderPermissionSystem1766500000000'),
	(195, 1767175667559, 'AddPythonBundleColumns1767175667559'),
	(196, 1767225600000, 'UpdateAppHistoryPayloadConstraint1767225600000'),
	(197, 1767294000000, 'DropWorkflowBundleAppVersionUniqueConstraint1767294000000'),
	(198, 1767294792000, 'AddWorkflowBundleLanguageUniqueIndex1767294792000'),
	(199, 1767640122550, 'ChangeDependenciesToText1767640122550'),
	(200, 1767700000001, 'AddPageHeaderAndFooterColumnsToPagesTable1767700000001'),
	(201, 1768289065973, 'AddCoRelationIdToApps1768289065973'),
	(202, 1771788082006, 'CreateCustomPageType1771788082006');
INSERT INTO public.migrations VALUES
	(203, 1772568626000, 'CreateWorkspaceBranchTables1772568626000'),
	(204, 1772810075355, 'AddArchivedColumnToAiConversations1772810075355'),
	(205, 1773055477835, 'AddPreviewToAiConversations1773055477835'),
	(206, 1773100000000, 'AddPlatformGitSyncSupport1773100000000'),
	(207, 1773200000000, 'RemoveAppBranchStateTable1773200000000'),
	(208, 1773300000000, 'AddCreatedByToWorkspaceBranch1773300000000'),
	(209, 1775040752060, 'CreateOrganizationAiKeys1775040752060'),
	(210, 1775040800001, 'AddFlexSizingToLayoutsTable1775040800001'),
	(211, 1775060000000, 'AddSpecFilesMapToPlugins1775060000000'),
	(212, 1776166250667, 'CreateGroupAdminsTable1776166250667'),
	(213, 1776307200000, 'AddCoRelationIdToQueryFolders1776307200000'),
	(214, 1776470400000, 'GenerateCoRelationIdForModules1776470400000'),
	(215, 1776500000000, 'AddProviderToOrganizationAiKeys1776500000000'),
	(216, 1776550000000, 'AddModuleMetaHashToWorkspaceBranch1776550000000'),
	(217, 1777000000000, 'AddIsDummyToDataSources1777000000000'),
	(218, 1777200000000, 'AddCoRelationIdNotNullConstraints1777200000000'),
	(219, 1777970000000, 'EnsureDefaultBranchDraftVersion1777970000000'),
	(220, 1778000000000, 'AddMetadataColumnsToAppVersions1778000000000'),
	(221, 1778485042438, 'AddMetadataColumnInConversationTable1778485042438'),
	(222, 1778760592536, 'AddBannerImageToWhiteLabelling1778760592536'),
	(223, 1778900000000, 'AddExpiryColumnsToUsers1778900000000'),
	(224, 1778900000001, 'AddInviteTokenExpiryToOrgUsers1778900000001'),
	(225, 1779000000000, 'AddDraftMetadataUniqueIndexes1779000000000'),
	(226, 1779100000000, 'BumpAppVersionUpdatedAtOnChildWrites1779100000000'),
	(227, 1779200000000, 'AddDefaultBranchDraftUniquePerApp1779200000000'),
	(228, 1779300000000, 'EnforceBranchedAppVersionInvariants1779300000000'),
	(229, 1779300000000, 'BackfillModuleVersionName1779300000000'),
	(230, 1779400000000, 'AddDefaultBranchSlugCaseInsensitiveTrigger1779400000000'),
	(231, 1779500000000, 'DropAppGitSyncTable1779500000000'),
	(232, 1779600000000, 'AddRemoteUpdatedAtToAppVersions1779600000000'),
	(234, 1779700000000, 'ExtendAppNameUniqueToDefaultBranch1779700000000'),
	(235, 1779800000000, 'AddAppVersionsBranchIdIndex1779800000000'),
	(236, 1779900000000, 'AddAppsCoRelationIdIndex1779900000000'),
	(237, 1779900000002, 'CreateNotificationsTables1779900000002'),
	(238, 1780000000000, 'MakeAppNameUniqueCaseSensitive1780000000000'),
	(239, 1781645306551, 'BackfillGoToAppEventSlugWithCorrelationId1781645306551'),
	(240, 1781645376435, 'AddTargetCorelationIdToPages1781645376435'),
	(241, 1781868342325, 'AddModuleToAppTypeEnum1781868342325'),
	(242, 1781869753341, 'AddModuleToResourceTypeEnum1781869753341'),
	(243, 1782112343421, 'AddTjdbPermission1782112343421'),
	(244, 1782196835449, 'AddModuleCreateDeleteToGroupPermissions1782196835449'),
	(245, 1782458527607, 'BanListTables1782458527607'),
	(246, 1782883589000, 'ChangeFolderNameFromCitextToVarchar1782883589000'),
	(248, 1625814801430, 'UpdateDefinitionsForEvents1625814801430'),
	(249, 1629971478272, 'UpdateDefinitionsForTableActionEvent1629971478272'),
	(250, 1630003364070, 'TurnOnSSLForEveryPostgresDataSource1630003364070'),
	(251, 1632468258787, 'PopulateUserGroupsFromOrganizationRoles1632468258787'),
	(252, 1633370361564, 'SetShowBulkSelectorToTrue1633370361564'),
	(253, 1633431766605, 'SetHighlightSelectedRowToFalseForExistingTables1633431766605'),
	(254, 1634729050892, 'BackfillAppCreatePermissionsAsTruthyForAdminGroup1634729050892');
INSERT INTO public.migrations VALUES
	(255, 1634848932643, 'SetTablecellSizeToCompact1634848932643'),
	(256, 1635788669976, 'SetMultiselectProperties1635788669976'),
	(257, 1636372753632, 'RebaseWidgetWidthAndLeftOffsetForResponsiveCanvas1636372753632'),
	(258, 1636609569079, 'BackfillFolderCreatePermissionsAsTruthyForAdminGroup1636609569079'),
	(259, 1638255797809, 'SetLoadingStateToFalseForExistingTables1638255797809'),
	(260, 1638796825499, 'BackfillFolderCreatePermissionsAsTruthyForMissedAdminGroup1638796825499'),
	(261, 1639038616546, 'UpdateDefinitionsForGlobalSettings1639038616546'),
	(262, 1639734070615, 'BackfillDataSourcesAndQueriesForAppVersions1639734070615'),
	(263, 1640683693031, 'BackfillCalendarWeekDateFormat1640683693031'),
	(264, 1641446596775, 'SetImageBorderTypeToNone1641446596775'),
	(265, 1644229722021, 'SetFxActiveToTrueForFxFieldsConvertedToUI1644229722021'),
	(266, 1650485473528, 'PopulateSSOConfigs1650485473528'),
	(267, 1651820577708, 'PopulateTextSize1651820577708'),
	(268, 1653472569828, 'addedInstructionTextPropInFilePickerWidget1653472569828'),
	(269, 1653474337657, 'BackfillFolderDeleteFolderUpdatePermissionsAsTruthyForAdminGroup1653474337657'),
	(270, 1654150855780, 'BackfillAddOrgEnvironmentVariablesGroupPermissions1654150855780'),
	(271, 1654596810662, 'ConvertAllUserEmailsToLowercaseAndDeleteDuplicateUsers1654596810662'),
	(272, 1655279771926, 'listViewWidgetAddingBorderRadiusProperty1655279771926'),
	(273, 1656061763136, 'modalProperties1656061763136'),
	(274, 1656924847186, 'addingCssPropsToTextWidget1656924847186'),
	(447, 1774530738974, 'SetAppPromoteAndReleaseTrueAdmins1774530738974'),
	(275, 1661331234770, 'RestructureTableColumnSizesAndActionsToHaveAValueKeyThatPointsToItsContents1661331234770'),
	(276, 1663581777527, 'ModalWidgetSize1663581777527'),
	(277, 1663689836425, 'instanceSettings1663689836425'),
	(278, 1666814745413, 'updateUserStatus1666814745413'),
	(279, 1667076251897, 'BackfillDataSources1667076251897'),
	(280, 1668521091918, 'ChangeDefinitionStructureForMultiPage1668521091918'),
	(281, 1669054493160, 'moveDataSourceOptionsToEnvironment1669054493160'),
	(282, 1669055405494, 'removePluginFromDataQuery1669055405494'),
	(283, 1669293520796, 'ConnectExistingCommentThreadsToPageIds1669293520796'),
	(284, 1669919175280, 'removeRepetitionInDataSourceAndQuery1669919175280'),
	(285, 1675368628629, 'AddAppVersionIdColumnToDataQueries1675368628629'),
	(286, 1675368628727, 'BackfillAppVersionToDataQueries1675368628727'),
	(287, 1675844361117, 'CleanupDataSourceOptionData1675844361117'),
	(288, 1675844361118, 'MigrateEnvironmentsUnderWorkspace1675844361118'),
	(289, 1676545162064, 'BackfillRunpyDatasources1676545162064'),
	(290, 1677822012965, 'AlterOrganizationIdInAppEnvironments1677822012965'),
	(291, 1679604241777, 'ReplaceTooljetDbTableNamesWithId1679604241777'),
	(292, 1680789366109, 'backfillDatasourceAdminPermissions1680789366109'),
	(293, 1681463532466, 'addMultipleEnvForCEcreatedApps1681463532466'),
	(294, 1682011503431, 'AddNewColumnsToInstanceSettings1682011503431'),
	(295, 1682045191971, 'BackfillInstanceSettingsColumns1682045191971'),
	(296, 1683022868045, 'environmentDataSourceMappingFix1683022868045'),
	(297, 1683136077244, 'AddUniqueConstraintToWorkspaceName1683136077244'),
	(298, 1683148731897, 'BackfillLicenseKeyFromEnv1683148731897'),
	(299, 1684145489093, 'AddUniqueConstraintToAppName1684145489093'),
	(300, 1684145489093, 'AddUniqueConstraintToFolderName1684145489093'),
	(301, 1686826460358, 'BackFillAppEnvironmentsPriorityColumn1686826460358'),
	(302, 1686829426671, 'BackFillCurrentEnvironmentId1686829426671'),
	(303, 1687188169091, 'UpdateOracleDbOptionsWithInstantClientVersion1687188169091');
INSERT INTO public.migrations VALUES
	(304, 1687720044583, 'BackfillAddOrgEnvironmentConstantsGroupPermissions1687720044583'),
	(305, 1688977149516, 'ListviewDefaultMode1688977149516'),
	(306, 1690830899563, 'UpdateMysqlDatasourceForSocketConnection1690830899563'),
	(307, 1692973078520, 'CellSizeRegularCondensed1692973078520'),
	(308, 1692974311591, 'TableRowCellStyle1692974311591'),
	(309, 1693288308041, 'organizationUsersRemoveDuplicates1693288308041'),
	(310, 1693309526388, 'addUniqueKeyConstrainForOrganizationUsers1693309526388'),
	(311, 1693368672418, 'AddEnableMultiplayerSettingsInInstanceSettings1693368672418'),
	(312, 1693574568333, 'AddWhiteLabelsInInstanceSettings1693574568333'),
	(313, 1696841694689, 'AddCommentsInInstanceSettings1696841694689'),
	(314, 1697107564294, 'UpdateFolderUniqueConstriant1697107564294'),
	(315, 1697473340856, 'MigrateAppsDefinitionSchemaTransition1697473340856'),
	(316, 1698222463379, 'AddUniqueAppSlug1698222463379'),
	(317, 1698737393421, 'UpdateCurrentEnvIdOfCeCreatedApps1698737393421'),
	(318, 1698841869350, 'PopulateCEOrgConstantsToOtherEnvs1698841869350'),
	(319, 1698843356891, 'UpdateFirstUserAsSuperAdminForCEInstances1698843356891'),
	(320, 1702419267642, 'AddCustomLogoutUrl1702419267642'),
	(321, 1705379107714, 'AddAppNameAppTypeWorkspaceConstraint1705379107714'),
	(322, 1706012625969, 'AddEnableWorkspaceLoginConfigInInstanceSettings1706012625969'),
	(323, 1706012702739, 'AddEnableSignUpInInstanceSettings1706012702739'),
	(324, 1706012772483, 'AddAllowedDomainsInInstanceSettings1706012772483'),
	(325, 1706024347284, 'AddInstanceLevelSSOInSSOConfigs1706024347284'),
	(326, 1706113492448, 'AddConfigScopeInInstanceSettings1706113492448'),
	(327, 1707466537651, 'MoveVisibilityDisabledStatesToProperties1707466537651'),
	(328, 1709618105790, 'EncryptValuesForExistingOrganizationConstants1709618105790'),
	(329, 1710780718114, 'AddGracePeriodExpiryDateColumnInOrganizationLicenseTable1710780718114'),
	(330, 1711523460586, 'DisableSignUpIfPersonalWorkspaceNotAllowed1711523460586'),
	(331, 1711528858371, 'MoveTableVisibilityDisabledToStyles1711528858371'),
	(332, 1713874179417, 'subscriptionImprovements1713874179417'),
	(333, 1715105945504, 'ReplaceTjDbPrimaryKeyConstraintsForExistingTables1715105945504'),
	(334, 1715248128046, 'MoveCheckboxButtonDisabledToProperties1715248128046'),
	(335, 1716551121164, 'addSMTPConfigsToTable1716551121164'),
	(336, 1718100845287, 'AddOrgThemesforOrganizations1718100845287'),
	(337, 1718542399701, 'UpdateInternalTablesConfigurationsColumn1718542399701'),
	(338, 1720352990850, 'CreateDefaultGroupInExistingWorkspace1720352990850'),
	(339, 1720365772516, 'AddingUsersToRespectiveRolesBuilderAndEndUsers1720365772516'),
	(340, 1720434737529, 'MigrateCustomGroupToNewUserGroup1720434737529'),
	(341, 1720513124281, 'DropGroupPermissionsOlderRelatedTables1720513124281'),
	(342, 1721236971725, 'MoveToolJetDatabaseTablesFromPublicToTenantSchema1721236971725'),
	(343, 1722357931487, 'AddTypeAsGlobalForExistingConstants1722357931487'),
	(344, 1722619519787, 'AddSMTPFromEmailToInstanceSettings1722619519787'),
	(345, 1722661249798, 'InstanceSettingsDataTypeCorrection1722661249798'),
	(346, 1723636080272, 'AddAutomaticSSOLoginInInstanceSettings1723636080272'),
	(347, 1724060238202, 'AddAppThemsv2Fields1724060238202'),
	(348, 1724931663807, 'AddOrganizationIdInUserDetails1724931663807'),
	(349, 1726649944702, 'AddConnectionTypeToSampleDataSources1726649944702'),
	(350, 1731279588337, 'ReplaceTheSampleDBConnectionValues1731279588337'),
	(351, 1731283187529, 'PopulateManualConnectionTypeForOldPostgresDs1731283187529'),
	(352, 1732273175402, 'AddSMTPEnvConfiguredToTable1732273175402'),
	(353, 1733274999001, 'AddEnvironmentPermissions1733274999001');
INSERT INTO public.migrations VALUES
	(354, 1733275000001, 'BackfillEnvironmentPermissionsForBuilders1733275000001'),
	(355, 1733771653728, 'MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728'),
	(356, 1735689600000, 'MigrateJsBundleContentToBinary1735689600000'),
	(357, 1736448327127, 'MoveVisibilityDisabledStatesToPropertiesTextarea1736448327127'),
	(358, 1736921797727, 'MoveInstanceWhiteLabelsToWhiteLabelsEntity1736921797727'),
	(359, 1737039401111, 'UpdateVisibilityFrIconComponent1737039401111'),
	(360, 1737041314335, 'UpdateVisibilityDisabledTooltipPaddingShapeForImageComponent1737041314335'),
	(361, 1738759782116, 'AddPlanToOrganizationLicense1738759782116'),
	(362, 1738833975655, 'AddPlanToOrganizationSubscription1738833975655'),
	(363, 1740401100000, 'SetDefaultWorkspace1740401100000'),
	(364, 1742215016773, 'InsertDataGithubSSH1742215016773'),
	(365, 1742369436314, 'StepsV2Migration1742369436314'),
	(366, 1742369617678, 'EnforceNewBasicPlanLimits1742369617678'),
	(367, 1742905945987, 'UpdateGlobalDataSources1742905945987'),
	(368, 1743053824028, 'MoveVisibilityDisabledStatesDividerLink1743053824028'),
	(369, 1745318714733, 'DeprecateLocalStaticDataSources1745318714733'),
	(370, 1745409452884, 'AddMissingStaticDataSources1745409452884'),
	(371, 1745409631920, 'AddDataSourceConstraintsForStatic1745409631920'),
	(372, 1746728238308, 'SetDefaultSessionTypeToUser1746728238308'),
	(373, 1747338135635, 'BackfillSlackAppOption1747338135635'),
	(374, 1748331051836, 'AddAiGenerationFlagsInApp1748331051836'),
	(375, 1748542504137, 'AddArtifactsTable1748542504137'),
	(376, 1749711866124, 'MigrateEnabledFlagToProviderColumns1749711866124'),
	(377, 1750659565297, 'MigrateHiddenValueFromBooleanToJson1750659565297'),
	(378, 1750761058803, 'RenameTJDefaultThemeTOTooljet1750761058803'),
	(379, 1751258388314, 'UpdateRestApiClientAuthInOauth1751258388314'),
	(380, 1751280222525, 'UpdateSalesforceSourceOptions1751280222525'),
	(381, 1751283157638, 'MoveHideHeaderAndAddPositionToPageSettings1751283157638'),
	(382, 1751315254641, 'BackfillDynamicOptionsPropertyForTabs1751315254641'),
	(383, 1751342006499, 'UpdateSnowflakeSourceOptions1751342006499'),
	(384, 1752298708040, 'RenameTooljetThemeToToolJet1752298708040'),
	(385, 1752307477010, 'AddMissingSurfaceThemeToDefault1752307477010'),
	(386, 1752403387878, 'MigrateFormVisibilityHeaderFooterProperties1752403387878'),
	(387, 1752404494845, 'MigrateContainerVisibilityProperties1752404494845'),
	(388, 1752434805432, 'MigrateVisibilityDisabledHighlightedStatesForTabs1752434805432'),
	(389, 1752568937074, 'MigrationVisibilityDisabledStateFilepicker1752568937074'),
	(390, 1752624000001, 'MigrateGroupSyncData1752624000001'),
	(391, 1752749046662, 'EncrpyGoogleCalendarClientSecret1752749046662'),
	(392, 1754048735123, 'MigrateSSHBranchColumnData1754048735123'),
	(393, 1754379601025, 'StatisticsVersion221754379601025'),
	(394, 1754940735810, 'DeprecateInputWidgetTypeOfField1754940735810'),
	(395, 1754999194042, 'UpdateWorkflowPermissionsForAdminAndBuilder1754999194042'),
	(396, 1756697039957, 'UpdateStatusCodeDefaultValueForWorkflowResponseNode1756697039957'),
	(397, 1756792368199, 'MigrateStarRatingProperties1756792368199'),
	(398, 1756814928001, 'MoveVisibilityAndSetAdvancedTrueForTags1756814928001'),
	(399, 1756814928003, 'MoveVisibilityForHtmlComponent1756814928003'),
	(400, 1757501461678, 'UpdateOrganizationAiCredits1757501461678'),
	(401, 1757505548285, 'UpdateSelfhostAiCredits1757505548285'),
	(402, 1758009004418, 'AddWorkflowGranularPermissionsToExistingAdminGroups1758009004418'),
	(403, 1758192692905, 'AddApiKeytoSelfhostCustomer1758192692905');
INSERT INTO public.migrations VALUES
	(404, 1758457644900, 'MigrateCircularProgressbarProperties1758457644900'),
	(405, 1758569631987, 'UpdateTooltipForKanbanComponent1758569631987'),
	(406, 1758793442013, 'UpdateAppVersionStatusAndFields1758793442013'),
	(407, 1759169380218, 'BackfillGoogleSheetDatasourceAuthenticationType1759169380218'),
	(408, 1760693571486, 'BackfillMicrosoftGraphDatasourceScopeToHaveOfflineAccessForRefreshToken1760693571486'),
	(409, 1761556597329, 'AddGrantTypeKeyInSSOConfig1761556597329'),
	(410, 1762517351039, 'PopulateOIDCCustomScopes1762517351039'),
	(411, 1762770971766, 'RenameGrantTypeKeyInSSOConfig1762770971766'),
	(412, 1762960587101, 'AddGroupSyncEnabledToSAMLConfigs1762960587101'),
	(413, 1763837608217, 'AddLdapGroupSyncToggle1763837608217'),
	(414, 1764000000000, 'BackfillMongoDBDatasourceNewFields1764000000000'),
	(415, 1764930484535, 'UpdateShowFlagForCurrencyInput1764930484535'),
	(416, 1765313746517, 'BackfillDefaultComponentStyles1765313746517'),
	(417, 1765358668387, 'UpdateDefaultThemeBorderWeakValue1765358668387'),
	(418, 1765958549099, 'AddGranularDomainSettings1765958549099'),
	(419, 1766500000001, 'SeedFolderPermissions1766500000001'),
	(420, 1767856819817, 'BackfillCommonBackgroundColorForTabs1767856819817'),
	(421, 1769151383974, 'NormalizeFolderAppsKeepFirstCreatedMappingPerApp1769151383974'),
	(422, 1769162575826, 'DropdownV2MenuSize1769162575826'),
	(423, 1769163530336, 'MigrateVisibilityDisabledStatesForIFrame1769163530336'),
	(424, 1769580578105, 'CurrencyInputNumberFormat1769580578105'),
	(425, 1770286858475, 'BackfillShowClearToggle1770286858475'),
	(426, 1770370074631, 'UpdateSalesforceQueryoptionsSoqlQueryToQuery1770370074631'),
	(427, 1771501843686, 'MigrateTreeSelectVisibility1771501843686'),
	(428, 1771581051295, 'PromoteAndReleaseExistingWorkflowVersionsToProductionAndRelease1771581051295'),
	(429, 1772045292279, 'BackfillDateTimePlaceholders1772045292279'),
	(430, 1773051395212, 'BackfillLayoutRadioButtonV21773051395212'),
	(431, 1773225075273, 'Updatepgsqlssltoggletoboolean1773225075273'),
	(432, 1773229178765, 'UpdateMongodbSslToggleToBoolean1773229178765'),
	(433, 1773229178900, 'EnforceUniqueDataSourceNames1773229178900'),
	(434, 1773229178901, 'BackFillBigQueryType1773229178901'),
	(435, 1773229179000, 'SeedWorkspaceBranchData1773229179000'),
	(436, 1773229180000, 'SeedDefaultDataSourceVersionsForAll1773229180000'),
	(437, 1773229181000, 'EnforceUniqueDataSourceNamesPerBranch1773229181000'),
	(438, 1773229182000, 'RelaxAppNameUniqueForGitApps1773229182000'),
	(439, 1773229182001, 'BackfillMssqlDatasourceAuthType1773229182001'),
	(440, 1773300000000, 'DropDataSourceOptionsTable1773300000000'),
	(441, 1773400000000, 'BackfillAppCoRelationId1773400000000'),
	(442, 1773649782353, 'AddUseEnvConfigToGitProviders1773649782353'),
	(443, 1774000000000, 'AddLLMKeyEnvConfiguredToTable1774000000000'),
	(444, 1774391955730, 'MigrateVisibilityTooltipBoxShadowForColorPicker1774391955730'),
	(445, 1774412653882, 'BackfillLoadingStateListView1774412653882'),
	(446, 1774503863002, 'BackfillPlaceholderTextColor1774503863002'),
	(448, 1774589474535, 'BackfillFontAndHoverStylesForButtonWidgets1774589474535'),
	(449, 1776419051000, 'PromoteAndReleaseExistingModuleVersions1776419051000'),
	(450, 1776419052000, 'BackfillCoRelationIdForDataSources1776419052000'),
	(451, 1776432217565, 'BackfillRefreshButtonAndExpandableRowsForTable1776432217565'),
	(452, 1776600000000, 'SeedPushModulesBranch1776600000000'),
	(453, 1776700000000, 'RemoveAppVersionIdFromDataSourceVersions1776700000000'),
	(454, 1776893271629, 'BackfillCollapseWhenHiddenDefaultToDynamicHeightComponents1776893271629');
INSERT INTO public.migrations VALUES
	(455, 1776977100104, 'UpdatePostgresqlAndMySQLPrimaryKeyColumnVariableToPrimaryKeyColumns1776977100104'),
	(456, 1777100000000, 'AddBranchIdToFolderApps1777100000000'),
	(457, 1777319937510, 'BackfillCollapseWhenHiddenForRemainingComponents1777319937510'),
	(458, 1777461183598, 'BackfillMaxLimitForMultiselectV21777461183598'),
	(459, 1777981940589, 'BackfillPaddingForModuleViewer1777981940589'),
	(460, 1778096864115, 'BackfillEmptyConfirmationMessageOnDataQueries1778096864115'),
	(461, 1778639657919, 'UpdateOldTjdbJoinQuerySnakeCaseToCamelCaseFormat1778639657919'),
	(462, 1778700000000, 'TightenDataSourceVersionConstraints1778700000000'),
	(463, 1779187191605, 'BackFillDatabricksOauth1779187191605'),
	(464, 1779784224000, 'CleanupStaleDraftVersions1779784224000'),
	(465, 1780393833724, 'MigrateVisibilityDisabledStatesForPagination1780393833724'),
	(466, 1780586959120, 'BackfillTooltipFormat1780586959120'),
	(467, 1780916231448, 'EncryptGitSyncPrivateKeys1780916231448'),
	(468, 1781869572704, 'AddModuleGranularPermissionsToExistingGroups1781869572704'),
	(469, 1782086400000, 'BackfillKeyValuePairContainerStylesNeutral1782086400000'),
	(470, 1782112568534, 'BackfillTjdbPermission1782112568534'),
	(471, 1782197622558, 'BackfillModuleCreateDeleteForDefaultGroups1782197622558'),
	(472, 1783372800000, 'MoveNavigationLayoutStylesToStyles1783372800000'),
	(473, 1784790000000, 'BackfillAiPluginManifestType1784790000000'),
	(474, 1785283200000, 'BackfillMssqlDatasourceConnectionType1785283200000'),
	(475, 1234567891000, 'LockMigrationsTable1234567891000'),
	(476, 1779650000000, 'CloneDefaultBranchDraftFromPublished1779650000000');

INSERT INTO public.organization_git_https VALUES
	('9f1bc69e-0d92-4eac-bea6-52d8172ecc81', '84cacd6f-f217-47a5-9bd9-eb9567c47a49', 'https://github.com/spike58/fixture.git', 'main', '1', '1', NULL, NULL, 'redacted', true, '2026-10-28 11:45:11.05139', '2026-10-28 11:45:11.05139', true);

INSERT INTO public.organization_git_sync VALUES
	('84cacd6f-f217-47a5-9bd9-eb9567c47a49', '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 11:45:11.05139', '2026-10-28 11:45:11.05139', false, true, 'v2', false);

INSERT INTO public.organization_git_sync_branches VALUES
	('31b785c9-8f44-4954-aaac-f60c4cd25148', '8b930517-7801-4b07-bd19-7eea1b3beabd', 'main', true, NULL, NULL, NULL, '2026-10-28 11:45:11.05139', '2026-10-28 11:45:11.05139', NULL, NULL),
	('5b0b484a-ed07-4d19-b6f9-e3903783e141', '8b930517-7801-4b07-bd19-7eea1b3beabd', 'feature-x', false, '31b785c9-8f44-4954-aaac-f60c4cd25148', NULL, NULL, '2026-10-28 11:45:11.085613', '2026-10-28 11:45:11.085613', NULL, NULL);

INSERT INTO public.organization_themes VALUES
	('f3c347cc-ac31-4b02-9f24-32e447a7b356', 'ToolJet', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '{"brand":{"colors":{"primary":{"light":"#4368E3","dark":"#4A6DD9"},"secondary":{"light":"#6A727C","dark":"#CFD3D8"},"tertiary":{"light":"#1E823B","dark":"#318344"}}},"text":{"font":"IBM Plex Sans","colors":{"primary":{"light":"#1B1F24","dark":"#CFD3D8"},"placeholder":{"light":"#6A727C","dark":"#858C94"}}},"border":{"radius":{"default":6,"small":0,"large":0},"colors":{"default":{"light":"#CCD1D5","dark":"#3C434B"},"weak":{"light":"#E4E7EB","dark":"#2B3036"}}},"systemStatus":{"colors":{"success":{"light":"#1E823B","dark":"#318344"},"error":{"light":"#D72D39","dark":"#D03F43"},"warning":{"light":"#BF4F03","dark":"#BA5722"}}},"surface":{"colors":{"appBackground":{"light":"#F6F6F6","dark":"#121518"},"surface1":{"light":"#FFFFFF","dark":"#1E2226"},"surface2":{"light":"#F6F8FA","dark":"#2B3036"},"surface3":{"light":"#E4E7EB","dark":"#3C434B"}}}}', true, true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('6c86f1aa-4a10-4775-949f-7f2ce0a61709', 'ToolJet', '8b930517-7801-4b07-bd19-7eea1b3beabd', '{"brand":{"colors":{"primary":{"light":"#4368E3","dark":"#4A6DD9"},"secondary":{"light":"#6A727C","dark":"#CFD3D8"},"tertiary":{"light":"#1E823B","dark":"#318344"}}},"text":{"font":"IBM Plex Sans","colors":{"primary":{"light":"#1B1F24","dark":"#CFD3D8"},"placeholder":{"light":"#6A727C","dark":"#858C94"}}},"border":{"radius":{"default":6,"small":0,"large":0},"colors":{"default":{"light":"#CCD1D5","dark":"#3C434B"},"weak":{"light":"#E4E7EB","dark":"#2B3036"}}},"systemStatus":{"colors":{"success":{"light":"#1E823B","dark":"#318344"},"error":{"light":"#D72D39","dark":"#D03F43"},"warning":{"light":"#BF4F03","dark":"#BA5722"}}},"surface":{"colors":{"appBackground":{"light":"#F6F6F6","dark":"#121518"},"surface1":{"light":"#FFFFFF","dark":"#1E2226"},"surface2":{"light":"#F6F8FA","dark":"#2B3036"},"surface3":{"light":"#E4E7EB","dark":"#3C434B"}}}}', true, true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717');

INSERT INTO public.organization_tjdb_configurations VALUES
	('aea5785d-fff0-4cc8-894d-3a37346e685b', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'user_7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'redacted', '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('a1bda825-8e04-4988-be8f-95df40287303', '8b930517-7801-4b07-bd19-7eea1b3beabd', 'user_8b930517-7801-4b07-bd19-7eea1b3beabd', 'redacted', '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717');

INSERT INTO public.organization_users VALUES
	('9a6e2d24-801f-47c1-a88d-7ce3e2af3cc5', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'all-users', 'active', '2026-10-28 17:15:09.601', '2026-10-28 17:15:09.601', NULL, 'invite', NULL),
	('c9ae42d4-d708-4a94-8f72-fb762ba68a60', '8b930517-7801-4b07-bd19-7eea1b3beabd', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'all-users', 'active', '2026-10-28 17:15:09.825', '2026-10-28 17:15:09.825', NULL, 'invite', NULL);

INSERT INTO public.organizations VALUES
	('7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'gitoff', NULL, '2026-10-28 17:15:09.441', '2026-10-28 11:46:11.011815', false, true, 'gitoff', NULL, 'active', false, true, '2026-10-28 17:16:11.023', NULL, NULL),
	('8b930517-7801-4b07-bd19-7eea1b3beabd', 'giton', NULL, '2026-10-28 17:15:09.806', '2026-10-28 11:46:11.719567', false, true, 'giton', NULL, 'active', false, false, '2026-10-28 17:16:11.72', NULL, NULL);

INSERT INTO public.pages VALUES
	('d816915e-c1a0-4a49-b724-75a9a13966c0', 'Home', 1, 'home', false, '9df57db2-562e-450c-8c1c-fdd166fb742d', '2026-10-28 11:45:10.551862', '2026-10-28 11:45:10.551862', true, NULL, NULL, NULL, false, NULL, 'new_tab', 'default', 'cfeab0fe-4b83-49a4-8111-d945029c8404', NULL, NULL, NULL, NULL, 'false'),
	('d1702491-7abd-4eab-a395-c6e569851e61', 'Home', 1, 'home', false, '27690053-b609-41d0-b0ca-ffb2f8df155d', '2026-10-28 11:45:10.594367', '2026-10-28 11:45:10.594367', true, NULL, NULL, NULL, false, NULL, 'new_tab', 'default', '804238b6-0d6e-4363-a59b-50f9d89f8fcf', NULL, NULL, NULL, NULL, 'false'),
	('fb0531db-191e-48c7-91a2-fd4a02108eaa', 'Home', 1, 'home', false, 'cec07005-b8a8-4c10-a7e2-735cbf791b36', '2026-10-28 11:45:11.149448', '2026-10-28 11:45:11.149448', true, NULL, NULL, NULL, false, NULL, 'new_tab', 'default', 'cfeab0fe-4b83-49a4-8111-d945029c8404', NULL, NULL, NULL, NULL, 'false'),
	('7b3a34e3-6a26-4425-8488-65c16af9f89b', 'Home', 1, 'home', false, 'ea3ea783-2dcd-455e-b5f8-4175ac817428', '2026-10-28 11:45:10.571311', '2026-10-28 11:46:00.864094', true, NULL, 1, NULL, false, NULL, 'new_tab', 'default', '7c0994c4-8198-48a2-91af-bb12a566a3a2', NULL, NULL, NULL, NULL, 'false'),
	('0ddb6c99-5263-426b-8eb9-2710a85d7fa0', 'Home', 1, 'home', false, '83e0e06a-ee44-4553-82d0-88dac3c33be7', '2026-10-28 11:45:10.613002', '2026-10-28 11:46:00.965481', true, NULL, 1, NULL, false, NULL, 'new_tab', 'default', '2aabf571-7291-4b4b-922f-eee12fc6582a', NULL, NULL, NULL, NULL, 'false'),
	('e1c58128-07fc-4d33-a4cf-d6bc0faaf178', 'Home', 1, 'home', false, 'e9df0342-efa3-4f60-b232-2c89defc7464', '2026-10-28 11:45:11.096708', '2026-10-28 11:46:01.602908', true, NULL, 1, NULL, false, NULL, 'new_tab', 'default', '0064fd95-e413-42ba-9261-e6ee88d2cd15', NULL, NULL, NULL, NULL, 'false'),
	('0c0ff636-cf85-4d37-9d80-5d98f74852d2', 'Home', 1, 'home', false, '2a03cb23-f76a-4708-a713-1ffc90c46bbb', '2026-10-28 11:45:09.936962', '2026-10-28 11:46:11.254011', true, NULL, 1, NULL, false, NULL, 'new_tab', 'default', '8dcf0e44-b815-4c8f-9047-0ed6af021a0e', NULL, NULL, NULL, NULL, 'false'),
	('5115aedc-9579-4053-b652-a3a77d20a7ab', 'Home', 1, 'home', false, '00e2fada-ac33-4f18-a3a7-0b517e61e413', '2026-10-28 11:45:09.96649', '2026-10-28 11:46:11.319328', true, NULL, 1, NULL, false, NULL, 'new_tab', 'default', '7367e177-0da4-4f96-a526-a60cc9f1fc30', NULL, NULL, NULL, NULL, 'false'),
	('1fa9285f-c049-44d2-9215-0b7a85d4ffe5', 'Home', 1, 'home', false, 'e0a72ede-518f-4e03-b0cd-fccbfc072371', '2026-10-28 11:45:09.993815', '2026-10-28 11:46:11.369911', true, NULL, 1, NULL, false, NULL, 'new_tab', 'default', 'bf4ddca6-357b-48c6-9b1c-785047ceae70', NULL, NULL, NULL, NULL, 'false'),
	('5b1d3e7a-daab-445b-983b-491d85eb7dd3', 'Home', 1, 'home', false, 'e56f8149-cc5f-409a-9e44-a8d8e33805fa', '2026-10-28 11:45:10.03292', '2026-10-28 11:46:11.431768', true, NULL, 1, NULL, false, NULL, 'new_tab', 'default', '9b6eda5a-8748-4d54-8ba8-6a9031452f06', NULL, NULL, NULL, NULL, 'false');

INSERT INTO public.permission_groups VALUES
	('bec7a639-bc4f-4d83-9635-0e4b6b2cc515', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'end-user', 'default', false, false, false, false, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', false, false, false, false, false, false, false, false, false),
	('d26f8423-1277-4ea9-bdd8-07916f1a4e37', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'admin', 'default', true, true, true, true, true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', true, true, true, true, true, true, true, true, true),
	('eed3dee6-b46c-4eca-8fb5-ac70fb33e611', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'builder', 'default', true, true, true, true, true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', true, true, true, true, true, true, true, true, true),
	('21075232-5900-4475-ac90-96f9902dcad9', '8b930517-7801-4b07-bd19-7eea1b3beabd', 'end-user', 'default', false, false, false, false, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', false, false, false, false, false, false, false, false, false),
	('ae2dfbd6-c28e-47c8-aea4-08348298a5a2', '8b930517-7801-4b07-bd19-7eea1b3beabd', 'admin', 'default', true, true, true, true, true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', true, true, true, true, true, true, true, true, true),
	('b1d29dcd-b3b1-4ef5-9808-50d8666a5d24', '8b930517-7801-4b07-bd19-7eea1b3beabd', 'builder', 'default', true, true, true, true, true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', true, true, true, true, true, true, true, true, true);

INSERT INTO public.sso_configs VALUES
	('cb63ebe4-82e7-4c3d-aec7-b76bfd158eed', NULL, 'google', '{"clientId":""}', false, '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'instance'),
	('78bc7322-2772-4901-810e-b22c3d2a2e6e', NULL, 'git', '{"clientId":"","hostName":"","clientSecret":""}', false, '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'instance'),
	('cf49623a-326f-4634-bf73-2305ab472a55', NULL, 'form', NULL, true, '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'instance'),
	('19cdd1ad-46a6-4709-b768-662a373d1826', NULL, 'openid', '{"clientId":"","name":"","clientSecret":"","wellKnownUrl":"","grantType":"authorization_code"}', false, '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'instance'),
	('b6896fcf-316b-4dd7-9fee-93a8b4419eb6', '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'form', NULL, true, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318', 'organization'),
	('ef573af2-3b24-451c-af0f-b73e753ca2fd', '8b930517-7801-4b07-bd19-7eea1b3beabd', 'form', NULL, true, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717', 'organization');

INSERT INTO public.users VALUES
	('c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'Spike', 'Admin', 'admin@spike58.test', 'redacted', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 11:45:09.442318', '2026-10-28 11:46:11.719567', '', NULL, 0, NULL, NULL, 'active', 'signup', 'instance', NULL, 'account_created', false, NULL, NULL, NULL, NULL);

INSERT INTO public.white_labelling VALUES
	('b017bb89-0b9e-4fbc-9db0-460f90a0022c', NULL, '', '', '', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'ACTIVE', NULL);

SELECT pg_catalog.setval('public.migrations_id_seq', 476, true);

ALTER TABLE ONLY public.component_permissions
    ADD CONSTRAINT "PK_023b9562d9ace19c9719a109ba6" PRIMARY KEY (id);

ALTER TABLE ONLY public.selfhost_customers_ai_feature
    ADD CONSTRAINT "PK_062b94ddf3d6dc23ecf6911ff59" PRIMARY KEY (id);

ALTER TABLE ONLY public.sso_responses
    ADD CONSTRAINT "PK_08e1894f3827e39909aef60e957" PRIMARY KEY (id);

ALTER TABLE ONLY public.components
    ADD CONSTRAINT "PK_0d742661c63926321b5f5eac1ad" PRIMARY KEY (id);

ALTER TABLE ONLY public.page_users
    ADD CONSTRAINT "PK_0feeebd52806c04785d05ea4157" PRIMARY KEY (id);

ALTER TABLE ONLY public.workflow_bundles
    ADD CONSTRAINT "PK_1186bee894f11b270421cc855fa" PRIMARY KEY (id);

ALTER TABLE ONLY public.sso_configs
    ADD CONSTRAINT "PK_13207db072d3e8fb33c7cf9ba80" PRIMARY KEY (id);

ALTER TABLE ONLY public.ai_response_votes
    ADD CONSTRAINT "PK_166ac4b2a636db8b5ddd1852ef0" PRIMARY KEY (id);

ALTER TABLE ONLY public.workflow_execution_edges
    ADD CONSTRAINT "PK_170d8d5f788dc249f770ca873b9" PRIMARY KEY (id);

ALTER TABLE ONLY public.app_environments
    ADD CONSTRAINT "PK_1bac3ab1d7df229239b0328b15e" PRIMARY KEY (id);

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY (id);

ALTER TABLE ONLY public.credentials
    ADD CONSTRAINT "PK_1e38bc43be6697cdda548ad27a6" PRIMARY KEY (id);

ALTER TABLE ONLY public.selfhost_customers_ai_credit_history
    ADD CONSTRAINT "PK_265dbb6095c6dec795b5a223fb4" PRIMARY KEY (id);

ALTER TABLE ONLY public.group_admins
    ADD CONSTRAINT "PK_2f4e10f238a87c0f41ab12176e7" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_tjdb_configurations
    ADD CONSTRAINT "PK_2fdb35a416b4c04bd1f215eed77" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_git_ssh
    ADD CONSTRAINT "PK_32d45842ea7315507dcf1c91094" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_gitlab
    ADD CONSTRAINT "PK_34d4ed52bcf334aa2606413ffa5" PRIMARY KEY (id);

ALTER TABLE ONLY public.custom_styles
    ADD CONSTRAINT "PK_36ec649459e1f8791238e09606e" PRIMARY KEY (id);

ALTER TABLE ONLY public.internal_tables
    ADD CONSTRAINT "PK_38927ea8a32fb5fa3c2f284bdbe" PRIMARY KEY (id);

ALTER TABLE ONLY public.white_labelling
    ADD CONSTRAINT "PK_3c6542b834b380fa2abfe246949" PRIMARY KEY (id);

ALTER TABLE ONLY public.app_history
    ADD CONSTRAINT "PK_467972ebd7214929fa0fe5ca7cd" PRIMARY KEY (id);

ALTER TABLE ONLY public.custom_domains
    ADD CONSTRAINT "PK_53c30715082abb90e5063a2a397" PRIMARY KEY (id);

ALTER TABLE ONLY public.metadata
    ADD CONSTRAINT "PK_56b22355e89941b9792c04ab176" PRIMARY KEY (id);

ALTER TABLE ONLY public.folder_apps
    ADD CONSTRAINT "PK_58949da84583c52002aba06345a" PRIMARY KEY (id);

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT "PK_60db12765b82858ba00c8aa4ae2" PRIMARY KEY (id);

ALTER TABLE ONLY public.component_users
    ADD CONSTRAINT "PK_6112a4d482638deb3111784baa5" PRIMARY KEY (id);

ALTER TABLE ONLY public.data_queries
    ADD CONSTRAINT "PK_6302ae6a7a364dea5d3448c3042" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT "PK_64e17f1dc8ebe056b49e751a494" PRIMARY KEY (id);

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT "PK_6516bbed3c129918e05c5012edb" PRIMARY KEY (id);

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY (id);

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "PK_6c16b9093a142e0e7613b04a3d9" PRIMARY KEY (id);

ALTER TABLE ONLY public.workflow_schedules
    ADD CONSTRAINT "PK_6c4c2cd5ad440ed1f7cf34a4a28" PRIMARY KEY (id);

ALTER TABLE ONLY public.selfhost_customer_licenses
    ADD CONSTRAINT "PK_6d00d2566188957916aa468a70e" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_ai_keys
    ADD CONSTRAINT "PK_73b2a9b81a0bc6242fb8faf286f" PRIMARY KEY (id);

ALTER TABLE ONLY public.page_permissions
    ADD CONSTRAINT "PK_757d978a5b7efe07544d92bf9e5" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_constants
    ADD CONSTRAINT "PK_7606acffdad04e6ea3adcd57a53" PRIMARY KEY (id);

ALTER TABLE ONLY public.user_mfa
    ADD CONSTRAINT "PK_7c15aa872d5f1498f2294dd2df8" PRIMARY KEY (id);

ALTER TABLE ONLY public.org_environment_constant_values
    ADD CONSTRAINT "PK_7ed9d11c766dd9cde2d1a9123e3" PRIMARY KEY (id);

ALTER TABLE ONLY public.data_query_folder_mappings
    ADD CONSTRAINT "PK_829e82b98a97a4fca1c9e05670a" PRIMARY KEY (id);

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "PK_8578bd31b0e7f6d6c2480dbbca8" PRIMARY KEY (id);

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY (id);

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT "PK_8d36b0dcf0c026c7aad923c80fd" PRIMARY KEY (id);

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT "PK_8f21ed625aa34c8391d636b7d3b" PRIMARY KEY (id);

ALTER TABLE ONLY public.event_handlers
    ADD CONSTRAINT "PK_913440be9e15e070b182e47ce33" PRIMARY KEY (id);

ALTER TABLE ONLY public.organizations_payments
    ADD CONSTRAINT "PK_95a2eac4fbfee993657dc5fddba" PRIMARY KEY (id);

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT "PK_9b97e4fbff9c2f3918fda27f999" PRIMARY KEY (id);

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT "PK_9d49b5c86c267d902145ed42c9d" PRIMARY KEY (id);

ALTER TABLE ONLY public.sso_config_oidc_group_sync
    ADD CONSTRAINT "PK_a14f718412a6f11b72e6bd2bbce" PRIMARY KEY (id);

ALTER TABLE ONLY public.query_users
    ADD CONSTRAINT "PK_a2e89a37ee49296ebf0a6b9ef39" PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_subscription_invoices
    ADD CONSTRAINT "PK_a7090f57601793033aaccc8514f" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_license
    ADD CONSTRAINT "PK_a8c9e6549f981f0b7df9c096e2b" PRIMARY KEY (id);

ALTER TABLE ONLY public.org_environment_variables
    ADD CONSTRAINT "PK_aaf204f1037d84a30714a0b446c" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT "PK_af79a22d50256af35812ba60a87" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_git_sync
    ADD CONSTRAINT "PK_b2aca769e8a446b6c9ed41e8980" PRIMARY KEY (id);

ALTER TABLE ONLY public.user_ban_list
    ADD CONSTRAINT "PK_b462cf47feaabf83558bfe5e8b1" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_themes
    ADD CONSTRAINT "PK_b5e502e596d9bb8ce610fdf1733" PRIMARY KEY (id);

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT "PK_bb3d17826b76295957a253ba73e" PRIMARY KEY (id);

ALTER TABLE ONLY public.notification_recipients
    ADD CONSTRAINT "PK_bd5b25c456987261a38c762b223" PRIMARY KEY (id);

ALTER TABLE ONLY public.data_source_user_oauth2s
    ADD CONSTRAINT "PK_c4766fc4eae3575d6edb830daee" PRIMARY KEY (id);

ALTER TABLE ONLY public.apps
    ADD CONSTRAINT "PK_c5121fda0f8268f1f7f84134e19" PRIMARY KEY (id);

ALTER TABLE ONLY public.comment_users
    ADD CONSTRAINT "PK_c7b47c32b9c1cc3be64a5e29b11" PRIMARY KEY (id);

ALTER TABLE ONLY public.data_query_folders
    ADD CONSTRAINT "PK_ca856fd8ee525f5d60023545580" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_ai_credit_history
    ADD CONSTRAINT "PK_cf1fa6d5b90370f9ae84bc11bd9" PRIMARY KEY (id);

ALTER TABLE ONLY public.ai_chat_prompts
    ADD CONSTRAINT "PK_d36be44b14ce2878c77b2a012ce" PRIMARY KEY (id);

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT "PK_d8a74804c34fc3900502cd27275" PRIMARY KEY (id);

ALTER TABLE ONLY public.workspace_ban_list
    ADD CONSTRAINT "PK_db3722c0acf83056e687fa60592" PRIMARY KEY (id);

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT "PK_dc70b1c6b641726739857fd938d" PRIMARY KEY (id);

ALTER TABLE ONLY public.workflow_execution_nodes
    ADD CONSTRAINT "PK_deaf3f80012cc2ffd6d5d680a8c" PRIMARY KEY (id);

ALTER TABLE ONLY public.query_permissions
    ADD CONSTRAINT "PK_e445af120bef04f23220a8be358" PRIMARY KEY (id);

ALTER TABLE ONLY public.onboarding_details
    ADD CONSTRAINT "PK_e53199715a021077f89edfa24bc" PRIMARY KEY (id);

ALTER TABLE ONLY public.organizations_ai_feature
    ADD CONSTRAINT "PK_e8012da60677ceac3e976c99e84" PRIMARY KEY (id);

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY (id);

ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT "PK_eb2567a5e4188cd54689e1d79ef" PRIMARY KEY (id);

ALTER TABLE ONLY public.user_personal_access_tokens
    ADD CONSTRAINT "PK_ebcf90ff97499e358e525c413cd" PRIMARY KEY (id);

ALTER TABLE ONLY public.layouts
    ADD CONSTRAINT "PK_f2331b0ed523c5c349652fffc7e" PRIMARY KEY (id);

ALTER TABLE ONLY public.selfhost_customers
    ADD CONSTRAINT "PK_f642e7b334b1ca6181329368ae1" PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_git_https
    ADD CONSTRAINT "PK_fadcd863f5e0166942c9659fbaf" PRIMARY KEY (id);

ALTER TABLE ONLY public.user_details
    ADD CONSTRAINT "PK_fb08394d3f499b9e441cab9ca51" PRIMARY KEY (id);

ALTER TABLE ONLY public.data_source_group_permissions
    ADD CONSTRAINT "PK_fc5fc8714e4c318200c672932f3" PRIMARY KEY (id);

ALTER TABLE ONLY public.ai_conversation_messages
    ADD CONSTRAINT "PK_ff230e9ba9eecf7f23be22920ae" PRIMARY KEY (id);

ALTER TABLE ONLY public.onboarding_details
    ADD CONSTRAINT "UQ_0ca5c5c7e2c7ce1a7c03dbb50ce" UNIQUE (user_id);

ALTER TABLE ONLY public.organizations_payments
    ADD CONSTRAINT "UQ_0f4287f77d7f42bfff96208211a" UNIQUE (invoice_id);

ALTER TABLE ONLY public.user_ban_list
    ADD CONSTRAINT "UQ_124d8e6be7e1b9dc4a2fab8c29a" UNIQUE (email);

ALTER TABLE ONLY public.org_environment_variables
    ADD CONSTRAINT "UQ_336d8c341188f36c2b2eb32cabe" UNIQUE (variable_name, variable_type, organization_id);

ALTER TABLE ONLY public.apps
    ADD CONSTRAINT "UQ_35eef0fb1f3f2b435b8b6d82ba0" UNIQUE (slug);

ALTER TABLE ONLY public.workspace_ban_list
    ADD CONSTRAINT "UQ_3c154e68475565fb5012e91bd98" UNIQUE (organization_id);

ALTER TABLE ONLY public.organization_git_ssh
    ADD CONSTRAINT "UQ_620f5b6c5d7ef7741cfaa0c5e47" UNIQUE (ssh_private_key);

ALTER TABLE ONLY public.organization_git_sync
    ADD CONSTRAINT "UQ_6951adbb9a9e5cd4c24423220e4" UNIQUE (organization_id);

ALTER TABLE ONLY public.organization_git_ssh
    ADD CONSTRAINT "UQ_81ad1877df5dcb5360157bed2ca" UNIQUE (config_id);

ALTER TABLE ONLY public.org_environment_constant_values
    ADD CONSTRAINT "UQ_88c9a33b0ea9d9d5ac9b3d7ac71" UNIQUE (organization_constant_id, environment_id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);

ALTER TABLE ONLY public.group_admins
    ADD CONSTRAINT "UQ_a63ab4ea34529a63cdd55eed88d" UNIQUE (user_id, group_id);

ALTER TABLE ONLY public.organization_ai_keys
    ADD CONSTRAINT "UQ_c2e41ced920fa2faa9ec23468dc" UNIQUE (organization_id);

ALTER TABLE ONLY public.organization_git_ssh
    ADD CONSTRAINT "UQ_cf0451c47ef5bee726b6708c97c" UNIQUE (ssh_public_key);

ALTER TABLE ONLY public.organization_git_https
    ADD CONSTRAINT "UQ_d9a726cf15ab296361bcb371184" UNIQUE (config_id);

ALTER TABLE ONLY public.data_query_folder_mappings
    ADD CONSTRAINT "UQ_data_query_folder_mapping_child" UNIQUE (child_id, child_type);

ALTER TABLE ONLY public.custom_domains
    ADD CONSTRAINT "UQ_e15fa3631ef1b306a4b4ec1d1b1" UNIQUE (domain);

ALTER TABLE ONLY public.user_mfa
    ADD CONSTRAINT "UQ_e30b056a8a4104c1be661031019" UNIQUE (identifier);

ALTER TABLE ONLY public.custom_domains
    ADD CONSTRAINT "UQ_e3bc9b51c6bf381f711a27448a4" UNIQUE (organization_id);

ALTER TABLE ONLY public.white_labelling
    ADD CONSTRAINT "UQ_e4a48ea7ac57db22b6e46e2bde6" UNIQUE (organization_id);

ALTER TABLE ONLY public.organization_tjdb_configurations
    ADD CONSTRAINT "UQ_edd0769f6a0e1b47a4e5783c297" UNIQUE (organization_id);

ALTER TABLE ONLY public.instance_settings
    ADD CONSTRAINT "UQ_f4841fbd4c9819d5ade4b5dfeb8" UNIQUE (key);

ALTER TABLE ONLY public.organization_gitlab
    ADD CONSTRAINT "UQ_fad9496e78b95985899ac69f63a" UNIQUE (config_id);

ALTER TABLE ONLY public.organizations_ai_feature
    ADD CONSTRAINT "UQ_org_wallet_type" UNIQUE (organization_id, wallet_type);

ALTER TABLE ONLY public.organization_constants
    ADD CONSTRAINT "UQ_organization_constant_name_type" UNIQUE (constant_name, organization_id, type);

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT "UQ_plugin_pluginId" UNIQUE (plugin_id);

ALTER TABLE ONLY public.selfhost_customers_ai_feature
    ADD CONSTRAINT "UQ_selfhost_customer_wallet_type" UNIQUE (selfhost_customer_id, wallet_type);

ALTER TABLE ONLY public.user_details
    ADD CONSTRAINT "UQ_user_details_organization_user" UNIQUE (organization_id, user_id);

ALTER TABLE ONLY public.apps_group_permissions
    ADD CONSTRAINT apps_group_permissions_granular_permission_id_key UNIQUE (granular_permission_id);

ALTER TABLE ONLY public.apps_group_permissions
    ADD CONSTRAINT apps_group_permissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.custom_styles
    ADD CONSTRAINT custom_styles_organization_id_unique UNIQUE (organization_id);

ALTER TABLE ONLY public.data_source_version_options
    ADD CONSTRAINT data_source_version_options_data_source_version_id_environm_key UNIQUE (data_source_version_id, environment_id);

ALTER TABLE ONLY public.data_source_version_options
    ADD CONSTRAINT data_source_version_options_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.data_source_versions
    ADD CONSTRAINT data_source_versions_data_source_id_branch_id_key UNIQUE (data_source_id, branch_id);

ALTER TABLE ONLY public.data_source_versions
    ADD CONSTRAINT data_source_versions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.data_sources_group_permissions
    ADD CONSTRAINT data_sources_group_permissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT folder_name_organization_id_unique UNIQUE (name, type, organization_id);

ALTER TABLE ONLY public.folders_group_permissions
    ADD CONSTRAINT folders_group_permissions_granular_permission_id_key UNIQUE (granular_permission_id);

ALTER TABLE ONLY public.folders_group_permissions
    ADD CONSTRAINT folders_group_permissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.granular_permissions
    ADD CONSTRAINT granular_permissions_name_unique UNIQUE (name, group_id);

ALTER TABLE ONLY public.granular_permissions
    ADD CONSTRAINT granular_permissions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.group_apps
    ADD CONSTRAINT group_apps_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.group_data_sources
    ADD CONSTRAINT group_data_sources_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.group_folders
    ADD CONSTRAINT group_folders_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.permission_groups
    ADD CONSTRAINT group_name_organization_id_unique UNIQUE (organization_id, name);

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT group_users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.module_origin_branch_staging
    ADD CONSTRAINT module_origin_branch_staging_pkey PRIMARY KEY (app_id);

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT name_app_id_app_versions_unique UNIQUE (name, app_id);

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT name_organizations_unique UNIQUE (name);

ALTER TABLE ONLY public.organization_git_sync_branches
    ADD CONSTRAINT organization_git_sync_branches_organization_id_branch_name_key UNIQUE (organization_id, branch_name);

ALTER TABLE ONLY public.organization_git_sync_branches
    ADD CONSTRAINT organization_git_sync_branches_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.organization_themes
    ADD CONSTRAINT organization_id_app_theme_name_unique UNIQUE (organization_id, name);

ALTER TABLE ONLY public.internal_tables
    ADD CONSTRAINT organization_id_table_name_unique UNIQUE (organization_id, table_name);

ALTER TABLE ONLY public.organization_license
    ADD CONSTRAINT organization_license_organization_id_unique UNIQUE (organization_id);

ALTER TABLE ONLY public.permission_groups
    ADD CONSTRAINT permission_groups_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.selfhost_customer_licenses
    ADD CONSTRAINT selfhost_customer_licenses_email_unique UNIQUE (email);

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT slug_organizations_unique UNIQUE (slug);

ALTER TABLE ONLY public.group_apps
    ADD CONSTRAINT unique_app_and_permission UNIQUE (app_id, apps_group_permissions_id);

ALTER TABLE ONLY public.group_folders
    ADD CONSTRAINT unique_folder_and_permission UNIQUE (folder_id, folders_group_permissions_id);

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT unique_key_organization_subscriptions_subscription_id UNIQUE (subscription_id);

ALTER TABLE ONLY public.organization_subscription_invoices
    ADD CONSTRAINT unique_key_subscription_invoices_invoice_id UNIQUE (invoice_id);

ALTER TABLE ONLY public.app_environments
    ADD CONSTRAINT unique_organization_id_priority UNIQUE (organization_id, priority);

ALTER TABLE ONLY public.notification_recipients
    ADD CONSTRAINT uq_recipient_notification_user UNIQUE (notification_id, user_id);

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT user_group_unique UNIQUE (user_id, group_id);

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT user_organization_unique UNIQUE (user_id, organization_id);

CREATE INDEX "IDX_673dc1c412adfb5b54ec419224" ON public.components USING btree (name);

CREATE INDEX "IDX_96aad5771d4c1bea3d75ee5cb4" ON public.custom_domains USING btree (status);

CREATE UNIQUE INDEX "IDX_CONFIG_SCOPE_SSO" ON public.sso_configs USING btree (config_scope, sso) WHERE (organization_id IS NULL);

CREATE UNIQUE INDEX "IDX_UNIQUE_ORG_AI_KEY" ON public.organization_ai_keys USING btree (organization_id);

CREATE UNIQUE INDEX "IDX_UNIQUE_SEQ_PER_APP_VERSION" ON public.app_history USING btree (app_version_id, sequence_number);

CREATE INDEX "IDX_dab02b08685ba25e5a59626992" ON public.components USING btree (type);

CREATE INDEX "IDX_data_query_folder_mappings_child_id" ON public.data_query_folder_mappings USING btree (child_id);

CREATE INDEX "IDX_data_query_folder_mappings_parent_id" ON public.data_query_folder_mappings USING btree (parent_id);

CREATE INDEX "IDX_de521ef5844106d2b2033dd2d8" ON public.components USING btree (page_id);

CREATE INDEX "IDX_organization_ai_credit_history_org_id" ON public.organization_ai_credit_history USING btree (organization_id);

CREATE INDEX "IDX_selfhost_customers_ai_credit_history_selfhost_customer_id" ON public.selfhost_customers_ai_credit_history USING btree (selfhost_customer_id);

CREATE INDEX "IDX_user_ban_list_email" ON public.user_ban_list USING btree (email);

CREATE INDEX "IDX_workspace_ban_list_organization_id" ON public.workspace_ban_list USING btree (organization_id);

CREATE UNIQUE INDEX "UQ_organization_id_nullable" ON public.white_labelling USING btree (organization_id) WHERE (organization_id IS NOT NULL);

CREATE UNIQUE INDEX app_name_organization_id_unique ON public.apps USING btree (name, organization_id, type) WHERE (creation_mode = 'DEFAULT'::public.app_creation_mode);

CREATE UNIQUE INDEX app_versions_app_default_branch_draft_unique ON public.app_versions USING btree (app_id, branch_id) WHERE ((status = 'DRAFT'::public.version_status_enum) AND (version_type = 'version'::public.app_version_type) AND (is_stub = false) AND (branch_id IS NOT NULL));

CREATE UNIQUE INDEX app_versions_app_default_branch_draft_unique_ensure_single_stub ON public.app_versions USING btree (app_id, branch_id) WHERE ((status = 'DRAFT'::public.version_status_enum) AND (version_type = 'version'::public.app_version_type) AND (is_stub = true) AND (branch_id IS NOT NULL));

CREATE INDEX audit_logs_organization_id_created_at_brin_idx ON public.audit_logs USING brin (organization_id, created_at) WITH (pages_per_range='32');

CREATE INDEX idx_app_versions_app_id_branch_id ON public.app_versions USING btree (app_id, branch_id);

CREATE INDEX idx_app_versions_branch_id ON public.app_versions USING btree (branch_id) WHERE (branch_id IS NOT NULL);

CREATE INDEX idx_app_versions_module_ref_branch ON public.app_versions USING btree (module_reference_id, branch_id) WHERE (module_reference_id IS NOT NULL);

CREATE INDEX idx_apps_co_relation_id ON public.apps USING btree (co_relation_id) WHERE (co_relation_id IS NOT NULL);

CREATE INDEX idx_bundle_sha ON public.workflow_bundles USING btree (bundle_sha);

CREATE INDEX idx_bundle_status ON public.workflow_bundles USING btree (status);

CREATE UNIQUE INDEX idx_data_source_versions_one_default ON public.data_source_versions USING btree (data_source_id) WHERE (is_default = true);

CREATE INDEX idx_ds_granular_permission_id ON public.data_sources_group_permissions USING btree (granular_permission_id);

CREATE INDEX idx_folder_apps_folder_id ON public.folder_apps USING btree (folder_id);

CREATE INDEX idx_folders_group_permissions_granular_permission_id ON public.folders_group_permissions USING btree (granular_permission_id);

CREATE INDEX idx_granular_permission_id ON public.apps_group_permissions USING btree (granular_permission_id);

CREATE INDEX idx_group_folders_folder_id ON public.group_folders USING btree (folder_id);

CREATE INDEX idx_group_folders_permissions_id ON public.group_folders USING btree (folders_group_permissions_id);

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);

CREATE INDEX idx_notifications_org ON public.notifications USING btree (organization_id);

CREATE UNIQUE INDEX idx_organizations_single_default ON public.organizations USING btree (is_default) WHERE (is_default = true);

CREATE INDEX idx_recipient_unread ON public.notification_recipients USING btree (user_id) WHERE (read_at IS NULL);

CREATE INDEX idx_recipient_user_created ON public.notification_recipients USING btree (user_id, created_at);

CREATE UNIQUE INDEX idx_unique_active_name_branch ON public.data_source_versions USING btree (lower((name)::text), COALESCE(branch_id, '00000000-0000-0000-0000-000000000000'::uuid)) WHERE ((is_active = true) AND (is_default = false));

CREATE UNIQUE INDEX idx_unique_static_kind_org ON public.data_sources USING btree (kind, type, organization_id) WHERE (type = 'static'::public.type);

CREATE UNIQUE INDEX idx_workflow_bundles_app_version_language ON public.workflow_bundles USING btree (app_version_id, language);

CREATE INDEX idx_workflow_bundles_language ON public.workflow_bundles USING btree (language);

CREATE INDEX idx_workflow_execution_edges_execution_id ON public.workflow_execution_edges USING btree (workflow_execution_id);

CREATE INDEX idx_workflow_execution_edges_source_node ON public.workflow_execution_edges USING btree (source_workflow_execution_node_id);

CREATE INDEX idx_workflow_execution_edges_target_node ON public.workflow_execution_edges USING btree (target_workflow_execution_node_id);

CREATE INDEX idx_workflow_execution_nodes_execution_id ON public.workflow_execution_nodes USING btree (workflow_execution_id);

CREATE INDEX idx_workflow_execution_nodes_execution_updated ON public.workflow_execution_nodes USING btree (workflow_execution_id, updated_at);

CREATE INDEX idx_workflow_executions_app_version_created ON public.workflow_executions USING btree (app_version_id, created_at DESC);

CREATE INDEX idx_workflow_executions_app_version_id ON public.workflow_executions USING btree (app_version_id);

CREATE INDEX idx_workflow_executions_created_at ON public.workflow_executions USING btree (created_at);

CREATE UNIQUE INDEX uniq_folder_apps_app_branch ON public.folder_apps USING btree (app_id, branch_id) WHERE (branch_id IS NOT NULL);

CREATE UNIQUE INDEX uniq_folder_apps_app_no_branch ON public.folder_apps USING btree (app_id) WHERE (branch_id IS NULL);

CREATE TRIGGER trg_app_versions_app_name_branch_unique BEFORE INSERT OR UPDATE OF app_name, branch_id, version_type, app_id ON public.app_versions FOR EACH ROW EXECUTE FUNCTION public.enforce_app_versions_app_name_branch_unique();

CREATE TRIGGER trg_app_versions_bump_apps_updated_at AFTER INSERT OR UPDATE ON public.app_versions FOR EACH ROW EXECUTE FUNCTION public.bump_app_updated_at_from_version();

CREATE TRIGGER trg_app_versions_default_branch_slug_unique BEFORE INSERT OR UPDATE OF slug ON public.app_versions FOR EACH ROW EXECUTE FUNCTION public.enforce_app_versions_default_branch_slug_unique();

CREATE TRIGGER trg_app_versions_slug_branch_unique BEFORE INSERT OR UPDATE OF slug, branch_id, version_type, app_id ON public.app_versions FOR EACH ROW EXECUTE FUNCTION public.enforce_app_versions_slug_branch_unique();

CREATE TRIGGER trg_app_versions_slug_default_branch_unique BEFORE INSERT OR UPDATE OF slug, status, branch_id, version_type, app_id ON public.app_versions FOR EACH ROW EXECUTE FUNCTION public.enforce_app_versions_slug_default_branch_unique();

CREATE TRIGGER trg_components_bump_app_version_updated_at AFTER INSERT OR UPDATE ON public.components FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_via_page();

CREATE TRIGGER trg_data_queries_bump_app_version_updated_at AFTER INSERT OR UPDATE ON public.data_queries FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_direct();

CREATE TRIGGER trg_event_handlers_bump_app_version_updated_at AFTER INSERT OR UPDATE ON public.event_handlers FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_direct();

CREATE TRIGGER trg_layouts_bump_app_version_updated_at AFTER INSERT OR UPDATE ON public.layouts FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_via_component();

CREATE TRIGGER trg_pages_bump_app_version_updated_at AFTER INSERT OR UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.bump_app_version_updated_at_direct();

CREATE TRIGGER trg_unique_active_default_dsv_name_per_org BEFORE INSERT OR UPDATE OF name, is_active, is_default, data_source_id ON public.data_source_versions FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_active_default_dsv_name_per_org();

ALTER TABLE ONLY public.workflow_execution_edges
    ADD CONSTRAINT "FK_01c76b586ae6dbdcadb6bd7437a" FOREIGN KEY (target_workflow_execution_node_id) REFERENCES public.workflow_execution_nodes(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.notification_recipients
    ADD CONSTRAINT "FK_021580b5aa0ee301ee359752b45" FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.org_environment_constant_values
    ADD CONSTRAINT "FK_025b9a6c6a4fbce3ad5e5c9f437" FOREIGN KEY (environment_id) REFERENCES public.app_environments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.workflow_execution_nodes
    ADD CONSTRAINT "FK_038260105d89e1e860d9261b3d7" FOREIGN KEY (workflow_execution_id) REFERENCES public.workflow_executions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT "FK_066997c6a75c0847736ac6ed017" FOREIGN KEY (app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.workflow_schedules
    ADD CONSTRAINT "FK_06b4d853e3065a6604a7ba432b4" FOREIGN KEY (environment_id) REFERENCES public.app_environments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT "FK_095c5c2bd5c0e3d7e899e5b20e6" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT "FK_0bd66d9c1dbe71c3ea4d076967c" FOREIGN KEY (current_environment_id) REFERENCES public.app_environments(id);

ALTER TABLE ONLY public.onboarding_details
    ADD CONSTRAINT "FK_0ca5c5c7e2c7ce1a7c03dbb50ce" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT "FK_0ed319385ff0805ca0de31f6142" FOREIGN KEY (app_version_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.page_users
    ADD CONSTRAINT "FK_1266f2e38e17d231de1f9dd23ac" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT "FK_12fdbf99ca0da93085d61edd3bb" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ai_response_votes
    ADD CONSTRAINT "FK_1453e7284482e033fb3a16edb7e" FOREIGN KEY (ai_conversation_message_id) REFERENCES public.ai_conversation_messages(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_145f35b204c731ba7fc1a0be0e7" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE ONLY public.organization_themes
    ADD CONSTRAINT "FK_1563692969449b78a567b3370e2" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.component_permissions
    ADD CONSTRAINT "FK_1a6fc751b5b65e96b59d879c373" FOREIGN KEY (component_id) REFERENCES public.components(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_users
    ADD CONSTRAINT "FK_1c9491ba157e3501f828d224706" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT "FK_1eec9b8ac8a36e3150f35d401b7" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE ONLY public.data_source_group_permissions
    ADD CONSTRAINT "FK_1fdbe6132ae885ed58472e449fc" FOREIGN KEY (data_source_id) REFERENCES public.data_sources(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_21a659804ed7bf61eb91688dea7" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "FK_226751367588fcb0f5dd3cca20d" FOREIGN KEY (app_versions_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_source_user_oauth2s
    ADD CONSTRAINT "FK_24f932108fa598d52e9e169fa2d" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.workflow_executions
    ADD CONSTRAINT "FK_262f13195c82160304ed4d4460f" FOREIGN KEY (app_version_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT "FK_2c003b4bc12690597189bfdc43c" FOREIGN KEY (manifest_file_id) REFERENCES public.files(id);

ALTER TABLE ONLY public.data_sources
    ADD CONSTRAINT "FK_32ad0ae084f81331fc77c2b4f77" FOREIGN KEY (plugin_id) REFERENCES public.plugins(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organizations_payments
    ADD CONSTRAINT "FK_341b0dbb7fdc785fbb00c6b7e5d" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE ONLY public.app_history
    ADD CONSTRAINT "FK_3544168c63db15f1da5d25de965" FOREIGN KEY (parent_id) REFERENCES public.app_history(id);

ALTER TABLE ONLY public.workspace_ban_list
    ADD CONSTRAINT "FK_3c154e68475565fb5012e91bd98" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT "FK_415f443ca3267e52f8008ba27cd" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_ai_credit_history
    ADD CONSTRAINT "FK_43b0c65b83ba95da454bee23859" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_source_user_oauth2s
    ADD CONSTRAINT "FK_4810f6554f3fcc8af416d083908" FOREIGN KEY (data_source_id) REFERENCES public.data_sources(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.query_users
    ADD CONSTRAINT "FK_4baf2bdceaaf7171708e8357b1c" FOREIGN KEY (query_permissions_id) REFERENCES public.query_permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "FK_4c675567d2a58f0b07cef09c13d" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.query_users
    ADD CONSTRAINT "FK_4f1ed7751184a77985c0522360c" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.sso_config_oidc_group_sync
    ADD CONSTRAINT "FK_50a5d16a98f7b5c30befcb0fe5e" FOREIGN KEY (sso_config_id) REFERENCES public.sso_configs(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_subscription_invoices
    ADD CONSTRAINT "FK_52458c44ef800b50cf4b8cc8d33" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT "FK_52ea28f4acf372478733bc8d84e" FOREIGN KEY (index_file_id) REFERENCES public.files(id);

ALTER TABLE ONLY public.ai_response_votes
    ADD CONSTRAINT "FK_52f94269c6fb6eec50752bbb846" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.page_users
    ADD CONSTRAINT "FK_5512792d1781807cf58ef2d50c5" FOREIGN KEY (permission_groups_id) REFERENCES public.permission_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.query_users
    ADD CONSTRAINT "FK_5c1e8d9c41ac4204d126b5f5ed5" FOREIGN KEY (permission_groups_id) REFERENCES public.permission_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_subscription_invoices
    ADD CONSTRAINT "FK_5eefc31bfd1dac1c7c15b028649" FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.workflow_execution_edges
    ADD CONSTRAINT "FK_60ce74bbbc07bec394242a2ee75" FOREIGN KEY (workflow_execution_id) REFERENCES public.workflow_executions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.query_permissions
    ADD CONSTRAINT "FK_63533b611fed47578a3f8ef0b98" FOREIGN KEY (query_id) REFERENCES public.data_queries(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_git_sync
    ADD CONSTRAINT "FK_6951adbb9a9e5cd4c24423220e4" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.sso_configs
    ADD CONSTRAINT "FK_6a7f38a17677bca235457451559" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_environments
    ADD CONSTRAINT "FK_6d4588e6daa919cb4eb390dbc93" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comment_users
    ADD CONSTRAINT "FK_703e5850a214def6df03ab2a2b1" FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.page_users
    ADD CONSTRAINT "FK_70a640f54e39533ecf9ae38531d" FOREIGN KEY (page_permissions_id) REFERENCES public.page_permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comment_users
    ADD CONSTRAINT "FK_70bc9e776f662cef614aef62ecd" FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.component_users
    ADD CONSTRAINT "FK_713b836e3a1b7dad0bf65503f5d" FOREIGN KEY (component_permissions_id) REFERENCES public.component_permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_history
    ADD CONSTRAINT "FK_72fa84ed90109e4c02f1c047471" FOREIGN KEY (app_version_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.apps
    ADD CONSTRAINT "FK_73348049217c53d971b890800d4" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.page_permissions
    ADD CONSTRAINT "FK_78e402cba55bb3e7b116a114927" FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.folder_apps
    ADD CONSTRAINT "FK_79f3202da82bbf94531d45eba56" FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.component_users
    ADD CONSTRAINT "FK_7f2872188b1d5c9c40a533f7e4e" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_git_ssh
    ADD CONSTRAINT "FK_81ad1877df5dcb5360157bed2ca" FOREIGN KEY (config_id) REFERENCES public.organization_git_sync(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT "FK_828bd01e4c15a11a16311521b09" FOREIGN KEY (promoted_from) REFERENCES public.app_environments(id);

ALTER TABLE ONLY public.workflow_schedules
    ADD CONSTRAINT "FK_8347fda878908e52e2350ef978d" FOREIGN KEY (workflow_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_users
    ADD CONSTRAINT "FK_850fda09e6a73f03b7949ddc06c" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.selfhost_customers_ai_feature
    ADD CONSTRAINT "FK_88db42f668de2132f13b5720a49" FOREIGN KEY (selfhost_customer_id) REFERENCES public.selfhost_customers(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.workflow_execution_edges
    ADD CONSTRAINT "FK_8cd1f6fe9dfb04294386fd133e2" FOREIGN KEY (source_workflow_execution_node_id) REFERENCES public.workflow_execution_nodes(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_personal_access_tokens
    ADD CONSTRAINT "FK_8e88ea7762921efea5a65ed0b6d" FOREIGN KEY (app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_details
    ADD CONSTRAINT "FK_8ee6c4e464e4375b3b323963745" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organizations_ai_feature
    ADD CONSTRAINT "FK_95399755b73980d4cfabd03ff32" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT "FK_955c5ab2b4b5622f0a2c64655f2" FOREIGN KEY (app_versions_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_queries
    ADD CONSTRAINT "FK_988c01920f45acacd723b3f8707" FOREIGN KEY (data_source_id) REFERENCES public.data_sources(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_personal_access_tokens
    ADD CONSTRAINT "FK_9b9f089d96388b7f3da3c9db8cd" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_queries
    ADD CONSTRAINT "FK_9d61250e26b5129c521d123aa7a" FOREIGN KEY (app_version_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT "FK_a3ba1b48cd6040e0862b46b7e0b" FOREIGN KEY (icon_file_id) REFERENCES public.files(id);

ALTER TABLE ONLY public.plugins
    ADD CONSTRAINT "FK_a3f9802ebae9260b39049cf8f3e" FOREIGN KEY (operations_file_id) REFERENCES public.files(id);

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT "FK_a6cc1a07ec07e376947ed1016a0" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "FK_a73bdb55794ec2e4c63cff1d631" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.layouts
    ADD CONSTRAINT "FK_ac2a629cebfc346a5bebb542cb7" FOREIGN KEY (component_id) REFERENCES public.components(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT "FK_ad4bb97b5599fff893fc94e184f" FOREIGN KEY (message_id) REFERENCES public.ai_conversation_messages(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT "FK_b352d7125d7fda739468192f649" FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT "FK_b88a8e5564641f120af38edad83" FOREIGN KEY (app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.workflow_bundles
    ADD CONSTRAINT "FK_ba319f7743244ef591f5c7b932e" FOREIGN KEY (app_version_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT "FK_bc1a27f0686dce8deec3645d1f8" FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.org_environment_constant_values
    ADD CONSTRAINT "FK_bd25bb2489cb9792356ca604ea0" FOREIGN KEY (organization_constant_id) REFERENCES public.organization_constants(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "FK_bd6273778843396b0e98599582f" FOREIGN KEY (pat_id) REFERENCES public.user_personal_access_tokens(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.ai_conversation_messages
    ADD CONSTRAINT "FK_bf6d64e72acaa22c62116338db2" FOREIGN KEY (ai_conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT "FK_bfc94ab6236a6451e03ec4eff52" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT "FK_c0c705aadb5a1740f52c02eca11" FOREIGN KEY (app_version_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_ai_keys
    ADD CONSTRAINT "FK_c2e41ced920fa2faa9ec23468dc" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_license
    ADD CONSTRAINT "FK_c4da4d3b12ee3429ac6374c0b35" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.org_environment_variables
    ADD CONSTRAINT "FK_c5642d620c9f85b0921b67d1a3b" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.component_users
    ADD CONSTRAINT "FK_ccb067c8c76c817b05877541ede" FOREIGN KEY (permission_groups_id) REFERENCES public.permission_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_git_https
    ADD CONSTRAINT "FK_d9a726cf15ab296361bcb371184" FOREIGN KEY (config_id) REFERENCES public.organization_git_sync(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.components
    ADD CONSTRAINT "FK_de521ef5844106d2b2033dd2d8b" FOREIGN KEY (page_id) REFERENCES public.pages(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "FK_e08c0b40ce104f44edf060126fe" FOREIGN KEY (owner_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.custom_domains
    ADD CONSTRAINT "FK_e3bc9b51c6bf381f711a27448a4" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.selfhost_customers_ai_credit_history
    ADD CONSTRAINT "FK_e47651873132c2c43cc8b9062c3" FOREIGN KEY (selfhost_customer_id) REFERENCES public.selfhost_customers(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.white_labelling
    ADD CONSTRAINT "FK_e4a48ea7ac57db22b6e46e2bde6" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.internal_tables
    ADD CONSTRAINT "FK_e76ca596220995774320786142e" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "FK_e7d9c02826213be7fb6487f3909" FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT "FK_e9658e959c490b0a634dfc54783" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_history
    ADD CONSTRAINT "FK_eaf1edad8211cfc786aa1518bc2" FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.event_handlers
    ADD CONSTRAINT "FK_ed742397d08d4ec77a76f1f4dce" FOREIGN KEY (app_version_id) REFERENCES public.app_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_tjdb_configurations
    ADD CONSTRAINT "FK_edd0769f6a0e1b47a4e5783c297" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_subscriptions
    ADD CONSTRAINT "FK_ee120ecc7d96135bd947a1ea7ae" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

ALTER TABLE ONLY public.user_details
    ADD CONSTRAINT "FK_ef1a1915f99bcf7a87049f74494" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_subscription_invoices
    ADD CONSTRAINT "FK_f37a68fa18cf94bc0c54ee95502" FOREIGN KEY (organization_subscription_id) REFERENCES public.organization_subscriptions(id);

ALTER TABLE ONLY public.folder_apps
    ADD CONSTRAINT "FK_f6621f66315ab0cfe04479cb816" FOREIGN KEY (app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT "FK_f82f5101f77e118bfa58c45f44b" FOREIGN KEY (app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_gitlab
    ADD CONSTRAINT "FK_fad9496e78b95985899ac69f63a" FOREIGN KEY (config_id) REFERENCES public.organization_git_sync(id);

ALTER TABLE ONLY public.custom_styles
    ADD CONSTRAINT "FK_fc903859d0b9ed6d4877a714964" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organizations_payments
    ADD CONSTRAINT "FK_fd10297f144ee9db7bbd61c2a2e" FOREIGN KEY (user_id) REFERENCES public.users(id);

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT "FK_fec86aa67ecb5fbec57be2c81b1" FOREIGN KEY (app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_source_version_options
    ADD CONSTRAINT data_source_version_options_data_source_version_id_fkey FOREIGN KEY (data_source_version_id) REFERENCES public.data_source_versions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_source_version_options
    ADD CONSTRAINT data_source_version_options_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES public.app_environments(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_source_versions
    ADD CONSTRAINT data_source_versions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.organization_git_sync_branches(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_source_versions
    ADD CONSTRAINT data_source_versions_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES public.data_sources(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_source_versions
    ADD CONSTRAINT data_source_versions_version_from_id_fkey FOREIGN KEY (version_from_id) REFERENCES public.data_source_versions(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.group_apps
    ADD CONSTRAINT fk_app_id FOREIGN KEY (app_id) REFERENCES public.apps(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT fk_app_versions_branch FOREIGN KEY (branch_id) REFERENCES public.organization_git_sync_branches(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.app_versions
    ADD CONSTRAINT fk_app_versions_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.group_apps
    ADD CONSTRAINT fk_apps_group_permissions_id FOREIGN KEY (apps_group_permissions_id) REFERENCES public.apps_group_permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_data_sources
    ADD CONSTRAINT fk_data_source_id FOREIGN KEY (data_source_id) REFERENCES public.data_sources(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_data_sources
    ADD CONSTRAINT fk_data_sources_permissions_id FOREIGN KEY (data_sources_group_permissions_id) REFERENCES public.data_sources_group_permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.folder_apps
    ADD CONSTRAINT fk_folder_apps_branch_id FOREIGN KEY (branch_id) REFERENCES public.organization_git_sync_branches(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.folders
    ADD CONSTRAINT fk_folders_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.folders_group_permissions
    ADD CONSTRAINT fk_folders_granular_permission_id FOREIGN KEY (granular_permission_id) REFERENCES public.granular_permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.apps_group_permissions
    ADD CONSTRAINT fk_granular_permission_id FOREIGN KEY (granular_permission_id) REFERENCES public.granular_permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.data_sources_group_permissions
    ADD CONSTRAINT fk_granular_permission_id FOREIGN KEY (granular_permission_id) REFERENCES public.granular_permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_admins
    ADD CONSTRAINT fk_group_admins_group_id FOREIGN KEY (group_id) REFERENCES public.permission_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_admins
    ADD CONSTRAINT fk_group_admins_organization_id FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_admins
    ADD CONSTRAINT fk_group_admins_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_folders
    ADD CONSTRAINT fk_group_folders_folder_id FOREIGN KEY (folder_id) REFERENCES public.folders(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_folders
    ADD CONSTRAINT fk_group_folders_permissions_id FOREIGN KEY (folders_group_permissions_id) REFERENCES public.folders_group_permissions(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT fk_group_id FOREIGN KEY (group_id) REFERENCES public.permission_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.granular_permissions
    ADD CONSTRAINT fk_group_id FOREIGN KEY (group_id) REFERENCES public.permission_groups(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.permission_groups
    ADD CONSTRAINT fk_organization_id FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_git_sync_branches
    ADD CONSTRAINT organization_git_sync_branches_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.organization_git_sync_branches
    ADD CONSTRAINT organization_git_sync_branches_source_branch_id_fkey FOREIGN KEY (source_branch_id) REFERENCES public.organization_git_sync_branches(id) ON DELETE SET NULL;

