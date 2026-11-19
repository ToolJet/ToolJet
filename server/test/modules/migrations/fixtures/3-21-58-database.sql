-- A ToolJet 3.21.58 (EE) database with synthetic seed data, for upgrade-from-3-21-58.spec.ts.
-- How it was built (to regenerate): a v3.21.58-beta checkout's migrations and server, driven through its API.
--   Base: a git-off and a git-on workspace, each with released and draft apps, a module, a workflow, data sources,
--   a query and folders; the git-on one also has a feature branch, NULL-branch drafts and the default-branch drafts
--   3.21.58's clone migration creates.
--   Then POST /api/library_apps (templates json-formatter, mortgage-calculator,
--   business-intelligence-dashboard-postgresql); a git-off app saved, promoted (PUT /api/v2/apps/:id/versions/:v,
--   .../promote), released (PUT /api/apps/:id/release) and given two more drafts (POST /api/apps/:id/versions); the
--   same release on the git-on default branch; POST /api/folder-apps on both (x-branch-id on git-on); a feature-branch
--   data source created and one deleted (POST/DELETE /api/data-sources?branch_id=), leaving it inactive.
--   Hand-written: one pulled app with only a stub draft, shaped as 3.21.58's git pull inserts it.
-- Redacted: credentials.value_ciphertext and users.password_digest set to 'redacted', LICENSE_KEY emptied;
-- user_sessions, audit_logs and AI conversations emptied.
-- Dump: pg_dump --no-owner --no-privileges --no-comments --inserts --rows-per-insert=50, minus '--' lines,
-- SET transaction_timeout and repeated blank lines.
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
	('78ef63a1-130f-4b48-8653-0ebb1547687c', '2a03cb23-f76a-4708-a713-1ffc90c46bbb', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 2, 'e182d45b-047c-49b7-95ee-c63428a99a35', 'delta', 'query_add', NULL, 'Added query q_select', '{"changes": [{"id": "451137b1-ffd2-4fe7-96ca-0c53f0ef168f", "op": "add", "value": {"id": "451137b1-ffd2-4fe7-96ca-0c53f0ef168f", "name": "q_select", "options": {"mode": "sql", "query": "select 1 as x"}, "dataSourceId": "69dbfec8-ca9d-4a63-8b99-86899afe7f50"}, "entity": "query"}, {"id": "f5d60425-9b77-464a-9079-94c1e1816f99", "op": "add", "value": {"id": "f5d60425-9b77-464a-9079-94c1e1816f99", "index": 0, "childId": "451137b1-ffd2-4fe7-96ca-0c53f0ef168f", "parentId": null, "childType": "query"}, "entity": "queryFolderMapping"}], "metadata": {"actionType": "query_add", "description": "Added query q_select", "affectedEntities": ["451137b1-ffd2-4fe7-96ca-0c53f0ef168f", "f5d60425-9b77-464a-9079-94c1e1816f99"]}}', false, '2026-10-28 11:45:16.165677+00', '2026-10-28 11:45:16.165677+00'),
	('cc66c179-3d3a-4cc9-8fd5-758977aba611', 'e884ec80-102a-44b3-8efe-fe7f1c6dcb6b', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 1, NULL, 'snapshot', 'initial_snapshot', NULL, 'Initial app state', '{"pages": {"8c1d1aee-b331-4fc4-a532-cff2d592ace7": {"id": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "url": null, "icon": null, "name": "Home", "type": "default", "appId": "", "index": 1, "handle": "home", "hidden": false, "openIn": "same_tab", "disabled": false, "pageHeader": null, "isPageGroup": false, "pageGroupId": null, "pageGroupIndex": null, "autoComputeLayout": true, "targetCorelationId": null}}, "layouts": {"0d6ec866-28ac-4d73-96b3-9d9d43bf78e2": {"id": "0d6ec866-28ac-4d73-96b3-9d9d43bf78e2", "top": 470, "left": 4, "type": "desktop", "width": 6, "height": 40, "componentId": "0aed45df-e2c5-411e-aaf4-4cd9c9d28d9f", "dimensionUnit": "count"}, "1d3833cc-a49f-48d8-ad4f-1918ac5bf877": {"id": "1d3833cc-a49f-48d8-ad4f-1918ac5bf877", "top": 300, "left": 28, "type": "mobile", "width": 3, "height": 30, "componentId": "233632b5-9a87-4be7-a534-271a251f84ad", "dimensionUnit": "count"}, "263bd061-f4a1-4a9c-819c-5b840ec7297e": {"id": "263bd061-f4a1-4a9c-819c-5b840ec7297e", "top": 130, "left": 4, "type": "desktop", "width": 35, "height": 250, "componentId": "2b58d037-e525-4aaf-bb2f-abb45e9188cf", "dimensionUnit": "count"}, "3dfa06c8-6226-42ef-8dab-4cf0583b528b": {"id": "3dfa06c8-6226-42ef-8dab-4cf0583b528b", "top": 20, "left": 4, "type": "desktop", "width": 13, "height": 50, "componentId": "f6f080c1-3e19-4d54-ac82-40316ae35ef5", "dimensionUnit": "count"}, "5985315f-7ece-4199-b757-c989b318e9eb": {"id": "5985315f-7ece-4199-b757-c989b318e9eb", "top": 50, "left": 6, "type": "mobile", "width": 6, "height": 40, "componentId": "0aed45df-e2c5-411e-aaf4-4cd9c9d28d9f", "dimensionUnit": "count"}, "5aa70f17-8a19-4920-aefe-572d3701550a": {"id": "5aa70f17-8a19-4920-aefe-572d3701550a", "top": 330, "left": 12, "type": "mobile", "width": 6, "height": 100, "componentId": "79fc270d-6b51-4b74-99a1-39f1f21d8644", "dimensionUnit": "count"}, "62646c73-54ed-4a82-a7e2-53bb999b9f66": {"id": "62646c73-54ed-4a82-a7e2-53bb999b9f66", "top": 0, "left": 30, "type": "mobile", "width": 6, "height": 100, "componentId": "2b58d037-e525-4aaf-bb2f-abb45e9188cf", "dimensionUnit": "count"}, "7892886c-b720-4278-ae25-04f2bf01104c": {"id": "7892886c-b720-4278-ae25-04f2bf01104c", "top": 470, "left": 35, "type": "desktop", "width": 4, "height": 40, "componentId": "233632b5-9a87-4be7-a534-271a251f84ad", "dimensionUnit": "count"}, "7cceab77-fb00-4304-874a-d11300feca4a": {"id": "7cceab77-fb00-4304-874a-d11300feca4a", "top": 270, "left": 27, "type": "mobile", "width": 3, "height": 30, "componentId": "5049b751-adce-4dec-a4ce-026b88f303f9", "dimensionUnit": "count"}, "9ca1a94e-dc1d-4510-b327-d7fcbfcd6200": {"id": "9ca1a94e-dc1d-4510-b327-d7fcbfcd6200", "top": 40, "left": 15, "type": "mobile", "width": 6, "height": 40, "componentId": "f6f080c1-3e19-4d54-ac82-40316ae35ef5", "dimensionUnit": "count"}, "aa5a94d0-d899-4054-9f75-bb40c77d9f2f": {"id": "aa5a94d0-d899-4054-9f75-bb40c77d9f2f", "top": 90, "left": 4, "type": "desktop", "width": 6, "height": 40, "componentId": "3a2f8901-d820-4173-8b0f-48f482be8f79", "dimensionUnit": "count"}, "b6d13ca0-1fe7-4fd8-944e-691a1f8055b8": {"id": "b6d13ca0-1fe7-4fd8-944e-691a1f8055b8", "top": 390, "left": 4, "type": "desktop", "width": 12, "height": 40, "componentId": "65eb0ead-046d-492b-b6c5-754bd65643c3", "dimensionUnit": "count"}, "c1968c78-ce75-4d29-baf3-6788db4dc922": {"id": "c1968c78-ce75-4d29-baf3-6788db4dc922", "top": 390, "left": 16, "type": "desktop", "width": 6, "height": 40, "componentId": "5049b751-adce-4dec-a4ce-026b88f303f9", "dimensionUnit": "count"}, "d0dd1eed-192d-4d4b-819e-b06f7cf18548": {"id": "d0dd1eed-192d-4d4b-819e-b06f7cf18548", "top": 270, "left": 12, "type": "mobile", "width": 8, "height": 30, "componentId": "65eb0ead-046d-492b-b6c5-754bd65643c3", "dimensionUnit": "count"}, "e54a994f-f12e-4ef5-977d-c31b6b123db9": {"id": "e54a994f-f12e-4ef5-977d-c31b6b123db9", "top": 510, "left": 4, "type": "desktop", "width": 35, "height": 250, "componentId": "79fc270d-6b51-4b74-99a1-39f1f21d8644", "dimensionUnit": "count"}, "efd24f29-2dfe-4d09-87e6-3816dc2b055d": {"id": "efd24f29-2dfe-4d09-87e6-3816dc2b055d", "top": 10, "left": 6, "type": "mobile", "width": 6, "height": 40, "componentId": "3a2f8901-d820-4173-8b0f-48f482be8f79", "dimensionUnit": "count"}}, "queries": {"a0deb579-2ee1-4142-986b-163bd30008df": {"id": "a0deb579-2ee1-4142-986b-163bd30008df", "name": "formatJSON", "options": {"code": "const input = components.textarea1.value;\nconst indentOption = components.indentOptions.value;\n\n// Parse the JSON and format it\nlet parsed;\ntry {\n  parsed = JSON.parse(input);\n} catch (error) {\n  const formattedJSON = \"Invalid JSON input: \" + error.message;\n  return formattedJSON;\n}\n\n// Determine the indentation\nlet indentChar;\nswitch (indentOption) {\n  case \"tab\":\n    indentChar = \"\\t\";\n    break;\n  case \"2spaces\":\n    indentChar = \"  \";\n    break;\n  case \"4spaces\":\n    indentChar = \"    \";\n    break;\n  case \"8spaces\":\n    indentChar = \"        \";\n    break;\n  default:\n    const formattedJSON = \"Invalid indent option\";\n    return formattedJSON;\n}\n\n// Format and display the JSON\nconst formattedJSON = JSON.stringify(parsed, null, indentChar);\nreturn formattedJSON;\n", "parameters": []}, "dataSourceId": "a9a8732b-6f29-4370-834c-c3283c8e8044"}}, "version": {"id": "e884ec80-102a-44b3-8efe-fe7f1c6dcb6b", "name": "v2", "definition": null, "homePageId": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "pageSettings": {"properties": {"hideLogo": true, "position": "side", "hideHeader": true, "disableMenu": {"value": "{{true}}", "fxActive": false}}}, "globalSettings": {"appMode": "auto", "canvasMaxWidth": 100, "canvasMaxHeight": 2400, "appInMaintenance": false, "backgroundFxQuery": "", "canvasMaxWidthType": "%", "canvasBackgroundColor": "#edeff5"}}, "components": {"0aed45df-e2c5-411e-aaf4-4cd9c9d28d9f": {"id": "0aed45df-e2c5-411e-aaf4-4cd9c9d28d9f", "name": "text3", "type": "Text", "pageId": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "parent": null, "styles": {"textSize": {"value": "16"}, "fontWeight": {"value": "bolder"}}, "general": {}, "properties": {"text": {"value": "Output JSON"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "233632b5-9a87-4be7-a534-271a251f84ad": {"id": "233632b5-9a87-4be7-a534-271a251f84ad", "name": "copyButton", "type": "Button", "pageId": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "parent": null, "styles": {"textSize": {"value": "{{14}}"}, "textColor": {"value": "#3e63ddff"}, "fontWeight": {"value": "normal"}, "loaderColor": {"value": "#3e63ddff"}, "borderRadius": {"value": "{{6}}"}, "backgroundColor": {"value": "#ffffff00"}, "contentAlignment": {"value": "center"}, "hoverBackgroundMode": {"value": "auto"}, "hoverBackgroundColor": {"value": "var(--cc-primary-brand)"}}, "general": {}, "properties": {"text": {"value": "Copy 📋"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "2b58d037-e525-4aaf-bb2f-abb45e9188cf": {"id": "2b58d037-e525-4aaf-bb2f-abb45e9188cf", "name": "textarea1", "type": "TextArea", "pageId": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "parent": null, "styles": {"widthType": {"value": "ofField"}, "borderRadius": {"value": "{{6}}"}}, "general": {}, "properties": {"label": "", "value": {"value": ""}, "placeholder": {"value": "{\"status\":\"Unformatted\",\"message\":\"This JSON is not formatted properly.\",\"data\":{\"id\":1,\"name\":\"Alice\",\"role\":\"Developer\"}}"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "3a2f8901-d820-4173-8b0f-48f482be8f79": {"id": "3a2f8901-d820-4173-8b0f-48f482be8f79", "name": "text2", "type": "Text", "pageId": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "parent": null, "styles": {"textSize": {"value": "16"}, "fontWeight": {"value": "bolder"}}, "general": {}, "properties": {"text": {"value": "Input JSON"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "5049b751-adce-4dec-a4ce-026b88f303f9": {"id": "5049b751-adce-4dec-a4ce-026b88f303f9", "name": "button1", "type": "Button", "pageId": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "parent": null, "styles": {"textSize": {"value": "{{14}}"}, "fontWeight": {"value": "normal"}, "borderRadius": {"value": "{{6}}"}, "backgroundColor": {"value": "#3e63ddff"}, "contentAlignment": {"value": "center"}, "hoverBackgroundMode": {"value": "auto"}, "hoverBackgroundColor": {"value": "var(--cc-primary-brand)"}}, "general": {}, "properties": {"text": {"value": "Format JSON"}, "loadingState": {"value": "{{queries.a0deb579-2ee1-4142-986b-163bd30008df.isLoading}}", "fxActive": true}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "65eb0ead-046d-492b-b6c5-754bd65643c3": {"id": "65eb0ead-046d-492b-b6c5-754bd65643c3", "name": "indentOptions", "type": "DropDown", "pageId": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "parent": null, "styles": {"borderRadius": {"value": "6"}}, "general": {}, "properties": {"label": {"value": "Indentation"}, "value": {"value": "{{\"4spaces\"}}"}, "values": {"value": "{{[\"tab\",\"2spaces\",\"4spaces\",\"8spaces\"]}}"}, "display_values": {"value": "{{[\"Indent with tab\", \"Indent with 2 spaces\", \"Indent with 4 spaces\",\"Indent with 8 spaces\"]}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "79fc270d-6b51-4b74-99a1-39f1f21d8644": {"id": "79fc270d-6b51-4b74-99a1-39f1f21d8644", "name": "textarea2", "type": "TextArea", "pageId": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "parent": null, "styles": {"widthType": {"value": "ofField"}, "borderRadius": {"value": "{{6}}"}}, "general": {}, "properties": {"label": "", "value": {"value": "{{queries.a0deb579-2ee1-4142-986b-163bd30008df.data}}"}, "placeholder": {"value": "{\n    \"status\": \"Formatted\",\n    \"message\": \"This JSON is properly formatted.\",\n    \"data\": {\n        \"id\": 1,\n        \"name\": \"Alice\",\n        \"role\": \"Developer\"\n    }\n}"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "f6f080c1-3e19-4d54-ac82-40316ae35ef5": {"id": "f6f080c1-3e19-4d54-ac82-40316ae35ef5", "name": "text1", "type": "Text", "pageId": "8c1d1aee-b331-4fc4-a532-cff2d592ace7", "parent": null, "styles": {"textSize": {"value": "25"}, "textAlign": {"value": "left"}, "fontWeight": {"value": "bolder"}}, "general": {}, "properties": {"text": {"value": "JSON Formatter"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}}, "queryFolders": {}, "eventHandlers": {"7f23fce0-d8be-4c5f-bd84-688402a6580d": {"id": "7f23fce0-d8be-4c5f-bd84-688402a6580d", "name": "onClick", "event": {"eventId": "onClick", "message": "Hello world!", "actionId": "copy-to-clipboard", "alertType": "info", "contentToCopy": "{{queries.a0deb579-2ee1-4142-986b-163bd30008df.data}}"}, "index": 0, "target": "component", "sourceId": "233632b5-9a87-4be7-a534-271a251f84ad"}, "d33c6f47-0c25-4898-be27-db47b293e9c3": {"id": "d33c6f47-0c25-4898-be27-db47b293e9c3", "name": "onClick", "event": {"eventId": "onClick", "message": "Hello world!", "queryId": "a0deb579-2ee1-4142-986b-163bd30008df", "actionId": "run-query", "alertType": "info", "queryName": "runjs1", "parameters": {}}, "index": 0, "target": "component", "sourceId": "5049b751-adce-4dec-a4ce-026b88f303f9"}}, "queryFolderMappings": {}}', false, '2026-10-28 21:02:19.245119+00', '2026-10-28 21:02:19.245119+00'),
	('07c6a895-8eda-4f97-8e96-2b13449e2860', '873cf9ba-539a-4b5c-857b-6480f42077be', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 1, NULL, 'snapshot', 'initial_snapshot', NULL, 'Initial app state', '{"pages": {"8615e3a8-7cf1-442a-b489-bdde3b062049": {"id": "8615e3a8-7cf1-442a-b489-bdde3b062049", "url": null, "icon": null, "name": "Home", "type": "default", "appId": "", "index": 1, "handle": "home", "hidden": false, "openIn": "same_tab", "disabled": false, "pageHeader": null, "isPageGroup": false, "pageGroupId": null, "pageGroupIndex": null, "autoComputeLayout": true, "targetCorelationId": null}}, "layouts": {"030ef464-7c98-4358-a252-add4d1b4f7f2": {"id": "030ef464-7c98-4358-a252-add4d1b4f7f2", "top": 90, "left": 4, "type": "desktop", "width": 6, "height": 40, "componentId": "c8b0cc3e-0005-4a6d-8ec2-b2cf0f763d63", "dimensionUnit": "count"}, "250d61de-2448-4e04-bcfb-cf59aed4fb18": {"id": "250d61de-2448-4e04-bcfb-cf59aed4fb18", "top": 300, "left": 28, "type": "mobile", "width": 3, "height": 30, "componentId": "844ac739-7ebc-4972-8b40-e065a951100d", "dimensionUnit": "count"}, "2b50e7da-e105-45c0-b4dc-b89c641c63f8": {"id": "2b50e7da-e105-45c0-b4dc-b89c641c63f8", "top": 470, "left": 35, "type": "desktop", "width": 4, "height": 40, "componentId": "844ac739-7ebc-4972-8b40-e065a951100d", "dimensionUnit": "count"}, "4d548b4a-6a2a-4244-a9bd-ba8adcce0311": {"id": "4d548b4a-6a2a-4244-a9bd-ba8adcce0311", "top": 50, "left": 6, "type": "mobile", "width": 6, "height": 40, "componentId": "993d16fe-62c2-46f3-a483-5a79e859b862", "dimensionUnit": "count"}, "5c4d718f-e6b7-4268-8836-74b3716e79c4": {"id": "5c4d718f-e6b7-4268-8836-74b3716e79c4", "top": 20, "left": 4, "type": "desktop", "width": 13, "height": 50, "componentId": "7821b2ae-f28b-4833-9e48-f68dd8fd267a", "dimensionUnit": "count"}, "6e48bfb4-bef7-4a4a-8376-674bea4983a5": {"id": "6e48bfb4-bef7-4a4a-8376-674bea4983a5", "top": 390, "left": 16, "type": "desktop", "width": 6, "height": 40, "componentId": "c3d98b65-efb6-4f1b-bc7d-606bd9dd29b2", "dimensionUnit": "count"}, "8deb78f9-d38b-42da-8ec4-1f34077d9661": {"id": "8deb78f9-d38b-42da-8ec4-1f34077d9661", "top": 10, "left": 6, "type": "mobile", "width": 6, "height": 40, "componentId": "c8b0cc3e-0005-4a6d-8ec2-b2cf0f763d63", "dimensionUnit": "count"}, "968ecca7-2247-42a0-b0c0-16ef6d0aa3c7": {"id": "968ecca7-2247-42a0-b0c0-16ef6d0aa3c7", "top": 270, "left": 12, "type": "mobile", "width": 8, "height": 30, "componentId": "7f274a6f-6f9e-4853-ac59-454fe88f0fee", "dimensionUnit": "count"}, "9e95f4f2-ca1f-4c40-9279-b2a4c16fabf4": {"id": "9e95f4f2-ca1f-4c40-9279-b2a4c16fabf4", "top": 390, "left": 4, "type": "desktop", "width": 12, "height": 40, "componentId": "7f274a6f-6f9e-4853-ac59-454fe88f0fee", "dimensionUnit": "count"}, "a6bc253f-f1f1-4671-b0c9-b877a287c636": {"id": "a6bc253f-f1f1-4671-b0c9-b877a287c636", "top": 510, "left": 4, "type": "desktop", "width": 35, "height": 250, "componentId": "b2224ce8-243f-4409-ad8a-487beb985942", "dimensionUnit": "count"}, "b52ea9eb-fbca-4c59-ac97-e4121e4f940b": {"id": "b52ea9eb-fbca-4c59-ac97-e4121e4f940b", "top": 330, "left": 12, "type": "mobile", "width": 6, "height": 100, "componentId": "b2224ce8-243f-4409-ad8a-487beb985942", "dimensionUnit": "count"}, "b8a0ef40-d059-4053-b6e7-91f7e491703d": {"id": "b8a0ef40-d059-4053-b6e7-91f7e491703d", "top": 270, "left": 27, "type": "mobile", "width": 3, "height": 30, "componentId": "c3d98b65-efb6-4f1b-bc7d-606bd9dd29b2", "dimensionUnit": "count"}, "bb0c1a08-f936-40d3-a234-49f8930f91ce": {"id": "bb0c1a08-f936-40d3-a234-49f8930f91ce", "top": 130, "left": 4, "type": "desktop", "width": 35, "height": 250, "componentId": "1f076920-974e-4dc0-8dd5-06e02516b0f7", "dimensionUnit": "count"}, "cab963f9-55ef-4a02-a00f-b25ce90895cb": {"id": "cab963f9-55ef-4a02-a00f-b25ce90895cb", "top": 470, "left": 4, "type": "desktop", "width": 6, "height": 40, "componentId": "993d16fe-62c2-46f3-a483-5a79e859b862", "dimensionUnit": "count"}, "f24715b5-b1df-4582-84dc-1d59ea9394df": {"id": "f24715b5-b1df-4582-84dc-1d59ea9394df", "top": 40, "left": 15, "type": "mobile", "width": 6, "height": 40, "componentId": "7821b2ae-f28b-4833-9e48-f68dd8fd267a", "dimensionUnit": "count"}, "fd45fa34-8e97-4536-b432-58cf7c0caaf5": {"id": "fd45fa34-8e97-4536-b432-58cf7c0caaf5", "top": 0, "left": 30, "type": "mobile", "width": 6, "height": 100, "componentId": "1f076920-974e-4dc0-8dd5-06e02516b0f7", "dimensionUnit": "count"}}, "queries": {"ba45e493-01d3-4736-b954-58c428c2fe35": {"id": "ba45e493-01d3-4736-b954-58c428c2fe35", "name": "formatJSON", "options": {"code": "const input = components.textarea1.value;\nconst indentOption = components.indentOptions.value;\n\n// Parse the JSON and format it\nlet parsed;\ntry {\n  parsed = JSON.parse(input);\n} catch (error) {\n  const formattedJSON = \"Invalid JSON input: \" + error.message;\n  return formattedJSON;\n}\n\n// Determine the indentation\nlet indentChar;\nswitch (indentOption) {\n  case \"tab\":\n    indentChar = \"\\t\";\n    break;\n  case \"2spaces\":\n    indentChar = \"  \";\n    break;\n  case \"4spaces\":\n    indentChar = \"    \";\n    break;\n  case \"8spaces\":\n    indentChar = \"        \";\n    break;\n  default:\n    const formattedJSON = \"Invalid indent option\";\n    return formattedJSON;\n}\n\n// Format and display the JSON\nconst formattedJSON = JSON.stringify(parsed, null, indentChar);\nreturn formattedJSON;\n", "parameters": []}, "dataSourceId": "a9a8732b-6f29-4370-834c-c3283c8e8044"}}, "version": {"id": "873cf9ba-539a-4b5c-857b-6480f42077be", "name": "v3", "definition": null, "homePageId": "8615e3a8-7cf1-442a-b489-bdde3b062049", "pageSettings": {"properties": {"hideLogo": true, "position": "side", "hideHeader": true, "disableMenu": {"value": "{{true}}", "fxActive": false}}}, "globalSettings": {"appMode": "auto", "canvasMaxWidth": 100, "canvasMaxHeight": 2400, "appInMaintenance": false, "backgroundFxQuery": "", "canvasMaxWidthType": "%", "canvasBackgroundColor": "#edeff5"}}, "components": {"1f076920-974e-4dc0-8dd5-06e02516b0f7": {"id": "1f076920-974e-4dc0-8dd5-06e02516b0f7", "name": "textarea1", "type": "TextArea", "pageId": "8615e3a8-7cf1-442a-b489-bdde3b062049", "parent": null, "styles": {"widthType": {"value": "ofField"}, "borderRadius": {"value": "{{6}}"}}, "general": {}, "properties": {"label": "", "value": {"value": ""}, "placeholder": {"value": "{\"status\":\"Unformatted\",\"message\":\"This JSON is not formatted properly.\",\"data\":{\"id\":1,\"name\":\"Alice\",\"role\":\"Developer\"}}"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "7821b2ae-f28b-4833-9e48-f68dd8fd267a": {"id": "7821b2ae-f28b-4833-9e48-f68dd8fd267a", "name": "text1", "type": "Text", "pageId": "8615e3a8-7cf1-442a-b489-bdde3b062049", "parent": null, "styles": {"textSize": {"value": "25"}, "textAlign": {"value": "left"}, "fontWeight": {"value": "bolder"}}, "general": {}, "properties": {"text": {"value": "JSON Formatter"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "7f274a6f-6f9e-4853-ac59-454fe88f0fee": {"id": "7f274a6f-6f9e-4853-ac59-454fe88f0fee", "name": "indentOptions", "type": "DropDown", "pageId": "8615e3a8-7cf1-442a-b489-bdde3b062049", "parent": null, "styles": {"borderRadius": {"value": "6"}}, "general": {}, "properties": {"label": {"value": "Indentation"}, "value": {"value": "{{\"4spaces\"}}"}, "values": {"value": "{{[\"tab\",\"2spaces\",\"4spaces\",\"8spaces\"]}}"}, "display_values": {"value": "{{[\"Indent with tab\", \"Indent with 2 spaces\", \"Indent with 4 spaces\",\"Indent with 8 spaces\"]}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "844ac739-7ebc-4972-8b40-e065a951100d": {"id": "844ac739-7ebc-4972-8b40-e065a951100d", "name": "copyButton", "type": "Button", "pageId": "8615e3a8-7cf1-442a-b489-bdde3b062049", "parent": null, "styles": {"textSize": {"value": "{{14}}"}, "textColor": {"value": "#3e63ddff"}, "fontWeight": {"value": "normal"}, "loaderColor": {"value": "#3e63ddff"}, "borderRadius": {"value": "{{6}}"}, "backgroundColor": {"value": "#ffffff00"}, "contentAlignment": {"value": "center"}, "hoverBackgroundMode": {"value": "auto"}, "hoverBackgroundColor": {"value": "var(--cc-primary-brand)"}}, "general": {}, "properties": {"text": {"value": "Copy 📋"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "993d16fe-62c2-46f3-a483-5a79e859b862": {"id": "993d16fe-62c2-46f3-a483-5a79e859b862", "name": "text3", "type": "Text", "pageId": "8615e3a8-7cf1-442a-b489-bdde3b062049", "parent": null, "styles": {"textSize": {"value": "16"}, "fontWeight": {"value": "bolder"}}, "general": {}, "properties": {"text": {"value": "Output JSON"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "b2224ce8-243f-4409-ad8a-487beb985942": {"id": "b2224ce8-243f-4409-ad8a-487beb985942", "name": "textarea2", "type": "TextArea", "pageId": "8615e3a8-7cf1-442a-b489-bdde3b062049", "parent": null, "styles": {"widthType": {"value": "ofField"}, "borderRadius": {"value": "{{6}}"}}, "general": {}, "properties": {"label": "", "value": {"value": "{{queries.ba45e493-01d3-4736-b954-58c428c2fe35.data}}"}, "placeholder": {"value": "{\n    \"status\": \"Formatted\",\n    \"message\": \"This JSON is properly formatted.\",\n    \"data\": {\n        \"id\": 1,\n        \"name\": \"Alice\",\n        \"role\": \"Developer\"\n    }\n}"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "c3d98b65-efb6-4f1b-bc7d-606bd9dd29b2": {"id": "c3d98b65-efb6-4f1b-bc7d-606bd9dd29b2", "name": "button1", "type": "Button", "pageId": "8615e3a8-7cf1-442a-b489-bdde3b062049", "parent": null, "styles": {"textSize": {"value": "{{14}}"}, "fontWeight": {"value": "normal"}, "borderRadius": {"value": "{{6}}"}, "backgroundColor": {"value": "#3e63ddff"}, "contentAlignment": {"value": "center"}, "hoverBackgroundMode": {"value": "auto"}, "hoverBackgroundColor": {"value": "var(--cc-primary-brand)"}}, "general": {}, "properties": {"text": {"value": "Format JSON"}, "loadingState": {"value": "{{queries.ba45e493-01d3-4736-b954-58c428c2fe35.isLoading}}", "fxActive": true}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}, "c8b0cc3e-0005-4a6d-8ec2-b2cf0f763d63": {"id": "c8b0cc3e-0005-4a6d-8ec2-b2cf0f763d63", "name": "text2", "type": "Text", "pageId": "8615e3a8-7cf1-442a-b489-bdde3b062049", "parent": null, "styles": {"textSize": {"value": "16"}, "fontWeight": {"value": "bolder"}}, "general": {}, "properties": {"text": {"value": "Input JSON"}, "tooltipFormat": {"value": "plainText"}, "collapseWhenHidden": {"value": "{{false}}"}}, "validation": {}, "generalStyles": {}, "displayPreferences": {"showOnMobile": {"value": "{{false}}"}, "showOnDesktop": {"value": "{{true}}"}}}}, "queryFolders": {}, "eventHandlers": {"0b94a1ac-5388-4889-b847-5a6429029e44": {"id": "0b94a1ac-5388-4889-b847-5a6429029e44", "name": "onClick", "event": {"eventId": "onClick", "message": "Hello world!", "queryId": "ba45e493-01d3-4736-b954-58c428c2fe35", "actionId": "run-query", "alertType": "info", "queryName": "runjs1", "parameters": {}}, "index": 0, "target": "component", "sourceId": "c3d98b65-efb6-4f1b-bc7d-606bd9dd29b2"}, "4731715e-cb6b-4403-9d58-6840934bd644": {"id": "4731715e-cb6b-4403-9d58-6840934bd644", "name": "onClick", "event": {"eventId": "onClick", "message": "Hello world!", "actionId": "copy-to-clipboard", "alertType": "info", "contentToCopy": "{{queries.ba45e493-01d3-4736-b954-58c428c2fe35.data}}"}, "index": 0, "target": "component", "sourceId": "844ac739-7ebc-4972-8b40-e065a951100d"}}, "queryFolderMappings": {}}', false, '2026-10-28 21:02:21.55586+00', '2026-10-28 21:02:21.55586+00');

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
	('e56f8149-cc5f-409a-9e44-a8d8e33805fa', 'v1', NULL, '9b6eda5a-8748-4d54-8ba8-6a9031452f06', '2026-10-28 17:15:10.034', '2026-10-28 11:46:11.431768', '52108afe-1776-4dcf-875a-834661c64263', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"var(--cc-appBackground-surface)","backgroundFxQuery":"","appMode":"light"}', true, '5b1d3e7a-daab-445b-983b-491d85eb7dd3', NULL, NULL, NULL, 'PUBLISHED', NULL, NULL, NULL, 'version', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL),
	('fff4b014-35d3-4770-8ddf-b8959b8c9f95', 'v1', NULL, 'daea9299-d98c-4e1a-8ee0-97231280fb06', '2026-10-29 02:31:48.738', '2026-10-29 02:32:56.368', '52108afe-1776-4dcf-875a-834661c64263', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"#edeff5","backgroundFxQuery":"","appMode":"auto"}', true, '02cef60a-84b7-4b06-a2d0-d5c809f68129', NULL, '{"properties":{"disableMenu":{"value":"{{true}}","fxActive":false},"position":"side","hideHeader":true,"hideLogo":true}}', NULL, 'PUBLISHED', NULL, NULL, NULL, 'version', NULL, 'd89b458d-ec44-4281-bdc1-ebd2b0c1ca49', NULL, false, NULL, NULL, NULL, 'daea9299-d98c-4e1a-8ee0-97231280fb06', 'Json formatter gitoff', 'archive', false, NULL),
	('e884ec80-102a-44b3-8efe-fe7f1c6dcb6b', 'v2', NULL, 'daea9299-d98c-4e1a-8ee0-97231280fb06', '2026-10-29 02:32:19.186', '2026-10-28 21:02:19.182031', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"#edeff5","backgroundFxQuery":"","appMode":"auto"}', true, '8c1d1aee-b331-4fc4-a532-cff2d592ace7', NULL, '{"properties":{"disableMenu":{"value":"{{true}}","fxActive":false},"position":"side","hideHeader":true,"hideLogo":true}}', 'fff4b014-35d3-4770-8ddf-b8959b8c9f95', 'DRAFT', NULL, NULL, NULL, 'version', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '155e58ce-9e55-4f41-9919-5df7de23c22c', NULL, false, NULL, NULL, NULL, 'daea9299-d98c-4e1a-8ee0-97231280fb06', 'Json formatter gitoff', 'archive', false, NULL),
	('5a7b0c1d-0000-4000-8000-00000000b001', '8e7e00f9-755d-4f7e-9359-c06367af300d', '{}', '5a7b0c1d-0000-4000-8000-00000000a001', '2026-10-28 21:04:17.367624', '2026-10-28 21:04:17.367624', NULL, '{}', false, NULL, NULL, '{}', NULL, 'DRAFT', NULL, NULL, NULL, 'version', NULL, NULL, NULL, true, '31b785c9-8f44-4954-aaac-f60c4cd25148', '2026-10-28 21:04:17.367624', NULL, '5a7b0c1d-0000-4000-8000-00000000a001', 'Pulled giton', 'home', false, NULL),
	('873cf9ba-539a-4b5c-857b-6480f42077be', 'v3', NULL, 'daea9299-d98c-4e1a-8ee0-97231280fb06', '2026-10-29 02:32:19.378', '2026-10-28 21:02:19.375956', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"#edeff5","backgroundFxQuery":"","appMode":"auto"}', true, '8615e3a8-7cf1-442a-b489-bdde3b062049', NULL, '{"properties":{"disableMenu":{"value":"{{true}}","fxActive":false},"position":"side","hideHeader":true,"hideLogo":true}}', 'fff4b014-35d3-4770-8ddf-b8959b8c9f95', 'DRAFT', NULL, NULL, NULL, 'version', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '155e58ce-9e55-4f41-9919-5df7de23c22c', NULL, false, NULL, NULL, NULL, 'daea9299-d98c-4e1a-8ee0-97231280fb06', 'Json formatter gitoff', 'archive', false, NULL),
	('a5207132-c550-457b-b50a-43118c84f573', 'v1', NULL, 'b78b13d6-776e-4c12-a51d-ffd07d693b92', '2026-10-29 02:33:03.892', '2026-10-29 02:33:47.025', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"#edeff5","backgroundFxQuery":""}', false, 'b2143c85-26b1-49e3-abe7-b5f90993f81e', NULL, '{"properties":{"disableMenu":{"value":"{{true}}","fxActive":false},"position":"side","hideHeader":true,"hideLogo":true}}', NULL, 'PUBLISHED', NULL, NULL, NULL, 'version', NULL, '81f29c4a-d5d7-419b-b7f3-8be1fb138c6e', NULL, false, NULL, NULL, NULL, 'b78b13d6-776e-4c12-a51d-ffd07d693b92', 'Mortgage giton', 'shield', false, NULL),
	('308945c9-e540-41bc-80b6-4f0e677bcc1c', 'v1', NULL, '4159bde0-4315-4a9f-af7b-36e7382a8db1', '2026-10-29 02:32:19.542', '2026-10-29 02:32:19.695', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"#edeff5","backgroundFxQuery":""}', false, 'a0183550-5c8b-401f-a014-923999f9d2f4', NULL, '{"properties":{"disableMenu":{"value":"{{true}}","fxActive":false},"position":"side","hideHeader":true,"hideLogo":true}}', NULL, 'DRAFT', NULL, NULL, NULL, 'version', NULL, '16c7b57d-3440-427c-b524-737103318986', NULL, false, NULL, NULL, NULL, '4159bde0-4315-4a9f-af7b-36e7382a8db1', 'BI dashboard gitoff', 'layers', false, NULL),
	('d07fb2ab-a191-4a7b-941f-c676167044a6', 'v1', NULL, 'f32540f6-fcf5-4fce-9228-03b63b988eb0', '2026-10-29 02:33:04.09', '2026-10-29 02:33:04.196', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"#edeff5","backgroundFxQuery":""}', false, '6d7123a7-31d5-428e-a5ba-a59010750a02', NULL, '{"properties":{"disableMenu":{"value":"{{true}}","fxActive":false},"position":"side","hideHeader":true,"hideLogo":true}}', NULL, 'DRAFT', NULL, NULL, NULL, 'version', NULL, '16c7b57d-3440-427c-b524-737103318986', NULL, false, '31b785c9-8f44-4954-aaac-f60c4cd25148', NULL, NULL, 'f32540f6-fcf5-4fce-9228-03b63b988eb0', 'BI dashboard giton', 'layers', false, NULL),
	('4241f003-5ce9-4ba2-ace8-d83068d460f2', '85b3349e-6afd-4da5-ad74-56cd40d2a1e0', NULL, 'b78b13d6-776e-4c12-a51d-ffd07d693b92', '2026-10-29 02:33:46.67', '2026-10-28 21:03:46.646458', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"appInMaintenance":false,"canvasMaxWidth":100,"canvasMaxWidthType":"%","canvasMaxHeight":2400,"canvasBackgroundColor":"#edeff5","backgroundFxQuery":""}', false, '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', NULL, '{"properties":{"disableMenu":{"value":"{{true}}","fxActive":false},"position":"side","hideHeader":true,"hideLogo":true}}', 'a5207132-c550-457b-b50a-43118c84f573', 'DRAFT', NULL, NULL, NULL, 'version', NULL, '81f29c4a-d5d7-419b-b7f3-8be1fb138c6e', NULL, false, '31b785c9-8f44-4954-aaac-f60c4cd25148', NULL, NULL, 'b78b13d6-776e-4c12-a51d-ffd07d693b92', 'Mortgage giton', 'shield', false, NULL);

