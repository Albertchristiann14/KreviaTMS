-- ============================================================================
-- KREVIA TEAM MANAGEMENT SYSTEM (KTMS) — INITIAL MIGRATION (0001)
-- PostgreSQL 16: 2 Extensions, 1 Sequence, 21 ENUMs, 25 Tables, 25 Custom Indexes,
--                Stored Generated Columns, CHECK Constraints, Triggers & RLS
-- ============================================================================

-- Extensions required by KTMS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Task code human-readable sequence (KTMS-1001, KTMS-1002, ...)
CREATE SEQUENCE IF NOT EXISTS seq_task_code_num START 1001;

-- ============================================================================
-- 1. CANONICAL & SUPPORTING DOMAIN ENUMS (21 ENUMs)
-- ============================================================================

CREATE TYPE task_status_enum AS ENUM (
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'REVISION',
  'DONE',
  'CANCELLED'
);

CREATE TYPE task_type_enum AS ENUM (
  'GENERAL',
  'CONTENT_PRODUCTION',
  'DESIGN_TASK'
);

CREATE TYPE task_priority_enum AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TYPE content_status_enum AS ENUM (
  'IDEA',
  'APPROVED_IDEA',
  'PLANNING',
  'IN_DESIGN',
  'DESIGN_REVIEW',
  'DESIGN_REVISION',
  'READY_TO_PUBLISH',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED'
);

CREATE TYPE design_submission_status_enum AS ENUM (
  'PENDING_BRIEF',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVISION_REQUESTED',
  'APPROVED'
);

CREATE TYPE kpi_evaluation_status_enum AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'REVIEWED',
  'FINALIZED'
);

CREATE TYPE employment_status_enum AS ENUM (
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
  'INACTIVE'
);

CREATE TYPE project_status_enum AS ENUM (
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED'
);

CREATE TYPE project_member_role_enum AS ENUM (
  'OWNER',
  'LEAD',
  'MEMBER',
  'VIEWER'
);

CREATE TYPE content_idea_status_enum AS ENUM (
  'IDEA',
  'APPROVED_IDEA',
  'CONVERTED',
  'ARCHIVED'
);

CREATE TYPE social_platform_enum AS ENUM (
  'INSTAGRAM',
  'TIKTOK',
  'LINKEDIN',
  'YOUTUBE',
  'X_TWITTER',
  'FACEBOOK',
  'WEBSITE_BLOG'
);

CREATE TYPE content_format_enum AS ENUM (
  'REELS',
  'CAROUSEL',
  'SINGLE_POST',
  'STORY',
  'SHORT_VIDEO',
  'LONG_VIDEO',
  'ARTICLE',
  'INFOGRAPHIC'
);

CREATE TYPE design_review_decision_enum AS ENUM (
  'APPROVED',
  'REVISION_REQUESTED'
);

CREATE TYPE asset_source_type_enum AS ENUM (
  'UPLOAD',
  'FIGMA',
  'CANVA',
  'GOOGLE_DRIVE',
  'OTHER_LINK'
);

CREATE TYPE asset_category_enum AS ENUM (
  'BRAND_KIT',
  'SOCIAL_MEDIA',
  'CAMPAIGN',
  'TEMPLATE',
  'PHOTO_VIDEO',
  'DOCUMENT',
  'OTHER'
);

CREATE TYPE kpi_category_enum AS ENUM (
  'DELIVERY',
  'QUALITY',
  'PRODUCTIVITY',
  'CREATIVE',
  'COLLABORATION'
);

CREATE TYPE kpi_metric_source_enum AS ENUM (
  'AUTO_TCR',
  'AUTO_OTDR',
  'AUTO_DQS',
  'AUTO_CPVS',
  'MANUAL_SCORE'
);

CREATE TYPE kpi_unit_enum AS ENUM (
  'PERCENTAGE',
  'COUNT',
  'SCORE_100',
  'RATIO'
);

CREATE TYPE kpi_grade_enum AS ENUM (
  'A',
  'B',
  'C',
  'D'
);

