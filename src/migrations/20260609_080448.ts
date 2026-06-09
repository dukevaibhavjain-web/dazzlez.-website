import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // --- ENUM TYPES (idempotent: skip if already exists) ---
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_events_event_name" AS ENUM('ViewContent', 'AddToCart', 'ViewCart', 'InitiateCheckout', 'Purchase', 'BlogView', 'BlogScroll', 'BlogEngagement', 'BlogProductClick', 'Search', 'SearchResultClick', 'ChatbotOpened', 'DesignAdvisorStart', 'DesignAdvisorComplete', 'Contact', 'Lead');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_keyword_bank_search_intent" AS ENUM('informational', 'transactional', 'navigational', 'commercial');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_keyword_bank_volume" AS ENUM('high', 'medium', 'low');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_keyword_bank_difficulty" AS ENUM('high', 'medium', 'low');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_keyword_bank_source" AS ENUM('product_catalog', 'occasion', 'ai_expanded', 'manual');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_blogs_keywords_search_intent" AS ENUM('informational', 'transactional', 'navigational', 'commercial');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_blogs_status" AS ENUM('draft', 'pending_approval', 'scheduled', 'published');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_blogs_ab_test_slot" AS ENUM('9am', '2pm', '7pm');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    CREATE TYPE "public"."enum_blog_timing_settings_recommended_slot" AS ENUM('none', '9am', '2pm', '7pm');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `)

  // --- TABLES (idempotent: IF NOT EXISTS) ---
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "events" (
    "id" serial PRIMARY KEY NOT NULL,
    "visitor_id" varchar NOT NULL,
    "session_id" varchar NOT NULL,
    "event_name" "enum_events_event_name" NOT NULL,
    "event_data" jsonb,
    "page_url" varchar NOT NULL,
    "referrer" varchar,
    "user_agent" varchar,
    "ip_address" varchar,
    "utm_source" varchar,
    "utm_medium" varchar,
    "utm_campaign" varchar,
    "utm_content" varchar,
    "revenue" numeric,
    "currency" varchar DEFAULT 'INR',
    "order_id" varchar,
    "blog_slug" varchar,
    "scroll_depth" numeric,
    "time_on_page" numeric,
    "timestamp" timestamp(3) with time zone NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "blog_categories" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "description" varchar,
    "sort_order" numeric DEFAULT 0,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "blog_tags" (
    "id" serial PRIMARY KEY NOT NULL,
    "name" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "keyword_bank" (
    "id" serial PRIMARY KEY NOT NULL,
    "keyword" varchar NOT NULL,
    "search_intent" "enum_keyword_bank_search_intent" NOT NULL,
    "volume" "enum_keyword_bank_volume",
    "difficulty" "enum_keyword_bank_difficulty",
    "related_category_id" integer,
    "related_occasion_id" integer,
    "blog_used_id" integer,
    "source" "enum_keyword_bank_source" DEFAULT 'product_catalog' NOT NULL,
    "approved" boolean DEFAULT false,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "blogs_keywords" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "keyword" varchar NOT NULL,
    "search_intent" "enum_blogs_keywords_search_intent"
  );

  CREATE TABLE IF NOT EXISTS "blogs_publishing_history" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "published_at" timestamp(3) with time zone,
    "ab_test_slot" varchar,
    "view_count" numeric,
    "engagement_score" numeric
  );

  CREATE TABLE IF NOT EXISTS "blogs" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "slug" varchar NOT NULL,
    "status" "enum_blogs_status" DEFAULT 'draft' NOT NULL,
    "excerpt" varchar NOT NULL,
    "body" jsonb NOT NULL,
    "category_id" integer NOT NULL,
    "hero_image_id" integer,
    "hero_image_svg" varchar,
    "reading_time_minutes" numeric,
    "view_count" numeric DEFAULT 0,
    "meta_title" varchar,
    "meta_description" varchar,
    "focus_keyword" varchar,
    "published_at" timestamp(3) with time zone,
    "scheduled_for" timestamp(3) with time zone,
    "ab_test_slot" "enum_blogs_ab_test_slot",
    "ai_generation_meta" jsonb,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "blogs_rels" (
    "id" serial PRIMARY KEY NOT NULL,
    "order" integer,
    "parent_id" integer NOT NULL,
    "path" varchar NOT NULL,
    "blog_tags_id" integer,
    "products_id" integer,
    "categories_id" integer
  );

  CREATE TABLE IF NOT EXISTS "blog_timing_settings_slot_stats" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "slot" varchar NOT NULL,
    "avg_views" numeric,
    "avg_scroll_depth" numeric,
    "avg_time_on_page" numeric,
    "blog_count" numeric
  );

  CREATE TABLE IF NOT EXISTS "blog_timing_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "recommended_slot" "enum_blog_timing_settings_recommended_slot" DEFAULT 'none',
    "recommendation_reason" varchar,
    "last_analyzed_at" timestamp(3) with time zone,
    "published_blog_count" numeric DEFAULT 0,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );
  `)

  // --- ALTER TABLE: add columns (idempotent: IF NOT EXISTS) ---
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "blog_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "blog_tags_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "keyword_bank_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "blogs_id" integer;
  `)

  // --- FOREIGN KEY CONSTRAINTS (idempotent: skip if exists) ---
  await db.execute(sql`
  DO $$ BEGIN
    ALTER TABLE "keyword_bank" ADD CONSTRAINT "keyword_bank_related_category_id_categories_id_fk" FOREIGN KEY ("related_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "keyword_bank" ADD CONSTRAINT "keyword_bank_related_occasion_id_occasions_id_fk" FOREIGN KEY ("related_occasion_id") REFERENCES "public"."occasions"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "keyword_bank" ADD CONSTRAINT "keyword_bank_blog_used_id_blogs_id_fk" FOREIGN KEY ("blog_used_id") REFERENCES "public"."blogs"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "blogs_keywords" ADD CONSTRAINT "blogs_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "blogs_publishing_history" ADD CONSTRAINT "blogs_publishing_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "blogs" ADD CONSTRAINT "blogs_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "blogs" ADD CONSTRAINT "blogs_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_blog_tags_fk" FOREIGN KEY ("blog_tags_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "blogs_rels" ADD CONSTRAINT "blogs_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "blog_timing_settings_slot_stats" ADD CONSTRAINT "blog_timing_settings_slot_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_timing_settings"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_categories_fk" FOREIGN KEY ("blog_categories_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_tags_fk" FOREIGN KEY ("blog_tags_id") REFERENCES "public"."blog_tags"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_keyword_bank_fk" FOREIGN KEY ("keyword_bank_id") REFERENCES "public"."keyword_bank"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;

  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blogs_fk" FOREIGN KEY ("blogs_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;
  `)

  // --- INDEXES (idempotent: IF NOT EXISTS) ---
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "events_visitor_id_idx" ON "events" USING btree ("visitor_id");
  CREATE INDEX IF NOT EXISTS "events_session_id_idx" ON "events" USING btree ("session_id");
  CREATE INDEX IF NOT EXISTS "events_event_name_idx" ON "events" USING btree ("event_name");
  CREATE INDEX IF NOT EXISTS "events_page_url_idx" ON "events" USING btree ("page_url");
  CREATE INDEX IF NOT EXISTS "events_utm_source_idx" ON "events" USING btree ("utm_source");
  CREATE INDEX IF NOT EXISTS "events_utm_medium_idx" ON "events" USING btree ("utm_medium");
  CREATE INDEX IF NOT EXISTS "events_utm_campaign_idx" ON "events" USING btree ("utm_campaign");
  CREATE INDEX IF NOT EXISTS "events_order_id_idx" ON "events" USING btree ("order_id");
  CREATE INDEX IF NOT EXISTS "events_blog_slug_idx" ON "events" USING btree ("blog_slug");
  CREATE INDEX IF NOT EXISTS "events_timestamp_idx" ON "events" USING btree ("timestamp");
  CREATE INDEX IF NOT EXISTS "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "blog_categories_name_idx" ON "blog_categories" USING btree ("name");
  CREATE UNIQUE INDEX IF NOT EXISTS "blog_categories_slug_idx" ON "blog_categories" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "blog_categories_updated_at_idx" ON "blog_categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "blog_categories_created_at_idx" ON "blog_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "blog_tags_name_idx" ON "blog_tags" USING btree ("name");
  CREATE UNIQUE INDEX IF NOT EXISTS "blog_tags_slug_idx" ON "blog_tags" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "blog_tags_updated_at_idx" ON "blog_tags" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "blog_tags_created_at_idx" ON "blog_tags" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "keyword_bank_keyword_idx" ON "keyword_bank" USING btree ("keyword");
  CREATE INDEX IF NOT EXISTS "keyword_bank_search_intent_idx" ON "keyword_bank" USING btree ("search_intent");
  CREATE INDEX IF NOT EXISTS "keyword_bank_related_category_idx" ON "keyword_bank" USING btree ("related_category_id");
  CREATE INDEX IF NOT EXISTS "keyword_bank_related_occasion_idx" ON "keyword_bank" USING btree ("related_occasion_id");
  CREATE INDEX IF NOT EXISTS "keyword_bank_blog_used_idx" ON "keyword_bank" USING btree ("blog_used_id");
  CREATE INDEX IF NOT EXISTS "keyword_bank_approved_idx" ON "keyword_bank" USING btree ("approved");
  CREATE INDEX IF NOT EXISTS "keyword_bank_updated_at_idx" ON "keyword_bank" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "keyword_bank_created_at_idx" ON "keyword_bank" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "blogs_keywords_order_idx" ON "blogs_keywords" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "blogs_keywords_parent_id_idx" ON "blogs_keywords" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "blogs_publishing_history_order_idx" ON "blogs_publishing_history" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "blogs_publishing_history_parent_id_idx" ON "blogs_publishing_history" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "blogs_title_idx" ON "blogs" USING btree ("title");
  CREATE UNIQUE INDEX IF NOT EXISTS "blogs_slug_idx" ON "blogs" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "blogs_status_idx" ON "blogs" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "blogs_category_idx" ON "blogs" USING btree ("category_id");
  CREATE INDEX IF NOT EXISTS "blogs_hero_image_idx" ON "blogs" USING btree ("hero_image_id");
  CREATE INDEX IF NOT EXISTS "blogs_published_at_idx" ON "blogs" USING btree ("published_at");
  CREATE INDEX IF NOT EXISTS "blogs_ab_test_slot_idx" ON "blogs" USING btree ("ab_test_slot");
  CREATE INDEX IF NOT EXISTS "blogs_updated_at_idx" ON "blogs" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "blogs_created_at_idx" ON "blogs" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "blogs_rels_order_idx" ON "blogs_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "blogs_rels_parent_idx" ON "blogs_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "blogs_rels_path_idx" ON "blogs_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "blogs_rels_blog_tags_id_idx" ON "blogs_rels" USING btree ("blog_tags_id");
  CREATE INDEX IF NOT EXISTS "blogs_rels_products_id_idx" ON "blogs_rels" USING btree ("products_id");
  CREATE INDEX IF NOT EXISTS "blogs_rels_categories_id_idx" ON "blogs_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "blog_timing_settings_slot_stats_order_idx" ON "blog_timing_settings_slot_stats" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "blog_timing_settings_slot_stats_parent_id_idx" ON "blog_timing_settings_slot_stats" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_blog_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_blog_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_tags_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_keyword_bank_id_idx" ON "payload_locked_documents_rels" USING btree ("keyword_bank_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_blogs_id_idx" ON "payload_locked_documents_rels" USING btree ("blogs_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "keyword_bank" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blogs_keywords" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blogs_publishing_history" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blogs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blogs_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_timing_settings_slot_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "blog_timing_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "events" CASCADE;
  DROP TABLE "blog_categories" CASCADE;
  DROP TABLE "blog_tags" CASCADE;
  DROP TABLE "keyword_bank" CASCADE;
  DROP TABLE "blogs_keywords" CASCADE;
  DROP TABLE "blogs_publishing_history" CASCADE;
  DROP TABLE "blogs" CASCADE;
  DROP TABLE "blogs_rels" CASCADE;
  DROP TABLE "blog_timing_settings_slot_stats" CASCADE;
  DROP TABLE "blog_timing_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_blog_categories_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_blog_tags_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_keyword_bank_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_blogs_fk";

  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_blog_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_blog_tags_id_idx";
  DROP INDEX "payload_locked_documents_rels_keyword_bank_id_idx";
  DROP INDEX "payload_locked_documents_rels_blogs_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "blog_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "blog_tags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "keyword_bank_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "blogs_id";
  DROP TYPE "public"."enum_events_event_name";
  DROP TYPE "public"."enum_keyword_bank_search_intent";
  DROP TYPE "public"."enum_keyword_bank_volume";
  DROP TYPE "public"."enum_keyword_bank_difficulty";
  DROP TYPE "public"."enum_keyword_bank_source";
  DROP TYPE "public"."enum_blogs_keywords_search_intent";
  DROP TYPE "public"."enum_blogs_status";
  DROP TYPE "public"."enum_blogs_ab_test_slot";
  DROP TYPE "public"."enum_blog_timing_settings_recommended_slot";`)
}