INSERT INTO public.apps VALUES
	('7c0994c4-8198-48a2-91af-bb12a566a3a2', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.574', '2026-10-28 11:46:00.864094', NULL, false, 'front-end', 'DEFAULT', NULL, false, '95c9dfb3-a053-4c94-9634-252a022b1802', false, false, NULL, 'visual'),
	('2aabf571-7291-4b4b-922f-eee12fc6582a', 'Workflow giton', NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '83e0e06a-ee44-4553-82d0-88dac3c33be7', NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.611', '2026-10-28 11:46:00.965481', 'home', true, 'workflow', 'DEFAULT', '9a0f2a08-d98e-40a4-bb28-472194ac0107', false, 'cb1a5dd4-c1da-46ca-9987-18200da8fd1f', false, false, NULL, 'visual'),
	('0064fd95-e413-42ba-9261-e6ee88d2cd15', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:11.097', '2026-10-28 11:46:01.602908', NULL, false, 'front-end', 'DEFAULT', NULL, false, '92696df0-d212-4780-992d-d473d320de8a', false, false, NULL, 'visual'),
	('8dcf0e44-b815-4c8f-9047-0ed6af021a0e', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '2a03cb23-f76a-4708-a713-1ffc90c46bbb', NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:09.939', '2026-10-28 11:46:11.254011', NULL, false, 'front-end', 'DEFAULT', NULL, false, '9e13e34b-cc81-4fef-86ad-285bca453bc5', false, false, NULL, 'visual'),
	('7367e177-0da4-4f96-a526-a60cc9f1fc30', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:09.968', '2026-10-28 11:46:11.319328', NULL, false, 'front-end', 'DEFAULT', NULL, false, 'e3f06888-f944-4062-b3c0-02f2520f3004', false, false, NULL, 'visual'),
	('bf4ddca6-357b-48c6-9b1c-785047ceae70', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'e0a72ede-518f-4e03-b0cd-fccbfc072371', NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:09.994', '2026-10-28 11:46:11.369911', NULL, false, 'module', 'DEFAULT', NULL, false, '8754e504-3e25-45d3-95ff-6796a96cc8f9', false, false, NULL, 'visual'),
	('9b6eda5a-8748-4d54-8ba8-6a9031452f06', 'Workflow gitoff', NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'e56f8149-cc5f-409a-9e44-a8d8e33805fa', NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-28 17:15:10.031', '2026-10-28 11:46:11.431768', 'home', true, 'workflow', 'DEFAULT', '728c5846-ce69-4cc7-93d4-3fb62fb8b38b', false, '3501946e-c10c-422d-9fbc-52b594942d88', false, false, NULL, 'visual'),
	('804238b6-0d6e-4363-a59b-50f9d89f8fcf', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '27690053-b609-41d0-b0ca-ffb2f8df155d', NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.594', '2026-10-28 11:46:41.846583', NULL, false, 'module', 'DEFAULT', NULL, false, '790fe368-51d6-406e-941c-92a5c6cdd94d', false, false, NULL, 'visual'),
	('cfeab0fe-4b83-49a4-8111-d945029c8404', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', '9df57db2-562e-450c-8c1c-fdd166fb742d', NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 17:15:10.552', '2026-10-28 11:46:41.846583', NULL, false, 'front-end', 'DEFAULT', NULL, false, 'baf67f94-617c-473c-be63-7d7ddb71a0ff', false, false, NULL, 'visual'),
	('daea9299-d98c-4e1a-8ee0-97231280fb06', NULL, 'daea9299-d98c-4e1a-8ee0-97231280fb06', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'fff4b014-35d3-4770-8ddf-b8959b8c9f95', NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-29 02:31:48.729', '2026-10-28 21:02:56.503454', NULL, false, 'front-end', 'DEFAULT', NULL, false, '155e58ce-9e55-4f41-9919-5df7de23c22c', false, false, NULL, 'visual'),
	('4159bde0-4315-4a9f-af7b-36e7382a8db1', NULL, '4159bde0-4315-4a9f-af7b-36e7382a8db1', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', '2026-10-29 02:32:19.54', '2026-10-28 21:02:19.537811', NULL, false, 'front-end', 'DEFAULT', NULL, false, '02a7ebc5-4e6b-4847-9ca1-f7365475cec8', false, false, NULL, 'visual'),
	('f32540f6-fcf5-4fce-9228-03b63b988eb0', NULL, 'f32540f6-fcf5-4fce-9228-03b63b988eb0', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-29 02:33:04.088', '2026-10-28 21:03:04.078858', NULL, false, 'front-end', 'DEFAULT', NULL, false, '02a7ebc5-4e6b-4847-9ca1-f7365475cec8', false, false, NULL, 'visual'),
	('b78b13d6-776e-4c12-a51d-ffd07d693b92', NULL, 'b78b13d6-776e-4c12-a51d-ffd07d693b92', 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'a5207132-c550-457b-b50a-43118c84f573', NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-29 02:33:03.884', '2026-10-28 21:03:47.157812', NULL, false, 'front-end', 'DEFAULT', NULL, false, '5c294d68-7409-4f92-a870-86de51779aa9', false, false, NULL, 'visual'),
	('5a7b0c1d-0000-4000-8000-00000000a001', NULL, NULL, 'c6c39059-5645-4bc3-a3e3-5fe65de8222e', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 21:04:17.367624', '2026-10-28 21:04:17.367624', NULL, false, 'front-end', 'DEFAULT', NULL, false, 'ee461c50-1894-4dfc-87d8-d072ed50995e', false, false, NULL, 'visual');

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
	('5e86d904-e978-4b84-9860-ad43b933aa48', 'ModuleContainer', 'ModuleContainer', 'd1702491-7abd-4eab-a395-c6e569851e61', NULL, '{"inputItems":{"value":[]},"outputItems":{"value":[]},"visibility":{"value":"{{true}}"}}', '{}', '{"backgroundColor":{"value":"#fff"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{true}}"}}', '{}', '2026-10-28 11:45:10.594367', '2026-10-28 11:45:10.594367', NULL),
	('c409a9e0-c0d6-4903-920e-7ecb110d2413', 'text1', 'Text', '02cef60a-84b7-4b06-a2d0-d5c809f68129', NULL, '{"text":{"value":"JSON Formatter"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textAlign":{"value":"left"},"textSize":{"value":"25"},"fontWeight":{"value":"bolder"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', NULL),
	('185f5c38-0e53-449d-abcf-9a75de64cf3d', 'indentOptions', 'DropDown', '02cef60a-84b7-4b06-a2d0-d5c809f68129', NULL, '{"values":{"value":"{{[\"tab\",\"2spaces\",\"4spaces\",\"8spaces\"]}}"},"display_values":{"value":"{{[\"Indent with tab\", \"Indent with 2 spaces\", \"Indent with 4 spaces\",\"Indent with 8 spaces\"]}}"},"value":{"value":"{{\"4spaces\"}}"},"label":{"value":"Indentation"}}', '{}', '{"borderRadius":{"value":"6"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', NULL),
	('7fe03c6b-e07f-4e92-9f50-d24a8445e5b0', 'copyButton', 'Button', '02cef60a-84b7-4b06-a2d0-d5c809f68129', NULL, '{"text":{"value":"Copy 📋"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00"},"borderRadius":{"value":"{{6}}"},"textColor":{"value":"#3e63ddff"},"loaderColor":{"value":"#3e63ddff"},"textSize":{"value":"{{14}}"},"fontWeight":{"value":"normal"},"contentAlignment":{"value":"center"},"hoverBackgroundColor":{"value":"var(--cc-primary-brand)"},"hoverBackgroundMode":{"value":"auto"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', NULL),
	('c26c51c3-2758-4b23-9575-ebd047ab3121', 'textarea1', 'TextArea', '02cef60a-84b7-4b06-a2d0-d5c809f68129', NULL, '{"value":{"value":""},"placeholder":{"value":"{\"status\":\"Unformatted\",\"message\":\"This JSON is not formatted properly.\",\"data\":{\"id\":1,\"name\":\"Alice\",\"role\":\"Developer\"}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":""}', '{}', '{"borderRadius":{"value":"{{6}}"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', NULL),
	('2d4753c8-3d3d-4ed1-96dc-65e282b7df6d', 'text2', 'Text', '02cef60a-84b7-4b06-a2d0-d5c809f68129', NULL, '{"text":{"value":"Input JSON"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"fontWeight":{"value":"bolder"},"textSize":{"value":"16"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', NULL),
	('ad0c8b8e-6239-4457-a58b-a4b3f9ec1855', 'text3', 'Text', '02cef60a-84b7-4b06-a2d0-d5c809f68129', NULL, '{"text":{"value":"Output JSON"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textSize":{"value":"16"},"fontWeight":{"value":"bolder"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', NULL),
	('a218e735-7319-4f7f-bd8e-b9b10f3e8593', 'button1', 'Button', '02cef60a-84b7-4b06-a2d0-d5c809f68129', NULL, '{"text":{"value":"Format JSON"},"loadingState":{"fxActive":true,"value":"{{queries.43afa479-a52f-441d-b03c-664af8d52cec.isLoading}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#3e63ddff"},"borderRadius":{"value":"{{6}}"},"textSize":{"value":"{{14}}"},"fontWeight":{"value":"normal"},"contentAlignment":{"value":"center"},"hoverBackgroundColor":{"value":"var(--cc-primary-brand)"},"hoverBackgroundMode":{"value":"auto"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', NULL),
	('53521679-4025-4728-b2ca-155d4170f093', 'textarea2', 'TextArea', '02cef60a-84b7-4b06-a2d0-d5c809f68129', NULL, '{"value":{"value":"{{queries.43afa479-a52f-441d-b03c-664af8d52cec.data}}"},"placeholder":{"value":"{\n    \"status\": \"Formatted\",\n    \"message\": \"This JSON is properly formatted.\",\n    \"data\": {\n        \"id\": 1,\n        \"name\": \"Alice\",\n        \"role\": \"Developer\"\n    }\n}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":""}', '{}', '{"borderRadius":{"value":"{{6}}"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', NULL),
	('f6f080c1-3e19-4d54-ac82-40316ae35ef5', 'text1', 'Text', '8c1d1aee-b331-4fc4-a532-cff2d592ace7', NULL, '{"text":{"value":"JSON Formatter"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textAlign":{"value":"left"},"textSize":{"value":"25"},"fontWeight":{"value":"bolder"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('65eb0ead-046d-492b-b6c5-754bd65643c3', 'indentOptions', 'DropDown', '8c1d1aee-b331-4fc4-a532-cff2d592ace7', NULL, '{"values":{"value":"{{[\"tab\",\"2spaces\",\"4spaces\",\"8spaces\"]}}"},"display_values":{"value":"{{[\"Indent with tab\", \"Indent with 2 spaces\", \"Indent with 4 spaces\",\"Indent with 8 spaces\"]}}"},"value":{"value":"{{\"4spaces\"}}"},"label":{"value":"Indentation"}}', '{}', '{"borderRadius":{"value":"6"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('233632b5-9a87-4be7-a534-271a251f84ad', 'copyButton', 'Button', '8c1d1aee-b331-4fc4-a532-cff2d592ace7', NULL, '{"text":{"value":"Copy 📋"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00"},"borderRadius":{"value":"{{6}}"},"textColor":{"value":"#3e63ddff"},"loaderColor":{"value":"#3e63ddff"},"textSize":{"value":"{{14}}"},"fontWeight":{"value":"normal"},"contentAlignment":{"value":"center"},"hoverBackgroundColor":{"value":"var(--cc-primary-brand)"},"hoverBackgroundMode":{"value":"auto"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('6d70cb3f-0b34-483c-88a8-304dd033cd6e', 'text9', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"text":{"value":"<div style=\"font-weight: 600;\">Compare by</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('1d643ac9-3a62-46c6-9275-5abef1cdb784', 'chart1', 'Chart', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"title":{"value":""},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{queries.chartReviewDistribution.data}}"},"loadingState":{"fxActive":true,"value":"{{queries.reviewDistribution.isLoading || queries.chartReviewDistribution.isLoading || queries.getAllChartsData.isLoading}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"value":"#fff","fxActive":false},"padding":{"value":"10"}}', '{"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('8dda9778-8182-4779-bc67-1353cde765dc', 'chart4', 'Chart', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"title":{"value":""},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{queries.positivityTrend.data}}"},"loadingState":{"value":"{{queries.trendAnalysis.isLoading || queries.positivityTrend.isLoading || queries.getAllChartsData.isLoading}}","fxActive":true}}', '{}', '{"borderRadius":{"value":"{{5}}"},"padding":{"value":"10"}}', '{"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('2b58d037-e525-4aaf-bb2f-abb45e9188cf', 'textarea1', 'TextArea', '8c1d1aee-b331-4fc4-a532-cff2d592ace7', NULL, '{"value":{"value":""},"placeholder":{"value":"{\"status\":\"Unformatted\",\"message\":\"This JSON is not formatted properly.\",\"data\":{\"id\":1,\"name\":\"Alice\",\"role\":\"Developer\"}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":""}', '{}', '{"borderRadius":{"value":"{{6}}"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('3a2f8901-d820-4173-8b0f-48f482be8f79', 'text2', 'Text', '8c1d1aee-b331-4fc4-a532-cff2d592ace7', NULL, '{"text":{"value":"Input JSON"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"fontWeight":{"value":"bolder"},"textSize":{"value":"16"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('0aed45df-e2c5-411e-aaf4-4cd9c9d28d9f', 'text3', 'Text', '8c1d1aee-b331-4fc4-a532-cff2d592ace7', NULL, '{"text":{"value":"Output JSON"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textSize":{"value":"16"},"fontWeight":{"value":"bolder"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('5049b751-adce-4dec-a4ce-026b88f303f9', 'button1', 'Button', '8c1d1aee-b331-4fc4-a532-cff2d592ace7', NULL, '{"text":{"value":"Format JSON"},"loadingState":{"fxActive":true,"value":"{{queries.a0deb579-2ee1-4142-986b-163bd30008df.isLoading}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#3e63ddff"},"borderRadius":{"value":"{{6}}"},"textSize":{"value":"{{14}}"},"fontWeight":{"value":"normal"},"contentAlignment":{"value":"center"},"hoverBackgroundColor":{"value":"var(--cc-primary-brand)"},"hoverBackgroundMode":{"value":"auto"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('79fc270d-6b51-4b74-99a1-39f1f21d8644', 'textarea2', 'TextArea', '8c1d1aee-b331-4fc4-a532-cff2d592ace7', NULL, '{"value":{"value":"{{queries.a0deb579-2ee1-4142-986b-163bd30008df.data}}"},"placeholder":{"value":"{\n    \"status\": \"Formatted\",\n    \"message\": \"This JSON is properly formatted.\",\n    \"data\": {\n        \"id\": 1,\n        \"name\": \"Alice\",\n        \"role\": \"Developer\"\n    }\n}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":""}', '{}', '{"borderRadius":{"value":"{{6}}"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('7821b2ae-f28b-4833-9e48-f68dd8fd267a', 'text1', 'Text', '8615e3a8-7cf1-442a-b489-bdde3b062049', NULL, '{"text":{"value":"JSON Formatter"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textAlign":{"value":"left"},"textSize":{"value":"25"},"fontWeight":{"value":"bolder"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('7f274a6f-6f9e-4853-ac59-454fe88f0fee', 'indentOptions', 'DropDown', '8615e3a8-7cf1-442a-b489-bdde3b062049', NULL, '{"values":{"value":"{{[\"tab\",\"2spaces\",\"4spaces\",\"8spaces\"]}}"},"display_values":{"value":"{{[\"Indent with tab\", \"Indent with 2 spaces\", \"Indent with 4 spaces\",\"Indent with 8 spaces\"]}}"},"value":{"value":"{{\"4spaces\"}}"},"label":{"value":"Indentation"}}', '{}', '{"borderRadius":{"value":"6"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('844ac739-7ebc-4972-8b40-e065a951100d', 'copyButton', 'Button', '8615e3a8-7cf1-442a-b489-bdde3b062049', NULL, '{"text":{"value":"Copy 📋"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00"},"borderRadius":{"value":"{{6}}"},"textColor":{"value":"#3e63ddff"},"loaderColor":{"value":"#3e63ddff"},"textSize":{"value":"{{14}}"},"fontWeight":{"value":"normal"},"contentAlignment":{"value":"center"},"hoverBackgroundColor":{"value":"var(--cc-primary-brand)"},"hoverBackgroundMode":{"value":"auto"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('1f076920-974e-4dc0-8dd5-06e02516b0f7', 'textarea1', 'TextArea', '8615e3a8-7cf1-442a-b489-bdde3b062049', NULL, '{"value":{"value":""},"placeholder":{"value":"{\"status\":\"Unformatted\",\"message\":\"This JSON is not formatted properly.\",\"data\":{\"id\":1,\"name\":\"Alice\",\"role\":\"Developer\"}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":""}', '{}', '{"borderRadius":{"value":"{{6}}"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('c8b0cc3e-0005-4a6d-8ec2-b2cf0f763d63', 'text2', 'Text', '8615e3a8-7cf1-442a-b489-bdde3b062049', NULL, '{"text":{"value":"Input JSON"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"fontWeight":{"value":"bolder"},"textSize":{"value":"16"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('993d16fe-62c2-46f3-a483-5a79e859b862', 'text3', 'Text', '8615e3a8-7cf1-442a-b489-bdde3b062049', NULL, '{"text":{"value":"Output JSON"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textSize":{"value":"16"},"fontWeight":{"value":"bolder"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('c3d98b65-efb6-4f1b-bc7d-606bd9dd29b2', 'button1', 'Button', '8615e3a8-7cf1-442a-b489-bdde3b062049', NULL, '{"text":{"value":"Format JSON"},"loadingState":{"fxActive":true,"value":"{{queries.ba45e493-01d3-4736-b954-58c428c2fe35.isLoading}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#3e63ddff"},"borderRadius":{"value":"{{6}}"},"textSize":{"value":"{{14}}"},"fontWeight":{"value":"normal"},"contentAlignment":{"value":"center"},"hoverBackgroundColor":{"value":"var(--cc-primary-brand)"},"hoverBackgroundMode":{"value":"auto"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('b2224ce8-243f-4409-ad8a-487beb985942', 'textarea2', 'TextArea', '8615e3a8-7cf1-442a-b489-bdde3b062049', NULL, '{"value":{"value":"{{queries.ba45e493-01d3-4736-b954-58c428c2fe35.data}}"},"placeholder":{"value":"{\n    \"status\": \"Formatted\",\n    \"message\": \"This JSON is properly formatted.\",\n    \"data\": {\n        \"id\": 1,\n        \"name\": \"Alice\",\n        \"role\": \"Developer\"\n    }\n}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":""}', '{}', '{"borderRadius":{"value":"{{6}}"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('3f0309f5-6a33-4013-8295-9da3b2e6b544', 'text14', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"text":{"value":"<div style=\"font-weight: 600;\">Type of usage</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('46205a92-fc61-4249-8d9d-856a0cb4bcad', 'text15', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"text":{"value":"<div style=\"font-weight: 600;\">Gender</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('c2cf531d-5d4b-4abc-9454-e40c1eee3f2f', 'multiselect8', 'Multiselect', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"label":{"value":""},"value":{"value":"{{queries.filterGender.data.values}}"},"values":{"value":"{{queries.filterGender.data.values}}"},"display_values":{"value":"{{queries.filterGender.data.labels}}"},"showAllOption":{"value":"{{true}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('7865843f-abf5-479a-8d12-b672f8b0ca09', 'text24', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Review distribution</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"borderRadius":{"value":"5"},"backgroundColor":{"value":"#3e63dd1a"},"borderColor":{"value":"#ffffff00"},"textColor":{"value":"#3e63ddff"},"textIndent":{"value":"10"},"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('c36cb784-4c2c-4835-9036-f90f2a070bab', 'text25', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Sentiment distribution</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#3e63dd1a"},"textColor":{"value":"#3e63ddff"},"textIndent":{"value":"10"},"borderColor":{"value":"#ffffff00"},"borderRadius":{"value":"5"},"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('80812fc6-55ad-429c-b43b-589f03463727', 'text26', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Time trend analysis</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#3e63dd1a"},"textColor":{"value":"#3e63ddff"},"textIndent":{"value":"10"},"borderColor":{"value":"#ffffff00"},"borderRadius":{"value":"5"},"padding":{"value":"default"},"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('0cea3da7-619b-4b34-93f2-98c755894e30', 'text27', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Positivity trend</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#3e63dd1a"},"textColor":{"value":"#3e63ddff"},"textIndent":{"value":"10"},"borderColor":{"value":"#ffffff00"},"borderRadius":{"value":"5"},"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('a3c12766-f3bf-465a-92d6-4b1fbb3992e7', 'dropdown10', 'DropDown', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"label":{"value":""},"value":{"value":"{{false}}"},"values":{"value":"{{[false, true]}}"},"placeholder":{"value":"Legend"},"display_values":{"value":"{{[\"Legend hidden\", \"Legend shown\"]}}"}}', '{}', '{"borderRadius":{"value":"5"},"justifyContent":{"value":"left"},"selectedTextColor":{"value":"#3e63ddff"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('8015c0b7-a83b-4316-bb38-377e333d0700', 'dropdown11', 'DropDown', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"label":{"value":""},"value":{"value":"{{false}}"},"values":{"value":"{{[false, true]}}"},"display_values":{"value":"{{[\"Legend hidden\", \"Legend shown\"]}}"},"placeholder":{"value":"Legend"}}', '{}', '{"borderRadius":{"value":"5"},"justifyContent":{"value":"left"},"selectedTextColor":{"value":"#3e63ddff"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('8da9f414-d5a3-429b-be68-e11079bb5a27', 'button1', 'Button', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"text":{"value":"Apply filters"},"loadingState":{"fxActive":false},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"disabledState":{"fxActive":true,"value":"{{queries.reviewDistribution.isLoading || queries.chartReviewDistribution.isLoading || queries.chartSentimentDistribution.isLoading || queries.trendAnalysis.isLoading || queries.timeTrendAnalysis.isLoading || queries.positivityTrend.isLoading}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"value":"#ffffff00"},"textColor":{"value":"#3e63ddff"},"loaderColor":{"value":"#3e63ddff"},"borderColor":{"value":"#3e63ddff"},"textSize":{"value":"{{14}}"},"fontWeight":{"value":"normal"},"contentAlignment":{"value":"center"},"hoverBackgroundColor":{"value":"var(--cc-primary-brand)"},"hoverBackgroundMode":{"value":"auto"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('721dbef9-5df3-4c06-a06c-f14e7f471f1a', 'datepicker1', 'Datepicker', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"defaultValue":{"value":"{{queries?.filterDate?.data?.min_date ?? \"01/07/2020\"}}"},"showClearBtn":{"value":"{{false}}"},"placeholder":{"value":"Select date"}}', '{}', '{"borderRadius":{"value":"{{5}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('3bfe4e29-c92d-49dd-bf84-a871d03732ec', 'icon1', 'Icon', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"icon":{"value":"IconArrowNarrowRight"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"iconColor":{"value":"#88888880"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('5c8561d5-7259-40bf-8e79-6e5bfae26d01', 'datepicker2', 'Datepicker', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"defaultValue":{"value":"{{queries?.filterDate?.data?.max_date ?? \"01/07/2020\"}}"},"showClearBtn":{"value":"{{false}}"},"placeholder":{"value":"Select date"}}', '{}', '{"borderRadius":{"value":"{{5}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('f8281667-15e3-4eee-9459-b07a88d9651c', 'container2', 'Container', 'a0183550-5c8b-401f-a014-923999f9d2f4', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('50e5bc42-cdb0-4438-a628-89711718b2ed', 'container3', 'Container', 'a0183550-5c8b-401f-a014-923999f9d2f4', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('27eee977-8ca6-4183-9d82-00cf716b4700', 'multiselect6', 'Multiselect', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"label":{"value":""},"value":{"value":"{{queries.filterSource.data.values}}"},"values":{"value":"{{queries.filterSource.data.values}}"},"display_values":{"value":"{{queries.filterSource.data.labels}}"},"showAllOption":{"value":"{{true}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('8ad681cc-0dd0-46d4-b081-bbdd277fcf5b', 'text10', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"text":{"value":"<hr>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('713d1377-5052-422b-833e-cbb73b3801cc', 'text11', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"text":{"value":"<div style=\"font-weight: 600;\">Date</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('c404a062-febe-4897-b56a-ee0f6cfe5f1a', 'text12', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"text":{"value":"<div style=\"font-weight: 600;\">Brand</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('dc258185-6be3-469b-ac0a-9b5f63708f34', 'chart2', 'Chart', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"title":{"value":""},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{queries.chartSentimentDistribution.data}}"},"barmode":{"value":"stack","fxActive":false},"loadingState":{"value":"{{queries.reviewDistribution.isLoading || queries.chartSentimentDistribution.isLoading || queries.getAllChartsData.isLoading}}","fxActive":true}}', '{}', '{"borderRadius":{"value":"{{5}}"},"padding":{"value":"10"}}', '{"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('7d4c0839-a45d-4ce1-bc07-20d8abb20703', 'chart3', 'Chart', 'a0183550-5c8b-401f-a014-923999f9d2f4', '50e5bc42-cdb0-4438-a628-89711718b2ed', '{"title":{"value":""},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{queries.timeTrendAnalysis.data}}"},"loadingState":{"value":"{{queries.trendAnalysis.isLoading || queries.timeTrendAnalysis.isLoading || queries.getAllChartsData.isLoading}}","fxActive":true}}', '{}', '{"borderRadius":{"value":"{{5}}"},"padding":{"value":"10"},"backgroundColor":{"value":"#fff"}}', '{"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL);
INSERT INTO public.components VALUES
	('0faaaf73-a68f-402f-914f-e957b6455569', 'text13', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"text":{"value":"<div style=\"font-weight: 600;\">Source</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('57f8ed50-ce47-49d2-a240-c79dca2b6779', 'multiselect7', 'Multiselect', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"label":{"value":""},"value":{"value":"{{queries.filterRoa.data.values}}"},"values":{"value":"{{queries.filterRoa.data.values}}"},"display_values":{"value":"{{queries.filterRoa.data.labels}}"},"showAllOption":{"value":"{{true}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('d2c1de92-6d51-40e3-a880-73af0d085350', 'dropdown2', 'DropDown', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"label":{"value":""},"value":{"value":"{{\"brand\"}}"},"values":{"value":"{{[\"brand\", \"source\"]}}"},"display_values":{"value":"{{[\"Brand\", \"Source\"]}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('df0ea429-942e-4d23-a31e-45e7476b52d4', 'multiselect5', 'Multiselect', 'a0183550-5c8b-401f-a014-923999f9d2f4', 'f8281667-15e3-4eee-9459-b07a88d9651c', '{"label":{"value":""},"value":{"value":"{{queries.filterBrand.data.values}}"},"values":{"value":"{{queries.filterBrand.data.values}}"},"display_values":{"value":"{{queries.filterBrand.data.labels}}"},"showAllOption":{"value":"{{true}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('2620fd9a-0583-4821-8d28-9d568786a1ab', 'container4', 'Container', 'a0183550-5c8b-401f-a014-923999f9d2f4', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"backgroundColor":{"value":"#3e63ddff"},"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('d754a9de-5b61-4529-9d6b-8b4d5c225682', 'text16', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', '2620fd9a-0583-4821-8d28-9d568786a1ab', '{"text":{"value":"B R A N D"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textColor":{"value":"#ffffffff"},"textSize":{"value":"{{24}}"},"fontWeight":{"value":"bold"},"letterSpacing":{"value":"{{0}}"},"boxShadow":{"value":"0px 0px 0px 0px #00000040"},"isScrollRequired":{"value":"disabled"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('5e1868d7-ed2c-42e0-9f25-95ad53c7785d', 'text17', 'Text', 'a0183550-5c8b-401f-a014-923999f9d2f4', '2620fd9a-0583-4821-8d28-9d568786a1ab', '{"text":{"value":"<div style=\"font-weight: 600;\">Business intelligence dashboard</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textColor":{"value":"#ffffffff","fxActive":false},"textSize":{"value":"{{20}}"},"textAlign":{"value":"right"},"fontWeight":{"value":"normal"},"boxShadow":{"value":"0px 0px 0px 0px #00000040"},"isScrollRequired":{"value":"disabled"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL),
	('5dfc584e-6b8a-40a8-8c3d-15d3a0134c0c', 'text2', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '2294f9d3-1437-4282-b6ba-cef7b5d1c841', '{"text":{"value":"Credit department"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textColor":{"value":"#ffffffff","fxActive":false},"textSize":{"value":"{{20}}"},"textAlign":{"value":"right"},"fontWeight":{"value":"normal"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('6f3cd944-201d-4eed-aa56-e90e8ecbf39d', 'text1', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '2294f9d3-1437-4282-b6ba-cef7b5d1c841', '{"text":{"value":"B A N K"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textColor":{"value":"#ffffffff"},"textSize":{"value":"{{24}}"},"textAlign":{"value":"left"},"fontWeight":{"value":"bold"},"letterSpacing":{"value":"{{0}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('2294f9d3-1437-4282-b6ba-cef7b5d1c841', 'container1', 'Container', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"backgroundColor":{"value":"#213b80ff"},"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('1a9b4c27-cdc7-45a2-acac-20932274c176', 'container2', 'Container', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('df931730-1c35-4304-aa38-7e6767017323', 'text4', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"text":{"value":"Interest Rate (%)"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('b20f1f9f-454f-49b6-8007-3e9793aaf265', 'numberinput1', 'NumberInput', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"value":{"value":"1000000"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":"","showClearBtn":{"value":"{{false}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"fxActive":true,"value":""},"borderColor":{"fxActive":true,"value":""},"placeholderTextColor":{"value":"var(--cc-placeholder-text)"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('0f12dce6-3278-4d0e-9052-573181c305fa', 'text5', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"text":{"value":"House Price"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('edf074d0-9280-4394-a2bc-c76a3edf3eaa', 'text6', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"text":{"value":"Down Payment (%)"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('af284d16-9d13-41f3-9a62-4504036597f5', 'text7', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"text":{"value":"Tenure (years)"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('71fb1669-c8bb-4d1e-a140-1b69dd5058dc', 'text8', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"text":{"value":"Start Date"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('7fd13393-1670-4f59-a8a0-82968c8c4e02', 'numberinput2', 'NumberInput', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"value":{"value":"20"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":"","showClearBtn":{"value":"{{false}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"fxActive":false,"value":""},"borderColor":{"fxActive":false,"value":""},"placeholderTextColor":{"value":"var(--cc-placeholder-text)"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('afaac627-1282-4291-b12a-b31b74b72d5a', 'numberinput3', 'NumberInput', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"value":{"value":"4"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":"","showClearBtn":{"value":"{{false}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"fxActive":false,"value":""},"borderColor":{"fxActive":false,"value":""},"placeholderTextColor":{"value":"var(--cc-placeholder-text)"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('aaf03e33-4639-4763-890e-e3c5532a2df1', 'numberinput4', 'NumberInput', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"value":{"value":"20"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":"","showClearBtn":{"value":"{{false}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"fxActive":false,"value":""},"borderColor":{"fxActive":false,"value":""},"placeholderTextColor":{"value":"var(--cc-placeholder-text)"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('62dc51ac-32bd-4a9a-9f67-abed403c8d8e', 'datepicker1', 'Datepicker', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"defaultValue":{"value":"01/01/2025"},"showClearBtn":{"value":"{{false}}"},"placeholder":{"value":"Select date"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('f99d0c0b-a636-4787-8e8c-92300509fef3', 'container4', 'Container', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('e124e468-fb3a-4762-98e2-493096fb5330', 'text21', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"{{`<font style=\"font-weight: 600;\">Monthly Mortgage Amount: </font>${queries.calculateMortgage.data}`}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textAlign":{"value":"left"},"textSize":{"value":"{{16}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('4b181557-d121-4959-8ebf-7f1a47e5495d', 'text22', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', '1a9b4c27-cdc7-45a2-acac-20932274c176', '{"text":{"value":"<font style=\"font-weight: 600;\">Mortgage Calculator</font>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textSize":{"value":"{{20}}"},"textAlign":{"value":"left"},"fontWeight":{"value":"bold"},"lineHeight":{"value":"{{1}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('f39fbeee-1095-4509-a4a5-128ab6658565', 'text23', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"<font style=\"font-weight: 600;\">Payment breakup</font>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textSize":{"value":"{{16}}"},"fontWeight":{"value":"bold"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('ff7e3411-8fb1-44ec-8a40-1bec3e0882ef', 'chart1', 'Chart', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"title":{"value":""},"type":{"value":"pie"},"data":{"value":"[\n  { \"x\": \"Jan\", \"y\": 100},\n  { \"x\": \"Feb\", \"y\": 80},\n  { \"x\": \"Mar\", \"y\": 40}\n]"},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{JSON.stringify({\n  data: [\n    {\n      values: [\n        (\n          components.numberinput1.value -\n          (components.numberinput2.value * components.numberinput1.value) / 100\n        ).toFixed(2),\n        (\n          Number(variables.monthly) * 12 * components.numberinput4.value -\n          components.numberinput1.value\n        ).toFixed(2),\n      ],\n      labels: [\"Principal\", \"Interest\"],\n      type: \"pie\",\n      marker: {\n        colors: [\"#8699D8\", \"#3451B2\"],\n      },\n    },\n  ],\n})}}"}}', '{}', '{"backgroundColor":{"value":"#ffffff","fxActive":false},"padding":{"value":"10"},"visibility":{"fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('fc8d92ce-2be7-44ef-9008-5215f026f012', 'text27', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"Loan Amount"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('7fb2dc34-af34-404a-9cc8-f41c7e07a10b', 'text29', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"Down Payment"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('d92eb3b7-a9c6-4347-ae99-c9b2a2c8b7b8', 'text24', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"<font style=\"font-weight: 600;\">Summary</font>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textSize":{"value":"{{16}}"},"fontWeight":{"value":"bold"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('4a81f1c6-6a48-4d3c-9cad-1587268f991b', 'text25', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"House Price"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('73bb99a0-f42c-495e-8cb9-6ed83135b197', 'text31', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"Total Payment"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('0a4e5bf2-3393-4a6d-8894-1ed93beb9859', 'text33', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"Payoff Date"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('11ab9b62-1a9e-43bf-8ce3-1aaf003ad84a', 'verticaldivider1', 'VerticalDivider', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"tooltipFormat":{"value":"plainText"}}', '{}', '{"dividerColor":{"value":"#8888884d"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('fad13554-9f9d-487c-9300-85f9e09d6e32', 'text35', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"{{(components.numberinput1.value).toFixed(2)}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('4c2d404f-d8ab-489a-be52-fea608aec7e8', 'text36', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"{{(components.numberinput1.value - ((components.numberinput2.value * components.numberinput1.value) / 100)).toFixed(2)}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('3edc8ad5-d863-4ef8-b2bb-ad744cf5529a', 'text37', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"{{((components.numberinput2.value * components.numberinput1.value) / 100).toFixed(2)}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('27090b2f-8341-419a-9fa4-6ff3e3473c14', 'text32', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"{{(Number(variables.monthly) * 12 * components.numberinput4.value).toFixed(2) || \"N/A\"}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('c584c404-6cfc-4f5e-9d1f-da4470c12645', 'text34', 'Text', 'b2143c85-26b1-49e3-abe7-b5f90993f81e', 'f99d0c0b-a636-4787-8e8c-92300509fef3', '{"text":{"value":"{{queries.calculateDate.data}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL),
	('69141026-c4bc-4892-8e71-a5862b46d1b1', 'text14', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Type of usage</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('f0bb932c-889b-4aa4-b550-b19c0e3ed67f', 'text15', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Gender</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('4b14440d-4739-4c49-8544-e5bad746c1e5', 'multiselect8', 'Multiselect', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"label":{"value":""},"value":{"value":"{{queries.filterGender.data.values}}"},"values":{"value":"{{queries.filterGender.data.values}}"},"display_values":{"value":"{{queries.filterGender.data.labels}}"},"showAllOption":{"value":"{{true}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('d77e7fb8-7add-4201-8f74-241998023590', 'text9', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Compare by</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('504f05c8-bff2-4f9b-97b2-b8a6c82c8d1e', 'chart1', 'Chart', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"title":{"value":""},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{queries.chartReviewDistribution.data}}"},"loadingState":{"fxActive":true,"value":"{{queries.reviewDistribution.isLoading || queries.chartReviewDistribution.isLoading || queries.getAllChartsData.isLoading}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"value":"#fff","fxActive":false},"padding":{"value":"10"}}', '{"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('94491e11-3a4a-4dbc-a893-82148b10fc55', 'chart4', 'Chart', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"title":{"value":""},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{queries.positivityTrend.data}}"},"loadingState":{"value":"{{queries.trendAnalysis.isLoading || queries.positivityTrend.isLoading || queries.getAllChartsData.isLoading}}","fxActive":true}}', '{}', '{"borderRadius":{"value":"{{5}}"},"padding":{"value":"10"}}', '{"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('c55913e3-0e91-43f0-8a17-cf118ae2cac9', 'text24', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"text":{"value":"<div style=\"font-weight: 600;\">Review distribution</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"borderRadius":{"value":"5"},"backgroundColor":{"value":"#3e63dd1a"},"borderColor":{"value":"#ffffff00"},"textColor":{"value":"#3e63ddff"},"textIndent":{"value":"10"},"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('c5dbd7a2-04f4-4ea4-bceb-796ba94d669f', 'text25', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"text":{"value":"<div style=\"font-weight: 600;\">Sentiment distribution</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#3e63dd1a"},"textColor":{"value":"#3e63ddff"},"textIndent":{"value":"10"},"borderColor":{"value":"#ffffff00"},"borderRadius":{"value":"5"},"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('a4ad7530-95af-41f9-b9c0-306dec01af28', 'text26', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"text":{"value":"<div style=\"font-weight: 600;\">Time trend analysis</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#3e63dd1a"},"textColor":{"value":"#3e63ddff"},"textIndent":{"value":"10"},"borderColor":{"value":"#ffffff00"},"borderRadius":{"value":"5"},"padding":{"value":"default"},"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('9d4ad48e-9413-4689-9819-2cb6e7b5f516', 'text27', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"text":{"value":"<div style=\"font-weight: 600;\">Positivity trend</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#3e63dd1a"},"textColor":{"value":"#3e63ddff"},"textIndent":{"value":"10"},"borderColor":{"value":"#ffffff00"},"borderRadius":{"value":"5"},"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('4b8a3848-c489-4557-ada4-da58271d2efc', 'dropdown10', 'DropDown', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"label":{"value":""},"value":{"value":"{{false}}"},"values":{"value":"{{[false, true]}}"},"placeholder":{"value":"Legend"},"display_values":{"value":"{{[\"Legend hidden\", \"Legend shown\"]}}"}}', '{}', '{"borderRadius":{"value":"5"},"justifyContent":{"value":"left"},"selectedTextColor":{"value":"#3e63ddff"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('f5d26600-ed0d-4167-a995-e57cf92366a7', 'dropdown11', 'DropDown', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"label":{"value":""},"value":{"value":"{{false}}"},"values":{"value":"{{[false, true]}}"},"display_values":{"value":"{{[\"Legend hidden\", \"Legend shown\"]}}"},"placeholder":{"value":"Legend"}}', '{}', '{"borderRadius":{"value":"5"},"justifyContent":{"value":"left"},"selectedTextColor":{"value":"#3e63ddff"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL);
INSERT INTO public.components VALUES
	('817817fe-3667-41a7-9c57-9e90c62a8f15', 'button1', 'Button', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"text":{"value":"Apply filters"},"loadingState":{"fxActive":false},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"disabledState":{"fxActive":true,"value":"{{queries.reviewDistribution.isLoading || queries.chartReviewDistribution.isLoading || queries.chartSentimentDistribution.isLoading || queries.trendAnalysis.isLoading || queries.timeTrendAnalysis.isLoading || queries.positivityTrend.isLoading}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"value":"#ffffff00"},"textColor":{"value":"#3e63ddff"},"loaderColor":{"value":"#3e63ddff"},"borderColor":{"value":"#3e63ddff"},"textSize":{"value":"{{14}}"},"fontWeight":{"value":"normal"},"contentAlignment":{"value":"center"},"hoverBackgroundColor":{"value":"var(--cc-primary-brand)"},"hoverBackgroundMode":{"value":"auto"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('7db9779a-6186-4c14-b3ad-f12a8d45f222', 'datepicker1', 'Datepicker', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"defaultValue":{"value":"{{queries?.filterDate?.data?.min_date ?? \"01/07/2020\"}}"},"showClearBtn":{"value":"{{false}}"},"placeholder":{"value":"Select date"}}', '{}', '{"borderRadius":{"value":"{{5}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('07e050bc-c4cd-4cfa-baae-42219e6750ef', 'icon1', 'Icon', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"icon":{"value":"IconArrowNarrowRight"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"iconColor":{"value":"#88888880"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('0b9bd802-2423-44ea-849c-8b4555ad25ac', 'datepicker2', 'Datepicker', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"defaultValue":{"value":"{{queries?.filterDate?.data?.max_date ?? \"01/07/2020\"}}"},"showClearBtn":{"value":"{{false}}"},"placeholder":{"value":"Select date"}}', '{}', '{"borderRadius":{"value":"{{5}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('2c92c28a-7a2a-4b35-b93e-86febd5990ed', 'container2', 'Container', '6d7123a7-31d5-428e-a5ba-a59010750a02', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('0c2c911e-d59c-4044-bf1b-a319dbb84261', 'container3', 'Container', '6d7123a7-31d5-428e-a5ba-a59010750a02', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('634a339f-c0d3-4ced-ad65-15b4940943a3', 'multiselect6', 'Multiselect', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"label":{"value":""},"value":{"value":"{{queries.filterSource.data.values}}"},"values":{"value":"{{queries.filterSource.data.values}}"},"display_values":{"value":"{{queries.filterSource.data.labels}}"},"showAllOption":{"value":"{{true}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('63ab45e4-96a2-4684-9660-30f827b4dc6b', 'text10', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"text":{"value":"<hr>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('b0effedf-162c-4699-b16c-b0cc3c7426f8', 'text11', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Date</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('b67d7c31-e17b-4975-a592-76780781d540', 'text12', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Brand</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('fdf036d1-96c3-44a3-adb1-1a75d0f129e8', 'chart2', 'Chart', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"title":{"value":""},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{queries.chartSentimentDistribution.data}}"},"barmode":{"value":"stack","fxActive":false},"loadingState":{"value":"{{queries.reviewDistribution.isLoading || queries.chartSentimentDistribution.isLoading || queries.getAllChartsData.isLoading}}","fxActive":true}}', '{}', '{"borderRadius":{"value":"{{5}}"},"padding":{"value":"10"}}', '{"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('337d4fc5-34de-41c9-86f8-c2dce775b51b', 'chart3', 'Chart', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0c2c911e-d59c-4044-bf1b-a319dbb84261', '{"title":{"value":""},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{queries.timeTrendAnalysis.data}}"},"loadingState":{"value":"{{queries.trendAnalysis.isLoading || queries.timeTrendAnalysis.isLoading || queries.getAllChartsData.isLoading}}","fxActive":true}}', '{}', '{"borderRadius":{"value":"{{5}}"},"padding":{"value":"10"},"backgroundColor":{"value":"#fff"}}', '{"boxShadow":{"value":"0px 0px 0px 1px #3e63dd1a"}}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('4c995070-ce33-4894-af78-d819e643ec1c', 'text13', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"text":{"value":"<div style=\"font-weight: 600;\">Source</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('e129821f-34f6-4703-82a9-79fb99200347', 'multiselect7', 'Multiselect', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"label":{"value":""},"value":{"value":"{{queries.filterRoa.data.values}}"},"values":{"value":"{{queries.filterRoa.data.values}}"},"display_values":{"value":"{{queries.filterRoa.data.labels}}"},"showAllOption":{"value":"{{true}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('8d9b4990-d3b5-48d5-b8a5-b6823a9ce462', 'dropdown2', 'DropDown', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"label":{"value":""},"value":{"value":"{{\"brand\"}}"},"values":{"value":"{{[\"brand\", \"source\"]}}"},"display_values":{"value":"{{[\"Brand\", \"Source\"]}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('6c21bbe6-4ff8-4c66-9070-2c2bf37c018a', 'multiselect5', 'Multiselect', '6d7123a7-31d5-428e-a5ba-a59010750a02', '2c92c28a-7a2a-4b35-b93e-86febd5990ed', '{"label":{"value":""},"value":{"value":"{{queries.filterBrand.data.values}}"},"values":{"value":"{{queries.filterBrand.data.values}}"},"display_values":{"value":"{{queries.filterBrand.data.labels}}"},"showAllOption":{"value":"{{true}}"}}', '{}', '{"borderRadius":{"value":"5"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('0aa0a541-6bdf-478e-92a8-7f3256c6fa4c', 'container4', 'Container', '6d7123a7-31d5-428e-a5ba-a59010750a02', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"backgroundColor":{"value":"#3e63ddff"},"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('cdb5ca72-a270-4f3a-bf32-dcbb67312d11', 'text16', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0aa0a541-6bdf-478e-92a8-7f3256c6fa4c', '{"text":{"value":"B R A N D"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textColor":{"value":"#ffffffff"},"textSize":{"value":"{{24}}"},"fontWeight":{"value":"bold"},"letterSpacing":{"value":"{{0}}"},"boxShadow":{"value":"0px 0px 0px 0px #00000040"},"isScrollRequired":{"value":"disabled"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('7df6ef38-c6b1-422d-a7b9-cf6ba163c59e', 'text17', 'Text', '6d7123a7-31d5-428e-a5ba-a59010750a02', '0aa0a541-6bdf-478e-92a8-7f3256c6fa4c', '{"text":{"value":"<div style=\"font-weight: 600;\">Business intelligence dashboard</div>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textColor":{"value":"#ffffffff","fxActive":false},"textSize":{"value":"{{20}}"},"textAlign":{"value":"right"},"fontWeight":{"value":"normal"},"boxShadow":{"value":"0px 0px 0px 0px #00000040"},"isScrollRequired":{"value":"disabled"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL),
	('62bedea4-755b-475d-b51b-694eca110373', 'text2', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '98447ceb-a2ce-426f-9d2c-8799fcfaacf8', '{"text":{"value":"Credit department"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textColor":{"value":"#ffffffff","fxActive":false},"textSize":{"value":"{{20}}"},"textAlign":{"value":"right"},"fontWeight":{"value":"normal"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('109dc90e-3c24-4c74-b244-1d298c8724ef', 'text1', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '98447ceb-a2ce-426f-9d2c-8799fcfaacf8', '{"text":{"value":"B A N K"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textColor":{"value":"#ffffffff"},"textSize":{"value":"{{24}}"},"textAlign":{"value":"left"},"fontWeight":{"value":"bold"},"letterSpacing":{"value":"{{0}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('98447ceb-a2ce-426f-9d2c-8799fcfaacf8', 'container1', 'Container', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"backgroundColor":{"value":"#213b80ff"},"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('f8499e08-4deb-469c-bbd0-2e96fd95f08f', 'container2', 'Container', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('3e0bf694-1319-4679-8e79-805878b9b8f1', 'text4', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"text":{"value":"Interest Rate (%)"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('06db0e76-6142-4d39-b134-baad091c6ef6', 'numberinput1', 'NumberInput', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"value":{"value":"1000000"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":"","showClearBtn":{"value":"{{false}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"fxActive":true,"value":""},"borderColor":{"fxActive":true,"value":""},"placeholderTextColor":{"value":"var(--cc-placeholder-text)"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('f07ed0ab-a53e-431a-af84-79cd4fc4be65', 'text5', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"text":{"value":"House Price"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('8a0e26dc-bb1d-4382-89c1-e4dc19241dec', 'text6', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"text":{"value":"Down Payment (%)"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('a9f46fa8-d07b-401e-b4b0-c8063b790c45', 'text7', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"text":{"value":"Tenure (years)"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('4a1680b2-53ea-48d6-99d3-389a72565814', 'text8', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"text":{"value":"Start Date"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('88da8bc6-eb24-42a0-9184-3c37196a0f6e', 'numberinput2', 'NumberInput', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"value":{"value":"20"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":"","showClearBtn":{"value":"{{false}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"fxActive":false,"value":""},"borderColor":{"fxActive":false,"value":""},"placeholderTextColor":{"value":"var(--cc-placeholder-text)"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('58f2aea4-c595-4300-9411-a89d8752a509', 'numberinput3', 'NumberInput', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"value":{"value":"4"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":"","showClearBtn":{"value":"{{false}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"fxActive":false,"value":""},"borderColor":{"fxActive":false,"value":""},"placeholderTextColor":{"value":"var(--cc-placeholder-text)"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('eed0d4ce-2834-45b3-9c6f-80b8a07033f4', 'numberinput4', 'NumberInput', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"value":{"value":"20"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"label":"","showClearBtn":{"value":"{{false}}"}}', '{}', '{"borderRadius":{"value":"{{5}}"},"backgroundColor":{"fxActive":false,"value":""},"borderColor":{"fxActive":false,"value":""},"placeholderTextColor":{"value":"var(--cc-placeholder-text)"},"widthType":{"value":"ofField"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('3a0d238d-1c1d-42e7-bb21-f1db8a1744eb', 'datepicker1', 'Datepicker', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"defaultValue":{"value":"01/01/2025"},"showClearBtn":{"value":"{{false}}"},"placeholder":{"value":"Select date"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('3931fa5e-9281-4311-ab93-d16b3b93fa08', 'container4', 'Container', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', NULL, '{"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"},"showHeader":false}', '{}', '{"borderRadius":{"value":"10"},"borderColor":{"value":"#ffffff00"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('f9d46a10-34f8-466d-816a-b71f267721ef', 'text21', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"{{`<font style=\"font-weight: 600;\">Monthly Mortgage Amount: </font>${queries.calculateMortgage.data}`}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textAlign":{"value":"left"},"textSize":{"value":"{{16}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('156bcf33-7008-423d-8035-c02969f24fbb', 'text22', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', '{"text":{"value":"<font style=\"font-weight: 600;\">Mortgage Calculator</font>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textSize":{"value":"{{20}}"},"textAlign":{"value":"left"},"fontWeight":{"value":"bold"},"lineHeight":{"value":"{{1}}"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('c14ac282-bc6e-489a-a71b-8fda6691e5bb', 'text23', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"<font style=\"font-weight: 600;\">Payment breakup</font>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textSize":{"value":"{{16}}"},"fontWeight":{"value":"bold"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('b3f0743e-d1f6-40d5-9c4d-98de693b87bd', 'chart1', 'Chart', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"title":{"value":""},"type":{"value":"pie"},"data":{"value":"[\n  { \"x\": \"Jan\", \"y\": 100},\n  { \"x\": \"Feb\", \"y\": 80},\n  { \"x\": \"Mar\", \"y\": 40}\n]"},"plotFromJson":{"value":"{{true}}"},"jsonDescription":{"value":"{{JSON.stringify({\n  data: [\n    {\n      values: [\n        (\n          components.numberinput1.value -\n          (components.numberinput2.value * components.numberinput1.value) / 100\n        ).toFixed(2),\n        (\n          Number(variables.monthly) * 12 * components.numberinput4.value -\n          components.numberinput1.value\n        ).toFixed(2),\n      ],\n      labels: [\"Principal\", \"Interest\"],\n      type: \"pie\",\n      marker: {\n        colors: [\"#8699D8\", \"#3451B2\"],\n      },\n    },\n  ],\n})}}"}}', '{}', '{"backgroundColor":{"value":"#ffffff","fxActive":false},"padding":{"value":"10"},"visibility":{"fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('ab6fb764-41dc-4fe1-9bcf-3917b8114c79', 'text27', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"Loan Amount"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('04896ad4-2ac9-49eb-be06-63eec111658a', 'text29', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"Down Payment"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('2760b2dc-5047-4bbb-a14d-ab74718f6881', 'text24', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"<font style=\"font-weight: 600;\">Summary</font>"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"textSize":{"value":"{{16}}"},"fontWeight":{"value":"bold"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('2a1083c0-4ddd-4819-a29e-cfb6dfa4f09c', 'text25', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"House Price"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('2efccc09-4aa2-4584-a939-0c1462e3dbcf', 'text31', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"Total Payment"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('3fde27cd-f4b5-49c7-b333-42e58dfdc41d', 'text33', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"Payoff Date"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{"backgroundColor":{"value":"#ffffff00","fxActive":false}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('6db4c770-9e28-4be8-b6d3-6dd5806d9317', 'verticaldivider1', 'VerticalDivider', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"tooltipFormat":{"value":"plainText"}}', '{}', '{"dividerColor":{"value":"#8888884d"}}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('15ace0d9-6c59-4417-b525-588d62b10290', 'text35', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"{{(components.numberinput1.value).toFixed(2)}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('aaef1b17-5ca4-4616-9281-b01488c230c3', 'text36', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"{{(components.numberinput1.value - ((components.numberinput2.value * components.numberinput1.value) / 100)).toFixed(2)}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('26986152-5252-4174-b5d1-9031d8b8c381', 'text37', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"{{((components.numberinput2.value * components.numberinput1.value) / 100).toFixed(2)}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('a274da88-30dd-4a71-a11a-fcb04924d4e0', 'text32', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"{{(Number(variables.monthly) * 12 * components.numberinput4.value).toFixed(2) || \"N/A\"}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('97cf961e-74d7-4b53-8ac6-36bc6f10672f', 'text34', 'Text', '65d7bb83-11db-4f1f-ab6d-b0362cfb557e', '3931fa5e-9281-4311-ab93-d16b3b93fa08', '{"text":{"value":"{{queries.calculateDate.data}}"},"collapseWhenHidden":{"value":"{{false}}"},"tooltipFormat":{"value":"plainText"}}', '{}', '{}', '{}', '{"showOnDesktop":{"value":"{{true}}"},"showOnMobile":{"value":"{{false}}"}}', '{}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL);

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
	('728ba5f4-bb70-4ace-beaa-5c3f7a948c99', 'redacted', '2026-10-28 17:15:11.131', '2026-10-28 17:15:11.131'),
	('f3cdbded-6643-4002-9b8f-5ee747014552', 'redacted', '2026-10-29 02:32:19.552', '2026-10-29 02:32:19.552'),
	('aca6f5a8-f144-4add-ad0a-8f050cb790ae', 'redacted', '2026-10-29 02:32:19.562', '2026-10-29 02:32:19.562'),
	('927cf94d-5b19-4ffb-b2ec-b4cf23bf8f21', 'redacted', '2026-10-29 02:32:19.564', '2026-10-29 02:32:19.564'),
	('98d0549c-7282-45a6-9593-c3a53bdf1e23', 'redacted', '2026-10-29 02:33:04.099', '2026-10-29 02:33:04.099'),
	('6871a771-f19b-462c-9de1-3a7f2e9b0afd', 'redacted', '2026-10-29 02:33:04.103', '2026-10-29 02:33:04.103'),
	('90f26bb7-c830-46d5-9634-7d000a048c5e', 'redacted', '2026-10-29 02:33:04.105', '2026-10-29 02:33:04.105'),
	('9906d466-0e2c-49e0-b4df-8efae7968961', 'redacted', '2026-10-29 02:33:04.107', '2026-10-29 02:33:04.107'),
	('fdcfe00a-3018-48ce-8f02-3463319e02f3', 'redacted', '2026-10-29 02:33:04.108', '2026-10-29 02:33:04.108'),
	('ac26bb90-d403-4457-a1fe-e6f3817d4d99', 'redacted', '2026-10-29 02:33:04.109', '2026-10-29 02:33:04.109'),
	('b6953527-5b3b-4016-bdc6-b719261fd17c', 'redacted', '2026-10-29 02:33:29.87', '2026-10-29 02:33:29.87'),
	('111128ab-2b37-4506-819b-964f2d485cce', 'redacted', '2026-10-29 02:33:29.871', '2026-10-29 02:33:29.871'),
	('e2dc99e5-d6ec-43ad-8d0f-3f0415461f17', 'redacted', '2026-10-29 02:33:29.872', '2026-10-29 02:33:29.872'),
	('6b508d70-763b-48f5-afd3-bd0723e4ff39', 'redacted', '2026-10-29 02:33:30.01', '2026-10-29 02:33:30.01'),
	('cc15a947-1201-4a91-8665-615c04333791', 'redacted', '2026-10-29 02:33:30.011', '2026-10-29 02:33:30.011'),
	('0503ec53-b415-4bbf-a8bf-3f12bf72b39a', 'redacted', '2026-10-29 02:33:30.011', '2026-10-29 02:33:30.011'),
	('9d257e8f-5cfe-4337-a8ac-ca3932e428ea', 'redacted', '2026-10-29 02:33:30.153', '2026-10-29 02:33:30.153'),
	('ef6fa6f5-203a-4f78-bb88-e30eba687949', 'redacted', '2026-10-29 02:33:30.154', '2026-10-29 02:33:30.154');
INSERT INTO public.credentials VALUES
	('7bc0482d-cf99-494d-93f8-df893e97c1d7', 'redacted', '2026-10-29 02:33:30.154', '2026-10-29 02:33:30.154');

INSERT INTO public.data_queries VALUES
	('451137b1-ffd2-4fe7-96ca-0c53f0ef168f', '69dbfec8-ca9d-4a63-8b99-86899afe7f50', 'q_select', '{"mode":"sql","query":"select 1 as x"}', '2026-10-28 17:15:10.082', '2026-10-28 17:15:10.082', NULL, '2a03cb23-f76a-4708-a713-1ffc90c46bbb'),
	('5bd92e49-67b0-46cb-94c5-f65bf7d1cb62', '9867e0d2-4260-469f-a184-eefae5ca3174', 'q_select', '{"mode":"sql","query":"select 1 as x"}', '2026-10-28 17:15:10.651', '2026-10-28 17:15:10.651', NULL, '9df57db2-562e-450c-8c1c-fdd166fb742d'),
	('427ae79c-40c3-4fa4-8cd4-d1e58d4ff95d', '9867e0d2-4260-469f-a184-eefae5ca3174', 'q_select', '{"mode":"sql","query":"select 1 as x"}', '2026-10-28 11:45:11.149448', '2026-10-28 11:45:11.149448', NULL, 'cec07005-b8a8-4c10-a7e2-735cbf791b36'),
	('43afa479-a52f-441d-b03c-664af8d52cec', 'a9a8732b-6f29-4370-834c-c3283c8e8044', 'formatJSON', '{"code":"const input = components.textarea1.value;\nconst indentOption = components.indentOptions.value;\n\n// Parse the JSON and format it\nlet parsed;\ntry {\n  parsed = JSON.parse(input);\n} catch (error) {\n  const formattedJSON = \"Invalid JSON input: \" + error.message;\n  return formattedJSON;\n}\n\n// Determine the indentation\nlet indentChar;\nswitch (indentOption) {\n  case \"tab\":\n    indentChar = \"\\t\";\n    break;\n  case \"2spaces\":\n    indentChar = \"  \";\n    break;\n  case \"4spaces\":\n    indentChar = \"    \";\n    break;\n  case \"8spaces\":\n    indentChar = \"        \";\n    break;\n  default:\n    const formattedJSON = \"Invalid indent option\";\n    return formattedJSON;\n}\n\n// Format and display the JSON\nconst formattedJSON = JSON.stringify(parsed, null, indentChar);\nreturn formattedJSON;\n","parameters":[]}', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', NULL, 'fff4b014-35d3-4770-8ddf-b8959b8c9f95'),
	('a0deb579-2ee1-4142-986b-163bd30008df', 'a9a8732b-6f29-4370-834c-c3283c8e8044', 'formatJSON', '{"code":"const input = components.textarea1.value;\nconst indentOption = components.indentOptions.value;\n\n// Parse the JSON and format it\nlet parsed;\ntry {\n  parsed = JSON.parse(input);\n} catch (error) {\n  const formattedJSON = \"Invalid JSON input: \" + error.message;\n  return formattedJSON;\n}\n\n// Determine the indentation\nlet indentChar;\nswitch (indentOption) {\n  case \"tab\":\n    indentChar = \"\\t\";\n    break;\n  case \"2spaces\":\n    indentChar = \"  \";\n    break;\n  case \"4spaces\":\n    indentChar = \"    \";\n    break;\n  case \"8spaces\":\n    indentChar = \"        \";\n    break;\n  default:\n    const formattedJSON = \"Invalid indent option\";\n    return formattedJSON;\n}\n\n// Format and display the JSON\nconst formattedJSON = JSON.stringify(parsed, null, indentChar);\nreturn formattedJSON;\n","parameters":[]}', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL, 'e884ec80-102a-44b3-8efe-fe7f1c6dcb6b'),
	('ba45e493-01d3-4736-b954-58c428c2fe35', 'a9a8732b-6f29-4370-834c-c3283c8e8044', 'formatJSON', '{"code":"const input = components.textarea1.value;\nconst indentOption = components.indentOptions.value;\n\n// Parse the JSON and format it\nlet parsed;\ntry {\n  parsed = JSON.parse(input);\n} catch (error) {\n  const formattedJSON = \"Invalid JSON input: \" + error.message;\n  return formattedJSON;\n}\n\n// Determine the indentation\nlet indentChar;\nswitch (indentOption) {\n  case \"tab\":\n    indentChar = \"\\t\";\n    break;\n  case \"2spaces\":\n    indentChar = \"  \";\n    break;\n  case \"4spaces\":\n    indentChar = \"    \";\n    break;\n  case \"8spaces\":\n    indentChar = \"        \";\n    break;\n  default:\n    const formattedJSON = \"Invalid indent option\";\n    return formattedJSON;\n}\n\n// Format and display the JSON\nconst formattedJSON = JSON.stringify(parsed, null, indentChar);\nreturn formattedJSON;\n","parameters":[]}', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL, '873cf9ba-539a-4b5c-857b-6480f42077be'),
	('4be93b44-5beb-44b2-80dc-d607a2d72563', 'a9a8732b-6f29-4370-834c-c3283c8e8044', 'chartReviewDistribution', '{"code":"const filteredData = variables.chartFocusParameters\n  ? queries.reviewDistribution.data.filter(\n      (row) => row.entity == variables.chartFocusParameters.filterEntity\n    )\n  : queries.reviewDistribution.data;\n\nconst chartData = {\n  data: [\n    {\n      type: \"bar\",\n      x: filteredData.map((row) => row.total_reviews),\n      y: filteredData.map((row) => row.entity),\n      orientation: \"h\",\n      marker: {\n        color: \"#3E63DDCC\",\n        width: 1,\n      },\n    },\n  ],\n};\n\nreturn chartData;","parameters":[]}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('ad7b5f15-f116-460e-8f9f-fb93239855f7', 'a9a8732b-6f29-4370-834c-c3283c8e8044', 'chartSentimentDistribution', '{"code":"const filteredData = variables.chartFocusParameters\n  ? queries.reviewDistribution.data.filter(\n      (row) => row.entity == variables.chartFocusParameters.filterEntity\n    )\n  : queries.reviewDistribution.data;\n\nconst chartData = {\n  data: [\n    {\n      x: filteredData.map(\n        (row) => `${(row.positive_reviews * 100) / row.total_reviews}%`\n      ),\n      y: filteredData.map((row) => row.entity),\n      name: \"Positive\",\n      orientation: \"h\",\n      marker: {\n        color: \"#9DF590\",\n        width: 1,\n      },\n      text: filteredData.map(\n        (row) =>\n          `${((row.positive_reviews * 100) / row.total_reviews).toFixed(2)}%`\n      ),\n      hovertemplate: filteredData.map(\n        (row) =>\n          `<b>${row.entity}</b><br>Unique count of Opinions: <b>${\n            row.positive_reviews\n          }</b><br>% of Opinions:\t<b>${(\n            (row.positive_reviews * 100) /\n            row.total_reviews\n          ).toFixed(2)}%</b>`\n      ),\n      type: \"bar\",\n    },\n    {\n      x: filteredData.map(\n        (row) => `${(row.neutral_reviews * 100) / row.total_reviews}%`\n      ),\n      y: filteredData.map((row) => row.entity),\n      name: \"Neutral\",\n      orientation: \"h\",\n      marker: {\n        color: \"#AFC2FF\",\n        width: 1,\n      },\n      text: filteredData.map(\n        (row) =>\n          `${((row.neutral_reviews * 100) / row.total_reviews).toFixed(2)}%`\n      ),\n      hovertemplate: filteredData.map(\n        (row) =>\n          `<b>${row.entity}</b><br>Unique count of Opinions: <b>${\n            row.neutral_reviews\n          }</b><br>% of Opinions:\t<b>${(\n            (row.neutral_reviews * 100) /\n            row.total_reviews\n          ).toFixed(2)}%</b>`\n      ),\n      type: \"bar\",\n    },\n    {\n      x: filteredData.map(\n        (row) => `${(row.negative_reviews * 100) / row.total_reviews}%`\n      ),\n      y: filteredData.map((row) => row.entity),\n      name: \"Negative\",\n      orientation: \"h\",\n      marker: {\n        color: \"#FFA1A1\",\n        width: 1,\n      },\n      text: filteredData.map(\n        (row) =>\n          `${((row.negative_reviews * 100) / row.total_reviews).toFixed(2)}%`\n      ),\n      hovertemplate: filteredData.map(\n        (row) =>\n          `<b>${row.entity}</b><br>Unique count of Opinions: <b>${\n            row.negative_reviews\n          }</b><br>% of Opinions:\t<b>${(\n            (row.negative_reviews * 100) /\n            row.total_reviews\n          ).toFixed(2)}%</b>`\n      ),\n      type: \"bar\",\n    },\n  ],\n};\n\nreturn chartData;","parameters":[]}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('98508cad-f39a-4876-88a6-4f14581b229a', 'a9a8732b-6f29-4370-834c-c3283c8e8044', 'positivityTrend', '{"code":"const aggregatedData = {};\nconst order = [];\n\nconst filteredData = variables.chartFocusParameters\n  ? queries.trendAnalysis.data.filter(\n      (row) => row.entity == variables.chartFocusParameters.filterEntity\n    )\n  : queries.trendAnalysis.data;\n\nfilteredData.forEach((item) => {\n  const entity = item.entity;\n  const monthYear = item.month_year;\n  const totalReviews = item.total_reviews;\n  const positiveReviews = item.positive_reviews;\n\n  if (!aggregatedData[entity]) {\n    aggregatedData[entity] = {\n      x: [],\n      y: [],\n      type: \"scatter\",\n      hovertemplate: [],\n      name: entity,\n      showlegend: components.dropdown11.value,\n      mode: \"lines+markers\",\n    };\n    order.push(entity);\n  }\n\n  if (!aggregatedData[entity].x.includes(monthYear)) {\n    aggregatedData[entity].x.push(monthYear);\n    aggregatedData[entity].y.push((positiveReviews / totalReviews) * 100 || 0);\n    aggregatedData[entity].hovertemplate.push(\n      `Date: <b>${monthYear}</b><br>Total count of Opinions: <b>${totalReviews}</b><br>Unique count of Positive Opinions: <b>${positiveReviews}</b><br>Positivity: <b>${(\n        (positiveReviews / totalReviews) * 100 || 0\n      ).toFixed(2)}%</b>`\n    );\n  } else {\n    const index = aggregatedData[entity].x.indexOf(monthYear);\n    aggregatedData[entity].y[index] = totalReviews;\n  }\n});\n\nconst outputJSON = order.map((entity) => aggregatedData[entity]);\n\nreturn { data: outputJSON };","parameters":[]}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('6dfbbbad-ecce-4428-a51e-2598985ef36d', 'a9a8732b-6f29-4370-834c-c3283c8e8044', 'timeTrendAnalysis', '{"code":"const aggregatedData = {};\nconst order = [];\n\nconst filteredData = variables.chartFocusParameters\n  ? queries.trendAnalysis.data.filter(\n      (row) => row.entity == variables.chartFocusParameters.filterEntity\n    )\n  : queries.trendAnalysis.data;\n\nfilteredData.forEach((item) => {\n  const entity = item.entity;\n  const monthYear = item.month_year;\n\n  if (!aggregatedData[entity]) {\n    aggregatedData[entity] = {\n      x: [],\n      y: [],\n      stackgroup: \"one\",\n      hovertemplate:\n        \"<b>Date:</b> %{x}<br><b>Unique count of reviews:</b> %{y}<br>\",\n      name: entity,\n      mode: \"none\",\n      showlegend: components.dropdown10.value,\n    };\n    order.push(entity);\n  }\n\n  if (!aggregatedData[entity].x.includes(monthYear)) {\n    aggregatedData[entity].x.push(monthYear);\n    aggregatedData[entity].y.push(item.total_reviews);\n  } else {\n    const index = aggregatedData[entity].x.indexOf(monthYear);\n    aggregatedData[entity].y[index] = item.total_reviews;\n  }\n});\n\nconst outputJSON = order.map((entity) => aggregatedData[entity]);\n\nreturn { data: outputJSON };","parameters":[]}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('376ca8b4-f340-4363-92ba-792a16fcc60a', 'a9a8732b-6f29-4370-834c-c3283c8e8044', 'getAllChartsData', '{"code":"actions.runQuery(\"chartReviewDistribution\");\nactions.runQuery(\"chartSentimentDistribution\");\nactions.runQuery(\"positivityTrend\");\nactions.runQuery(\"timeTrendAnalysis\");","parameters":[]}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('3d86427c-357d-49da-8dd4-6a6ab74791eb', 'a9a8732b-6f29-4370-834c-c3283c8e8044', 'runQueriesAfterFilterLoad', '{"code":"if (\n  (variables?.filterDateAvailable ?? false) &&\n  (variables?.filterBrandAvailable ?? false) &&\n  (variables?.filterSourceAvailable ?? false) &&\n  (variables?.filterRoaAvailable ?? false) &&\n  (variables?.filterGenderAvailable ?? false)\n) {\n  if (variables?.filterBrandAvailable ?? false) {\n    queries.reviewDistribution.run();\n    queries.trendAnalysis.run();\n  }\n}","parameters":[]}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('5ed60b36-065b-49a4-bab0-588072a3d77a', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'reviewDistribution', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":false,"query":"{{`SELECT\n    INITCAP(${ components.dropdown2.value }) AS entity,\n    SUM(\n        CASE\n            WHEN overall_sentiment = ''Positive'' THEN 1\n            ELSE 0\n        END\n    ) AS positive_reviews,\n    SUM(\n        CASE\n            WHEN overall_sentiment = ''Negative'' THEN 1\n            ELSE 0\n        END\n    ) AS negative_reviews,\n    SUM(\n        CASE\n            WHEN overall_sentiment = ''Neutral'' THEN 1\n            ELSE 0\n        END\n    ) AS neutral_reviews,\n    COUNT(*) AS total_reviews\nFROM\n    business_data\nWHERE\n    date_of_submission BETWEEN ''${moment(components.datepicker1.value, \"DD/MM/YYYY\").format(\"YYYY-MM-DD\")}''\n    AND ''${moment(components.datepicker2.value, \"DD/MM/YYYY\").format(\"YYYY-MM-DD\")}''\n    AND LOWER(brand) in (''${components.multiselect5.values.join(\"'', ''\")}'')\n    AND LOWER(source) in (''${components.multiselect6.values.join(\"'', ''\")}'')\n    AND LOWER(roa) in (''${components.multiselect7.values.join(\"'', ''\")}'')\n    AND LOWER(gender) in (''${components.multiselect8.values.join(\"'', ''\")}'')\nGROUP BY\n    ${ components.dropdown2.value }\nORDER BY\n    total_reviews ASC;`}}","runOnPageLoad":false}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('38dd4ad8-5e60-4ca6-a556-b683792ef955', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'filterDate', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT \n    TO_CHAR(MIN(date_of_submission), ''DD/MM/YYYY'') AS min_date, \n    TO_CHAR(MAX(date_of_submission), ''DD/MM/YYYY'') AS max_date \nFROM \n    business_data;","runOnPageLoad":true,"transformation":"return data[0];"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('26153db4-6175-4164-95b3-1e15e900d8de', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'filterGender', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(gender) AS lower_entity,\n    INITCAP(gender) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('0d80cb02-f4e7-4f54-99d5-f9e26bcb7472', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'filterContextAspectGroup', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(context_aspect_group) AS lower_entity,\n    INITCAP(context_aspect_group) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('a4c3ad2b-1060-4df0-9d6c-53a32e35541d', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'createTable', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":false,"query":"CREATE TABLE business_data(\n    brand text,\n    source text,\n    aspect text,\n    context_aspect_group text,\n    date_of_submission date,\n    gender text,\n    roa text,\n    overall_sentiment text\n);"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('a25bdebc-47e2-4f10-9ee7-ed969827c638', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'createDatabase', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":false,"query":"CREATE DATABASE business_analytics_database;"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('644f8e01-5103-4a09-8897-21e98c0631b9', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'filterRoa', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(roa) AS lower_entity,\n    INITCAP(roa) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('4454a3d8-816e-48cd-988f-0f7d2ba7680a', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'filterSource', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(source) AS lower_entity,\n    INITCAP(source) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('ee402b36-5ed2-4c84-82aa-5a57926562c3', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'filterAspect', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(aspect) AS aspect \nFROM business_data\nORDER BY aspect;","runOnPageLoad":true,"transformation":"const labels = data.map((row) => row.aspect.charAt(0).toUpperCase() + row.aspect.slice(1).toLowerCase());\nconst values = data.map((row) => row.aspect);\n\nreturn { labels, values };"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('3b6ae18b-3e49-40d5-9525-225857dc11f9', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'trendAnalysis', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":false,"query":"{{`WITH months AS (\n    SELECT\n        generate_series(\n            ''${moment(components.datepicker1.value, \"DD/MM/YYYY\").format(\"YYYY-MM-DD\")}'' :: date,\n            ''${moment(components.datepicker2.value, \"DD/MM/YYYY\").format(\"YYYY-MM-DD\")}'' :: date,\n            ''1 month'' :: interval\n        ) AS month\n),\nenitites AS (\n    SELECT\n        DISTINCT LOWER(${ components.dropdown2.value }) as ${ components.dropdown2.value }\n    FROM\n        business_data\n    WHERE\n        LOWER(${ components.dropdown2.value }) IN (''${(components.dropdown2.value == \"brand\" ? components.multiselect5.values : components.multiselect6.values).join(\"'', ''\")}'')\n)\nSELECT\n    TO_CHAR(m.month, ''Mon YY'') AS month_year,\n    INITCAP(LOWER(e.${ components.dropdown2.value })) AS entity,\n    COUNT(cd.${ components.dropdown2.value }) AS total_reviews,\n    COUNT(\n        CASE\n            WHEN cd.overall_sentiment = ''Positive'' THEN 1\n        END\n    ) AS positive_reviews\nFROM\n    months m\n    CROSS JOIN enitites e\n    LEFT JOIN business_data cd ON TO_CHAR(cd.date_of_submission, ''Mon YY'') = TO_CHAR(m.month, ''Mon YY'')\n    AND LOWER(cd.${ components.dropdown2.value }) = LOWER(e.${ components.dropdown2.value })\n    AND LOWER(cd.brand) in (''${components.multiselect5.values.join(\"'', ''\")}'')\n    AND LOWER(cd.source) in (''${components.multiselect6.values.join(\"'', ''\")}'')\n    AND LOWER(cd.roa) in (''${components.multiselect7.values.join(\"'', ''\")}'')\n    AND LOWER(cd.gender) in (''${components.multiselect8.values.join(\"'', ''\")}'')\nGROUP BY\n    TO_CHAR(m.month, ''Mon YY''),\n    LOWER(e.${ components.dropdown2.value })\nORDER BY\n    TO_DATE(TO_CHAR(m.month, ''Mon YY''), ''Mon YY''),\n    LOWER(e.${ components.dropdown2.value });`}}","transformation":"// write your code here\n// return value will be set as data and the original data will be available as rawData\nreturn data.filter(row => row.amount > 1000);"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('7523d28c-8508-40e2-a5b2-36c31e36acb5', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'filterBrand', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(brand) AS lower_entity,\n    INITCAP(brand) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, '308945c9-e540-41bc-80b6-4f0e677bcc1c'),
	('c0cfb42b-ff91-4623-b80f-0d4588f36087', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'calculateMortgage', '{"code":"var amt =\n  components.numberinput1.value -\n  (components.numberinput2.value * components.numberinput1.value) / 100;\nvar apr = components.numberinput3.value / 1200;\nvar term = components.numberinput4.value * 12;\nvar payment = (\n  (amt * (apr * Math.pow(1 + apr, term))) /\n  (Math.pow(1 + apr, term) - 1)\n).toFixed(2);\nactions.setVariable(\"monthly\", payment);\nreturn payment;","hasParamSupport":true,"parameters":[],"runOnPageLoad":true}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL, 'a5207132-c550-457b-b50a-43118c84f573'),
	('0b711a33-36bd-4238-b365-7750df5bc2ac', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'calculateDate', '{"code":"var start = components.datepicker1.value;\nreturn (\n  \"30/\" +\n  (moment(start,''DD/MM/YYYY'').month() + 1) +\n  \"/\" +\n  (moment(start,''DD/MM/YYYY'').year() + Number(components.numberinput4.value))\n);","hasParamSupport":true,"parameters":[],"runOnPageLoad":true}', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', NULL, 'a5207132-c550-457b-b50a-43118c84f573'),
	('5d80b083-afb7-47a5-8bc3-11209e18c664', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'chartReviewDistribution', '{"code":"const filteredData = variables.chartFocusParameters\n  ? queries.reviewDistribution.data.filter(\n      (row) => row.entity == variables.chartFocusParameters.filterEntity\n    )\n  : queries.reviewDistribution.data;\n\nconst chartData = {\n  data: [\n    {\n      type: \"bar\",\n      x: filteredData.map((row) => row.total_reviews),\n      y: filteredData.map((row) => row.entity),\n      orientation: \"h\",\n      marker: {\n        color: \"#3E63DDCC\",\n        width: 1,\n      },\n    },\n  ],\n};\n\nreturn chartData;","parameters":[]}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('f402a2c8-9570-404a-80e7-2488677a39e9', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'chartSentimentDistribution', '{"code":"const filteredData = variables.chartFocusParameters\n  ? queries.reviewDistribution.data.filter(\n      (row) => row.entity == variables.chartFocusParameters.filterEntity\n    )\n  : queries.reviewDistribution.data;\n\nconst chartData = {\n  data: [\n    {\n      x: filteredData.map(\n        (row) => `${(row.positive_reviews * 100) / row.total_reviews}%`\n      ),\n      y: filteredData.map((row) => row.entity),\n      name: \"Positive\",\n      orientation: \"h\",\n      marker: {\n        color: \"#9DF590\",\n        width: 1,\n      },\n      text: filteredData.map(\n        (row) =>\n          `${((row.positive_reviews * 100) / row.total_reviews).toFixed(2)}%`\n      ),\n      hovertemplate: filteredData.map(\n        (row) =>\n          `<b>${row.entity}</b><br>Unique count of Opinions: <b>${\n            row.positive_reviews\n          }</b><br>% of Opinions:\t<b>${(\n            (row.positive_reviews * 100) /\n            row.total_reviews\n          ).toFixed(2)}%</b>`\n      ),\n      type: \"bar\",\n    },\n    {\n      x: filteredData.map(\n        (row) => `${(row.neutral_reviews * 100) / row.total_reviews}%`\n      ),\n      y: filteredData.map((row) => row.entity),\n      name: \"Neutral\",\n      orientation: \"h\",\n      marker: {\n        color: \"#AFC2FF\",\n        width: 1,\n      },\n      text: filteredData.map(\n        (row) =>\n          `${((row.neutral_reviews * 100) / row.total_reviews).toFixed(2)}%`\n      ),\n      hovertemplate: filteredData.map(\n        (row) =>\n          `<b>${row.entity}</b><br>Unique count of Opinions: <b>${\n            row.neutral_reviews\n          }</b><br>% of Opinions:\t<b>${(\n            (row.neutral_reviews * 100) /\n            row.total_reviews\n          ).toFixed(2)}%</b>`\n      ),\n      type: \"bar\",\n    },\n    {\n      x: filteredData.map(\n        (row) => `${(row.negative_reviews * 100) / row.total_reviews}%`\n      ),\n      y: filteredData.map((row) => row.entity),\n      name: \"Negative\",\n      orientation: \"h\",\n      marker: {\n        color: \"#FFA1A1\",\n        width: 1,\n      },\n      text: filteredData.map(\n        (row) =>\n          `${((row.negative_reviews * 100) / row.total_reviews).toFixed(2)}%`\n      ),\n      hovertemplate: filteredData.map(\n        (row) =>\n          `<b>${row.entity}</b><br>Unique count of Opinions: <b>${\n            row.negative_reviews\n          }</b><br>% of Opinions:\t<b>${(\n            (row.negative_reviews * 100) /\n            row.total_reviews\n          ).toFixed(2)}%</b>`\n      ),\n      type: \"bar\",\n    },\n  ],\n};\n\nreturn chartData;","parameters":[]}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('9cfbae86-b3f6-43b5-a526-5a65a500c3d8', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'positivityTrend', '{"code":"const aggregatedData = {};\nconst order = [];\n\nconst filteredData = variables.chartFocusParameters\n  ? queries.trendAnalysis.data.filter(\n      (row) => row.entity == variables.chartFocusParameters.filterEntity\n    )\n  : queries.trendAnalysis.data;\n\nfilteredData.forEach((item) => {\n  const entity = item.entity;\n  const monthYear = item.month_year;\n  const totalReviews = item.total_reviews;\n  const positiveReviews = item.positive_reviews;\n\n  if (!aggregatedData[entity]) {\n    aggregatedData[entity] = {\n      x: [],\n      y: [],\n      type: \"scatter\",\n      hovertemplate: [],\n      name: entity,\n      showlegend: components.dropdown11.value,\n      mode: \"lines+markers\",\n    };\n    order.push(entity);\n  }\n\n  if (!aggregatedData[entity].x.includes(monthYear)) {\n    aggregatedData[entity].x.push(monthYear);\n    aggregatedData[entity].y.push((positiveReviews / totalReviews) * 100 || 0);\n    aggregatedData[entity].hovertemplate.push(\n      `Date: <b>${monthYear}</b><br>Total count of Opinions: <b>${totalReviews}</b><br>Unique count of Positive Opinions: <b>${positiveReviews}</b><br>Positivity: <b>${(\n        (positiveReviews / totalReviews) * 100 || 0\n      ).toFixed(2)}%</b>`\n    );\n  } else {\n    const index = aggregatedData[entity].x.indexOf(monthYear);\n    aggregatedData[entity].y[index] = totalReviews;\n  }\n});\n\nconst outputJSON = order.map((entity) => aggregatedData[entity]);\n\nreturn { data: outputJSON };","parameters":[]}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('7731999e-d904-4d7d-9964-44e01356144d', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'timeTrendAnalysis', '{"code":"const aggregatedData = {};\nconst order = [];\n\nconst filteredData = variables.chartFocusParameters\n  ? queries.trendAnalysis.data.filter(\n      (row) => row.entity == variables.chartFocusParameters.filterEntity\n    )\n  : queries.trendAnalysis.data;\n\nfilteredData.forEach((item) => {\n  const entity = item.entity;\n  const monthYear = item.month_year;\n\n  if (!aggregatedData[entity]) {\n    aggregatedData[entity] = {\n      x: [],\n      y: [],\n      stackgroup: \"one\",\n      hovertemplate:\n        \"<b>Date:</b> %{x}<br><b>Unique count of reviews:</b> %{y}<br>\",\n      name: entity,\n      mode: \"none\",\n      showlegend: components.dropdown10.value,\n    };\n    order.push(entity);\n  }\n\n  if (!aggregatedData[entity].x.includes(monthYear)) {\n    aggregatedData[entity].x.push(monthYear);\n    aggregatedData[entity].y.push(item.total_reviews);\n  } else {\n    const index = aggregatedData[entity].x.indexOf(monthYear);\n    aggregatedData[entity].y[index] = item.total_reviews;\n  }\n});\n\nconst outputJSON = order.map((entity) => aggregatedData[entity]);\n\nreturn { data: outputJSON };","parameters":[]}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('4957b872-7d6d-4ac3-9492-337c365ddb3e', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'getAllChartsData', '{"code":"actions.runQuery(\"chartReviewDistribution\");\nactions.runQuery(\"chartSentimentDistribution\");\nactions.runQuery(\"positivityTrend\");\nactions.runQuery(\"timeTrendAnalysis\");","parameters":[]}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('9bee74ab-c227-44c8-81d7-776a44f66917', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'runQueriesAfterFilterLoad', '{"code":"if (\n  (variables?.filterDateAvailable ?? false) &&\n  (variables?.filterBrandAvailable ?? false) &&\n  (variables?.filterSourceAvailable ?? false) &&\n  (variables?.filterRoaAvailable ?? false) &&\n  (variables?.filterGenderAvailable ?? false)\n) {\n  if (variables?.filterBrandAvailable ?? false) {\n    queries.reviewDistribution.run();\n    queries.trendAnalysis.run();\n  }\n}","parameters":[]}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('ca533774-f995-414b-ae3b-f11ce52a4957', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'reviewDistribution', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":false,"query":"{{`SELECT\n    INITCAP(${ components.dropdown2.value }) AS entity,\n    SUM(\n        CASE\n            WHEN overall_sentiment = ''Positive'' THEN 1\n            ELSE 0\n        END\n    ) AS positive_reviews,\n    SUM(\n        CASE\n            WHEN overall_sentiment = ''Negative'' THEN 1\n            ELSE 0\n        END\n    ) AS negative_reviews,\n    SUM(\n        CASE\n            WHEN overall_sentiment = ''Neutral'' THEN 1\n            ELSE 0\n        END\n    ) AS neutral_reviews,\n    COUNT(*) AS total_reviews\nFROM\n    business_data\nWHERE\n    date_of_submission BETWEEN ''${moment(components.datepicker1.value, \"DD/MM/YYYY\").format(\"YYYY-MM-DD\")}''\n    AND ''${moment(components.datepicker2.value, \"DD/MM/YYYY\").format(\"YYYY-MM-DD\")}''\n    AND LOWER(brand) in (''${components.multiselect5.values.join(\"'', ''\")}'')\n    AND LOWER(source) in (''${components.multiselect6.values.join(\"'', ''\")}'')\n    AND LOWER(roa) in (''${components.multiselect7.values.join(\"'', ''\")}'')\n    AND LOWER(gender) in (''${components.multiselect8.values.join(\"'', ''\")}'')\nGROUP BY\n    ${ components.dropdown2.value }\nORDER BY\n    total_reviews ASC;`}}","runOnPageLoad":false}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('c4282cd4-66d4-4ad4-b74e-bd09c95c1758', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'filterDate', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT \n    TO_CHAR(MIN(date_of_submission), ''DD/MM/YYYY'') AS min_date, \n    TO_CHAR(MAX(date_of_submission), ''DD/MM/YYYY'') AS max_date \nFROM \n    business_data;","runOnPageLoad":true,"transformation":"return data[0];"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('64b9d8c1-8367-4554-b58f-b4673aa935ba', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'filterGender', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(gender) AS lower_entity,\n    INITCAP(gender) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('cd2af674-32de-4388-8ad7-1aa9f6125bf6', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'filterContextAspectGroup', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(context_aspect_group) AS lower_entity,\n    INITCAP(context_aspect_group) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('ee7916cc-a6ff-46be-aaa3-f105bee57a14', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'createTable', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":false,"query":"CREATE TABLE business_data(\n    brand text,\n    source text,\n    aspect text,\n    context_aspect_group text,\n    date_of_submission date,\n    gender text,\n    roa text,\n    overall_sentiment text\n);"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('fdb4d2c3-4f74-4b12-a9a0-2dd60dfba574', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'createDatabase', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":false,"query":"CREATE DATABASE business_analytics_database;"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('9e729484-1e6c-4f54-9dcd-bbbad1784480', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'filterRoa', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(roa) AS lower_entity,\n    INITCAP(roa) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('686fe311-ece6-4784-a7a6-c360f3bc3735', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'filterSource', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(source) AS lower_entity,\n    INITCAP(source) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('7733b726-9ee0-4b95-944f-ec53854652d4', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'filterAspect', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(aspect) AS aspect \nFROM business_data\nORDER BY aspect;","runOnPageLoad":true,"transformation":"const labels = data.map((row) => row.aspect.charAt(0).toUpperCase() + row.aspect.slice(1).toLowerCase());\nconst values = data.map((row) => row.aspect);\n\nreturn { labels, values };"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('958f7c43-4cb2-4b75-bd2a-1482eeb0f159', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'trendAnalysis', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":false,"query":"{{`WITH months AS (\n    SELECT\n        generate_series(\n            ''${moment(components.datepicker1.value, \"DD/MM/YYYY\").format(\"YYYY-MM-DD\")}'' :: date,\n            ''${moment(components.datepicker2.value, \"DD/MM/YYYY\").format(\"YYYY-MM-DD\")}'' :: date,\n            ''1 month'' :: interval\n        ) AS month\n),\nenitites AS (\n    SELECT\n        DISTINCT LOWER(${ components.dropdown2.value }) as ${ components.dropdown2.value }\n    FROM\n        business_data\n    WHERE\n        LOWER(${ components.dropdown2.value }) IN (''${(components.dropdown2.value == \"brand\" ? components.multiselect5.values : components.multiselect6.values).join(\"'', ''\")}'')\n)\nSELECT\n    TO_CHAR(m.month, ''Mon YY'') AS month_year,\n    INITCAP(LOWER(e.${ components.dropdown2.value })) AS entity,\n    COUNT(cd.${ components.dropdown2.value }) AS total_reviews,\n    COUNT(\n        CASE\n            WHEN cd.overall_sentiment = ''Positive'' THEN 1\n        END\n    ) AS positive_reviews\nFROM\n    months m\n    CROSS JOIN enitites e\n    LEFT JOIN business_data cd ON TO_CHAR(cd.date_of_submission, ''Mon YY'') = TO_CHAR(m.month, ''Mon YY'')\n    AND LOWER(cd.${ components.dropdown2.value }) = LOWER(e.${ components.dropdown2.value })\n    AND LOWER(cd.brand) in (''${components.multiselect5.values.join(\"'', ''\")}'')\n    AND LOWER(cd.source) in (''${components.multiselect6.values.join(\"'', ''\")}'')\n    AND LOWER(cd.roa) in (''${components.multiselect7.values.join(\"'', ''\")}'')\n    AND LOWER(cd.gender) in (''${components.multiselect8.values.join(\"'', ''\")}'')\nGROUP BY\n    TO_CHAR(m.month, ''Mon YY''),\n    LOWER(e.${ components.dropdown2.value })\nORDER BY\n    TO_DATE(TO_CHAR(m.month, ''Mon YY''), ''Mon YY''),\n    LOWER(e.${ components.dropdown2.value });`}}","transformation":"// write your code here\n// return value will be set as data and the original data will be available as rawData\nreturn data.filter(row => row.amount > 1000);"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('edf86b4f-66d7-44fb-977d-1d57294bf69c', 'a77220af-a4a8-4f3e-992d-10b624613ea9', 'filterBrand', '{"mode":"sql","transformationLanguage":"javascript","enableTransformation":true,"query":"SELECT DISTINCT LOWER(brand) AS lower_entity,\n    INITCAP(brand) AS initcap_entity\nFROM business_data\nORDER BY lower_entity;","runOnPageLoad":true,"transformation":"const labels = [];\nconst values = [];\ndata.forEach((row) => {\n  labels.push(row.initcap_entity);\n  values.push(row.lower_entity);\n});\n\nreturn { labels, values };"}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, 'd07fb2ab-a191-4a7b-941f-c676167044a6'),
	('a59d6f7c-4d9f-46a8-8753-4a1456602160', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'calculateMortgage', '{"code":"var amt =\n  components.numberinput1.value -\n  (components.numberinput2.value * components.numberinput1.value) / 100;\nvar apr = components.numberinput3.value / 1200;\nvar term = components.numberinput4.value * 12;\nvar payment = (\n  (amt * (apr * Math.pow(1 + apr, term))) /\n  (Math.pow(1 + apr, term) - 1)\n).toFixed(2);\nactions.setVariable(\"monthly\", payment);\nreturn payment;","hasParamSupport":true,"parameters":[],"runOnPageLoad":true}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL, '4241f003-5ce9-4ba2-ace8-d83068d460f2'),
	('1809c96a-2d6c-4c28-b80d-9c1534ecb4fb', '0ea1ab2d-f87c-4446-aeb5-aa709a6abc9c', 'calculateDate', '{"code":"var start = components.datepicker1.value;\nreturn (\n  \"30/\" +\n  (moment(start,''DD/MM/YYYY'').month() + 1) +\n  \"/\" +\n  (moment(start,''DD/MM/YYYY'').year() + Number(components.numberinput4.value))\n);","hasParamSupport":true,"parameters":[],"runOnPageLoad":true}', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL, '4241f003-5ce9-4ba2-ace8-d83068d460f2');

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
	('afdbdac5-ec26-493a-9697-328c7f567e2d', '125fb8c1-d338-475d-bffc-a9f3b85b7bb1', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5431, "encrypted": false}, "database": {"value": "postgres", "encrypted": false}, "password": {"encrypted": true, "credential_id": "83540e72-1562-4e47-b6ba-124d5fd5c161"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "connection_type": {"value": "manual", "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 11:45:11.207146', '2026-10-28 11:45:11.207146'),
	('627f92aa-60ec-408a-a9fd-d4023f01873b', 'fd4e685a-467c-4a2e-be99-a41dd546034b', '88fd0e2b-afb0-4a4f-912d-65bf2152712b', '{"host": {"value": "35.202.183.199", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "business_analytics_database", "encrypted": false}, "password": {"encrypted": true, "credential_id": "f3cdbded-6643-4002-9b8f-5ee747014552"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811'),
	('1b237521-6e25-4585-a726-73279e328c7f', 'fd4e685a-467c-4a2e-be99-a41dd546034b', '52108afe-1776-4dcf-875a-834661c64263', '{"host": {"value": "35.202.183.199", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "business_analytics_database", "encrypted": false}, "password": {"encrypted": true, "credential_id": "aca6f5a8-f144-4add-ad0a-8f050cb790ae"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811');
INSERT INTO public.data_source_version_options VALUES
	('22be3923-2160-4731-a1de-c8b964dc292e', 'fd4e685a-467c-4a2e-be99-a41dd546034b', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{"host": {"value": "35.202.183.199", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "business_analytics_database", "encrypted": false}, "password": {"encrypted": true, "credential_id": "927cf94d-5b19-4ffb-b2ec-b4cf23bf8f21"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811'),
	('2a1008b6-cebb-43df-b918-1ca889802b14', '2cdcde0c-a346-4812-a47e-2bb3346606c3', '49105c82-d28f-4a76-95c6-28101a0760f1', '{"host": {"value": "35.202.183.199", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "business_analytics_database", "encrypted": false}, "password": {"encrypted": true, "credential_id": "98d0549c-7282-45a6-9593-c3a53bdf1e23"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858'),
	('35488dcc-0df9-4c2b-8361-f90806c35725', '2cdcde0c-a346-4812-a47e-2bb3346606c3', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"host": {"value": "35.202.183.199", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "business_analytics_database", "encrypted": false}, "password": {"encrypted": true, "credential_id": "6871a771-f19b-462c-9de1-3a7f2e9b0afd"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858'),
	('914af05d-dd33-4394-bd0f-b3462b3c7405', '2cdcde0c-a346-4812-a47e-2bb3346606c3', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"host": {"value": "35.202.183.199", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "business_analytics_database", "encrypted": false}, "password": {"encrypted": true, "credential_id": "90f26bb7-c830-46d5-9634-7d000a048c5e"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858'),
	('810daa73-8072-4a03-a3d3-03fd75990e73', '1f918690-5da5-4f91-aa15-cf3475b6fcd7', '49105c82-d28f-4a76-95c6-28101a0760f1', '{"host": {"value": "35.202.183.199", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "business_analytics_database", "encrypted": false}, "password": {"encrypted": true, "credential_id": "9906d466-0e2c-49e0-b4df-8efae7968961"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858'),
	('6d25da34-546e-44cd-952e-530faa29752d', '1f918690-5da5-4f91-aa15-cf3475b6fcd7', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"host": {"value": "35.202.183.199", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "business_analytics_database", "encrypted": false}, "password": {"encrypted": true, "credential_id": "fdcfe00a-3018-48ce-8f02-3463319e02f3"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858'),
	('3cb1ca4a-4c9f-47c8-bc00-c3f5b221a4e2', '1f918690-5da5-4f91-aa15-cf3475b6fcd7', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"host": {"value": "35.202.183.199", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "business_analytics_database", "encrypted": false}, "password": {"encrypted": true, "credential_id": "ac26bb90-d403-4457-a1fe-e6f3817d4d99"}, "username": {"value": "postgres", "encrypted": false}, "ssl_enabled": {"value": false, "encrypted": false}, "ssl_certificate": {"value": "none", "encrypted": false}}', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858'),
	('e3c2cdca-6c49-4a5e-b365-4e9ebf1d9065', '857c1a9b-3e32-4559-9990-eb0d1d2a2299', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "analytics", "encrypted": false}, "password": {"encrypted": true, "credential_id": "b6953527-5b3b-4016-bdc6-b719261fd17c"}, "username": {"value": "analyst", "encrypted": false}}', '2026-10-28 21:03:29.849731', '2026-10-28 21:03:29.849731'),
	('3532e3f6-4844-4d02-a7b5-cae8fb6b302a', '857c1a9b-3e32-4559-9990-eb0d1d2a2299', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "analytics", "encrypted": false}, "password": {"encrypted": true, "credential_id": "111128ab-2b37-4506-819b-964f2d485cce"}, "username": {"value": "analyst", "encrypted": false}}', '2026-10-28 21:03:29.849731', '2026-10-28 21:03:29.849731'),
	('ff4cbb58-3ad7-4c97-bb2b-899782be0238', '857c1a9b-3e32-4559-9990-eb0d1d2a2299', '49105c82-d28f-4a76-95c6-28101a0760f1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "analytics", "encrypted": false}, "password": {"encrypted": true, "credential_id": "e2dc99e5-d6ec-43ad-8d0f-3f0415461f17"}, "username": {"value": "analyst", "encrypted": false}}', '2026-10-28 21:03:29.849731', '2026-10-28 21:03:29.849731'),
	('613eb38e-bde6-4c19-ae53-8374f99b354f', '06fd93cf-45be-4ae8-b2f2-1b0dcb53f004', '1070416b-edb6-4b4d-bd77-84027ee86ca2', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "analytics", "encrypted": false}, "password": {"encrypted": true, "credential_id": "6b508d70-763b-48f5-afd3-bd0723e4ff39"}, "username": {"value": "analyst", "encrypted": false}}', '2026-10-28 21:03:29.996051', '2026-10-28 21:03:29.996051'),
	('7a817d58-3dac-4ac8-be35-66a11e38c8c7', '06fd93cf-45be-4ae8-b2f2-1b0dcb53f004', '8ba17658-22fc-48d7-a315-0450a232c2a1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "analytics", "encrypted": false}, "password": {"encrypted": true, "credential_id": "cc15a947-1201-4a91-8665-615c04333791"}, "username": {"value": "analyst", "encrypted": false}}', '2026-10-28 21:03:29.996051', '2026-10-28 21:03:29.996051'),
	('372ffc9a-c457-4175-8c89-656b165082d7', '06fd93cf-45be-4ae8-b2f2-1b0dcb53f004', '49105c82-d28f-4a76-95c6-28101a0760f1', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "analytics", "encrypted": false}, "password": {"encrypted": true, "credential_id": "0503ec53-b415-4bbf-a8bf-3f12bf72b39a"}, "username": {"value": "analyst", "encrypted": false}}', '2026-10-28 21:03:29.996051', '2026-10-28 21:03:29.996051'),
	('40ebfb6b-ab71-400d-a78f-3d10e225969f', 'e482040a-8eef-4bdf-abf5-0ce625b84d9b', '52108afe-1776-4dcf-875a-834661c64263', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "analytics", "encrypted": false}, "password": {"encrypted": true, "credential_id": "9d257e8f-5cfe-4337-a8ac-ca3932e428ea"}, "username": {"value": "analyst", "encrypted": false}}', '2026-10-28 21:03:30.138794', '2026-10-29 02:33:30.154'),
	('c6cd2df1-8b04-46e2-93d9-256d38f15b1d', 'e482040a-8eef-4bdf-abf5-0ce625b84d9b', '6ffa73fc-57f9-4384-9132-e6e261ef8cf0', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "analytics", "encrypted": false}, "password": {"encrypted": true, "credential_id": "ef6fa6f5-203a-4f78-bb88-e30eba687949"}, "username": {"value": "analyst", "encrypted": false}}', '2026-10-28 21:03:30.138794', '2026-10-29 02:33:30.155'),
	('ceb11057-06d5-4ffb-bb62-796506d70987', 'e482040a-8eef-4bdf-abf5-0ce625b84d9b', '88fd0e2b-afb0-4a4f-912d-65bf2152712b', '{"host": {"value": "localhost", "encrypted": false}, "port": {"value": 5432, "encrypted": false}, "database": {"value": "analytics", "encrypted": false}, "password": {"encrypted": true, "credential_id": "7bc0482d-cf99-494d-93f8-df893e97c1d7"}, "username": {"value": "analyst", "encrypted": false}}', '2026-10-28 21:03:30.138794', '2026-10-29 02:33:30.155');

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
	('125fb8c1-d338-475d-bffc-a9f3b85b7bb1', '9867e0d2-4260-469f-a184-eefae5ca3174', 'fac8faad-13f4-4c33-9f62-1e830bcf8c05', false, 'pg_giton', true, NULL, '31b785c9-8f44-4954-aaac-f60c4cd25148', NULL, '2026-10-28 11:45:11.207146', '2026-10-28 11:45:11.207146'),
	('fd4e685a-467c-4a2e-be99-a41dd546034b', '9d80565e-8bce-4e80-a6e4-2ffbe328486f', NULL, true, 'business_analytics', true, NULL, NULL, NULL, '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811'),
	('2cdcde0c-a346-4812-a47e-2bb3346606c3', 'a77220af-a4a8-4f3e-992d-10b624613ea9', NULL, true, 'business_analytics', true, NULL, NULL, NULL, '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858'),
	('1f918690-5da5-4f91-aa15-cf3475b6fcd7', 'a77220af-a4a8-4f3e-992d-10b624613ea9', NULL, false, 'business_analytics', true, NULL, '31b785c9-8f44-4954-aaac-f60c4cd25148', NULL, '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858'),
	('857c1a9b-3e32-4559-9990-eb0d1d2a2299', 'a235d2d6-3503-409a-8e86-dc856796fa70', NULL, false, 'Business_Analytics_2', true, NULL, '5b0b484a-ed07-4d19-b6f9-e3903783e141', NULL, '2026-10-28 21:03:29.849731', '2026-10-28 21:03:29.849731'),
	('e482040a-8eef-4bdf-abf5-0ce625b84d9b', 'b4843336-c826-4dab-9110-26133683a92c', NULL, true, 'Business_Analytics_2', true, NULL, NULL, NULL, '2026-10-28 21:03:30.138794', '2026-10-28 21:03:30.138794'),
	('06fd93cf-45be-4ae8-b2f2-1b0dcb53f004', '80a25e04-5bd9-40b8-99c8-da0c996a687c', NULL, false, 'scratch_feature', false, NULL, '5b0b484a-ed07-4d19-b6f9-e3903783e141', NULL, '2026-10-28 21:03:29.996051', '2026-10-29 02:33:36.512');

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
	('87918ee2-c38e-4ed3-8494-38ed82420eb1', 'pg_feature', 'postgresql', '2026-10-28 17:15:11.125', '2026-10-28 11:45:11.126565', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'default', 'global', '87918ee2-c38e-4ed3-8494-38ed82420eb1', false),
	('9d80565e-8bce-4e80-a6e4-2ffbe328486f', 'business_analytics', 'postgresql', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'default', 'global', '737a1edf-9ced-46a6-9f05-b747f371ce5e', false),
	('a77220af-a4a8-4f3e-992d-10b624613ea9', 'business_analytics', 'postgresql', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'default', 'global', '737a1edf-9ced-46a6-9f05-b747f371ce5e', false),
	('a235d2d6-3503-409a-8e86-dc856796fa70', 'Business_Analytics_2', 'postgresql', '2026-10-29 02:33:29.865', '2026-10-28 21:03:29.849731', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'default', 'global', 'a235d2d6-3503-409a-8e86-dc856796fa70', false),
	('80a25e04-5bd9-40b8-99c8-da0c996a687c', 'scratch_feature', 'postgresql', '2026-10-29 02:33:30.007', '2026-10-28 21:03:29.996051', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', 'default', 'global', '80a25e04-5bd9-40b8-99c8-da0c996a687c', false),
	('b4843336-c826-4dab-9110-26133683a92c', 'Business_Analytics_2', 'postgresql', '2026-10-29 02:33:30.149', '2026-10-28 21:03:30.138794', NULL, NULL, '7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'default', 'global', 'b4843336-c826-4dab-9110-26133683a92c', false);

INSERT INTO public.data_sources_group_permissions VALUES
	('e89bebc6-dbdb-41e7-845c-4108083ac39a', '92c27225-b008-4ff9-b444-aed976f9a2ef', true, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('c4222468-112d-4e6f-ad34-8f247f36b076', 'f35633a4-027e-43eb-9733-bb9acbc3a14f', true, false, '2026-10-28 11:45:09.442318', '2026-10-28 11:45:09.442318'),
	('192d069e-cf31-4a19-85c5-464aa6bdff7b', 'd548dea6-f782-45d2-b221-f33174e60678', true, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717'),
	('0afecf94-272a-44c9-8c3d-4a8b5c4d51f1', '020efa8b-dddb-4057-8cd1-e44d16593000', true, false, '2026-10-28 11:45:09.807717', '2026-10-28 11:45:09.807717');

INSERT INTO public.event_handlers VALUES
	('7fc83f44-d33c-4659-9f5e-f81e12d913e0', 'onClick', 0, '{"eventId": "onClick", "message": "Hello world!", "queryId": "43afa479-a52f-441d-b03c-664af8d52cec", "actionId": "run-query", "alertType": "info", "queryName": "runjs1", "parameters": {}}', 'fff4b014-35d3-4770-8ddf-b8959b8c9f95', 'a218e735-7319-4f7f-bd8e-b9b10f3e8593', 'component', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', '7fe01341-7165-4890-86a6-604069e35388'),
	('5888633f-312d-4206-abf6-700e2a6c7e3b', 'onClick', 0, '{"eventId": "onClick", "message": "Hello world!", "actionId": "copy-to-clipboard", "alertType": "info", "contentToCopy": "{{queries.43afa479-a52f-441d-b03c-664af8d52cec.data}}"}', 'fff4b014-35d3-4770-8ddf-b8959b8c9f95', '7fe03c6b-e07f-4e92-9f50-d24a8445e5b0', 'component', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', '1ae88eca-7be0-4a66-ad6f-9de12b8619a6'),
	('7f23fce0-d8be-4c5f-bd84-688402a6580d', 'onClick', 0, '{"eventId": "onClick", "message": "Hello world!", "actionId": "copy-to-clipboard", "alertType": "info", "contentToCopy": "{{queries.a0deb579-2ee1-4142-986b-163bd30008df.data}}"}', 'e884ec80-102a-44b3-8efe-fe7f1c6dcb6b', '233632b5-9a87-4be7-a534-271a251f84ad', 'component', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('d33c6f47-0c25-4898-be27-db47b293e9c3', 'onClick', 0, '{"eventId": "onClick", "message": "Hello world!", "queryId": "a0deb579-2ee1-4142-986b-163bd30008df", "actionId": "run-query", "alertType": "info", "queryName": "runjs1", "parameters": {}}', 'e884ec80-102a-44b3-8efe-fe7f1c6dcb6b', '5049b751-adce-4dec-a4ce-026b88f303f9', 'component', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', NULL),
	('4731715e-cb6b-4403-9d58-6840934bd644', 'onClick', 0, '{"eventId": "onClick", "message": "Hello world!", "actionId": "copy-to-clipboard", "alertType": "info", "contentToCopy": "{{queries.ba45e493-01d3-4736-b954-58c428c2fe35.data}}"}', '873cf9ba-539a-4b5c-857b-6480f42077be', '844ac739-7ebc-4972-8b40-e065a951100d', 'component', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('0b94a1ac-5388-4889-b847-5a6429029e44', 'onClick', 0, '{"eventId": "onClick", "message": "Hello world!", "queryId": "ba45e493-01d3-4736-b954-58c428c2fe35", "actionId": "run-query", "alertType": "info", "queryName": "runjs1", "parameters": {}}', '873cf9ba-539a-4b5c-857b-6480f42077be', 'c3d98b65-efb6-4f1b-bc7d-606bd9dd29b2', 'component', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', NULL),
	('296f35c0-f9ed-4a7b-bb36-f382b769214e', 'onClick', 0, '{"key": "chartFocusParameters", "value": "{{variables.chartFocusParameters ? undefined : ({filterEntity: components.chart1.clickedDataPoint.yAxisLabel})}}", "eventId": "onClick", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "success", "runOnlyIf": ""}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '1d643ac9-3a62-46c6-9275-5abef1cdb784', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '138c235e-18bf-4a5c-bbff-2c36b1f7652d'),
	('3650ddfd-b84a-40d4-a7fd-c1be67bdc2a2', 'onClick', 0, '{"key": "chartFocusParameters", "value": "{{variables.chartFocusParameters ? undefined : ({filterEntity: components.chart4.clickedDataPoint.dataSeriesName})}}", "eventId": "onClick", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '8dda9778-8182-4779-bc67-1353cde765dc', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '2f9b168b-5a8b-4560-a8a3-550b17c09c1f'),
	('ed30763f-0baa-4a62-a85b-c3155d1a23e2', 'onClick', 0, '{"key": "chartFocusParameters", "eventId": "onClick", "message": "Hello world!", "actionId": "unset-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '8da9f414-d5a3-429b-be68-e11079bb5a27', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '74c68b53-aa7a-4738-9430-82cd370fef4f'),
	('d426a6e7-e299-439d-9682-831f801629eb', 'onClick', 0, '{"key": "chartFocusParameters", "value": "{{variables.chartFocusParameters ? undefined : ({filterEntity: components.chart2.clickedDataPoint.yAxisLabel})}}", "eventId": "onClick", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', 'dc258185-6be3-469b-ac0a-9b5f63708f34', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '5b972983-1cea-4c43-9ba6-804fc5fb5d3c'),
	('a39dcf30-1c3d-4a0d-93d3-aa3de34bf55f', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "376ca8b4-f340-4363-92ba-792a16fcc60a", "actionId": "run-query", "alertType": "info", "queryName": "getAllChartsData", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '1d643ac9-3a62-46c6-9275-5abef1cdb784', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '4ecf3a1d-c422-4ee9-ad4c-5142b727baf0'),
	('833905cc-f455-44dc-a544-3d45d3453758', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "376ca8b4-f340-4363-92ba-792a16fcc60a", "actionId": "run-query", "alertType": "info", "queryName": "getAllChartsData", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '8dda9778-8182-4779-bc67-1353cde765dc', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'd7458bd3-2838-461b-ba1b-9f2f78a6e067'),
	('14a65d69-85fa-4073-ad6e-55e61d4fbb86', 'onSelect', 0, '{"eventId": "onSelect", "message": "Hello world!", "queryId": "6dfbbbad-ecce-4428-a51e-2598985ef36d", "actionId": "run-query", "alertType": "info", "queryName": "timeTrendAnalysis", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', 'a3c12766-f3bf-465a-92d6-4b1fbb3992e7', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '31d79406-f4e7-426a-96a6-b412a59a3da4'),
	('33d6a29a-d755-4430-a582-8d634cb4c003', 'onSelect', 0, '{"eventId": "onSelect", "message": "Hello world!", "queryId": "98508cad-f39a-4876-88a6-4f14581b229a", "actionId": "run-query", "alertType": "info", "queryName": "positivityTrend", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '8015c0b7-a83b-4316-bb38-377e333d0700', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'b26b5633-6761-4cac-82c1-d7ed0c8a3491'),
	('438f8a5c-fb30-4067-87fb-f8d514312964', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "3d86427c-357d-49da-8dd4-6a6ab74791eb", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '8da9f414-d5a3-429b-be68-e11079bb5a27', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'a177ec3f-e39c-4632-97ad-67d1000f09b1'),
	('ac38f3c1-c3bd-44b8-a7e0-40c5c457a18c', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "376ca8b4-f340-4363-92ba-792a16fcc60a", "actionId": "run-query", "alertType": "info", "queryName": "getAllChartsData", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', 'dc258185-6be3-469b-ac0a-9b5f63708f34', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'f3328bb5-6f36-4a0a-ac41-322beace8b77'),
	('10b80339-4ab0-4a95-9acf-09880a5f11bf', 'onDataQuerySuccess', 0, '{"key": "filterAspectAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '7733b726-9ee0-4b95-944f-ec53854652d4', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '70092a0f-e569-4c4c-a144-9fa121ead158'),
	('91f4b085-c023-4f41-9028-54d1b12e1faa', 'onDataQuerySuccess', 0, '{"key": "filterBrandAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'edf86b4f-66d7-44fb-977d-1d57294bf69c', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'a738a32c-1894-4387-b1ca-fb3594ccf50f'),
	('25bf4ba8-d40a-47a9-b805-39df78fc86ed', 'onClick', 0, '{"key": "chartFocusParameters", "value": "{{variables.chartFocusParameters ? undefined : ({filterEntity: components.chart3.clickedDataPoint.dataSeriesName})}}", "eventId": "onClick", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '7d4c0839-a45d-4ce1-bc07-20d8abb20703', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '4f77651f-6439-40a4-92cc-f5b6cda0b65f'),
	('abfe3a65-7a4b-4913-8f0c-fa2d9db23c1f', 'onDataQuerySuccess', 0, '{"key": "filterDateAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '38dd4ad8-5e60-4ca6-a556-b683792ef955', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '1f08b3f3-1070-4cd4-9fdc-40857f899cd9'),
	('bb318f69-2a61-4024-aab4-7214600ea1af', 'onDataQuerySuccess', 0, '{"key": "filterGenderAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '26153db4-6175-4164-95b3-1e15e900d8de', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'd5f528d3-66b4-4fc1-9334-02543191f5db'),
	('7704e4c3-1b66-45d0-9065-6de59b5deda3', 'onDataQuerySuccess', 0, '{"key": "filterContextAspectGroupAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '0d80cb02-f4e7-4f54-99d5-f9e26bcb7472', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'd0501434-c4c2-4905-a91d-eeb50f2a3817'),
	('d555054f-d97f-444b-805a-ee577ab00223', 'onDataQuerySuccess', 0, '{"key": "filterRoaAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '644f8e01-5103-4a09-8897-21e98c0631b9', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '43b3a51c-2545-4b4c-b969-67ede7c24c7f'),
	('18b640c9-9d13-44a1-b629-42a1b2c0c01a', 'onDataQuerySuccess', 0, '{"key": "filterSourceAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '4454a3d8-816e-48cd-988f-0f7d2ba7680a', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'b651f18d-a8c8-4fef-bff1-b8a1e34e4466'),
	('0b7262ed-6e18-4ee7-bc05-2efd7dc1b011', 'onDataQuerySuccess', 0, '{"key": "filterAspectAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', 'ee402b36-5ed2-4c84-82aa-5a57926562c3', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '70092a0f-e569-4c4c-a144-9fa121ead158'),
	('9cef5377-b32d-42b8-81db-3c450a699675', 'onDataQuerySuccess', 0, '{"key": "filterBrandAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '7523d28c-8508-40e2-a5b2-36c31e36acb5', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'a738a32c-1894-4387-b1ca-fb3594ccf50f'),
	('6474e5d0-6168-4c52-9836-c66c6af4688e', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "376ca8b4-f340-4363-92ba-792a16fcc60a", "actionId": "run-query", "alertType": "info", "queryName": "getAllChartsData", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '7d4c0839-a45d-4ce1-bc07-20d8abb20703', 'component', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'd59fd216-b31d-43d6-bdfe-3cd3e53a0be8'),
	('9a788140-1a8c-4f40-8cd1-0ac2f9bd34f9', 'onDataQuerySuccess', 0, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "4be93b44-5beb-44b2-80dc-d607a2d72563", "actionId": "run-query", "alertType": "info", "queryName": "chartReviewDistribution", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '5ed60b36-065b-49a4-bab0-588072a3d77a', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '586a135a-93a4-4099-b20d-6cd91a20dd4a'),
	('0f1b2e4c-bcc2-4ac2-bf93-5c7db73b19ff', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "ad7b5f15-f116-460e-8f9f-fb93239855f7", "actionId": "run-query", "alertType": "info", "queryName": "chartSentimentDistribution", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '5ed60b36-065b-49a4-bab0-588072a3d77a', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '067e9dfc-cd9e-4f52-9202-d52cf6444331'),
	('a4b64e05-4ac6-43ab-9099-e9aab9ee037c', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "3d86427c-357d-49da-8dd4-6a6ab74791eb", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '38dd4ad8-5e60-4ca6-a556-b683792ef955', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '7191d4da-1f53-4987-985d-314ba4bb3477'),
	('6607ed18-8882-4984-b5f2-c51762baa628', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "3d86427c-357d-49da-8dd4-6a6ab74791eb", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '26153db4-6175-4164-95b3-1e15e900d8de', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'fe98a869-622c-4c25-806d-3f5f3850950a'),
	('161e09ac-451a-42bd-8378-6dd2f257d5da', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "3d86427c-357d-49da-8dd4-6a6ab74791eb", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '0d80cb02-f4e7-4f54-99d5-f9e26bcb7472', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '5d497843-4e7e-41fe-8a2b-77fc2e9b5a85'),
	('aed8d2b4-5f42-42e6-ac8f-7995240ea77c', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "3d86427c-357d-49da-8dd4-6a6ab74791eb", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '644f8e01-5103-4a09-8897-21e98c0631b9', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', 'ff31c04e-146b-4ad1-bb5c-cc0e8fd0b5f0'),
	('5d9f3361-92b1-490e-9674-1c67ea8db168', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "3d86427c-357d-49da-8dd4-6a6ab74791eb", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '4454a3d8-816e-48cd-988f-0f7d2ba7680a', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '64bcdab5-7039-4923-8d9b-6fac3716a71c'),
	('fc4d2843-8c3b-47ce-b57c-ab53a77c1fd1', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "3d86427c-357d-49da-8dd4-6a6ab74791eb", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', 'ee402b36-5ed2-4c84-82aa-5a57926562c3', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '07300903-b861-4025-9307-da2d75a627df'),
	('d34d8e72-214e-4b83-ae1f-8fab1732ef02', 'onDataQuerySuccess', 0, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "6dfbbbad-ecce-4428-a51e-2598985ef36d", "actionId": "run-query", "alertType": "info", "queryName": "timeTrendAnalysis", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '3b6ae18b-3e49-40d5-9525-225857dc11f9', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '165bfd5b-e7c5-4d3e-80b5-3230d4ffc9c4'),
	('89d69875-2b22-4891-a33c-9687f4a0086b', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "98508cad-f39a-4876-88a6-4f14581b229a", "actionId": "run-query", "alertType": "info", "queryName": "positivityTrend", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '3b6ae18b-3e49-40d5-9525-225857dc11f9', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '1f1ed15c-b718-4cc9-adac-18e3d541d564'),
	('0d64b676-2523-4dd7-badb-120633125568', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "3d86427c-357d-49da-8dd4-6a6ab74791eb", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', '308945c9-e540-41bc-80b6-4f0e677bcc1c', '7523d28c-8508-40e2-a5b2-36c31e36acb5', 'data_query', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', '5e602e6a-6460-48e2-93aa-fdb3ffb58f58'),
	('f72d0735-dbe3-4996-92cf-fad7964f04a8', 'onChange', 0, '{"eventId": "onChange", "message": "Hello world!", "queryId": "c0cfb42b-ff91-4623-b80f-0d4588f36087", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateMortgage", "parameters": {}}', 'a5207132-c550-457b-b50a-43118c84f573', 'b20f1f9f-454f-49b6-8007-3e9793aaf265', 'component', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', 'bacee16d-47b0-469b-8395-a6a89e77fe9c'),
	('955c640e-3e3a-4d6c-b4a6-530ff5737189', 'onChange', 0, '{"eventId": "onChange", "message": "Hello world!", "queryId": "c0cfb42b-ff91-4623-b80f-0d4588f36087", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateMortgage", "parameters": {}}', 'a5207132-c550-457b-b50a-43118c84f573', '7fd13393-1670-4f59-a8a0-82968c8c4e02', 'component', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', 'b3e553c3-0f72-47bf-82f3-21df6079d5b4'),
	('4ba628e4-7eee-4dfa-a645-31f8d676bb8f', 'onChange', 0, '{"eventId": "onChange", "message": "Hello world!", "queryId": "c0cfb42b-ff91-4623-b80f-0d4588f36087", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateMortgage", "parameters": {}}', 'a5207132-c550-457b-b50a-43118c84f573', 'afaac627-1282-4291-b12a-b31b74b72d5a', 'component', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', 'c8e79c24-b4d7-429e-859a-c4c40ede957e'),
	('80d8456d-3094-4f78-8fbf-00fb1c06d051', 'onChange', 0, '{"eventId": "onChange", "message": "Hello world!", "queryId": "c0cfb42b-ff91-4623-b80f-0d4588f36087", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateMortgage", "parameters": {}}', 'a5207132-c550-457b-b50a-43118c84f573', 'aaf03e33-4639-4763-890e-e3c5532a2df1', 'component', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', 'be95f92a-783e-4a62-9da2-f3383f28ae9b'),
	('5e7d568a-baf2-42f4-9756-1189c2173767', 'onSelect', 0, '{"eventId": "onSelect", "message": "Hello world!", "queryId": "0b711a33-36bd-4238-b365-7750df5bc2ac", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateDate", "parameters": {}}', 'a5207132-c550-457b-b50a-43118c84f573', '62dc51ac-32bd-4a9a-9f67-abed403c8d8e', 'component', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', '47fbe79c-eb92-4328-8898-34c763751def'),
	('8f6c462b-ad30-47d5-8394-f7eab7814e8d', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "4957b872-7d6d-4ac3-9492-337c365ddb3e", "actionId": "run-query", "alertType": "info", "queryName": "getAllChartsData", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '504f05c8-bff2-4f9b-97b2-b8a6c82c8d1e', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '4ecf3a1d-c422-4ee9-ad4c-5142b727baf0'),
	('25f5532a-a7e3-46cc-a98b-9c9afa08b866', 'onClick', 0, '{"key": "chartFocusParameters", "value": "{{variables.chartFocusParameters ? undefined : ({filterEntity: components.chart1.clickedDataPoint.yAxisLabel})}}", "eventId": "onClick", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "success", "runOnlyIf": ""}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '504f05c8-bff2-4f9b-97b2-b8a6c82c8d1e', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '138c235e-18bf-4a5c-bbff-2c36b1f7652d'),
	('ea35dfe9-7397-40b5-a1dd-f82b24de39cd', 'onClick', 0, '{"key": "chartFocusParameters", "value": "{{variables.chartFocusParameters ? undefined : ({filterEntity: components.chart4.clickedDataPoint.dataSeriesName})}}", "eventId": "onClick", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '94491e11-3a4a-4dbc-a893-82148b10fc55', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '2f9b168b-5a8b-4560-a8a3-550b17c09c1f'),
	('594e60da-fa54-4a2f-86d1-d1771e23a13c', 'onClick', 0, '{"key": "chartFocusParameters", "eventId": "onClick", "message": "Hello world!", "actionId": "unset-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '817817fe-3667-41a7-9c57-9e90c62a8f15', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '74c68b53-aa7a-4738-9430-82cd370fef4f'),
	('e1740405-f799-4982-a20a-47de518bb01e', 'onClick', 0, '{"key": "chartFocusParameters", "value": "{{variables.chartFocusParameters ? undefined : ({filterEntity: components.chart2.clickedDataPoint.yAxisLabel})}}", "eventId": "onClick", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'fdf036d1-96c3-44a3-adb1-1a75d0f129e8', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '5b972983-1cea-4c43-9ba6-804fc5fb5d3c'),
	('bcc5c207-7703-4187-b98d-1080ad1b8549', 'onClick', 0, '{"key": "chartFocusParameters", "value": "{{variables.chartFocusParameters ? undefined : ({filterEntity: components.chart3.clickedDataPoint.dataSeriesName})}}", "eventId": "onClick", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '337d4fc5-34de-41c9-86f8-c2dce775b51b', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '4f77651f-6439-40a4-92cc-f5b6cda0b65f'),
	('5985224e-b116-4a59-b5bf-cedf1440035a', 'onDataQuerySuccess', 0, '{"key": "filterDateAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'c4282cd4-66d4-4ad4-b74e-bd09c95c1758', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '1f08b3f3-1070-4cd4-9fdc-40857f899cd9');
INSERT INTO public.event_handlers VALUES
	('3b0b343a-d25f-470d-a453-4536dd44fa99', 'onDataQuerySuccess', 0, '{"key": "filterGenderAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '64b9d8c1-8367-4554-b58f-b4673aa935ba', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'd5f528d3-66b4-4fc1-9334-02543191f5db'),
	('ca0337ae-5af7-42c4-b2a3-372436f5e42a', 'onDataQuerySuccess', 0, '{"key": "filterContextAspectGroupAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'cd2af674-32de-4388-8ad7-1aa9f6125bf6', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'd0501434-c4c2-4905-a91d-eeb50f2a3817'),
	('1b5da033-84b4-4d04-bee6-e995487ca3b9', 'onDataQuerySuccess', 0, '{"key": "filterRoaAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '9e729484-1e6c-4f54-9dcd-bbbad1784480', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '43b3a51c-2545-4b4c-b969-67ede7c24c7f'),
	('d8edc0b1-8440-4f9a-9181-13c313ff0298', 'onDataQuerySuccess', 0, '{"key": "filterSourceAvailable", "value": "{{true}}", "eventId": "onDataQuerySuccess", "message": "Hello world!", "actionId": "set-custom-variable", "alertType": "info"}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '686fe311-ece6-4784-a7a6-c360f3bc3735', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'b651f18d-a8c8-4fef-bff1-b8a1e34e4466'),
	('9a22db7e-9a3f-4d38-bf22-5bd7f9ecf9cf', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "9bee74ab-c227-44c8-81d7-776a44f66917", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '686fe311-ece6-4784-a7a6-c360f3bc3735', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '64bcdab5-7039-4923-8d9b-6fac3716a71c'),
	('1cf251a4-2df5-430e-a2ab-98c3901eed83', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "9bee74ab-c227-44c8-81d7-776a44f66917", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '7733b726-9ee0-4b95-944f-ec53854652d4', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '07300903-b861-4025-9307-da2d75a627df'),
	('b45da3fc-6618-4dc1-8672-efcc4a24e822', 'onDataQuerySuccess', 0, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "7731999e-d904-4d7d-9964-44e01356144d", "actionId": "run-query", "alertType": "info", "queryName": "timeTrendAnalysis", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '958f7c43-4cb2-4b75-bd2a-1482eeb0f159', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '165bfd5b-e7c5-4d3e-80b5-3230d4ffc9c4'),
	('a133fabe-c7e1-462b-9037-a7dc50a227f9', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "9cfbae86-b3f6-43b5-a526-5a65a500c3d8", "actionId": "run-query", "alertType": "info", "queryName": "positivityTrend", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '958f7c43-4cb2-4b75-bd2a-1482eeb0f159', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '1f1ed15c-b718-4cc9-adac-18e3d541d564'),
	('fdc6e2f3-2c4f-497d-a716-dd5457cd4c96', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "4957b872-7d6d-4ac3-9492-337c365ddb3e", "actionId": "run-query", "alertType": "info", "queryName": "getAllChartsData", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '94491e11-3a4a-4dbc-a893-82148b10fc55', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'd7458bd3-2838-461b-ba1b-9f2f78a6e067'),
	('817fd123-d3c6-4a8d-8d51-8d4d684158f6', 'onSelect', 0, '{"eventId": "onSelect", "message": "Hello world!", "queryId": "7731999e-d904-4d7d-9964-44e01356144d", "actionId": "run-query", "alertType": "info", "queryName": "timeTrendAnalysis", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '4b8a3848-c489-4557-ada4-da58271d2efc', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '31d79406-f4e7-426a-96a6-b412a59a3da4'),
	('a0bd8808-3c78-46e6-a63b-98584226b892', 'onSelect', 0, '{"eventId": "onSelect", "message": "Hello world!", "queryId": "9cfbae86-b3f6-43b5-a526-5a65a500c3d8", "actionId": "run-query", "alertType": "info", "queryName": "positivityTrend", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'f5d26600-ed0d-4167-a995-e57cf92366a7', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'b26b5633-6761-4cac-82c1-d7ed0c8a3491'),
	('09b57459-19da-4591-bb0f-38105ef330cc', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "9bee74ab-c227-44c8-81d7-776a44f66917", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '817817fe-3667-41a7-9c57-9e90c62a8f15', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'a177ec3f-e39c-4632-97ad-67d1000f09b1'),
	('063cc111-c156-429d-8b5a-7eb809e6a80c', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "4957b872-7d6d-4ac3-9492-337c365ddb3e", "actionId": "run-query", "alertType": "info", "queryName": "getAllChartsData", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'fdf036d1-96c3-44a3-adb1-1a75d0f129e8', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'f3328bb5-6f36-4a0a-ac41-322beace8b77'),
	('297a1afe-1c4e-4f94-b988-b6a54a60470b', 'onClick', 1, '{"eventId": "onClick", "message": "Hello world!", "queryId": "4957b872-7d6d-4ac3-9492-337c365ddb3e", "actionId": "run-query", "alertType": "info", "queryName": "getAllChartsData", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '337d4fc5-34de-41c9-86f8-c2dce775b51b', 'component', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'd59fd216-b31d-43d6-bdfe-3cd3e53a0be8'),
	('0f61ad9d-d5f3-4ccf-a23b-88ec8dc0c1f3', 'onDataQuerySuccess', 0, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "5d80b083-afb7-47a5-8bc3-11209e18c664", "actionId": "run-query", "alertType": "info", "queryName": "chartReviewDistribution", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'ca533774-f995-414b-ae3b-f11ce52a4957', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '586a135a-93a4-4099-b20d-6cd91a20dd4a'),
	('87f9e8f6-8d08-4694-ba58-cd0da3f91826', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "f402a2c8-9570-404a-80e7-2488677a39e9", "actionId": "run-query", "alertType": "info", "queryName": "chartSentimentDistribution", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'ca533774-f995-414b-ae3b-f11ce52a4957', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '067e9dfc-cd9e-4f52-9202-d52cf6444331'),
	('fed23113-ae01-4a67-b015-ac1ee258f1e6', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "9bee74ab-c227-44c8-81d7-776a44f66917", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'c4282cd4-66d4-4ad4-b74e-bd09c95c1758', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '7191d4da-1f53-4987-985d-314ba4bb3477'),
	('76ca77c6-792f-45e8-9a4a-47e7369a1b17', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "9bee74ab-c227-44c8-81d7-776a44f66917", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '64b9d8c1-8367-4554-b58f-b4673aa935ba', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'fe98a869-622c-4c25-806d-3f5f3850950a'),
	('03a2d971-b027-4b3e-bb76-1a06ec43a42e', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "9bee74ab-c227-44c8-81d7-776a44f66917", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'cd2af674-32de-4388-8ad7-1aa9f6125bf6', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '5d497843-4e7e-41fe-8a2b-77fc2e9b5a85'),
	('15dbdf86-7037-4e7e-bcf2-14b3f53b4eb1', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "9bee74ab-c227-44c8-81d7-776a44f66917", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', '9e729484-1e6c-4f54-9dcd-bbbad1784480', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', 'ff31c04e-146b-4ad1-bb5c-cc0e8fd0b5f0'),
	('02578eda-07fb-4dab-a52f-e25d33897222', 'onDataQuerySuccess', 1, '{"eventId": "onDataQuerySuccess", "message": "Hello world!", "queryId": "9bee74ab-c227-44c8-81d7-776a44f66917", "actionId": "run-query", "alertType": "info", "queryName": "decideTabQueries", "parameters": {}}', 'd07fb2ab-a191-4a7b-941f-c676167044a6', 'edf86b4f-66d7-44fb-977d-1d57294bf69c', 'data_query', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', '5e602e6a-6460-48e2-93aa-fdb3ffb58f58'),
	('97926b40-190c-4cea-8405-cbd8ddb009e1', 'onChange', 0, '{"eventId": "onChange", "message": "Hello world!", "queryId": "a59d6f7c-4d9f-46a8-8753-4a1456602160", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateMortgage", "parameters": {}}', '4241f003-5ce9-4ba2-ace8-d83068d460f2', '06db0e76-6142-4d39-b134-baad091c6ef6', 'component', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('c4fc5b05-e7c6-4835-95d3-51489f7a8463', 'onChange', 0, '{"eventId": "onChange", "message": "Hello world!", "queryId": "a59d6f7c-4d9f-46a8-8753-4a1456602160", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateMortgage", "parameters": {}}', '4241f003-5ce9-4ba2-ace8-d83068d460f2', '88da8bc6-eb24-42a0-9184-3c37196a0f6e', 'component', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('5c036a7c-ce8c-4e6c-be18-189d40cf96ad', 'onChange', 0, '{"eventId": "onChange", "message": "Hello world!", "queryId": "a59d6f7c-4d9f-46a8-8753-4a1456602160", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateMortgage", "parameters": {}}', '4241f003-5ce9-4ba2-ace8-d83068d460f2', '58f2aea4-c595-4300-9411-a89d8752a509', 'component', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('88935f01-f920-4a3c-9081-73a18e8b2722', 'onChange', 0, '{"eventId": "onChange", "message": "Hello world!", "queryId": "a59d6f7c-4d9f-46a8-8753-4a1456602160", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateMortgage", "parameters": {}}', '4241f003-5ce9-4ba2-ace8-d83068d460f2', 'eed0d4ce-2834-45b3-9c6f-80b8a07033f4', 'component', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL),
	('2b222900-d44b-446b-b589-3b004220d0dd', 'onSelect', 0, '{"eventId": "onSelect", "message": "Hello world!", "queryId": "1809c96a-2d6c-4c28-b80d-9c1534ecb4fb", "actionId": "run-query", "debounce": "100", "alertType": "info", "queryName": "calculateDate", "parameters": {}}', '4241f003-5ce9-4ba2-ace8-d83068d460f2', '3a0d238d-1c1d-42e7-bb21-f1db8a1744eb', 'component', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', NULL);

INSERT INTO public.folder_apps VALUES
	('6b45e1bc-85a3-4aca-8a32-af45666c9cea', '225c1d1d-496d-4d3c-a133-2c65a7a293d3', '8dcf0e44-b815-4c8f-9047-0ed6af021a0e', '2026-10-28 11:45:10.131358', '2026-10-28 11:45:10.131358', NULL),
	('78d8de68-6cef-451e-8f1b-de1db9be8d91', '225c1d1d-496d-4d3c-a133-2c65a7a293d3', '7367e177-0da4-4f96-a526-a60cc9f1fc30', '2026-10-28 11:45:10.153792', '2026-10-28 11:45:10.153792', NULL),
	('773b85bd-c910-47f1-aa1a-b234b828dafa', 'a073905d-f908-41a2-9c70-e825b63c8e0b', '9b6eda5a-8748-4d54-8ba8-6a9031452f06', '2026-10-28 11:45:10.182507', '2026-10-28 11:45:10.182507', NULL),
	('7dab4a9b-3bd4-497d-a539-c8a5d28fa7c9', '8a837d19-110e-4073-a559-f93ee3fc3e81', 'cfeab0fe-4b83-49a4-8111-d945029c8404', '2026-10-28 11:45:10.693637', '2026-10-28 11:45:10.693637', NULL),
	('fa818c06-d1df-4076-9eb8-2113b0355c7b', '8a837d19-110e-4073-a559-f93ee3fc3e81', '7c0994c4-8198-48a2-91af-bb12a566a3a2', '2026-10-28 11:45:10.712331', '2026-10-28 11:45:10.712331', NULL),
	('aae39225-2f08-4317-ae0e-eee7d365c459', 'ca655e01-4944-4b1b-aee2-a311b76a2d7e', '2aabf571-7291-4b4b-922f-eee12fc6582a', '2026-10-28 11:45:10.737371', '2026-10-28 11:45:10.737371', NULL),
	('f290373c-0c8f-41bc-a528-583e4c072591', '225c1d1d-496d-4d3c-a133-2c65a7a293d3', 'daea9299-d98c-4e1a-8ee0-97231280fb06', '2026-10-28 21:03:17.672219', '2026-10-28 21:03:17.672219', NULL),
	('066925c8-868b-4f23-8d91-48ad6ed7163a', '225c1d1d-496d-4d3c-a133-2c65a7a293d3', '4159bde0-4315-4a9f-af7b-36e7382a8db1', '2026-10-28 21:03:17.672219', '2026-10-28 21:03:17.672219', NULL),
	('4ed8387a-d146-4a89-a8ae-cecc2df65bad', '8a837d19-110e-4073-a559-f93ee3fc3e81', 'b78b13d6-776e-4c12-a51d-ffd07d693b92', '2026-10-28 21:03:17.836963', '2026-10-28 21:03:17.836963', '31b785c9-8f44-4954-aaac-f60c4cd25148'),
	('b67ba23e-5a29-44d3-a6ef-fab0d76bf449', '8a837d19-110e-4073-a559-f93ee3fc3e81', 'f32540f6-fcf5-4fce-9228-03b63b988eb0', '2026-10-28 21:03:17.836963', '2026-10-28 21:03:17.836963', '31b785c9-8f44-4954-aaac-f60c4cd25148');

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
	('33cec37e-a200-4b8c-b278-589c94542ddc', 'SMTP_PASSWORD', '', '2026-10-28 11:40:47.208371', '2026-10-28 11:40:47.208371', 'Password', NULL, 'password', NULL, NULL, 'system'),
	('beb62a54-bbfb-4d19-a4a0-cb0d9f3c54a5', 'LICENSE_KEY', '', '2026-10-28 17:10:53.825', '2026-10-28 11:40:47.208371', 'License Key', 'header.organization.menus.manageSSO.generalSettings.licenseKey', 'text_area', NULL, NULL, 'system');

INSERT INTO public.layouts VALUES
	('9643a962-6746-4ccb-9997-2baf59305828', 'desktop', 50, 3, 38, 400, '5e86d904-e978-4b84-9860-ad43b933aa48', 'count', '2026-10-28 11:46:00.624723', NULL, NULL, NULL),
	('5b0b404e-2779-4dc6-8484-09ab75964cb4', 'mobile', 50, 3, 38, 400, '5e86d904-e978-4b84-9860-ad43b933aa48', 'count', '2026-10-28 11:46:00.624723', NULL, NULL, NULL),
	('490320e8-4d10-4d02-be37-767b67c15a6c', 'desktop', 50, 3, 38, 400, 'eef098e0-701b-48b8-bd1f-f61ce25c89a1', 'count', '2026-10-28 11:46:11.127757', NULL, NULL, NULL),
	('99daf9b0-656c-482b-93c1-57f4b68049cb', 'mobile', 50, 3, 38, 400, 'eef098e0-701b-48b8-bd1f-f61ce25c89a1', 'count', '2026-10-28 11:46:11.127757', NULL, NULL, NULL),
	('1e922be7-a68a-46be-8c61-2d171215612e', 'mobile', 40, 15, 6, 40, 'c409a9e0-c0d6-4903-920e-7ecb110d2413', 'count', '2026-10-28 21:01:48.723638', '0c1df350-90d3-4809-a3a7-ffc8ae31c5ee', NULL, NULL),
	('d064a789-9354-4319-93d7-df4d09446dcb', 'desktop', 20, 4, 13, 50, 'c409a9e0-c0d6-4903-920e-7ecb110d2413', 'count', '2026-10-28 21:01:48.723638', '236bb7e4-deee-415d-ba66-8483ea815dcc', NULL, NULL),
	('009e8b19-365a-4bf4-ac24-2d2ac618d785', 'mobile', 270, 27, 3, 30, 'a218e735-7319-4f7f-bd8e-b9b10f3e8593', 'count', '2026-10-28 21:01:48.723638', '0093b5af-6729-4b1e-87de-921f775a11da', NULL, NULL),
	('4cbddc1c-f824-4b59-bf6a-ff1879113ba6', 'desktop', 390, 16, 6, 40, 'a218e735-7319-4f7f-bd8e-b9b10f3e8593', 'count', '2026-10-28 21:01:48.723638', '90d3d579-88bd-4103-96aa-1cb875efd5f0', NULL, NULL),
	('614a2c66-4ec6-46aa-aee3-3d17ed9c575f', 'mobile', 270, 12, 8, 30, '185f5c38-0e53-449d-abcf-9a75de64cf3d', 'count', '2026-10-28 21:01:48.723638', '4d533e2c-74fc-44ab-8dcb-538ac50df347', NULL, NULL),
	('6106450e-f416-4fc1-a130-f8627ff9b752', 'desktop', 390, 4, 12, 40, '185f5c38-0e53-449d-abcf-9a75de64cf3d', 'count', '2026-10-28 21:01:48.723638', '27d6904d-f08b-4169-ba80-65e5e6c7fbcc', NULL, NULL),
	('781452d1-87ef-49cb-a42c-9da918a8d3ba', 'mobile', 300, 28, 3, 30, '7fe03c6b-e07f-4e92-9f50-d24a8445e5b0', 'count', '2026-10-28 21:01:48.723638', '13e4d499-4ffa-47b5-8bbc-9cce493bd297', NULL, NULL),
	('b91fc462-9eab-4aac-b982-43bb254f5a94', 'desktop', 470, 35, 4, 40, '7fe03c6b-e07f-4e92-9f50-d24a8445e5b0', 'count', '2026-10-28 21:01:48.723638', 'c5a3bf28-3338-4e1c-98ae-6bd289bb2688', NULL, NULL),
	('cddfa837-9a78-427c-9a5a-0fe4f1c2f75e', 'mobile', 0, 30, 6, 100, 'c26c51c3-2758-4b23-9575-ebd047ab3121', 'count', '2026-10-28 21:01:48.723638', 'ff76110f-1eb5-4277-a9dc-d9edb89a0fe2', NULL, NULL),
	('277c4522-c491-4ff9-ae14-0270198a0075', 'desktop', 130, 4, 35, 250, 'c26c51c3-2758-4b23-9575-ebd047ab3121', 'count', '2026-10-28 21:01:48.723638', '9aceb800-658d-4d32-8e37-5f888966f45e', NULL, NULL),
	('1aafa4c1-03fe-4610-895b-f8bb50c29972', 'mobile', 330, 12, 6, 100, '53521679-4025-4728-b2ca-155d4170f093', 'count', '2026-10-28 21:01:48.723638', 'cc05ba20-d09c-4e41-abf7-d34e7196709e', NULL, NULL),
	('60d07e3b-d180-450c-93da-64bab777543e', 'desktop', 510, 4, 35, 250, '53521679-4025-4728-b2ca-155d4170f093', 'count', '2026-10-28 21:01:48.723638', '5e7df204-8bd4-4d7a-9122-806a6e7d4da8', NULL, NULL),
	('deae6b5e-3036-43f5-918f-33c383223e54', 'mobile', 10, 6, 6, 40, '2d4753c8-3d3d-4ed1-96dc-65e282b7df6d', 'count', '2026-10-28 21:01:48.723638', '4a3ecf3d-37a5-4671-805a-7b7f00971b9c', NULL, NULL),
	('2ca545de-6833-427c-afea-17b020c7eed3', 'desktop', 90, 4, 6, 40, '2d4753c8-3d3d-4ed1-96dc-65e282b7df6d', 'count', '2026-10-28 21:01:48.723638', '98db300f-919f-4e24-86e1-0783bf2ab7fc', NULL, NULL),
	('3e4f1cbf-0e66-452e-a98b-cdee684edc93', 'mobile', 50, 6, 6, 40, 'ad0c8b8e-6239-4457-a58b-a4b3f9ec1855', 'count', '2026-10-28 21:01:48.723638', '2ef6ad5c-8e91-4588-962b-60dbd6688e84', NULL, NULL),
	('51d84fdd-efb1-42e2-9708-3032a8e04a4e', 'desktop', 470, 4, 6, 40, 'ad0c8b8e-6239-4457-a58b-a4b3f9ec1855', 'count', '2026-10-28 21:01:48.723638', '971f8943-f4cb-45b4-bc01-79c953666bb9', NULL, NULL),
	('9ca1a94e-dc1d-4510-b327-d7fcbfcd6200', 'mobile', 40, 15, 6, 40, 'f6f080c1-3e19-4d54-ac82-40316ae35ef5', 'count', '2026-10-28 21:02:19.182031', '0c1df350-90d3-4809-a3a7-ffc8ae31c5ee', NULL, NULL),
	('3dfa06c8-6226-42ef-8dab-4cf0583b528b', 'desktop', 20, 4, 13, 50, 'f6f080c1-3e19-4d54-ac82-40316ae35ef5', 'count', '2026-10-28 21:02:19.182031', '236bb7e4-deee-415d-ba66-8483ea815dcc', NULL, NULL),
	('d0dd1eed-192d-4d4b-819e-b06f7cf18548', 'mobile', 270, 12, 8, 30, '65eb0ead-046d-492b-b6c5-754bd65643c3', 'count', '2026-10-28 21:02:19.182031', '4d533e2c-74fc-44ab-8dcb-538ac50df347', NULL, NULL),
	('b6d13ca0-1fe7-4fd8-944e-691a1f8055b8', 'desktop', 390, 4, 12, 40, '65eb0ead-046d-492b-b6c5-754bd65643c3', 'count', '2026-10-28 21:02:19.182031', '27d6904d-f08b-4169-ba80-65e5e6c7fbcc', NULL, NULL),
	('1d3833cc-a49f-48d8-ad4f-1918ac5bf877', 'mobile', 300, 28, 3, 30, '233632b5-9a87-4be7-a534-271a251f84ad', 'count', '2026-10-28 21:02:19.182031', '13e4d499-4ffa-47b5-8bbc-9cce493bd297', NULL, NULL),
	('7892886c-b720-4278-ae25-04f2bf01104c', 'desktop', 470, 35, 4, 40, '233632b5-9a87-4be7-a534-271a251f84ad', 'count', '2026-10-28 21:02:19.182031', 'c5a3bf28-3338-4e1c-98ae-6bd289bb2688', NULL, NULL),
	('62646c73-54ed-4a82-a7e2-53bb999b9f66', 'mobile', 0, 30, 6, 100, '2b58d037-e525-4aaf-bb2f-abb45e9188cf', 'count', '2026-10-28 21:02:19.182031', 'ff76110f-1eb5-4277-a9dc-d9edb89a0fe2', NULL, NULL),
	('263bd061-f4a1-4a9c-819c-5b840ec7297e', 'desktop', 130, 4, 35, 250, '2b58d037-e525-4aaf-bb2f-abb45e9188cf', 'count', '2026-10-28 21:02:19.182031', '9aceb800-658d-4d32-8e37-5f888966f45e', NULL, NULL),
	('efd24f29-2dfe-4d09-87e6-3816dc2b055d', 'mobile', 10, 6, 6, 40, '3a2f8901-d820-4173-8b0f-48f482be8f79', 'count', '2026-10-28 21:02:19.182031', '4a3ecf3d-37a5-4671-805a-7b7f00971b9c', NULL, NULL),
	('aa5a94d0-d899-4054-9f75-bb40c77d9f2f', 'desktop', 90, 4, 6, 40, '3a2f8901-d820-4173-8b0f-48f482be8f79', 'count', '2026-10-28 21:02:19.182031', '98db300f-919f-4e24-86e1-0783bf2ab7fc', NULL, NULL),
	('5985315f-7ece-4199-b757-c989b318e9eb', 'mobile', 50, 6, 6, 40, '0aed45df-e2c5-411e-aaf4-4cd9c9d28d9f', 'count', '2026-10-28 21:02:19.182031', '2ef6ad5c-8e91-4588-962b-60dbd6688e84', NULL, NULL),
	('0d6ec866-28ac-4d73-96b3-9d9d43bf78e2', 'desktop', 470, 4, 6, 40, '0aed45df-e2c5-411e-aaf4-4cd9c9d28d9f', 'count', '2026-10-28 21:02:19.182031', '971f8943-f4cb-45b4-bc01-79c953666bb9', NULL, NULL),
	('7cceab77-fb00-4304-874a-d11300feca4a', 'mobile', 270, 27, 3, 30, '5049b751-adce-4dec-a4ce-026b88f303f9', 'count', '2026-10-28 21:02:19.182031', '0093b5af-6729-4b1e-87de-921f775a11da', NULL, NULL),
	('c1968c78-ce75-4d29-baf3-6788db4dc922', 'desktop', 390, 16, 6, 40, '5049b751-adce-4dec-a4ce-026b88f303f9', 'count', '2026-10-28 21:02:19.182031', '90d3d579-88bd-4103-96aa-1cb875efd5f0', NULL, NULL),
	('5aa70f17-8a19-4920-aefe-572d3701550a', 'mobile', 330, 12, 6, 100, '79fc270d-6b51-4b74-99a1-39f1f21d8644', 'count', '2026-10-28 21:02:19.182031', 'cc05ba20-d09c-4e41-abf7-d34e7196709e', NULL, NULL),
	('e54a994f-f12e-4ef5-977d-c31b6b123db9', 'desktop', 510, 4, 35, 250, '79fc270d-6b51-4b74-99a1-39f1f21d8644', 'count', '2026-10-28 21:02:19.182031', '5e7df204-8bd4-4d7a-9122-806a6e7d4da8', NULL, NULL),
	('f24715b5-b1df-4582-84dc-1d59ea9394df', 'mobile', 40, 15, 6, 40, '7821b2ae-f28b-4833-9e48-f68dd8fd267a', 'count', '2026-10-28 21:02:19.375956', '0c1df350-90d3-4809-a3a7-ffc8ae31c5ee', NULL, NULL),
	('5c4d718f-e6b7-4268-8836-74b3716e79c4', 'desktop', 20, 4, 13, 50, '7821b2ae-f28b-4833-9e48-f68dd8fd267a', 'count', '2026-10-28 21:02:19.375956', '236bb7e4-deee-415d-ba66-8483ea815dcc', NULL, NULL),
	('968ecca7-2247-42a0-b0c0-16ef6d0aa3c7', 'mobile', 270, 12, 8, 30, '7f274a6f-6f9e-4853-ac59-454fe88f0fee', 'count', '2026-10-28 21:02:19.375956', '4d533e2c-74fc-44ab-8dcb-538ac50df347', NULL, NULL),
	('9e95f4f2-ca1f-4c40-9279-b2a4c16fabf4', 'desktop', 390, 4, 12, 40, '7f274a6f-6f9e-4853-ac59-454fe88f0fee', 'count', '2026-10-28 21:02:19.375956', '27d6904d-f08b-4169-ba80-65e5e6c7fbcc', NULL, NULL),
	('250d61de-2448-4e04-bcfb-cf59aed4fb18', 'mobile', 300, 28, 3, 30, '844ac739-7ebc-4972-8b40-e065a951100d', 'count', '2026-10-28 21:02:19.375956', '13e4d499-4ffa-47b5-8bbc-9cce493bd297', NULL, NULL),
	('2b50e7da-e105-45c0-b4dc-b89c641c63f8', 'desktop', 470, 35, 4, 40, '844ac739-7ebc-4972-8b40-e065a951100d', 'count', '2026-10-28 21:02:19.375956', 'c5a3bf28-3338-4e1c-98ae-6bd289bb2688', NULL, NULL),
	('fd45fa34-8e97-4536-b432-58cf7c0caaf5', 'mobile', 0, 30, 6, 100, '1f076920-974e-4dc0-8dd5-06e02516b0f7', 'count', '2026-10-28 21:02:19.375956', 'ff76110f-1eb5-4277-a9dc-d9edb89a0fe2', NULL, NULL),
	('bb0c1a08-f936-40d3-a234-49f8930f91ce', 'desktop', 130, 4, 35, 250, '1f076920-974e-4dc0-8dd5-06e02516b0f7', 'count', '2026-10-28 21:02:19.375956', '9aceb800-658d-4d32-8e37-5f888966f45e', NULL, NULL),
	('8deb78f9-d38b-42da-8ec4-1f34077d9661', 'mobile', 10, 6, 6, 40, 'c8b0cc3e-0005-4a6d-8ec2-b2cf0f763d63', 'count', '2026-10-28 21:02:19.375956', '4a3ecf3d-37a5-4671-805a-7b7f00971b9c', NULL, NULL),
	('030ef464-7c98-4358-a252-add4d1b4f7f2', 'desktop', 90, 4, 6, 40, 'c8b0cc3e-0005-4a6d-8ec2-b2cf0f763d63', 'count', '2026-10-28 21:02:19.375956', '98db300f-919f-4e24-86e1-0783bf2ab7fc', NULL, NULL),
	('4d548b4a-6a2a-4244-a9bd-ba8adcce0311', 'mobile', 50, 6, 6, 40, '993d16fe-62c2-46f3-a483-5a79e859b862', 'count', '2026-10-28 21:02:19.375956', '2ef6ad5c-8e91-4588-962b-60dbd6688e84', NULL, NULL),
	('cab963f9-55ef-4a02-a00f-b25ce90895cb', 'desktop', 470, 4, 6, 40, '993d16fe-62c2-46f3-a483-5a79e859b862', 'count', '2026-10-28 21:02:19.375956', '971f8943-f4cb-45b4-bc01-79c953666bb9', NULL, NULL),
	('b8a0ef40-d059-4053-b6e7-91f7e491703d', 'mobile', 270, 27, 3, 30, 'c3d98b65-efb6-4f1b-bc7d-606bd9dd29b2', 'count', '2026-10-28 21:02:19.375956', '0093b5af-6729-4b1e-87de-921f775a11da', NULL, NULL),
	('6e48bfb4-bef7-4a4a-8376-674bea4983a5', 'desktop', 390, 16, 6, 40, 'c3d98b65-efb6-4f1b-bc7d-606bd9dd29b2', 'count', '2026-10-28 21:02:19.375956', '90d3d579-88bd-4103-96aa-1cb875efd5f0', NULL, NULL);
INSERT INTO public.layouts VALUES
	('b52ea9eb-fbca-4c59-ac97-e4121e4f940b', 'mobile', 330, 12, 6, 100, 'b2224ce8-243f-4409-ad8a-487beb985942', 'count', '2026-10-28 21:02:19.375956', 'cc05ba20-d09c-4e41-abf7-d34e7196709e', NULL, NULL),
	('a6bc253f-f1f1-4671-b0c9-b877a287c636', 'desktop', 510, 4, 35, 250, 'b2224ce8-243f-4409-ad8a-487beb985942', 'count', '2026-10-28 21:02:19.375956', '5e7df204-8bd4-4d7a-9122-806a6e7d4da8', NULL, NULL),
	('1113a3ac-e5f2-46d4-a6d2-d0e288ba62b2', 'mobile', 140, 19, 13.953488372093023, 40, '3f0309f5-6a33-4013-8295-9da3b2e6b544', 'count', '2026-10-28 21:02:19.537811', '09857c28-d01e-4967-b090-87672b0ecf8d', NULL, NULL),
	('fcae8cae-4b8b-4383-9adf-cde415ed5a57', 'desktop', 420, 3, 36, 30, '3f0309f5-6a33-4013-8295-9da3b2e6b544', 'count', '2026-10-28 21:02:19.537811', 'cb4e0a6e-1903-420b-88e6-37ed83b86e02', NULL, NULL),
	('2475e5f5-5fe7-4452-91d5-f695633b480b', 'mobile', 140, 19, 13.953488372093023, 40, '46205a92-fc61-4249-8d9d-856a0cb4bcad', 'count', '2026-10-28 21:02:19.537811', '203f1a9d-058c-427d-b9eb-fa586e63e203', NULL, NULL),
	('82f71585-d3a7-4eb3-a75c-af10c52df49a', 'desktop', 510, 3, 36, 30, '46205a92-fc61-4249-8d9d-856a0cb4bcad', 'count', '2026-10-28 21:02:19.537811', 'd3d9300a-920e-43e4-8501-69b9caed26c7', NULL, NULL),
	('3c8dfc9f-2339-4fab-b5bb-0e97c51525bb', 'mobile', 250, 4, 27.906976744186046, 30, 'c2cf531d-5d4b-4abc-9454-e40c1eee3f2f', 'count', '2026-10-28 21:02:19.537811', '2e228901-3eb4-4385-8f51-17671de138cc', NULL, NULL),
	('68042cdf-2519-4e2a-928c-3d1d45c72616', 'desktop', 540, 3, 36, 40, 'c2cf531d-5d4b-4abc-9454-e40c1eee3f2f', 'count', '2026-10-28 21:02:19.537811', 'f41b87da-92f1-4a86-bb0a-469d34476478', NULL, NULL),
	('22f8749e-9232-4097-8ce5-393447af59d1', 'mobile', 140, 19, 13.953488372093023, 40, '6d70cb3f-0b34-483c-88a8-304dd033cd6e', 'count', '2026-10-28 21:02:19.537811', '7a46cf9b-bb74-428c-a8af-2db1b06a3825', NULL, NULL),
	('ed0d352a-3b0a-4cd7-a24a-6212072ac029', 'desktop', 20, 3, 36, 30, '6d70cb3f-0b34-483c-88a8-304dd033cd6e', 'count', '2026-10-28 21:02:19.537811', '7e65c683-7f4f-4ee7-ad7a-f74b4fac6ee2', NULL, NULL),
	('1bf3b8d8-8d92-4916-9943-0bb324bf7c5d', 'mobile', 50, 10, 46.51162790697674, 400, '1d643ac9-3a62-46c6-9275-5abef1cdb784', 'count', '2026-10-28 21:02:19.537811', '93605755-ada4-480c-b252-12324adaf08b', NULL, NULL),
	('631615c4-bf60-4f55-9b4b-df6272fb9600', 'desktop', 60, 1, 20, 270, '1d643ac9-3a62-46c6-9275-5abef1cdb784', 'count', '2026-10-28 21:02:19.537811', '79dc501c-dd49-434f-96c6-6a09acdc855b', NULL, NULL),
	('cb23c314-18a2-4cbd-a58f-e9d84b7cea25', 'mobile', 50, 10, 46.51162790697674, 400, '8dda9778-8182-4779-bc67-1353cde765dc', 'count', '2026-10-28 21:02:19.537811', 'b0b7924e-8094-4f01-9e90-ec491f58be8f', NULL, NULL),
	('75ded503-3cd6-411f-b03e-55f016971548', 'desktop', 390, 22, 20, 270, '8dda9778-8182-4779-bc67-1353cde765dc', 'count', '2026-10-28 21:02:19.537811', '8c1b52bc-0257-4291-9499-27ef18ce79b0', NULL, NULL),
	('2172fb49-f99f-4897-92a5-821a4e1f56c7', 'mobile', 20, 12, 13.953488372093023, 40, '7865843f-abf5-479a-8d12-b672f8b0ca09', 'count', '2026-10-28 21:02:19.537811', '0d58444d-27cc-4163-a72f-19916256c9b2', NULL, NULL),
	('44dbe33a-3c52-42ce-8147-d5c8ce1cd703', 'desktop', 20, 1, 20, 40, '7865843f-abf5-479a-8d12-b672f8b0ca09', 'count', '2026-10-28 21:02:19.537811', '77632ec6-97be-4670-a2a5-5a497e5cb2a9', NULL, NULL),
	('70741578-1ab2-4eee-a359-fb0c88c3b5a2', 'mobile', 20, 12, 13.953488372093023, 40, 'c36cb784-4c2c-4835-9036-f90f2a070bab', 'count', '2026-10-28 21:02:19.537811', '93fa84c3-60dc-4c7d-bdcb-6a3f4c95fd83', NULL, NULL),
	('27453b16-a145-4fda-86a5-b605b6e69d0f', 'desktop', 20, 22, 20, 40, 'c36cb784-4c2c-4835-9036-f90f2a070bab', 'count', '2026-10-28 21:02:19.537811', '5320aac1-fbd5-4953-8bbc-a61e4e8a0dac', NULL, NULL),
	('a592c032-0dff-4628-9bc7-d9eee492f4e6', 'mobile', 20, 12, 13.953488372093023, 40, '80812fc6-55ad-429c-b43b-589f03463727', 'count', '2026-10-28 21:02:19.537811', '02e88023-f692-4c00-90e5-34f590094718', NULL, NULL),
	('845e5304-bbac-4489-8d67-4cdd17c770da', 'desktop', 350, 1, 14, 40, '80812fc6-55ad-429c-b43b-589f03463727', 'count', '2026-10-28 21:02:19.537811', '3f4a26ae-a6f8-4025-8270-2106dbd31de8', NULL, NULL),
	('3bc42272-1d5b-4512-9e33-0eed348da544', 'mobile', 20, 12, 13.953488372093023, 40, '0cea3da7-619b-4b34-93f2-98c755894e30', 'count', '2026-10-28 21:02:19.537811', 'f5bda9e0-2d6d-4f76-a730-7e75578e494a', NULL, NULL),
	('6176b041-0b73-47a5-9a92-7a18b42058fe', 'desktop', 350, 22, 14, 40, '0cea3da7-619b-4b34-93f2-98c755894e30', 'count', '2026-10-28 21:02:19.537811', '63fe8c30-fc51-440f-af8c-d80c0990ed0b', NULL, NULL),
	('6fab5e6f-3ce6-472c-9f05-a9aa171f0ef2', 'mobile', 360, 24, 18.6046511627907, 30, 'a3c12766-f3bf-465a-92d6-4b1fbb3992e7', 'count', '2026-10-28 21:02:19.537811', '9fa3eea1-1425-4942-80b1-5b00ca9881dc', NULL, NULL),
	('be8f983d-4729-426f-81ee-7ac6960359c1', 'desktop', 350, 15, 6, 40, 'a3c12766-f3bf-465a-92d6-4b1fbb3992e7', 'count', '2026-10-28 21:02:19.537811', '8e2a83f3-3b93-418a-9307-6e3bc5275ca7', NULL, NULL),
	('141cce30-ed79-472b-9f67-775ae0ba8857', 'mobile', 360, 24, 18.6046511627907, 30, '8015c0b7-a83b-4316-bb38-377e333d0700', 'count', '2026-10-28 21:02:19.537811', '8af925d3-739d-49f4-985a-ca7a18dbea53', NULL, NULL),
	('7f8736b1-f634-4673-a3e7-4c5756d9b851', 'desktop', 350, 36, 6, 40, '8015c0b7-a83b-4316-bb38-377e333d0700', 'count', '2026-10-28 21:02:19.537811', 'cb16276f-d941-4e81-9797-43592ba9ed42', NULL, NULL),
	('406211c8-4ec8-4409-92ec-553f077b5787', 'mobile', 590, 7, 6.976744186046512, 30, '8da9f414-d5a3-429b-be68-e11079bb5a27', 'count', '2026-10-28 21:02:19.537811', 'd7ebd8b2-90bb-4833-935b-736c2a20b85e', NULL, NULL),
	('56724b24-d28b-420e-914b-5e34575ff01e', 'desktop', 620, 3, 36, 40, '8da9f414-d5a3-429b-be68-e11079bb5a27', 'count', '2026-10-28 21:02:19.537811', 'dabda092-8c3e-4c74-94b3-9e283ae69ea8', NULL, NULL),
	('c1c8be8b-51e5-4b33-9771-8cc05ea57766', 'mobile', 190, 1, 11.627906976744185, 30, '721dbef9-5df3-4c06-a06c-f14e7f471f1a', 'count', '2026-10-28 21:02:19.537811', '359356ed-705a-4e1c-94b4-dd03436dd526', NULL, NULL),
	('9416e076-8622-4ea5-a9a9-8e08f445f579', 'desktop', 180, 3, 15, 40, '721dbef9-5df3-4c06-a06c-f14e7f471f1a', 'count', '2026-10-28 21:02:19.537811', 'dc58b551-d91a-4036-ad24-1fed92b47914', NULL, NULL),
	('43a6ef24-aff3-443a-bb2b-050939ca2d72', 'mobile', 180, 4, 11.627906976744185, 48, '3bfe4e29-c92d-49dd-bf84-a871d03732ec', 'count', '2026-10-28 21:02:19.537811', 'e02d9c2e-8018-4a96-8e10-a07eae586cd6', NULL, NULL),
	('44ed6747-22d8-4195-8ac1-1ab80fac2b34', 'desktop', 184, 18, 6, 30, '3bfe4e29-c92d-49dd-bf84-a871d03732ec', 'count', '2026-10-28 21:02:19.537811', 'e3206220-eda1-4fcc-9476-6a41287b0622', NULL, NULL),
	('114dd187-e37b-4d55-a444-b4089f44388c', 'mobile', 190, 1, 11.627906976744185, 30, '5c8561d5-7259-40bf-8e79-6e5bfae26d01', 'count', '2026-10-28 21:02:19.537811', 'cb82199a-66f1-4bab-8ba8-b3921479e1e6', NULL, NULL),
	('c9b813b7-ee35-471a-bd77-ed21672457fb', 'desktop', 180, 24, 15, 40, '5c8561d5-7259-40bf-8e79-6e5bfae26d01', 'count', '2026-10-28 21:02:19.537811', '7ec41aa1-d945-4817-b90c-903e391a75bd', NULL, NULL),
	('f406c997-fdf3-4ce7-a60c-99b0afb05503', 'mobile', 930, 2, 5, 200, 'f8281667-15e3-4eee-9459-b07a88d9651c', 'count', '2026-10-28 21:02:19.537811', 'a2d87179-17ed-459a-a3fe-5133632defd4', NULL, NULL),
	('b9531bbe-a5e8-4965-aa89-566a074644b2', 'desktop', 110, 1, 9, 690, 'f8281667-15e3-4eee-9459-b07a88d9651c', 'count', '2026-10-28 21:02:19.537811', '9f5d9745-e740-4746-9ea7-37d6ada5a6d6', NULL, NULL),
	('7a417fe2-ddb9-44d6-be6c-e24fc980f748', 'mobile', 920, 11, 5, 200, '50e5bc42-cdb0-4438-a628-89711718b2ed', 'count', '2026-10-28 21:02:19.537811', '4af8dcf9-f42c-4320-8edd-d75e63d04099', NULL, NULL),
	('471fe83a-3b1f-46d2-9158-d17b15be5d43', 'desktop', 110, 11, 31, 690, '50e5bc42-cdb0-4438-a628-89711718b2ed', 'count', '2026-10-28 21:02:19.537811', '55476cd4-90ba-4641-b69e-2c39061b50cd', NULL, NULL),
	('043bcc8b-258e-4cab-aabd-23c4e7abf2cc', 'desktop', 360, 3, 36, 40, '27eee977-8ca6-4183-9d82-00cf716b4700', 'count', '2026-10-28 21:02:19.537811', 'cb33bf0d-662a-4d07-9ef7-dbe2826deedf', NULL, NULL),
	('d2a70895-d256-434c-8129-2c1acadd6a9d', 'mobile', 250, 4, 27.906976744186046, 30, '27eee977-8ca6-4183-9d82-00cf716b4700', 'count', '2026-10-28 21:02:19.537811', '3e89a5c8-3a7d-4abd-8418-c04f96adb5ab', NULL, NULL),
	('ea708b47-1089-455a-a4aa-791870019540', 'desktop', 110, 3, 36, 20, '8ad681cc-0dd0-46d4-b081-bbdd277fcf5b', 'count', '2026-10-28 21:02:19.537811', '3ef5cd1e-604a-4082-a218-3b0b7d97761a', NULL, NULL),
	('d18d2631-bb9a-44ca-a547-c01db0365445', 'mobile', 100, 8, 13.953488372093023, 40, '8ad681cc-0dd0-46d4-b081-bbdd277fcf5b', 'count', '2026-10-28 21:02:19.537811', 'be3e6065-c1aa-46d2-9994-6a336d1d59f3', NULL, NULL),
	('53b789d0-6f1d-46f8-90e1-1fd7d2cc9216', 'desktop', 150, 3, 36, 30, '713d1377-5052-422b-833e-cbb73b3801cc', 'count', '2026-10-28 21:02:19.537811', 'bb324f49-6859-4d2c-9579-d4bf672d5318', NULL, NULL),
	('bc7824e1-6638-4f59-9815-83f638baf4cb', 'mobile', 140, 19, 13.953488372093023, 40, '713d1377-5052-422b-833e-cbb73b3801cc', 'count', '2026-10-28 21:02:19.537811', '88cbe38f-8f09-444d-b2aa-027271bfc81a', NULL, NULL),
	('ef76944f-3c3a-45ab-883d-91a1e1a0d9da', 'desktop', 240, 3, 36, 30, 'c404a062-febe-4897-b56a-ee0f6cfe5f1a', 'count', '2026-10-28 21:02:19.537811', '10534f81-4c0f-4feb-a9ef-cbd8c4a41eb3', NULL, NULL),
	('f8b18d64-c2fa-4d62-b17e-a0f4c5733a92', 'mobile', 140, 19, 13.953488372093023, 40, 'c404a062-febe-4897-b56a-ee0f6cfe5f1a', 'count', '2026-10-28 21:02:19.537811', 'bd98a8ec-7a29-40a8-8f0e-946aaefc8326', NULL, NULL),
	('31d045fd-ed44-413b-8605-9d8faf7bb485', 'desktop', 60, 22, 20, 270, 'dc258185-6be3-469b-ac0a-9b5f63708f34', 'count', '2026-10-28 21:02:19.537811', 'e9d1e2e9-3ab7-4a50-bad5-b3dbe17b5f7a', NULL, NULL),
	('d10e618f-a183-4d26-a780-efcb0bf65d34', 'mobile', 50, 10, 46.51162790697674, 400, 'dc258185-6be3-469b-ac0a-9b5f63708f34', 'count', '2026-10-28 21:02:19.537811', 'e8346b17-d80e-4a35-9fa7-4056477e276c', NULL, NULL),
	('c0d6f3cf-30af-452f-bdb3-8b49523e678d', 'mobile', 50, 10, 46.51162790697674, 400, '7d4c0839-a45d-4ce1-bc07-20d8abb20703', 'count', '2026-10-28 21:02:19.537811', 'dd224b6e-df2f-4f56-a39c-3a25222a2ed2', NULL, NULL),
	('11665712-59bd-403c-a9c1-842b6f514739', 'desktop', 390, 1, 20, 270, '7d4c0839-a45d-4ce1-bc07-20d8abb20703', 'count', '2026-10-28 21:02:19.537811', '9fa3f618-08f7-46f9-8933-b3aefb0ff516', NULL, NULL);
INSERT INTO public.layouts VALUES
	('0baf9a18-724e-47f8-878a-781ef1c81609', 'mobile', 140, 19, 13.953488372093023, 40, '0faaaf73-a68f-402f-914f-e957b6455569', 'count', '2026-10-28 21:02:19.537811', '2bdd431e-6db8-4bd2-b133-183204c34d6d', NULL, NULL),
	('d542cc15-0573-4771-999b-c881f8dc8a5c', 'desktop', 330, 3, 36, 30, '0faaaf73-a68f-402f-914f-e957b6455569', 'count', '2026-10-28 21:02:19.537811', '512e402c-d654-4571-b9aa-d9da5d908cb9', NULL, NULL),
	('bf3ef066-e4cb-4893-bfbf-3cfd578e906b', 'mobile', 250, 4, 27.906976744186046, 30, '57f8ed50-ce47-49d2-a240-c79dca2b6779', 'count', '2026-10-28 21:02:19.537811', 'b6cf70ac-da7d-49c5-ab14-a6d7ecd1fbdf', NULL, NULL),
	('41478775-a2ff-4946-858a-087061746833', 'desktop', 450, 3, 36, 40, '57f8ed50-ce47-49d2-a240-c79dca2b6779', 'count', '2026-10-28 21:02:19.537811', '1812d553-3204-47ea-b18a-be47a5b299a2', NULL, NULL),
	('6acc8cad-456d-466f-bb19-9afe9b20ec22', 'desktop', 50, 3, 36, 40, 'd2c1de92-6d51-40e3-a880-73af0d085350', 'count', '2026-10-28 21:02:19.537811', '801745bc-3469-49fa-bf81-98f5bd7cea50', NULL, NULL),
	('a4fae212-7513-40da-90ac-aef53dbf862e', 'mobile', 90, 8, 18.6046511627907, 30, 'd2c1de92-6d51-40e3-a880-73af0d085350', 'count', '2026-10-28 21:02:19.537811', '340b33d3-2b37-420a-adbc-e73041804ede', NULL, NULL),
	('83e9efcb-054c-4400-94a7-dd6dd8047454', 'mobile', 250, 4, 27.906976744186046, 30, 'df0ea429-942e-4d23-a31e-45e7476b52d4', 'count', '2026-10-28 21:02:19.537811', 'a95ed0db-53b7-4776-a5c6-cf2385bc8e4f', NULL, NULL),
	('1914a644-19e9-43fc-9ce6-b5ff316878e0', 'desktop', 270, 3, 36, 40, 'df0ea429-942e-4d23-a31e-45e7476b52d4', 'count', '2026-10-28 21:02:19.537811', 'cfd716d7-a904-4902-ae6f-a3b660ee9b5a', NULL, NULL),
	('6f1a1e58-3f34-4b2d-987b-19d7febdf48a', 'desktop', 20, 1, 41, 70, '2620fd9a-0583-4821-8d28-9d568786a1ab', 'count', '2026-10-28 21:02:19.537811', 'dcf85794-763c-4583-a619-0926ac7b9070', NULL, NULL),
	('3b7f615e-c4a6-4953-a057-9a19151ccda4', 'desktop', 10, 1, 6, 40, 'd754a9de-5b61-4529-9d6b-8b4d5c225682', 'count', '2026-10-28 21:02:19.537811', 'dc678ee7-eb03-4797-a219-f00760910197', NULL, NULL),
	('50615ce6-ff54-4545-bda9-1a0954174471', 'desktop', 10, 23, 19, 40, '5e1868d7-ed2c-42e0-9f25-95ad53c7785d', 'count', '2026-10-28 21:02:19.537811', '34d90506-a751-401c-8974-5a6e7e25b96d', NULL, NULL),
	('1626c6ff-e10a-49cd-a2bb-53dc86f77125', 'desktop', 10, 32, 10, 40, '5dfc584e-6b8a-40a8-8c3d-15d3a0134c0c', 'count', '2026-10-28 21:03:03.869244', 'fdbf7034-47ed-40d0-bbba-41bd05d35674', NULL, NULL),
	('23c0b7f1-289c-4db3-b467-f97393d5cb7c', 'desktop', 10, 1, 13, 40, '6f3cd944-201d-4eed-aa56-e90e8ecbf39d', 'count', '2026-10-28 21:03:03.869244', 'da7ab9ad-49f7-485e-abb6-eb9c7405c099', NULL, NULL),
	('e5668f66-43db-46de-80f7-96a42b574f75', 'desktop', 20, 1, 41, 70, '2294f9d3-1437-4282-b6ba-cef7b5d1c841', 'count', '2026-10-28 21:03:03.869244', 'ccf77d17-04ac-4db8-9a84-76328f25e981', NULL, NULL),
	('928abfa3-8d5f-4f76-b103-2ef5a50eca1d', 'desktop', 110, 1, 10, 470, '1a9b4c27-cdc7-45a2-acac-20932274c176', 'count', '2026-10-28 21:03:03.869244', 'd77dccfc-faf2-46ec-a663-fde49c42344c', NULL, NULL),
	('0107a702-d496-4509-bfc4-1db0c378954e', 'mobile', 100, 0, 5, 200, '1a9b4c27-cdc7-45a2-acac-20932274c176', 'count', '2026-10-28 21:03:03.869244', '5b4ede3a-4d28-4e8e-a85e-9252ca6502e4', NULL, NULL),
	('0f97a55e-fe78-475f-a668-c8eda3f70d2a', 'mobile', 10, 1, 13.953488372093023, 30, 'df931730-1c35-4304-aa38-7e6767017323', 'count', '2026-10-28 21:03:03.869244', '062697ba-6246-4291-9ceb-651880c109ad', NULL, NULL),
	('1a254069-1b98-4631-9957-7b2ef97cd4c6', 'desktop', 300, 3, 16.000000000000004, 40, 'df931730-1c35-4304-aa38-7e6767017323', 'count', '2026-10-28 21:03:03.869244', '5a7e12a4-2238-44d4-bebe-d1be03dd2d4b', NULL, NULL),
	('feea1f13-0874-49f4-953d-7f084a1ee279', 'mobile', 10, 18, 9.30232558139535, 30, 'b20f1f9f-454f-49b6-8007-3e9793aaf265', 'count', '2026-10-28 21:03:03.869244', 'd839422c-333d-479b-956d-7f2626bd5057', NULL, NULL),
	('c83fdd6c-692a-4a73-91f3-a0384c54263e', 'desktop', 90, 20, 19.000000000000004, 40, 'b20f1f9f-454f-49b6-8007-3e9793aaf265', 'count', '2026-10-28 21:03:03.869244', '7d2f757e-37fa-4237-907e-50f73abdbb6f', NULL, NULL),
	('1e0efca6-77b8-44ca-b5de-b9fe65f90a54', 'desktop', 90, 3, 16.000000000000004, 40, '0f12dce6-3278-4d0e-9052-573181c305fa', 'count', '2026-10-28 21:03:03.869244', '12a2d773-1dde-418b-aab4-f7f3f0b6a839', NULL, NULL),
	('d021da4a-cb9a-41cf-81c5-7ad39519302b', 'mobile', 10, 1, 13.953488372093023, 30, '0f12dce6-3278-4d0e-9052-573181c305fa', 'count', '2026-10-28 21:03:03.869244', 'a0caa252-65ce-41fb-bd9e-8c62a8645f6a', NULL, NULL),
	('52def295-b9e6-4d5a-9699-adf9454fd879', 'mobile', 10, 1, 13.953488372093023, 30, 'edf074d0-9280-4394-a2bc-c76a3edf3eaa', 'count', '2026-10-28 21:03:03.869244', '96142dd6-d471-40a7-86c2-f769b673d6a5', NULL, NULL),
	('fb8218a8-9e64-47ce-a2c6-dbd32bbc66a8', 'desktop', 160, 3, 16.000000000000004, 40, 'edf074d0-9280-4394-a2bc-c76a3edf3eaa', 'count', '2026-10-28 21:03:03.869244', '8d85b560-f79f-4149-81d7-2c5b7870fd92', NULL, NULL),
	('0da6bb7e-b53d-44f4-bef0-8cda19a62615', 'desktop', 230, 3, 16.000000000000004, 40, 'af284d16-9d13-41f3-9a62-4504036597f5', 'count', '2026-10-28 21:03:03.869244', '4033bbfb-a6bb-4a75-a9e1-f5c23a9d1485', NULL, NULL),
	('c9143e45-6a64-48c2-a1b7-e80cf0b0c344', 'mobile', 10, 1, 13.953488372093023, 30, 'af284d16-9d13-41f3-9a62-4504036597f5', 'count', '2026-10-28 21:03:03.869244', '2ab6f99f-2486-4bf2-b814-7a90b78d6ffb', NULL, NULL),
	('311aaf71-0851-4a51-b4aa-425e56f9bb8b', 'desktop', 370, 3, 16.000000000000004, 40, '71fb1669-c8bb-4d1e-a140-1b69dd5058dc', 'count', '2026-10-28 21:03:03.869244', '59ebbc10-8b12-4d60-a23c-2aa99a0daac8', NULL, NULL),
	('371424ee-0d85-474f-80b5-9932dbe30aaf', 'mobile', 10, 1, 13.953488372093023, 30, '71fb1669-c8bb-4d1e-a140-1b69dd5058dc', 'count', '2026-10-28 21:03:03.869244', 'cd9b769f-381c-4f0c-8524-76b97594be11', NULL, NULL),
	('42fa79df-70cc-4f39-8599-8daf81c9331b', 'desktop', 160, 20, 19.000000000000004, 40, '7fd13393-1670-4f59-a8a0-82968c8c4e02', 'count', '2026-10-28 21:03:03.869244', '511580c2-9bed-40d2-8068-908f9e3744cf', NULL, NULL),
	('5ef5b52f-2941-4e0b-ac26-c273ffa5180c', 'mobile', 70, 19, 9.30232558139535, 30, '7fd13393-1670-4f59-a8a0-82968c8c4e02', 'count', '2026-10-28 21:03:03.869244', '0b3236bb-2e5b-4883-ac1a-8e57856497c7', NULL, NULL),
	('6dc0ee04-3a4c-428d-9d12-8b29ad7c219e', 'mobile', 130, 20, 9.30232558139535, 30, 'afaac627-1282-4291-b12a-b31b74b72d5a', 'count', '2026-10-28 21:03:03.869244', '3c5e4d88-f128-4b98-bd27-18bb5de2b431', NULL, NULL),
	('227243fd-b4ac-4c67-85f8-b27a8ebc8891', 'desktop', 300, 20, 19.000000000000004, 40, 'afaac627-1282-4291-b12a-b31b74b72d5a', 'count', '2026-10-28 21:03:03.869244', '80f50b21-4178-490e-95e3-259a899d09ae', NULL, NULL),
	('fa1c6d74-14c8-42ee-9679-9e0822ab97a5', 'desktop', 230, 20, 19.000000000000004, 40, 'aaf03e33-4639-4763-890e-e3c5532a2df1', 'count', '2026-10-28 21:03:03.869244', '1813dcf4-822f-40a9-bfea-c5786d03aa6c', NULL, NULL),
	('189126c0-a0bd-452a-8a4e-ae629605d74b', 'mobile', 130, 20, 9.30232558139535, 30, 'aaf03e33-4639-4763-890e-e3c5532a2df1', 'count', '2026-10-28 21:03:03.869244', '3a1ea50a-58dc-4b36-a09c-098c0c3243e6', NULL, NULL),
	('e43fc335-6406-4f7f-a87f-3d30de14bcba', 'desktop', 370, 20, 19.000000000000004, 40, '62dc51ac-32bd-4a9a-9f67-abed403c8d8e', 'count', '2026-10-28 21:03:03.869244', '481d8e02-a7c7-4516-9f95-1c0d4755c0cd', NULL, NULL),
	('1041b461-a257-4c38-b45a-e12ce2083567', 'mobile', 240, 20, 11.627906976744185, 30, '62dc51ac-32bd-4a9a-9f67-abed403c8d8e', 'count', '2026-10-28 21:03:03.869244', '9893822f-f81d-400e-8ff2-082b8742db75', NULL, NULL),
	('240b0589-7fbc-4d28-abb0-b2e9002d4a21', 'desktop', 110, 12, 30, 470, 'f99d0c0b-a636-4787-8e8c-92300509fef3', 'count', '2026-10-28 21:03:03.869244', '1d223635-924e-47ae-a495-90138ddc0137', NULL, NULL),
	('4545a760-59a1-4c47-85b5-2ca6dfd0f21a', 'mobile', 620, 14, 5, 200, 'f99d0c0b-a636-4787-8e8c-92300509fef3', 'count', '2026-10-28 21:03:03.869244', '6da67bbf-95e7-4132-a752-3dc0ec6ba489', NULL, NULL),
	('02ba4e4c-c146-4bc5-87fa-f5db2074eefa', 'desktop', 10, 1, 40, 50, 'e124e468-fb3a-4762-98e2-493096fb5330', 'count', '2026-10-28 21:03:03.869244', 'ffed0d54-b9ba-4b6e-8d9f-71784e517dc4', NULL, NULL),
	('4ecb2538-13c6-4697-9b3a-0e918b81c1e1', 'mobile', 20, 8, 13.953488372093023, 30, 'e124e468-fb3a-4762-98e2-493096fb5330', 'count', '2026-10-28 21:03:03.869244', '765d5731-0724-40d8-bb7c-fae237b2d7b9', NULL, NULL),
	('8ec18a81-2c00-45f2-8e81-690f978b645f', 'desktop', 10, 3, 36.00000000000001, 50, '4b181557-d121-4959-8ebf-7f1a47e5495d', 'count', '2026-10-28 21:03:03.869244', '985f0d49-fa5e-435b-a922-fb372ea42e76', NULL, NULL),
	('c6596e56-17b4-4de9-93be-c142cbbe67c9', 'mobile', 10, 10, 13.953488372093023, 30, '4b181557-d121-4959-8ebf-7f1a47e5495d', 'count', '2026-10-28 21:03:03.869244', 'a51a445e-ea5e-4489-a6fe-1b10741a8bee', NULL, NULL),
	('a9955557-6bb0-4925-b934-451d7db1c331', 'desktop', 80, 1, 10, 40, 'f39fbeee-1095-4509-a4a5-128ab6658565', 'count', '2026-10-28 21:03:03.869244', 'c7b5449e-74f4-4e74-8c53-0d711f74fb62', NULL, NULL),
	('5b107251-b01b-4117-b68b-406f7841ca91', 'mobile', 20, 2, 13.953488372093023, 30, 'f39fbeee-1095-4509-a4a5-128ab6658565', 'count', '2026-10-28 21:03:03.869244', 'de04b06a-6520-450a-a616-050df8488fb4', NULL, NULL),
	('95f4d667-f0e6-4c5e-9a71-045c45ffc8ee', 'mobile', 0, 0, 20, 400, 'ff7e3411-8fb1-44ec-8a40-1bec3e0882ef', 'count', '2026-10-28 21:03:03.869244', '50bf0e94-39ee-48b9-b594-8857d3bcccfe', NULL, NULL),
	('e4444060-8498-4246-92d4-bcaf9a25f4c6', 'desktop', 130, 1, 17.999999999999996, 310, 'ff7e3411-8fb1-44ec-8a40-1bec3e0882ef', 'count', '2026-10-28 21:03:03.869244', 'd34a2abe-5c4b-4d90-9b4b-0fe810671305', NULL, NULL),
	('f0dd31b4-1f34-4322-8b2a-c9e3e66032da', 'desktop', 200, 26, 7, 40, 'fc8d92ce-2be7-44ef-9008-5215f026f012', 'count', '2026-10-28 21:03:03.869244', '44aa9f8f-a343-42fe-a2a5-c1cf177769c6', NULL, NULL),
	('bcbb388f-54d6-4dfa-bae1-c70e521df1ae', 'mobile', 10, 1, 13.953488372093023, 30, 'fc8d92ce-2be7-44ef-9008-5215f026f012', 'count', '2026-10-28 21:03:03.869244', 'c64ba418-5d14-4e90-b404-6bf8d2ac5cea', NULL, NULL),
	('f2c03897-c14a-4314-a794-274fdd148c01', 'desktop', 260, 26, 7, 40, '7fb2dc34-af34-404a-9cc8-f41c7e07a10b', 'count', '2026-10-28 21:03:03.869244', 'edd3c796-6aa1-4fa1-83cd-14934b24b4ad', NULL, NULL),
	('f53132b1-9c4b-4a30-afe0-891622e4970d', 'mobile', 10, 1, 13.953488372093023, 30, '7fb2dc34-af34-404a-9cc8-f41c7e07a10b', 'count', '2026-10-28 21:03:03.869244', '0ee9d0ee-fdeb-403c-b272-816e9967a433', NULL, NULL);
INSERT INTO public.layouts VALUES
	('fad2ef14-4042-46ee-968c-e66e320209fd', 'mobile', 10, 2, 13.953488372093023, 30, 'd92eb3b7-a9c6-4347-ae99-c9b2a2c8b7b8', 'count', '2026-10-28 21:03:03.869244', 'a1dbc95c-6193-4b34-8210-e46f737cc462', NULL, NULL),
	('fa2c2419-b19b-4308-aff6-9cb6c5a9ece2', 'desktop', 80, 26, 8.999999999999998, 40, 'd92eb3b7-a9c6-4347-ae99-c9b2a2c8b7b8', 'count', '2026-10-28 21:03:03.869244', '0a196926-1da6-42b2-aca3-00fd927632e1', NULL, NULL),
	('a25ebe66-9f93-430a-9041-218e13727a1f', 'mobile', 10, 1, 13.953488372093023, 30, '4a81f1c6-6a48-4d3c-9cad-1587268f991b', 'count', '2026-10-28 21:03:03.869244', 'c505d41b-ac06-458e-8d43-c1724325e036', NULL, NULL),
	('cb03b4c6-87b8-4914-9ed8-7d849e796f8f', 'desktop', 140, 26, 7, 40, '4a81f1c6-6a48-4d3c-9cad-1587268f991b', 'count', '2026-10-28 21:03:03.869244', '5a27f0ef-6e07-41d3-8a8c-80d99476f008', NULL, NULL),
	('6d304658-7e47-480a-befc-f419a8145b9b', 'mobile', 10, 1, 13.953488372093023, 30, '73bb99a0-f42c-495e-8cb9-6ed83135b197', 'count', '2026-10-28 21:03:03.869244', '50bd3e7f-f5b2-4cbe-a8bb-9a4c5cc6e432', NULL, NULL),
	('f555b5a5-5975-4c26-be30-dac09c4cc625', 'desktop', 320, 26, 7, 40, '73bb99a0-f42c-495e-8cb9-6ed83135b197', 'count', '2026-10-28 21:03:03.869244', '0e9aeeb7-d65c-4ebb-9ba4-df3b79dd6966', NULL, NULL),
	('40b53e30-ee89-4ad8-806e-34fa1542a1c1', 'mobile', 10, 1, 13.953488372093023, 30, '0a4e5bf2-3393-4a6d-8894-1ed93beb9859', 'count', '2026-10-28 21:03:03.869244', 'aa98db88-37e7-427f-9b8a-32630fe1058a', NULL, NULL),
	('52d04ce1-8fa5-40ec-8460-5d5f401907e2', 'desktop', 380, 26, 7, 40, '0a4e5bf2-3393-4a6d-8894-1ed93beb9859', 'count', '2026-10-28 21:03:03.869244', '96162594-9c45-4c94-88e7-89ca45d2bb4b', NULL, NULL),
	('e0ab907f-b692-4711-a66f-a358bcd6b89b', 'desktop', 80, 21, 3, 360, '11ab9b62-1a9e-43bf-8ce3-1aaf003ad84a', 'count', '2026-10-28 21:03:03.869244', '77fcd152-336d-4b64-b74e-e2cf3daeb889', NULL, NULL),
	('146f145a-028e-475f-a205-0d264a1f3a16', 'mobile', 90, 20, 4.651162790697675, 100, '11ab9b62-1a9e-43bf-8ce3-1aaf003ad84a', 'count', '2026-10-28 21:03:03.869244', '5060d943-8e68-4da8-b181-1c2eecd3b054', NULL, NULL),
	('5ed6799b-3a77-470a-8643-ca9e0fd9e57a', 'desktop', 140, 34, 8, 40, 'fad13554-9f9d-487c-9300-85f9e09d6e32', 'count', '2026-10-28 21:03:03.869244', '30cba4db-5828-44af-b321-600cd1dd0440', NULL, NULL),
	('f677f70c-453b-4e03-b3a1-07d2968e0f8c', 'mobile', 10, 1, 13.953488372093023, 30, 'fad13554-9f9d-487c-9300-85f9e09d6e32', 'count', '2026-10-28 21:03:03.869244', '0c72b9cc-dafe-438b-9239-79552abeaa19', NULL, NULL),
	('7d49d1b4-898b-4cfa-acc2-a17f08f66a0c', 'desktop', 200, 34, 8, 40, '4c2d404f-d8ab-489a-be52-fea608aec7e8', 'count', '2026-10-28 21:03:03.869244', '290551a8-7df7-4558-a903-c8d6905e8545', NULL, NULL),
	('1ce8adea-0298-4ae1-8603-b125df1ab048', 'mobile', 10, 1, 13.953488372093023, 30, '4c2d404f-d8ab-489a-be52-fea608aec7e8', 'count', '2026-10-28 21:03:03.869244', '48e1b2e5-82f9-43b3-8747-af4f2f1b549d', NULL, NULL),
	('46f33954-300f-4a31-b38a-d0938a03cdf6', 'desktop', 260, 34, 8, 40, '3edc8ad5-d863-4ef8-b2bb-ad744cf5529a', 'count', '2026-10-28 21:03:03.869244', '8c2df9a5-507f-43b1-a7f0-9b085a3ae868', NULL, NULL),
	('04544e1a-e5eb-45f2-ae7c-a560ba241b60', 'mobile', 10, 1, 13.953488372093023, 30, '3edc8ad5-d863-4ef8-b2bb-ad744cf5529a', 'count', '2026-10-28 21:03:03.869244', '2d7c51b7-5135-4ac3-babd-69fb3fb92f1b', NULL, NULL),
	('2f13cbcb-cacb-4863-a2c7-b9f73f06f41e', 'desktop', 320, 34, 8, 40, '27090b2f-8341-419a-9fa4-6ff3e3473c14', 'count', '2026-10-28 21:03:03.869244', '6d7694ad-138e-4ace-bf6a-5ac509ec9243', NULL, NULL),
	('9e7b173c-2845-46c6-a81e-77da71f27dc1', 'mobile', 10, 1, 13.953488372093023, 30, '27090b2f-8341-419a-9fa4-6ff3e3473c14', 'count', '2026-10-28 21:03:03.869244', '8f4d1c15-b5f1-4a57-b7e8-bdf05a941259', NULL, NULL),
	('580a7cee-c315-44d1-b83a-9aba6f4295de', 'desktop', 380, 34, 8, 40, 'c584c404-6cfc-4f5e-9d1f-da4470c12645', 'count', '2026-10-28 21:03:03.869244', 'b07b8adc-0bb3-4311-850c-e65c05cfd631', NULL, NULL),
	('2cf8e2b7-18e4-4b73-b9c4-eaf19165680f', 'mobile', 10, 1, 13.953488372093023, 30, 'c584c404-6cfc-4f5e-9d1f-da4470c12645', 'count', '2026-10-28 21:03:03.869244', 'a6bb5e03-6479-497a-bb31-8c8e8ae0b5cd', NULL, NULL),
	('25d9913e-6d71-4818-992a-4c34eefd58df', 'mobile', 140, 19, 13.953488372093023, 40, '69141026-c4bc-4892-8e71-a5862b46d1b1', 'count', '2026-10-28 21:03:04.078858', '09857c28-d01e-4967-b090-87672b0ecf8d', NULL, NULL),
	('bd3a13f8-f309-4eaf-be46-79a177ca9a36', 'desktop', 420, 3, 36, 30, '69141026-c4bc-4892-8e71-a5862b46d1b1', 'count', '2026-10-28 21:03:04.078858', 'cb4e0a6e-1903-420b-88e6-37ed83b86e02', NULL, NULL),
	('5becb296-83c4-47e1-84e1-887fa46b3f06', 'mobile', 140, 19, 13.953488372093023, 40, 'f0bb932c-889b-4aa4-b550-b19c0e3ed67f', 'count', '2026-10-28 21:03:04.078858', '203f1a9d-058c-427d-b9eb-fa586e63e203', NULL, NULL),
	('fbffbcc6-5375-493f-8acc-2eb6bf886a9f', 'desktop', 510, 3, 36, 30, 'f0bb932c-889b-4aa4-b550-b19c0e3ed67f', 'count', '2026-10-28 21:03:04.078858', 'd3d9300a-920e-43e4-8501-69b9caed26c7', NULL, NULL),
	('63de13c1-745a-4ffb-ab3d-5bdecd013315', 'mobile', 250, 4, 27.906976744186046, 30, '4b14440d-4739-4c49-8544-e5bad746c1e5', 'count', '2026-10-28 21:03:04.078858', '2e228901-3eb4-4385-8f51-17671de138cc', NULL, NULL),
	('b1eb2b5b-f440-4567-888f-2faeb00f332f', 'desktop', 540, 3, 36, 40, '4b14440d-4739-4c49-8544-e5bad746c1e5', 'count', '2026-10-28 21:03:04.078858', 'f41b87da-92f1-4a86-bb0a-469d34476478', NULL, NULL),
	('9da22fcb-6d67-4e44-a66a-f575a003f0ab', 'mobile', 140, 19, 13.953488372093023, 40, 'd77e7fb8-7add-4201-8f74-241998023590', 'count', '2026-10-28 21:03:04.078858', '7a46cf9b-bb74-428c-a8af-2db1b06a3825', NULL, NULL),
	('b750ac82-bf36-47d1-a867-b9a2da877530', 'desktop', 20, 3, 36, 30, 'd77e7fb8-7add-4201-8f74-241998023590', 'count', '2026-10-28 21:03:04.078858', '7e65c683-7f4f-4ee7-ad7a-f74b4fac6ee2', NULL, NULL),
	('5dc3388f-7a1c-484e-a40c-2f885b1e84c7', 'mobile', 50, 10, 46.51162790697674, 400, '504f05c8-bff2-4f9b-97b2-b8a6c82c8d1e', 'count', '2026-10-28 21:03:04.078858', '93605755-ada4-480c-b252-12324adaf08b', NULL, NULL),
	('0e9c7047-b280-4fd5-8695-f0348cfdf909', 'desktop', 60, 1, 20, 270, '504f05c8-bff2-4f9b-97b2-b8a6c82c8d1e', 'count', '2026-10-28 21:03:04.078858', '79dc501c-dd49-434f-96c6-6a09acdc855b', NULL, NULL),
	('03ace20e-a882-4230-9497-f1f7a34c32ac', 'mobile', 50, 10, 46.51162790697674, 400, '94491e11-3a4a-4dbc-a893-82148b10fc55', 'count', '2026-10-28 21:03:04.078858', 'b0b7924e-8094-4f01-9e90-ec491f58be8f', NULL, NULL),
	('f0e3acbd-e1c5-43a7-8526-049ed024a2f8', 'desktop', 390, 22, 20, 270, '94491e11-3a4a-4dbc-a893-82148b10fc55', 'count', '2026-10-28 21:03:04.078858', '8c1b52bc-0257-4291-9499-27ef18ce79b0', NULL, NULL),
	('710ba9cc-8f23-4622-9c0e-e4b81aaa0b03', 'mobile', 20, 12, 13.953488372093023, 40, 'c55913e3-0e91-43f0-8a17-cf118ae2cac9', 'count', '2026-10-28 21:03:04.078858', '0d58444d-27cc-4163-a72f-19916256c9b2', NULL, NULL),
	('d395899a-f8c3-46cf-804c-92a0204f893c', 'desktop', 20, 1, 20, 40, 'c55913e3-0e91-43f0-8a17-cf118ae2cac9', 'count', '2026-10-28 21:03:04.078858', '77632ec6-97be-4670-a2a5-5a497e5cb2a9', NULL, NULL),
	('91dbf648-494a-46c6-8ee4-eb5568f71ad0', 'mobile', 20, 12, 13.953488372093023, 40, 'c5dbd7a2-04f4-4ea4-bceb-796ba94d669f', 'count', '2026-10-28 21:03:04.078858', '93fa84c3-60dc-4c7d-bdcb-6a3f4c95fd83', NULL, NULL),
	('ac17e8c2-bdee-40b9-90ae-0eb11fc69799', 'desktop', 20, 22, 20, 40, 'c5dbd7a2-04f4-4ea4-bceb-796ba94d669f', 'count', '2026-10-28 21:03:04.078858', '5320aac1-fbd5-4953-8bbc-a61e4e8a0dac', NULL, NULL),
	('cbb475cc-9148-41c6-b1ae-29e554f9027a', 'mobile', 20, 12, 13.953488372093023, 40, 'a4ad7530-95af-41f9-b9c0-306dec01af28', 'count', '2026-10-28 21:03:04.078858', '02e88023-f692-4c00-90e5-34f590094718', NULL, NULL),
	('b9fb6731-3610-48f4-9ae2-75f862783145', 'desktop', 350, 1, 14, 40, 'a4ad7530-95af-41f9-b9c0-306dec01af28', 'count', '2026-10-28 21:03:04.078858', '3f4a26ae-a6f8-4025-8270-2106dbd31de8', NULL, NULL),
	('1d77f369-3549-44c3-a8c1-4759c137e1de', 'mobile', 20, 12, 13.953488372093023, 40, '9d4ad48e-9413-4689-9819-2cb6e7b5f516', 'count', '2026-10-28 21:03:04.078858', 'f5bda9e0-2d6d-4f76-a730-7e75578e494a', NULL, NULL),
	('b05e41d5-eddb-4e27-b703-1be292eb1f37', 'desktop', 350, 22, 14, 40, '9d4ad48e-9413-4689-9819-2cb6e7b5f516', 'count', '2026-10-28 21:03:04.078858', '63fe8c30-fc51-440f-af8c-d80c0990ed0b', NULL, NULL),
	('fefc66af-1a6d-45a5-9b19-49460ec3a965', 'mobile', 360, 24, 18.6046511627907, 30, '4b8a3848-c489-4557-ada4-da58271d2efc', 'count', '2026-10-28 21:03:04.078858', '9fa3eea1-1425-4942-80b1-5b00ca9881dc', NULL, NULL),
	('dc1d78fd-e42c-4a64-ad40-8bd8acbeca12', 'desktop', 350, 15, 6, 40, '4b8a3848-c489-4557-ada4-da58271d2efc', 'count', '2026-10-28 21:03:04.078858', '8e2a83f3-3b93-418a-9307-6e3bc5275ca7', NULL, NULL),
	('6eee2ab0-697c-490c-9744-1c5538e3ee65', 'mobile', 360, 24, 18.6046511627907, 30, 'f5d26600-ed0d-4167-a995-e57cf92366a7', 'count', '2026-10-28 21:03:04.078858', '8af925d3-739d-49f4-985a-ca7a18dbea53', NULL, NULL),
	('469279d2-e6c7-4665-b5e3-9d5c238b5d51', 'desktop', 350, 36, 6, 40, 'f5d26600-ed0d-4167-a995-e57cf92366a7', 'count', '2026-10-28 21:03:04.078858', 'cb16276f-d941-4e81-9797-43592ba9ed42', NULL, NULL),
	('4ac9b18e-19b0-4c9a-9e33-9665cd3dedef', 'mobile', 590, 7, 6.976744186046512, 30, '817817fe-3667-41a7-9c57-9e90c62a8f15', 'count', '2026-10-28 21:03:04.078858', 'd7ebd8b2-90bb-4833-935b-736c2a20b85e', NULL, NULL),
	('a6678f8f-c922-47a8-ad04-a51ee1570221', 'desktop', 620, 3, 36, 40, '817817fe-3667-41a7-9c57-9e90c62a8f15', 'count', '2026-10-28 21:03:04.078858', 'dabda092-8c3e-4c74-94b3-9e283ae69ea8', NULL, NULL),
	('499d5cc5-5e13-40e7-88f0-28e567b7a17a', 'mobile', 190, 1, 11.627906976744185, 30, '7db9779a-6186-4c14-b3ad-f12a8d45f222', 'count', '2026-10-28 21:03:04.078858', '359356ed-705a-4e1c-94b4-dd03436dd526', NULL, NULL),
	('7aa752a9-4a9c-4f57-80e7-5a751fab3ed5', 'desktop', 180, 3, 15, 40, '7db9779a-6186-4c14-b3ad-f12a8d45f222', 'count', '2026-10-28 21:03:04.078858', 'dc58b551-d91a-4036-ad24-1fed92b47914', NULL, NULL),
	('9354152d-cc69-41a3-8a13-971c4b60a212', 'mobile', 180, 4, 11.627906976744185, 48, '07e050bc-c4cd-4cfa-baae-42219e6750ef', 'count', '2026-10-28 21:03:04.078858', 'e02d9c2e-8018-4a96-8e10-a07eae586cd6', NULL, NULL),
	('f5ee0503-26cc-466f-b1a7-641afb05f6d0', 'desktop', 184, 18, 6, 30, '07e050bc-c4cd-4cfa-baae-42219e6750ef', 'count', '2026-10-28 21:03:04.078858', 'e3206220-eda1-4fcc-9476-6a41287b0622', NULL, NULL);
INSERT INTO public.layouts VALUES
	('762ad035-d38a-4f85-9d83-fb12f7d4225c', 'mobile', 190, 1, 11.627906976744185, 30, '0b9bd802-2423-44ea-849c-8b4555ad25ac', 'count', '2026-10-28 21:03:04.078858', 'cb82199a-66f1-4bab-8ba8-b3921479e1e6', NULL, NULL),
	('a8e5a0d0-541e-496b-a790-814af4ee0065', 'desktop', 180, 24, 15, 40, '0b9bd802-2423-44ea-849c-8b4555ad25ac', 'count', '2026-10-28 21:03:04.078858', '7ec41aa1-d945-4817-b90c-903e391a75bd', NULL, NULL),
	('6c1b9e8b-4419-404d-ba80-8373187c3ac1', 'mobile', 930, 2, 5, 200, '2c92c28a-7a2a-4b35-b93e-86febd5990ed', 'count', '2026-10-28 21:03:04.078858', 'a2d87179-17ed-459a-a3fe-5133632defd4', NULL, NULL),
	('fa886a46-24ed-4ee9-b43b-da4dcee13e83', 'desktop', 110, 1, 9, 690, '2c92c28a-7a2a-4b35-b93e-86febd5990ed', 'count', '2026-10-28 21:03:04.078858', '9f5d9745-e740-4746-9ea7-37d6ada5a6d6', NULL, NULL),
	('acc40004-700b-4bc9-ac31-b38c18183833', 'mobile', 920, 11, 5, 200, '0c2c911e-d59c-4044-bf1b-a319dbb84261', 'count', '2026-10-28 21:03:04.078858', '4af8dcf9-f42c-4320-8edd-d75e63d04099', NULL, NULL),
	('b7ef027a-2026-41e1-a8a2-a8fcf84deb73', 'desktop', 110, 11, 31, 690, '0c2c911e-d59c-4044-bf1b-a319dbb84261', 'count', '2026-10-28 21:03:04.078858', '55476cd4-90ba-4641-b69e-2c39061b50cd', NULL, NULL),
	('0929d863-0d9d-4c9b-83dd-973169a50f32', 'desktop', 360, 3, 36, 40, '634a339f-c0d3-4ced-ad65-15b4940943a3', 'count', '2026-10-28 21:03:04.078858', 'cb33bf0d-662a-4d07-9ef7-dbe2826deedf', NULL, NULL),
	('55425be7-8a77-47f2-8dc7-f012736edc36', 'mobile', 250, 4, 27.906976744186046, 30, '634a339f-c0d3-4ced-ad65-15b4940943a3', 'count', '2026-10-28 21:03:04.078858', '3e89a5c8-3a7d-4abd-8418-c04f96adb5ab', NULL, NULL),
	('7bbcc8e2-9894-493f-9441-aaf1d7a07d0c', 'desktop', 110, 3, 36, 20, '63ab45e4-96a2-4684-9660-30f827b4dc6b', 'count', '2026-10-28 21:03:04.078858', '3ef5cd1e-604a-4082-a218-3b0b7d97761a', NULL, NULL),
	('406b1fe9-acff-4233-88c9-723a6340d087', 'mobile', 100, 8, 13.953488372093023, 40, '63ab45e4-96a2-4684-9660-30f827b4dc6b', 'count', '2026-10-28 21:03:04.078858', 'be3e6065-c1aa-46d2-9994-6a336d1d59f3', NULL, NULL),
	('32a841e7-d959-4ba0-8703-4caedc815eaf', 'desktop', 150, 3, 36, 30, 'b0effedf-162c-4699-b16c-b0cc3c7426f8', 'count', '2026-10-28 21:03:04.078858', 'bb324f49-6859-4d2c-9579-d4bf672d5318', NULL, NULL),
	('ca54f4da-1efe-4049-ba74-8c0bf82648fa', 'mobile', 140, 19, 13.953488372093023, 40, 'b0effedf-162c-4699-b16c-b0cc3c7426f8', 'count', '2026-10-28 21:03:04.078858', '88cbe38f-8f09-444d-b2aa-027271bfc81a', NULL, NULL),
	('21023054-93d0-4a49-ad2a-3ae64485c51f', 'desktop', 240, 3, 36, 30, 'b67d7c31-e17b-4975-a592-76780781d540', 'count', '2026-10-28 21:03:04.078858', '10534f81-4c0f-4feb-a9ef-cbd8c4a41eb3', NULL, NULL),
	('ed3dff79-778d-4c50-ab0a-4ab7b2f298cf', 'mobile', 140, 19, 13.953488372093023, 40, 'b67d7c31-e17b-4975-a592-76780781d540', 'count', '2026-10-28 21:03:04.078858', 'bd98a8ec-7a29-40a8-8f0e-946aaefc8326', NULL, NULL),
	('52efaa9f-4881-4a68-ba5f-c020ef72b996', 'desktop', 60, 22, 20, 270, 'fdf036d1-96c3-44a3-adb1-1a75d0f129e8', 'count', '2026-10-28 21:03:04.078858', 'e9d1e2e9-3ab7-4a50-bad5-b3dbe17b5f7a', NULL, NULL),
	('5ff4452a-65d7-4240-94c2-eaca4593b323', 'mobile', 50, 10, 46.51162790697674, 400, 'fdf036d1-96c3-44a3-adb1-1a75d0f129e8', 'count', '2026-10-28 21:03:04.078858', 'e8346b17-d80e-4a35-9fa7-4056477e276c', NULL, NULL),
	('a2d42f56-25cf-459b-af36-7f85b0b4d692', 'mobile', 50, 10, 46.51162790697674, 400, '337d4fc5-34de-41c9-86f8-c2dce775b51b', 'count', '2026-10-28 21:03:04.078858', 'dd224b6e-df2f-4f56-a39c-3a25222a2ed2', NULL, NULL),
	('a0cebc37-56d6-408f-9206-cf81c0baec98', 'desktop', 390, 1, 20, 270, '337d4fc5-34de-41c9-86f8-c2dce775b51b', 'count', '2026-10-28 21:03:04.078858', '9fa3f618-08f7-46f9-8933-b3aefb0ff516', NULL, NULL),
	('241b1b51-cca9-4722-93e9-7b3027747a5d', 'mobile', 140, 19, 13.953488372093023, 40, '4c995070-ce33-4894-af78-d819e643ec1c', 'count', '2026-10-28 21:03:04.078858', '2bdd431e-6db8-4bd2-b133-183204c34d6d', NULL, NULL),
	('7a4cca8f-b3c0-43a2-a4b7-105873629440', 'desktop', 330, 3, 36, 30, '4c995070-ce33-4894-af78-d819e643ec1c', 'count', '2026-10-28 21:03:04.078858', '512e402c-d654-4571-b9aa-d9da5d908cb9', NULL, NULL),
	('78e9ace3-ddfc-4a63-b863-5140f8280b0f', 'mobile', 250, 4, 27.906976744186046, 30, 'e129821f-34f6-4703-82a9-79fb99200347', 'count', '2026-10-28 21:03:04.078858', 'b6cf70ac-da7d-49c5-ab14-a6d7ecd1fbdf', NULL, NULL),
	('d033baf5-fbfc-4f77-bb67-84e58fa11a33', 'desktop', 450, 3, 36, 40, 'e129821f-34f6-4703-82a9-79fb99200347', 'count', '2026-10-28 21:03:04.078858', '1812d553-3204-47ea-b18a-be47a5b299a2', NULL, NULL),
	('7012eb8e-3851-46ec-98f6-cd1d7ee87704', 'desktop', 50, 3, 36, 40, '8d9b4990-d3b5-48d5-b8a5-b6823a9ce462', 'count', '2026-10-28 21:03:04.078858', '801745bc-3469-49fa-bf81-98f5bd7cea50', NULL, NULL),
	('cd6d098d-17b1-4a25-9248-65d84e0ccdc6', 'mobile', 90, 8, 18.6046511627907, 30, '8d9b4990-d3b5-48d5-b8a5-b6823a9ce462', 'count', '2026-10-28 21:03:04.078858', '340b33d3-2b37-420a-adbc-e73041804ede', NULL, NULL),
	('0fb7af6d-8b7a-4c1f-bffb-951d3f11628b', 'mobile', 250, 4, 27.906976744186046, 30, '6c21bbe6-4ff8-4c66-9070-2c2bf37c018a', 'count', '2026-10-28 21:03:04.078858', 'a95ed0db-53b7-4776-a5c6-cf2385bc8e4f', NULL, NULL),
	('32a30e7d-4b63-447f-884d-93eaa1c6fd6e', 'desktop', 270, 3, 36, 40, '6c21bbe6-4ff8-4c66-9070-2c2bf37c018a', 'count', '2026-10-28 21:03:04.078858', 'cfd716d7-a904-4902-ae6f-a3b660ee9b5a', NULL, NULL),
	('a9ceb26a-5e0c-4a37-8dcd-9e082d1a0b26', 'desktop', 20, 1, 41, 70, '0aa0a541-6bdf-478e-92a8-7f3256c6fa4c', 'count', '2026-10-28 21:03:04.078858', 'dcf85794-763c-4583-a619-0926ac7b9070', NULL, NULL),
	('3c813b51-832b-4a01-9288-ac29c218bdc0', 'desktop', 10, 1, 6, 40, 'cdb5ca72-a270-4f3a-bf32-dcbb67312d11', 'count', '2026-10-28 21:03:04.078858', 'dc678ee7-eb03-4797-a219-f00760910197', NULL, NULL),
	('ba044583-206d-4ecd-aa0f-7ec9e026255c', 'desktop', 10, 23, 19, 40, '7df6ef38-c6b1-422d-a7b9-cf6ba163c59e', 'count', '2026-10-28 21:03:04.078858', '34d90506-a751-401c-8974-5a6e7e25b96d', NULL, NULL),
	('fc5b09a5-6bd3-46bc-bb1b-c62e62315e50', 'desktop', 10, 32, 10, 40, '62bedea4-755b-475d-b51b-694eca110373', 'count', '2026-10-28 21:03:46.646458', 'fdbf7034-47ed-40d0-bbba-41bd05d35674', NULL, NULL),
	('d6a4a9b1-5305-43c4-bf1e-fdb715710026', 'desktop', 10, 1, 13, 40, '109dc90e-3c24-4c74-b244-1d298c8724ef', 'count', '2026-10-28 21:03:46.646458', 'da7ab9ad-49f7-485e-abb6-eb9c7405c099', NULL, NULL),
	('69437f4b-ea38-482b-840b-2b32ae76a7fb', 'desktop', 20, 1, 41, 70, '98447ceb-a2ce-426f-9d2c-8799fcfaacf8', 'count', '2026-10-28 21:03:46.646458', 'ccf77d17-04ac-4db8-9a84-76328f25e981', NULL, NULL),
	('6c93e9f8-0582-419d-b7f5-a5cf7829a9e8', 'desktop', 110, 1, 10, 470, 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', 'count', '2026-10-28 21:03:46.646458', 'd77dccfc-faf2-46ec-a663-fde49c42344c', NULL, NULL),
	('93104713-a32b-4e25-9b15-8ab85de7e775', 'mobile', 100, 0, 5, 200, 'f8499e08-4deb-469c-bbd0-2e96fd95f08f', 'count', '2026-10-28 21:03:46.646458', '5b4ede3a-4d28-4e8e-a85e-9252ca6502e4', NULL, NULL),
	('9d5f76a0-f844-4ed7-ba4d-c1c6a0e76dc0', 'mobile', 10, 1, 13.953488372093023, 30, '3e0bf694-1319-4679-8e79-805878b9b8f1', 'count', '2026-10-28 21:03:46.646458', '062697ba-6246-4291-9ceb-651880c109ad', NULL, NULL),
	('e40811f6-dc9f-49c3-b891-09521b1a0ea8', 'desktop', 300, 3, 16.000000000000004, 40, '3e0bf694-1319-4679-8e79-805878b9b8f1', 'count', '2026-10-28 21:03:46.646458', '5a7e12a4-2238-44d4-bebe-d1be03dd2d4b', NULL, NULL),
	('038f4212-ae7d-4ee1-a799-972b5b3ebd15', 'mobile', 10, 18, 9.30232558139535, 30, '06db0e76-6142-4d39-b134-baad091c6ef6', 'count', '2026-10-28 21:03:46.646458', 'd839422c-333d-479b-956d-7f2626bd5057', NULL, NULL),
	('b0f07615-727f-4603-b682-fb403a76a7de', 'desktop', 90, 20, 19.000000000000004, 40, '06db0e76-6142-4d39-b134-baad091c6ef6', 'count', '2026-10-28 21:03:46.646458', '7d2f757e-37fa-4237-907e-50f73abdbb6f', NULL, NULL),
	('f379c56f-c19b-4f83-8900-719861538246', 'desktop', 90, 3, 16.000000000000004, 40, 'f07ed0ab-a53e-431a-af84-79cd4fc4be65', 'count', '2026-10-28 21:03:46.646458', '12a2d773-1dde-418b-aab4-f7f3f0b6a839', NULL, NULL),
	('cecc217a-5111-4c1c-880c-85a800cb3b42', 'mobile', 10, 1, 13.953488372093023, 30, 'f07ed0ab-a53e-431a-af84-79cd4fc4be65', 'count', '2026-10-28 21:03:46.646458', 'a0caa252-65ce-41fb-bd9e-8c62a8645f6a', NULL, NULL),
	('758a17e6-f868-4f1f-a488-c6ba62a09573', 'mobile', 10, 1, 13.953488372093023, 30, '8a0e26dc-bb1d-4382-89c1-e4dc19241dec', 'count', '2026-10-28 21:03:46.646458', '96142dd6-d471-40a7-86c2-f769b673d6a5', NULL, NULL),
	('b88093bf-48c9-4920-8930-f45d93629ce3', 'desktop', 160, 3, 16.000000000000004, 40, '8a0e26dc-bb1d-4382-89c1-e4dc19241dec', 'count', '2026-10-28 21:03:46.646458', '8d85b560-f79f-4149-81d7-2c5b7870fd92', NULL, NULL),
	('009cc4fa-386f-4b37-8116-5096552e2d11', 'desktop', 230, 3, 16.000000000000004, 40, 'a9f46fa8-d07b-401e-b4b0-c8063b790c45', 'count', '2026-10-28 21:03:46.646458', '4033bbfb-a6bb-4a75-a9e1-f5c23a9d1485', NULL, NULL),
	('f0c713cd-95e6-4011-8a9f-940b1f3c10ba', 'mobile', 10, 1, 13.953488372093023, 30, 'a9f46fa8-d07b-401e-b4b0-c8063b790c45', 'count', '2026-10-28 21:03:46.646458', '2ab6f99f-2486-4bf2-b814-7a90b78d6ffb', NULL, NULL),
	('ffd7d855-00af-46b1-a1ff-d59f3bff063e', 'desktop', 370, 3, 16.000000000000004, 40, '4a1680b2-53ea-48d6-99d3-389a72565814', 'count', '2026-10-28 21:03:46.646458', '59ebbc10-8b12-4d60-a23c-2aa99a0daac8', NULL, NULL),
	('7ef83ed8-4a4b-4799-b282-b0c768f0744e', 'mobile', 10, 1, 13.953488372093023, 30, '4a1680b2-53ea-48d6-99d3-389a72565814', 'count', '2026-10-28 21:03:46.646458', 'cd9b769f-381c-4f0c-8524-76b97594be11', NULL, NULL),
	('bd62d33b-493d-4365-b01d-06f9eee4d5f6', 'desktop', 160, 20, 19.000000000000004, 40, '88da8bc6-eb24-42a0-9184-3c37196a0f6e', 'count', '2026-10-28 21:03:46.646458', '511580c2-9bed-40d2-8068-908f9e3744cf', NULL, NULL),
	('0bb9c754-9ff4-491f-95f0-45693c27c599', 'mobile', 70, 19, 9.30232558139535, 30, '88da8bc6-eb24-42a0-9184-3c37196a0f6e', 'count', '2026-10-28 21:03:46.646458', '0b3236bb-2e5b-4883-ac1a-8e57856497c7', NULL, NULL),
	('ee3cc312-7858-4a4d-97c1-b8e7368f30f3', 'mobile', 130, 20, 9.30232558139535, 30, '58f2aea4-c595-4300-9411-a89d8752a509', 'count', '2026-10-28 21:03:46.646458', '3c5e4d88-f128-4b98-bd27-18bb5de2b431', NULL, NULL),
	('7acb1fcc-4503-4722-a43a-aa5f03d160d6', 'desktop', 300, 20, 19.000000000000004, 40, '58f2aea4-c595-4300-9411-a89d8752a509', 'count', '2026-10-28 21:03:46.646458', '80f50b21-4178-490e-95e3-259a899d09ae', NULL, NULL);
INSERT INTO public.layouts VALUES
	('91ec0c5f-0083-471f-bff8-07f6560353a7', 'desktop', 230, 20, 19.000000000000004, 40, 'eed0d4ce-2834-45b3-9c6f-80b8a07033f4', 'count', '2026-10-28 21:03:46.646458', '1813dcf4-822f-40a9-bfea-c5786d03aa6c', NULL, NULL),
	('4ea7cb44-02ab-4c94-b51d-50f47339a379', 'mobile', 130, 20, 9.30232558139535, 30, 'eed0d4ce-2834-45b3-9c6f-80b8a07033f4', 'count', '2026-10-28 21:03:46.646458', '3a1ea50a-58dc-4b36-a09c-098c0c3243e6', NULL, NULL),
	('eba5353b-7671-4037-bcd6-a51b324752ac', 'desktop', 370, 20, 19.000000000000004, 40, '3a0d238d-1c1d-42e7-bb21-f1db8a1744eb', 'count', '2026-10-28 21:03:46.646458', '481d8e02-a7c7-4516-9f95-1c0d4755c0cd', NULL, NULL),
	('cdf65ced-f609-4d7d-843e-cc5c2d27cec1', 'mobile', 240, 20, 11.627906976744185, 30, '3a0d238d-1c1d-42e7-bb21-f1db8a1744eb', 'count', '2026-10-28 21:03:46.646458', '9893822f-f81d-400e-8ff2-082b8742db75', NULL, NULL),
	('bce5d2ec-04b3-44d3-8f59-8d96d68c055c', 'desktop', 110, 12, 30, 470, '3931fa5e-9281-4311-ab93-d16b3b93fa08', 'count', '2026-10-28 21:03:46.646458', '1d223635-924e-47ae-a495-90138ddc0137', NULL, NULL),
	('8b475798-c611-4ad4-87d7-7a4376ffa3f9', 'mobile', 620, 14, 5, 200, '3931fa5e-9281-4311-ab93-d16b3b93fa08', 'count', '2026-10-28 21:03:46.646458', '6da67bbf-95e7-4132-a752-3dc0ec6ba489', NULL, NULL),
	('7bfcd6fe-f180-47b9-a868-7c84a3058567', 'desktop', 10, 1, 40, 50, 'f9d46a10-34f8-466d-816a-b71f267721ef', 'count', '2026-10-28 21:03:46.646458', 'ffed0d54-b9ba-4b6e-8d9f-71784e517dc4', NULL, NULL),
	('acba9743-03ac-4bfb-a5b8-cdf7995b67b4', 'mobile', 20, 8, 13.953488372093023, 30, 'f9d46a10-34f8-466d-816a-b71f267721ef', 'count', '2026-10-28 21:03:46.646458', '765d5731-0724-40d8-bb7c-fae237b2d7b9', NULL, NULL),
	('f0d00121-94af-412d-ab28-cc5b82b482e4', 'desktop', 10, 3, 36.00000000000001, 50, '156bcf33-7008-423d-8035-c02969f24fbb', 'count', '2026-10-28 21:03:46.646458', '985f0d49-fa5e-435b-a922-fb372ea42e76', NULL, NULL),
	('5566d856-613e-44de-badf-08f9cb53eabc', 'mobile', 10, 10, 13.953488372093023, 30, '156bcf33-7008-423d-8035-c02969f24fbb', 'count', '2026-10-28 21:03:46.646458', 'a51a445e-ea5e-4489-a6fe-1b10741a8bee', NULL, NULL),
	('61a866f4-2beb-4520-96d6-d859ebc09f0f', 'desktop', 80, 1, 10, 40, 'c14ac282-bc6e-489a-a71b-8fda6691e5bb', 'count', '2026-10-28 21:03:46.646458', 'c7b5449e-74f4-4e74-8c53-0d711f74fb62', NULL, NULL),
	('f9ae9830-8ea8-4cbe-90c4-3927b3d3d978', 'mobile', 20, 2, 13.953488372093023, 30, 'c14ac282-bc6e-489a-a71b-8fda6691e5bb', 'count', '2026-10-28 21:03:46.646458', 'de04b06a-6520-450a-a616-050df8488fb4', NULL, NULL),
	('b323cb8f-c39e-4fe7-8f67-2b4833071f00', 'mobile', 0, 0, 20, 400, 'b3f0743e-d1f6-40d5-9c4d-98de693b87bd', 'count', '2026-10-28 21:03:46.646458', '50bf0e94-39ee-48b9-b594-8857d3bcccfe', NULL, NULL),
	('ee0d7577-407c-4778-8e0b-f47c1f07acae', 'desktop', 130, 1, 17.999999999999996, 310, 'b3f0743e-d1f6-40d5-9c4d-98de693b87bd', 'count', '2026-10-28 21:03:46.646458', 'd34a2abe-5c4b-4d90-9b4b-0fe810671305', NULL, NULL),
	('6e0f7b5a-9978-451f-9e36-4bcfd488ca5a', 'desktop', 200, 26, 7, 40, 'ab6fb764-41dc-4fe1-9bcf-3917b8114c79', 'count', '2026-10-28 21:03:46.646458', '44aa9f8f-a343-42fe-a2a5-c1cf177769c6', NULL, NULL),
	('449bb536-3271-44cc-8eff-7b23b69bfce7', 'mobile', 10, 1, 13.953488372093023, 30, 'ab6fb764-41dc-4fe1-9bcf-3917b8114c79', 'count', '2026-10-28 21:03:46.646458', 'c64ba418-5d14-4e90-b404-6bf8d2ac5cea', NULL, NULL),
	('07408091-bbeb-4853-9c4e-b71ca5f1a539', 'desktop', 260, 26, 7, 40, '04896ad4-2ac9-49eb-be06-63eec111658a', 'count', '2026-10-28 21:03:46.646458', 'edd3c796-6aa1-4fa1-83cd-14934b24b4ad', NULL, NULL),
	('fcd17ede-d571-4959-b87c-a049a4c3918a', 'mobile', 10, 1, 13.953488372093023, 30, '04896ad4-2ac9-49eb-be06-63eec111658a', 'count', '2026-10-28 21:03:46.646458', '0ee9d0ee-fdeb-403c-b272-816e9967a433', NULL, NULL),
	('23ae1aaf-8d19-48d1-b4f2-e5ffb5adc2ab', 'mobile', 10, 2, 13.953488372093023, 30, '2760b2dc-5047-4bbb-a14d-ab74718f6881', 'count', '2026-10-28 21:03:46.646458', 'a1dbc95c-6193-4b34-8210-e46f737cc462', NULL, NULL),
	('3d42c43f-682f-4385-8934-1412047d4b9a', 'desktop', 80, 26, 8.999999999999998, 40, '2760b2dc-5047-4bbb-a14d-ab74718f6881', 'count', '2026-10-28 21:03:46.646458', '0a196926-1da6-42b2-aca3-00fd927632e1', NULL, NULL),
	('f8887e8b-0dcb-4107-b8e3-108d84dd8dd5', 'mobile', 10, 1, 13.953488372093023, 30, '2a1083c0-4ddd-4819-a29e-cfb6dfa4f09c', 'count', '2026-10-28 21:03:46.646458', 'c505d41b-ac06-458e-8d43-c1724325e036', NULL, NULL),
	('24a74d40-a198-44ee-a2c7-67e7b54d444d', 'desktop', 140, 26, 7, 40, '2a1083c0-4ddd-4819-a29e-cfb6dfa4f09c', 'count', '2026-10-28 21:03:46.646458', '5a27f0ef-6e07-41d3-8a8c-80d99476f008', NULL, NULL),
	('f6132d8e-5224-4c71-8c6e-724cd572357f', 'mobile', 10, 1, 13.953488372093023, 30, '2efccc09-4aa2-4584-a939-0c1462e3dbcf', 'count', '2026-10-28 21:03:46.646458', '50bd3e7f-f5b2-4cbe-a8bb-9a4c5cc6e432', NULL, NULL),
	('21be7a65-9464-4d83-a345-cd7765be796b', 'desktop', 320, 26, 7, 40, '2efccc09-4aa2-4584-a939-0c1462e3dbcf', 'count', '2026-10-28 21:03:46.646458', '0e9aeeb7-d65c-4ebb-9ba4-df3b79dd6966', NULL, NULL),
	('fc01edd1-7bd7-4368-bd2c-1abdabd20f34', 'mobile', 10, 1, 13.953488372093023, 30, '3fde27cd-f4b5-49c7-b333-42e58dfdc41d', 'count', '2026-10-28 21:03:46.646458', 'aa98db88-37e7-427f-9b8a-32630fe1058a', NULL, NULL),
	('6a6abd28-4aae-443a-86d7-ddc3e394bf66', 'desktop', 380, 26, 7, 40, '3fde27cd-f4b5-49c7-b333-42e58dfdc41d', 'count', '2026-10-28 21:03:46.646458', '96162594-9c45-4c94-88e7-89ca45d2bb4b', NULL, NULL),
	('985c3475-9567-4909-b40b-7e99135cadcc', 'desktop', 80, 21, 3, 360, '6db4c770-9e28-4be8-b6d3-6dd5806d9317', 'count', '2026-10-28 21:03:46.646458', '77fcd152-336d-4b64-b74e-e2cf3daeb889', NULL, NULL),
	('f1e18c40-f63a-4e40-a244-b3dd89f167c4', 'mobile', 90, 20, 4.651162790697675, 100, '6db4c770-9e28-4be8-b6d3-6dd5806d9317', 'count', '2026-10-28 21:03:46.646458', '5060d943-8e68-4da8-b181-1c2eecd3b054', NULL, NULL),
	('ca6872e0-4cdf-4509-8a76-9ce58c62d01d', 'desktop', 140, 34, 8, 40, '15ace0d9-6c59-4417-b525-588d62b10290', 'count', '2026-10-28 21:03:46.646458', '30cba4db-5828-44af-b321-600cd1dd0440', NULL, NULL),
	('17d6863f-b3cf-442a-a18b-783837498d5d', 'mobile', 10, 1, 13.953488372093023, 30, '15ace0d9-6c59-4417-b525-588d62b10290', 'count', '2026-10-28 21:03:46.646458', '0c72b9cc-dafe-438b-9239-79552abeaa19', NULL, NULL),
	('6e7281ea-f614-4e94-85c6-ea5069de50a7', 'desktop', 200, 34, 8, 40, 'aaef1b17-5ca4-4616-9281-b01488c230c3', 'count', '2026-10-28 21:03:46.646458', '290551a8-7df7-4558-a903-c8d6905e8545', NULL, NULL),
	('12389343-04b2-45fa-a0d1-40fc8cdcf86e', 'mobile', 10, 1, 13.953488372093023, 30, 'aaef1b17-5ca4-4616-9281-b01488c230c3', 'count', '2026-10-28 21:03:46.646458', '48e1b2e5-82f9-43b3-8747-af4f2f1b549d', NULL, NULL),
	('76e95ac5-764b-427e-aacd-1810412ae77e', 'desktop', 260, 34, 8, 40, '26986152-5252-4174-b5d1-9031d8b8c381', 'count', '2026-10-28 21:03:46.646458', '8c2df9a5-507f-43b1-a7f0-9b085a3ae868', NULL, NULL),
	('2058891e-0cbd-4fc1-bbe9-f54c9f240969', 'mobile', 10, 1, 13.953488372093023, 30, '26986152-5252-4174-b5d1-9031d8b8c381', 'count', '2026-10-28 21:03:46.646458', '2d7c51b7-5135-4ac3-babd-69fb3fb92f1b', NULL, NULL),
	('8c7c8ceb-b706-497a-a171-c8359957654e', 'desktop', 320, 34, 8, 40, 'a274da88-30dd-4a71-a11a-fcb04924d4e0', 'count', '2026-10-28 21:03:46.646458', '6d7694ad-138e-4ace-bf6a-5ac509ec9243', NULL, NULL),
	('96f13fbe-c750-4c49-b61d-bd3ec9f2574f', 'mobile', 10, 1, 13.953488372093023, 30, 'a274da88-30dd-4a71-a11a-fcb04924d4e0', 'count', '2026-10-28 21:03:46.646458', '8f4d1c15-b5f1-4a57-b7e8-bdf05a941259', NULL, NULL),
	('f8d61b2f-e34e-49ad-b818-03a500aaf24f', 'desktop', 380, 34, 8, 40, '97cf961e-74d7-4b53-8ac6-36bc6f10672f', 'count', '2026-10-28 21:03:46.646458', 'b07b8adc-0bb3-4311-850c-e65c05cfd631', NULL, NULL),
	('9d51aabf-c765-45bf-b5a5-3fc56cc806a8', 'mobile', 10, 1, 13.953488372093023, 30, '97cf961e-74d7-4b53-8ac6-36bc6f10672f', 'count', '2026-10-28 21:03:46.646458', 'a6bb5e03-6479-497a-bb31-8c8e8ae0b5cd', NULL, NULL);

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
	('7b4aec54-0ec4-465b-8c73-a65eb274f2a3', 'gitoff', NULL, '2026-10-28 17:15:09.441', '2026-10-28 21:03:30.097869', false, true, 'gitoff', NULL, 'active', false, true, '2026-10-29 02:33:30.114', NULL, NULL),
	('8b930517-7801-4b07-bd19-7eea1b3beabd', 'giton', NULL, '2026-10-28 17:15:09.806', '2026-10-28 21:03:47.273088', false, true, 'giton', NULL, 'active', false, false, '2026-10-29 02:33:47.287', NULL, NULL);

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
	('5b1d3e7a-daab-445b-983b-491d85eb7dd3', 'Home', 1, 'home', false, 'e56f8149-cc5f-409a-9e44-a8d8e33805fa', '2026-10-28 11:45:10.03292', '2026-10-28 11:46:11.431768', true, NULL, 1, NULL, false, NULL, 'new_tab', 'default', '9b6eda5a-8748-4d54-8ba8-6a9031452f06', NULL, NULL, NULL, NULL, 'false'),
	('02cef60a-84b7-4b06-a2d0-d5c809f68129', 'Home', 1, 'home', false, 'fff4b014-35d3-4770-8ddf-b8959b8c9f95', '2026-10-28 21:01:48.723638', '2026-10-28 21:01:48.723638', true, NULL, NULL, NULL, false, NULL, 'same_tab', 'default', '', NULL, NULL, NULL, NULL, 'false'),
	('8c1d1aee-b331-4fc4-a532-cff2d592ace7', 'Home', 1, 'home', false, 'e884ec80-102a-44b3-8efe-fe7f1c6dcb6b', '2026-10-28 21:02:19.182031', '2026-10-28 21:02:19.182031', true, NULL, NULL, NULL, false, NULL, 'same_tab', 'default', '', NULL, NULL, NULL, NULL, 'false'),
	('8615e3a8-7cf1-442a-b489-bdde3b062049', 'Home', 1, 'home', false, '873cf9ba-539a-4b5c-857b-6480f42077be', '2026-10-28 21:02:19.375956', '2026-10-28 21:02:19.375956', true, NULL, NULL, NULL, false, NULL, 'same_tab', 'default', '', NULL, NULL, NULL, NULL, 'false'),
	('a0183550-5c8b-401f-a014-923999f9d2f4', 'Home', 1, 'home', false, '308945c9-e540-41bc-80b6-4f0e677bcc1c', '2026-10-28 21:02:19.537811', '2026-10-28 21:02:19.537811', false, NULL, NULL, NULL, false, NULL, 'same_tab', 'default', '', NULL, NULL, NULL, NULL, 'false'),
	('b2143c85-26b1-49e3-abe7-b5f90993f81e', 'Home', 1, 'home', false, 'a5207132-c550-457b-b50a-43118c84f573', '2026-10-28 21:03:03.869244', '2026-10-28 21:03:03.869244', false, NULL, NULL, NULL, false, NULL, 'same_tab', 'default', '', NULL, NULL, NULL, NULL, 'false'),
	('6d7123a7-31d5-428e-a5ba-a59010750a02', 'Home', 1, 'home', false, 'd07fb2ab-a191-4a7b-941f-c676167044a6', '2026-10-28 21:03:04.078858', '2026-10-28 21:03:04.078858', false, NULL, NULL, NULL, false, NULL, 'same_tab', 'default', '', NULL, NULL, NULL, NULL, 'false'),
	('65d7bb83-11db-4f1f-ab6d-b0362cfb557e', 'Home', 1, 'home', false, '4241f003-5ce9-4ba2-ace8-d83068d460f2', '2026-10-28 21:03:46.646458', '2026-10-28 21:03:46.646458', false, NULL, NULL, NULL, false, NULL, 'same_tab', 'default', '', NULL, NULL, NULL, NULL, 'false');

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
	('c6c39059-5645-4bc3-a3e3-5fe65de8222e', 'Spike', 'Admin', 'admin@spike58.test', 'redacted', NULL, NULL, '8b930517-7801-4b07-bd19-7eea1b3beabd', '2026-10-28 11:45:09.442318', '2026-10-28 21:03:47.273088', '', NULL, 0, NULL, NULL, 'active', 'signup', 'instance', NULL, 'account_created', false, NULL, NULL, NULL, NULL);

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