CREATE TYPE notification_type_enum AS ENUM (
  'TASK_ASSIGNED',
  'TASK_REASSIGNED',
  'TASK_STATUS_CHANGED',
  'TASK_SUBMITTED_REVIEW',
  'TASK_REVISION_REQUESTED',
  'TASK_COMPLETED',
  'TASK_COMMENT_MENTION',
  'TASK_DEADLINE_SOON',
  'TASK_DEADLINE_TODAY',
  'TASK_OVERDUE',
  'CONTENT_IDEA_REVIEWED',
  'CONTENT_READY_TO_PUBLISH',
  'DESIGN_BRIEF_ASSIGNED',
  'DESIGN_SUBMITTED',
  'DESIGN_REVISION_REQUESTED',
  'DESIGN_APPROVED',
  'KPI_EVALUATION_OPEN',
  'KPI_EVALUATION_SUBMITTED',
  'KPI_EVALUATION_FINALIZED',
  'ANNOUNCEMENT_PUBLISHED',
  'SYSTEM_ALERT'
);

CREATE TYPE announcement_priority_enum AS ENUM (
  'INFO',
  'IMPORTANT',
  'URGENT'
);

-- ============================================================================
-- 2. HELPER TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION fn_prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  RAISE EXCEPTION 'activity_logs bersifat immutable (append-only): operasi % ditolak.', TG_OP;
END;
$$;

-- ============================================================================
-- 3. TABLES (25 Tables in Topological Dependency Order)
-- ============================================================================

-- 3.1 Identity, Team Directory & RBAC (4 tables)
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_roles_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]*$')
);

CREATE TABLE users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id              UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  manager_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  email                VARCHAR(255) NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  full_name            VARCHAR(150) NOT NULL,
  display_name         VARCHAR(80),
  avatar_url           TEXT,
  job_title            VARCHAR(100) NOT NULL,
  department           VARCHAR(100) NOT NULL DEFAULT 'Operations',
  phone                VARCHAR(30),
  bio                  TEXT,
  skills               TEXT[] NOT NULL DEFAULT '{}',
  employment_status    employment_status_enum NOT NULL DEFAULT 'FULL_TIME',
  joined_at            DATE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  token_version        INTEGER NOT NULL DEFAULT 1,
  last_login_at        TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,
  CONSTRAINT chk_users_email_lower CHECK (email = LOWER(email)),
  CONSTRAINT chk_users_no_self_manager CHECK (manager_id IS NULL OR manager_id <> id),
  CONSTRAINT chk_users_token_version CHECK (token_version >= 1)
);

CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(100) NOT NULL UNIQUE,
  module      VARCHAR(50) NOT NULL,
  resource    VARCHAR(50) NOT NULL,
  action      VARCHAR(50) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_permissions_code_format CHECK (code ~ '^[a-z_]+:[a-z_]+:[a-z_]+$')
);

CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- 3.2 Projects & Membership — Modul A (2 tables)
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) NOT NULL UNIQUE,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  status          project_status_enum NOT NULL DEFAULT 'ACTIVE',
  color_hex       VARCHAR(7) NOT NULL DEFAULT '#2563EB',
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  start_date      DATE,
  target_end_date DATE,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT chk_projects_code_upper CHECK (code ~ '^[A-Z0-9_-]{2,20}$'),
  CONSTRAINT chk_projects_color_hex CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT chk_projects_dates CHECK (
    target_end_date IS NULL OR start_date IS NULL OR target_end_date >= start_date
  )
);

CREATE TABLE project_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_role project_member_role_enum NOT NULL DEFAULT 'MEMBER',
  added_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_members_pair UNIQUE (project_id, user_id)
);

