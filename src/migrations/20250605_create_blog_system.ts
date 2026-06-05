import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(`
      -- Create blog_categories table
      CREATE TABLE IF NOT EXISTS "blog_categories" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "slug" VARCHAR UNIQUE NOT NULL,
        "description" TEXT,
        "sort_order" INTEGER DEFAULT 0,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "blog_categories_slug_idx" ON "blog_categories" ("slug");

      -- Create blog_tags table
      CREATE TABLE IF NOT EXISTS "blog_tags" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR UNIQUE NOT NULL,
        "slug" VARCHAR UNIQUE NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "blog_tags_slug_idx" ON "blog_tags" ("slug");

      -- Create keyword_bank table
      CREATE TABLE IF NOT EXISTS "keyword_bank" (
        "id" SERIAL PRIMARY KEY,
        "keyword" VARCHAR UNIQUE NOT NULL,
        "search_intent" VARCHAR DEFAULT 'informational',
        "volume" VARCHAR,
        "difficulty" VARCHAR,
        "related_category_id" INTEGER REFERENCES "categories" ("id"),
        "related_occasion_id" INTEGER REFERENCES "occasions" ("id"),
        "blog_used_id" INTEGER REFERENCES "blogs" ("id"),
        "source" VARCHAR DEFAULT 'product_catalog',
        "approved" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "keyword_bank_keyword_idx" ON "keyword_bank" ("keyword");
      CREATE INDEX IF NOT EXISTS "keyword_bank_search_intent_idx" ON "keyword_bank" ("search_intent");
      CREATE INDEX IF NOT EXISTS "keyword_bank_approved_idx" ON "keyword_bank" ("approved");

      -- Create blogs table
      CREATE TABLE IF NOT EXISTS "blogs" (
        "id" SERIAL PRIMARY KEY,
        "title" VARCHAR NOT NULL,
        "slug" VARCHAR UNIQUE NOT NULL,
        "status" VARCHAR DEFAULT 'draft',
        "excerpt" TEXT NOT NULL,
        "body" JSONB,
        "category_id" INTEGER NOT NULL REFERENCES "blog_categories" ("id"),
        "hero_image_id" INTEGER REFERENCES "media" ("id"),
        "hero_image_svg" TEXT,
        "reading_time_minutes" INTEGER,
        "view_count" INTEGER DEFAULT 0,
        "meta_title" VARCHAR,
        "meta_description" VARCHAR,
        "focus_keyword" VARCHAR,
        "keywords" JSONB,
        "published_at" TIMESTAMP,
        "scheduled_for" TIMESTAMP,
        "ab_test_slot" VARCHAR,
        "publishing_history" JSONB,
        "ai_generation_meta" JSONB,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS "blogs_status_idx" ON "blogs" ("status");
      CREATE INDEX IF NOT EXISTS "blogs_slug_idx" ON "blogs" ("slug");
      CREATE INDEX IF NOT EXISTS "blogs_published_at_idx" ON "blogs" ("published_at");
      CREATE INDEX IF NOT EXISTS "blogs_category_id_idx" ON "blogs" ("category_id");
      CREATE INDEX IF NOT EXISTS "blogs_ab_test_slot_idx" ON "blogs" ("ab_test_slot");

      -- Create blog_tags relationship table
      CREATE TABLE IF NOT EXISTS "blogs_blog_tags" (
        "id" SERIAL PRIMARY KEY,
        "parent_id" INTEGER NOT NULL REFERENCES "blogs" ("id") ON DELETE CASCADE,
        "blog_tags_id" INTEGER NOT NULL REFERENCES "blog_tags" ("id") ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS "blogs_blog_tags_parent_idx" ON "blogs_blog_tags" ("parent_id");

      -- Create linked products relationship table
      CREATE TABLE IF NOT EXISTS "blogs_linked_products" (
        "id" SERIAL PRIMARY KEY,
        "parent_id" INTEGER NOT NULL REFERENCES "blogs" ("id") ON DELETE CASCADE,
        "products_id" INTEGER NOT NULL REFERENCES "products" ("id") ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS "blogs_linked_products_parent_idx" ON "blogs_linked_products" ("parent_id");

      -- Create linked collections relationship table
      CREATE TABLE IF NOT EXISTS "blogs_linked_collections" (
        "id" SERIAL PRIMARY KEY,
        "parent_id" INTEGER NOT NULL REFERENCES "blogs" ("id") ON DELETE CASCADE,
        "categories_id" INTEGER NOT NULL REFERENCES "categories" ("id") ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS "blogs_linked_collections_parent_idx" ON "blogs_linked_collections" ("parent_id");
  `);
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(`
      DROP TABLE IF EXISTS "blogs_linked_collections" CASCADE;
      DROP TABLE IF EXISTS "blogs_linked_products" CASCADE;
      DROP TABLE IF EXISTS "blogs_blog_tags" CASCADE;
      DROP TABLE IF EXISTS "blogs" CASCADE;
      DROP TABLE IF EXISTS "keyword_bank" CASCADE;
      DROP TABLE IF EXISTS "blog_tags" CASCADE;
      DROP TABLE IF EXISTS "blog_categories" CASCADE;
  `);
}