-- 3.3 Social Media & Design Management — Modul C (7 tables)
CREATE TABLE content_ideas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  title               VARCHAR(200) NOT NULL,
  description         TEXT,
  target_platform     social_platform_enum NOT NULL DEFAULT 'INSTAGRAM',
  content_pillar      VARCHAR(100),
  reference_urls      JSONB NOT NULL DEFAULT '[]'::jsonb,
  status              content_idea_status_enum NOT NULL DEFAULT 'IDEA',
  upvoted_by_user_ids UUID[] NOT NULL DEFAULT '{}',
  proposed_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes        TEXT,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ
);

CREATE TABLE content_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  idea_id            UUID REFERENCES content_ideas(id) ON DELETE SET NULL,
  title              VARCHAR(200) NOT NULL,
  platform           social_platform_enum NOT NULL,
  content_format     content_format_enum NOT NULL,
  content_pillar     VARCHAR(100),
  campaign_name      VARCHAR(150),
  status             content_status_enum NOT NULL DEFAULT 'PLANNING',
  requires_design    BOOLEAN NOT NULL DEFAULT TRUE,
  caption            TEXT,
  hashtags           TEXT[] NOT NULL DEFAULT '{}',
  cta_text           VARCHAR(255),
  creator_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approver_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  planned_publish_at TIMESTAMPTZ,
  published_at       TIMESTAMPTZ,
  published_url      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE TABLE design_briefs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  content_item_id        UUID REFERENCES content_items(id) ON DELETE SET NULL,
  title                  VARCHAR(200) NOT NULL,
  objective              TEXT NOT NULL,
  dimensions_spec        VARCHAR(150),
  copy_text              TEXT,
  brand_guidelines_notes TEXT,
  reference_links        JSONB NOT NULL DEFAULT '[]'::jsonb,
  status                 design_submission_status_enum NOT NULL DEFAULT 'PENDING_BRIEF',
  requested_by           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_designer_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date               TIMESTAMPTZ,
  current_version        INTEGER NOT NULL DEFAULT 0,
  revision_count         INTEGER NOT NULL DEFAULT 0,
  approved_at            TIMESTAMPTZ,
  approved_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  CONSTRAINT chk_design_briefs_counters CHECK (current_version >= 0 AND revision_count >= 0)
);

CREATE TABLE design_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_brief_id UUID NOT NULL REFERENCES design_briefs(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  submitted_by    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status          design_submission_status_enum NOT NULL DEFAULT 'SUBMITTED',
  source_type     asset_source_type_enum NOT NULL DEFAULT 'UPLOAD',
  file_url        TEXT NOT NULL,
  storage_key     TEXT,
  thumbnail_url   TEXT,
  mime_type       VARCHAR(120),
  file_size_bytes BIGINT,
  designer_notes  TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_design_submissions_ver UNIQUE (design_brief_id, version_number),
  CONSTRAINT chk_design_submissions_ver CHECK (version_number >= 1),
  CONSTRAINT chk_design_submissions_status CHECK (
    status IN ('SUBMITTED', 'REVISION_REQUESTED', 'APPROVED')
  ),
  CONSTRAINT chk_design_submissions_upload_key CHECK (
    source_type <> 'UPLOAD' OR storage_key IS NOT NULL
  ),
  CONSTRAINT chk_design_submissions_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

CREATE TABLE design_reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_submission_id UUID NOT NULL REFERENCES design_submissions(id) ON DELETE CASCADE,
  reviewer_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decision             design_review_decision_enum NOT NULL,
  feedback             TEXT NOT NULL,
  revision_checklist   JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID REFERENCES projects(id) ON DELETE SET NULL,
  content_item_id         UUID REFERENCES content_items(id) ON DELETE SET NULL,
  design_submission_id    UUID REFERENCES design_submissions(id) ON DELETE SET NULL,
  title                   VARCHAR(200) NOT NULL,
  description             TEXT,
  category                asset_category_enum NOT NULL DEFAULT 'OTHER',
  source_type             asset_source_type_enum NOT NULL DEFAULT 'UPLOAD',
  file_url                TEXT NOT NULL,
  storage_key             TEXT,
  thumbnail_url           TEXT,
  mime_type               VARCHAR(120),
  file_size_bytes         BIGINT,
  tags                    TEXT[] NOT NULL DEFAULT '{}',
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_approved_brand_asset BOOLEAN NOT NULL DEFAULT FALSE,
  is_superseded           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  CONSTRAINT chk_assets_upload_key CHECK (source_type <> 'UPLOAD' OR storage_key IS NOT NULL),
  CONSTRAINT chk_assets_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

CREATE TABLE content_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  recorded_date   DATE NOT NULL,
  impressions     INTEGER NOT NULL DEFAULT 0,
  reach           INTEGER NOT NULL DEFAULT 0,
  likes           INTEGER NOT NULL DEFAULT 0,
  comments        INTEGER NOT NULL DEFAULT 0,
  shares          INTEGER NOT NULL DEFAULT 0,
  saves           INTEGER NOT NULL DEFAULT 0,
  clicks          INTEGER NOT NULL DEFAULT 0,
  video_views     INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(6,2) GENERATED ALWAYS AS (
    CASE
      WHEN reach = 0 THEN 0.00
      ELSE LEAST(
        999.99,
        ROUND(((likes + comments + shares + saves)::NUMERIC / reach) * 100, 2)
      )
    END
  ) STORED,
  ctr             NUMERIC(6,2) GENERATED ALWAYS AS (
    CASE
      WHEN impressions = 0 THEN 0.00
      ELSE LEAST(
        999.99,
        ROUND((clicks::NUMERIC / impressions) * 100, 2)
      )
    END
  ) STORED,
  notes           TEXT,
  recorded_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_content_analytics_day UNIQUE (content_item_id, recorded_date),
  CONSTRAINT chk_content_analytics_nonneg CHECK (
    impressions >= 0 AND reach >= 0 AND likes >= 0 AND comments >= 0
    AND shares >= 0 AND saves >= 0 AND clicks >= 0 AND video_views >= 0
  )
);

-- 3.4 Unified Tasks & Collaboration — Modul A (4 tables)
CREATE TABLE tasks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_code          VARCHAR(30) NOT NULL UNIQUE,
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  parent_task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
  content_item_id    UUID REFERENCES content_items(id) ON DELETE SET NULL,
  design_brief_id    UUID REFERENCES design_briefs(id) ON DELETE SET NULL,
  title              VARCHAR(200) NOT NULL,
  description        TEXT,
  task_type          task_type_enum NOT NULL DEFAULT 'GENERAL',
  status             task_status_enum NOT NULL DEFAULT 'TODO',
  priority           task_priority_enum NOT NULL DEFAULT 'MEDIUM',
  position           DOUBLE PRECISION NOT NULL DEFAULT 65536,
  version            INTEGER NOT NULL DEFAULT 1,
  requires_review    BOOLEAN NOT NULL DEFAULT TRUE,
  assignee_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewer_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date         DATE,
  started_at         TIMESTAMPTZ,
  first_submitted_at TIMESTAMPTZ,
  due_date           TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  is_on_time         BOOLEAN,
  estimated_hours    NUMERIC(5,2),
  actual_hours       NUMERIC(5,2),
  revision_count     INTEGER NOT NULL DEFAULT 0,
  tags               TEXT[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ,
  CONSTRAINT chk_tasks_no_self_parent CHECK (parent_task_id IS NULL OR parent_task_id <> id),
  CONSTRAINT chk_tasks_version_pos CHECK (version >= 1),
  CONSTRAINT chk_tasks_hours CHECK (
    (estimated_hours IS NULL OR estimated_hours >= 0) AND
    (actual_hours IS NULL OR actual_hours >= 0)
  ),
  CONSTRAINT chk_tasks_revision_nonneg CHECK (revision_count >= 0),
  CONSTRAINT chk_tasks_done_timestamp CHECK (
    (status = 'DONE' AND completed_at IS NOT NULL) OR
    (status <> 'DONE')
  ),
  CONSTRAINT chk_tasks_type_fk_alignment CHECK (
    (task_type <> 'DESIGN_TASK' OR design_brief_id IS NOT NULL)
  )
);

CREATE TABLE task_checklists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_comments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id            UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  parent_comment_id  UUID REFERENCES task_comments(id) ON DELETE SET NULL,
  body               TEXT NOT NULL,
  mentioned_user_ids UUID[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE TABLE task_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  source_type     asset_source_type_enum NOT NULL DEFAULT 'UPLOAD',
  file_name       VARCHAR(255) NOT NULL,
  file_url        TEXT NOT NULL,
  storage_key     TEXT,
  mime_type       VARCHAR(120),
  file_size_bytes BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT chk_task_attachments_upload_key CHECK (
    source_type <> 'UPLOAD' OR storage_key IS NOT NULL
  ),
  CONSTRAINT chk_task_attachments_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

-- 3.5 Team Management & KPI Evaluation — Modul B (4 tables)
CREATE TABLE kpi_templates (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 VARCHAR(50) NOT NULL UNIQUE,
  name                 VARCHAR(150) NOT NULL,
  description          TEXT,
  category             kpi_category_enum NOT NULL,
  applicable_role_id   UUID REFERENCES roles(id) ON DELETE SET NULL,
  metric_source        kpi_metric_source_enum NOT NULL,
  unit                 kpi_unit_enum NOT NULL DEFAULT 'PERCENTAGE',
  default_target_value NUMERIC(10,2) NOT NULL,
  default_weight       NUMERIC(5,2) NOT NULL,
  is_higher_better     BOOLEAN NOT NULL DEFAULT TRUE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_by           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,
  CONSTRAINT chk_kpi_templates_weight CHECK (default_weight > 0 AND default_weight <= 100)
);

CREATE TABLE kpi_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kpi_template_id UUID NOT NULL REFERENCES kpi_templates(id) ON DELETE RESTRICT,
  period_year     SMALLINT NOT NULL,
  period_month    SMALLINT NOT NULL,
  target_value    NUMERIC(10,2) NOT NULL,
  weight          NUMERIC(5,2) NOT NULL,
  assigned_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_kpi_assignments_period UNIQUE (user_id, kpi_template_id, period_year, period_month),
  CONSTRAINT chk_kpi_assignments_year CHECK (period_year BETWEEN 2024 AND 2100),
  CONSTRAINT chk_kpi_assignments_month CHECK (period_month BETWEEN 1 AND 12),
  CONSTRAINT chk_kpi_assignments_weight CHECK (weight > 0 AND weight <= 100)
);

CREATE TABLE monthly_evaluations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  evaluator_id            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  period_year             SMALLINT NOT NULL,
  period_month            SMALLINT NOT NULL,
  status                  kpi_evaluation_status_enum NOT NULL DEFAULT 'DRAFT',
  total_tasks_assigned    INTEGER NOT NULL DEFAULT 0,
  total_tasks_completed   INTEGER NOT NULL DEFAULT 0,
  tasks_completed_on_time INTEGER NOT NULL DEFAULT 0,
  completion_rate         NUMERIC(5,2),
  on_time_rate            NUMERIC(5,2),
  avg_revision_count      NUMERIC(5,2),
  design_quality_score    NUMERIC(5,2),
  weighted_kpi_score      NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  performance_grade       kpi_grade_enum,
  auto_metrics_snapshot   JSONB NOT NULL DEFAULT '{}'::jsonb,
  self_assessment_notes   TEXT,
  evaluator_notes         TEXT,
  submitted_at            TIMESTAMPTZ,
  reviewed_at             TIMESTAMPTZ,
  finalized_at            TIMESTAMPTZ,
  finalized_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_monthly_eval_user_period UNIQUE (user_id, period_year, period_month),
  CONSTRAINT chk_monthly_eval_no_self CHECK (evaluator_id <> user_id),
  CONSTRAINT chk_monthly_eval_year CHECK (period_year BETWEEN 2024 AND 2100),
  CONSTRAINT chk_monthly_eval_month CHECK (period_month BETWEEN 1 AND 12),
  CONSTRAINT chk_monthly_eval_rates CHECK (
    (completion_rate IS NULL OR completion_rate BETWEEN 0 AND 100) AND
    (on_time_rate IS NULL OR on_time_rate BETWEEN 0 AND 100) AND
    (avg_revision_count IS NULL OR avg_revision_count >= 0) AND
    (design_quality_score IS NULL OR design_quality_score BETWEEN 40 AND 100) AND
    weighted_kpi_score BETWEEN 0 AND 100
  ),
  CONSTRAINT chk_monthly_eval_finalized CHECK (
    status <> 'FINALIZED' OR (finalized_at IS NOT NULL AND finalized_by IS NOT NULL)
  )
);

CREATE TABLE evaluation_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_evaluation_id   UUID NOT NULL REFERENCES monthly_evaluations(id) ON DELETE CASCADE,
  kpi_assignment_id       UUID REFERENCES kpi_assignments(id) ON DELETE SET NULL,
  kpi_template_id         UUID NOT NULL REFERENCES kpi_templates(id) ON DELETE RESTRICT,
  indicator_name_snapshot VARCHAR(150) NOT NULL,
  metric_source           kpi_metric_source_enum NOT NULL,
  target_value            NUMERIC(10,2) NOT NULL,
  actual_value            NUMERIC(10,2),
  weight                  NUMERIC(5,2) NOT NULL,
  achievement_pct         NUMERIC(6,2),
  weighted_score          NUMERIC(6,2),
  evidence_notes          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_eval_items_template UNIQUE (monthly_evaluation_id, kpi_template_id),
  CONSTRAINT chk_eval_items_weight CHECK (weight > 0 AND weight <= 100),
  CONSTRAINT chk_eval_items_achievement CHECK (
    achievement_pct IS NULL OR achievement_pct BETWEEN 0 AND 100
  )
);

-- 3.6 System Management — Modul D (4 tables)
CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  type         notification_type_enum NOT NULL,
  title        VARCHAR(180) NOT NULL,
  message      TEXT NOT NULL,
  entity_type  VARCHAR(50),
  entity_id    UUID,
  action_url   VARCHAR(255),
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title           VARCHAR(200) NOT NULL,
  content         TEXT NOT NULL,
  priority        announcement_priority_enum NOT NULL DEFAULT 'INFO',
  target_role_ids UUID[] NOT NULL DEFAULT '{}',
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE announcement_reads (
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(80) NOT NULL,
  module      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id   UUID,
  summary     VARCHAR(255) NOT NULL,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. TRIGGERS (AUTO updated_at & IMMUTABLE AUDIT LOG)
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'roles', 'users', 'projects', 'content_ideas', 'content_items',
    'design_briefs', 'assets', 'content_analytics', 'tasks',
    'task_checklists', 'task_comments', 'kpi_templates', 'kpi_assignments',
    'monthly_evaluations', 'evaluation_items', 'announcements'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;

CREATE TRIGGER trg_activity_logs_immutable
  BEFORE UPDATE OR DELETE ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_log_mutation();

-- ============================================================================
-- 5. INDEXING STRATEGY (25 Custom Indexes: B-Tree Composite, Partial, GIN, Trigram)
-- ============================================================================

-- A. Unified Tasks (8 indexes)
-- 1.
CREATE INDEX idx_tasks_kanban_board
  ON tasks (project_id, status, position)
  WHERE deleted_at IS NULL;

-- 2.
CREATE INDEX idx_tasks_my_tasks
  ON tasks (assignee_id, status, due_date NULLS LAST)
  WHERE deleted_at IS NULL;

-- 3.
CREATE INDEX idx_tasks_calendar_due
  ON tasks (due_date, status, assignee_id)
  WHERE deleted_at IS NULL AND due_date IS NOT NULL;

-- 4.
CREATE INDEX idx_tasks_kpi_period
  ON tasks (assignee_id, completed_at, due_date, status)
  WHERE deleted_at IS NULL AND status <> 'CANCELLED';

-- 5.
CREATE UNIQUE INDEX uq_tasks_active_design_brief
  ON tasks (design_brief_id)
  WHERE design_brief_id IS NOT NULL AND deleted_at IS NULL;

-- 6.
CREATE UNIQUE INDEX uq_tasks_active_content_production
  ON tasks (content_item_id, task_type)
  WHERE content_item_id IS NOT NULL AND task_type = 'CONTENT_PRODUCTION' AND deleted_at IS NULL;

-- 7.
CREATE INDEX idx_tasks_content_item
  ON tasks (content_item_id)
  WHERE content_item_id IS NOT NULL AND deleted_at IS NULL;

-- 8.
CREATE INDEX idx_tasks_tags_gin
  ON tasks USING GIN (tags)
  WHERE deleted_at IS NULL;

-- B. Social Media, Design Workspace & Asset Library (8 indexes)
-- 9.
CREATE INDEX idx_content_items_calendar
  ON content_items (planned_publish_at, platform, status)
  WHERE deleted_at IS NULL;

-- 10.
CREATE INDEX idx_design_briefs_designer_queue
  ON design_briefs (assigned_designer_id, status, due_date)
  WHERE deleted_at IS NULL;

-- 11.
CREATE INDEX idx_design_submissions_brief_ver
  ON design_submissions (design_brief_id, version_number DESC);

-- 12.
CREATE INDEX idx_assets_category_created
  ON assets (category, created_at DESC)
  WHERE deleted_at IS NULL;

-- 13.
CREATE INDEX idx_assets_tags_gin
  ON assets USING GIN (tags)
  WHERE deleted_at IS NULL;

-- 14.
CREATE INDEX idx_assets_metadata_gin
  ON assets USING GIN (metadata jsonb_path_ops)
  WHERE deleted_at IS NULL;

-- 15.
CREATE INDEX idx_assets_title_trgm
  ON assets USING GIN (title gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- 16.
CREATE INDEX idx_tasks_title_trgm
  ON tasks USING GIN (title gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- C. Team Directory & KPI (2 indexes)
-- 17.
CREATE INDEX idx_users_active_role_dept
  ON users (role_id, department)
  WHERE deleted_at IS NULL AND is_active = TRUE;

-- 18.
CREATE INDEX idx_monthly_eval_period_status
  ON monthly_evaluations (period_year DESC, period_month DESC, status);

-- D. Notifications, Announcements & Activity Logs (7 indexes)
-- 19.
CREATE INDEX idx_notifications_unread_recipient
  ON notifications (recipient_id, created_at DESC)
  WHERE is_read = FALSE;

-- 20.
CREATE INDEX idx_notifications_recipient_feed
  ON notifications (recipient_id, created_at DESC);

-- 21.
CREATE INDEX idx_announcements_active_feed
  ON announcements (is_pinned DESC, published_at DESC)
  WHERE deleted_at IS NULL;

-- 22.
CREATE INDEX idx_announcements_target_roles_gin
  ON announcements USING GIN (target_role_ids)
  WHERE deleted_at IS NULL;

-- 23.
CREATE INDEX idx_activity_logs_entity_timeline
  ON activity_logs (entity_type, entity_id, created_at DESC);

-- 24.
CREATE INDEX idx_activity_logs_actor_module_time
  ON activity_logs (module, actor_id, created_at DESC);

-- 25.
CREATE INDEX idx_activity_logs_new_values_gin
  ON activity_logs USING GIN (new_values jsonb_path_ops);

-- ============================================================================
-- 6. SUPABASE ROW-LEVEL SECURITY (RLS) LOCKDOWN
-- Enables RLS on all 25 public tables with ZERO permissive public policies
-- and revokes PostgREST access from anon & authenticated when roles exist.
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  has_anon BOOLEAN;
  has_auth BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') INTO has_anon;
  SELECT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') INTO has_auth;

  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    IF has_anon THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', r.tablename);
    END IF;
    IF has_auth THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated;', r.tablename);
    END IF;
  END LOOP;
END $$;
