import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_products_gallery_gold_color" AS ENUM('', 'yellow', 'white', 'rose');
  CREATE TYPE "public"."enum_products_metals_purity" AS ENUM('9K', '14K', '18K', '22K', 'Silver925', 'Platinum');
  CREATE TYPE "public"."enum_products_diamonds_role" AS ENUM('small', 'solitaire');
  CREATE TYPE "public"."enum_products_status" AS ENUM('draft', 'active', 'archived');
  CREATE TYPE "public"."enum_products_fulfillment_type" AS ENUM('made_to_order', 'ready_stock');
  CREATE TYPE "public"."enum_products_default_gold_color" AS ENUM('yellow', 'white', 'rose');
  CREATE TYPE "public"."enum_color_stones_grade" AS ENUM('Premium', 'Standard');
  CREATE TYPE "public"."enum_rate_gold_purity" AS ENUM('9K', '14K', '18K', '22K', 'Silver925', 'Platinum');
  CREATE TYPE "public"."enum_rate_gold_source" AS ENUM('manual', 'ibja', 'imported');
  CREATE TYPE "public"."enum_making_rules_metal_type" AS ENUM('gold', 'silver', 'platinum');
  CREATE TYPE "public"."enum_making_rules_type" AS ENUM('wastage_plus_making', 'flat');
  CREATE TYPE "public"."enum_fx_rates_currency" AS ENUM('USD', 'AED', 'GBP', 'EUR', 'SGD');
  CREATE TYPE "public"."enum_fx_rates_source" AS ENUM('manual', 'api');
  CREATE TYPE "public"."enum_customers_segments" AS ENUM('new', 'engaged', 'high_value', 'vip', 'dormant');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumb_url" varchar,
  	"sizes_thumb_width" numeric,
  	"sizes_thumb_height" numeric,
  	"sizes_thumb_mime_type" varchar,
  	"sizes_thumb_filesize" numeric,
  	"sizes_thumb_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_zoom_url" varchar,
  	"sizes_zoom_width" numeric,
  	"sizes_zoom_height" numeric,
  	"sizes_zoom_mime_type" varchar,
  	"sizes_zoom_filesize" numeric,
  	"sizes_zoom_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"sort_order" numeric DEFAULT 100,
  	"hero_image_id" integer,
  	"short_description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sub_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"category_id" integer NOT NULL,
  	"sort_order" numeric DEFAULT 100,
  	"hero_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shapes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"sort_order" numeric DEFAULT 100,
  	"icon_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "occasions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"sort_order" numeric DEFAULT 100,
  	"hero_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"gold_color" "enum_products_gallery_gold_color" DEFAULT ''
  );
  
  CREATE TABLE "products_metals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"purity" "enum_products_metals_purity" NOT NULL,
  	"weight_g" numeric NOT NULL
  );
  
  CREATE TABLE "products_diamonds" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"role" "enum_products_diamonds_role" DEFAULT 'small' NOT NULL,
  	"shape_id" integer,
  	"size_mm" varchar,
  	"weight_ct" numeric NOT NULL,
  	"count" numeric DEFAULT 1 NOT NULL,
  	"cut" varchar,
  	"color" varchar,
  	"clarity" varchar
  );
  
  CREATE TABLE "products_color_stones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"stone_id" integer NOT NULL,
  	"weight_ct" numeric NOT NULL,
  	"count" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"status" "enum_products_status" DEFAULT 'draft',
  	"slug" varchar,
  	"display_name" varchar NOT NULL,
  	"description" varchar,
  	"category_id" integer NOT NULL,
  	"sub_category_id" integer,
  	"primary_shape_id" integer,
  	"is_solitaire" boolean DEFAULT false,
  	"is_ring" boolean DEFAULT false,
  	"fulfillment_type" "enum_products_fulfillment_type" DEFAULT 'made_to_order' NOT NULL,
  	"stock_quantity" numeric DEFAULT 0,
  	"hero_image_id" integer,
  	"default_gold_color" "enum_products_default_gold_color" DEFAULT 'yellow',
  	"from_price_inr" numeric,
  	"designer_notes" varchar,
  	"remarks" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "diamond_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"display_order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "color_stones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"grade" "enum_color_stones_grade" DEFAULT 'Standard',
  	"rate_per_ct" numeric NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rate_gold" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"purity" "enum_rate_gold_purity" NOT NULL,
  	"rate_per_g" numeric NOT NULL,
  	"source" "enum_rate_gold_source" DEFAULT 'manual',
  	"effective_at" timestamp(3) with time zone NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rate_diamond" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"diamond_category_id" integer NOT NULL,
  	"ct_band_min" numeric DEFAULT 0 NOT NULL,
  	"ct_band_max" numeric NOT NULL,
  	"rate_per_ct" numeric NOT NULL,
  	"cut" varchar,
  	"color" varchar,
  	"clarity" varchar,
  	"effective_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "making_rules" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"metal_type" "enum_making_rules_metal_type" NOT NULL,
  	"type" "enum_making_rules_type" DEFAULT 'wastage_plus_making' NOT NULL,
  	"wastage_pct" numeric DEFAULT 0,
  	"making_per_g" numeric NOT NULL,
  	"min_making" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "fx_rates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"currency" "enum_fx_rates_currency" NOT NULL,
  	"inr_per_unit" numeric NOT NULL,
  	"source" "enum_fx_rates_source" DEFAULT 'manual',
  	"effective_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customers_segments" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_customers_segments",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "customers_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar,
  	"phone" varchar,
  	"wa_opt_in" boolean DEFAULT false,
  	"source" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"categories_id" integer,
  	"sub_categories_id" integer,
  	"shapes_id" integer,
  	"occasions_id" integer,
  	"products_id" integer,
  	"diamond_categories_id" integer,
  	"color_stones_id" integer,
  	"rate_gold_id" integer,
  	"rate_diamond_id" integer,
  	"making_rules_id" integer,
  	"fx_rates_id" integer,
  	"customers_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"customers_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"made_to_order_disclaimer" varchar DEFAULT 'Most of our pieces are crafted to order. The price shown is an estimate based on current gold and diamond rates. The final invoice is issued at dispatch and may vary slightly depending on the exact stones sourced and any rate movement during production.',
  	"ready_stock_badge_text" varchar DEFAULT 'In Stock — ready to ship',
  	"ready_stock_price_note" varchar DEFAULT 'Confirmed price. Ships within 3-5 business days.',
  	"quote_validity_days" numeric DEFAULT 7,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "feature_flags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"wa_business_api" boolean DEFAULT false,
  	"wa_shared_inbox" boolean DEFAULT false,
  	"wa_login" boolean DEFAULT false,
  	"ai_draft_replies" boolean DEFAULT false,
  	"ai_web_chatbot" boolean DEFAULT false,
  	"ai_voice_agent" boolean DEFAULT false,
  	"ai_reference_image_search" boolean DEFAULT false,
  	"gold_rate_live_ibja" boolean DEFAULT false,
  	"gold_rate_auto_recompute" boolean DEFAULT false,
  	"fx_live" boolean DEFAULT false,
  	"checkout_cashfree" boolean DEFAULT false,
  	"checkout_gst_invoice_pdf" boolean DEFAULT false,
  	"shipping_serviceability" boolean DEFAULT false,
  	"meta_capi_server_side" boolean DEFAULT false,
  	"email_transactional" boolean DEFAULT false,
  	"email_campaigns" boolean DEFAULT false,
  	"campaigns_scheduled_sends" boolean DEFAULT false,
  	"search_semantic_pgvector" boolean DEFAULT false,
  	"similar_products_vector" boolean DEFAULT false,
  	"scraper_competitor_designs" boolean DEFAULT false,
  	"wallet_cashback_engine" boolean DEFAULT false,
  	"wallet_loyalty_points" boolean DEFAULT false,
  	"i18n_hindi" boolean DEFAULT false,
  	"i18n_other_languages" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shapes" ADD CONSTRAINT "shapes_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "occasions" ADD CONSTRAINT "occasions_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_gallery" ADD CONSTRAINT "products_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_metals" ADD CONSTRAINT "products_metals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_diamonds" ADD CONSTRAINT "products_diamonds_shape_id_shapes_id_fk" FOREIGN KEY ("shape_id") REFERENCES "public"."shapes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_diamonds" ADD CONSTRAINT "products_diamonds_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_color_stones" ADD CONSTRAINT "products_color_stones_stone_id_color_stones_id_fk" FOREIGN KEY ("stone_id") REFERENCES "public"."color_stones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_color_stones" ADD CONSTRAINT "products_color_stones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_sub_category_id_sub_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."sub_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_primary_shape_id_shapes_id_fk" FOREIGN KEY ("primary_shape_id") REFERENCES "public"."shapes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "rate_diamond" ADD CONSTRAINT "rate_diamond_diamond_category_id_diamond_categories_id_fk" FOREIGN KEY ("diamond_category_id") REFERENCES "public"."diamond_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "customers_segments" ADD CONSTRAINT "customers_segments_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customers_sessions" ADD CONSTRAINT "customers_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sub_categories_fk" FOREIGN KEY ("sub_categories_id") REFERENCES "public"."sub_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shapes_fk" FOREIGN KEY ("shapes_id") REFERENCES "public"."shapes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_occasions_fk" FOREIGN KEY ("occasions_id") REFERENCES "public"."occasions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_diamond_categories_fk" FOREIGN KEY ("diamond_categories_id") REFERENCES "public"."diamond_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_color_stones_fk" FOREIGN KEY ("color_stones_id") REFERENCES "public"."color_stones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_gold_fk" FOREIGN KEY ("rate_gold_id") REFERENCES "public"."rate_gold"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rate_diamond_fk" FOREIGN KEY ("rate_diamond_id") REFERENCES "public"."rate_diamond"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_making_rules_fk" FOREIGN KEY ("making_rules_id") REFERENCES "public"."making_rules"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fx_rates_fk" FOREIGN KEY ("fx_rates_id") REFERENCES "public"."fx_rates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumb_sizes_thumb_filename_idx" ON "media" USING btree ("sizes_thumb_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_zoom_sizes_zoom_filename_idx" ON "media" USING btree ("sizes_zoom_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE UNIQUE INDEX "categories_name_idx" ON "categories" USING btree ("name");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_hero_image_idx" ON "categories" USING btree ("hero_image_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "sub_categories_slug_idx" ON "sub_categories" USING btree ("slug");
  CREATE INDEX "sub_categories_category_idx" ON "sub_categories" USING btree ("category_id");
  CREATE INDEX "sub_categories_hero_image_idx" ON "sub_categories" USING btree ("hero_image_id");
  CREATE INDEX "sub_categories_updated_at_idx" ON "sub_categories" USING btree ("updated_at");
  CREATE INDEX "sub_categories_created_at_idx" ON "sub_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "category_slug_idx" ON "sub_categories" USING btree ("category_id","slug");
  CREATE UNIQUE INDEX "shapes_name_idx" ON "shapes" USING btree ("name");
  CREATE UNIQUE INDEX "shapes_slug_idx" ON "shapes" USING btree ("slug");
  CREATE INDEX "shapes_icon_idx" ON "shapes" USING btree ("icon_id");
  CREATE INDEX "shapes_updated_at_idx" ON "shapes" USING btree ("updated_at");
  CREATE INDEX "shapes_created_at_idx" ON "shapes" USING btree ("created_at");
  CREATE UNIQUE INDEX "occasions_name_idx" ON "occasions" USING btree ("name");
  CREATE UNIQUE INDEX "occasions_slug_idx" ON "occasions" USING btree ("slug");
  CREATE INDEX "occasions_hero_image_idx" ON "occasions" USING btree ("hero_image_id");
  CREATE INDEX "occasions_updated_at_idx" ON "occasions" USING btree ("updated_at");
  CREATE INDEX "occasions_created_at_idx" ON "occasions" USING btree ("created_at");
  CREATE INDEX "products_gallery_order_idx" ON "products_gallery" USING btree ("_order");
  CREATE INDEX "products_gallery_parent_id_idx" ON "products_gallery" USING btree ("_parent_id");
  CREATE INDEX "products_gallery_image_idx" ON "products_gallery" USING btree ("image_id");
  CREATE INDEX "products_metals_order_idx" ON "products_metals" USING btree ("_order");
  CREATE INDEX "products_metals_parent_id_idx" ON "products_metals" USING btree ("_parent_id");
  CREATE INDEX "products_diamonds_order_idx" ON "products_diamonds" USING btree ("_order");
  CREATE INDEX "products_diamonds_parent_id_idx" ON "products_diamonds" USING btree ("_parent_id");
  CREATE INDEX "products_diamonds_shape_idx" ON "products_diamonds" USING btree ("shape_id");
  CREATE INDEX "products_color_stones_order_idx" ON "products_color_stones" USING btree ("_order");
  CREATE INDEX "products_color_stones_parent_id_idx" ON "products_color_stones" USING btree ("_parent_id");
  CREATE INDEX "products_color_stones_stone_idx" ON "products_color_stones" USING btree ("stone_id");
  CREATE UNIQUE INDEX "products_code_idx" ON "products" USING btree ("code");
  CREATE INDEX "products_slug_idx" ON "products" USING btree ("slug");
  CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");
  CREATE INDEX "products_sub_category_idx" ON "products" USING btree ("sub_category_id");
  CREATE INDEX "products_primary_shape_idx" ON "products" USING btree ("primary_shape_id");
  CREATE INDEX "products_hero_image_idx" ON "products" USING btree ("hero_image_id");
  CREATE INDEX "products_from_price_inr_idx" ON "products" USING btree ("from_price_inr");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE UNIQUE INDEX "diamond_categories_name_idx" ON "diamond_categories" USING btree ("name");
  CREATE UNIQUE INDEX "diamond_categories_slug_idx" ON "diamond_categories" USING btree ("slug");
  CREATE INDEX "diamond_categories_updated_at_idx" ON "diamond_categories" USING btree ("updated_at");
  CREATE INDEX "diamond_categories_created_at_idx" ON "diamond_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "color_stones_slug_idx" ON "color_stones" USING btree ("slug");
  CREATE INDEX "color_stones_updated_at_idx" ON "color_stones" USING btree ("updated_at");
  CREATE INDEX "color_stones_created_at_idx" ON "color_stones" USING btree ("created_at");
  CREATE INDEX "rate_gold_purity_idx" ON "rate_gold" USING btree ("purity");
  CREATE INDEX "rate_gold_updated_at_idx" ON "rate_gold" USING btree ("updated_at");
  CREATE INDEX "rate_gold_created_at_idx" ON "rate_gold" USING btree ("created_at");
  CREATE INDEX "rate_diamond_diamond_category_idx" ON "rate_diamond" USING btree ("diamond_category_id");
  CREATE INDEX "rate_diamond_updated_at_idx" ON "rate_diamond" USING btree ("updated_at");
  CREATE INDEX "rate_diamond_created_at_idx" ON "rate_diamond" USING btree ("created_at");
  CREATE UNIQUE INDEX "making_rules_metal_type_idx" ON "making_rules" USING btree ("metal_type");
  CREATE INDEX "making_rules_updated_at_idx" ON "making_rules" USING btree ("updated_at");
  CREATE INDEX "making_rules_created_at_idx" ON "making_rules" USING btree ("created_at");
  CREATE INDEX "fx_rates_currency_idx" ON "fx_rates" USING btree ("currency");
  CREATE INDEX "fx_rates_updated_at_idx" ON "fx_rates" USING btree ("updated_at");
  CREATE INDEX "fx_rates_created_at_idx" ON "fx_rates" USING btree ("created_at");
  CREATE INDEX "customers_segments_order_idx" ON "customers_segments" USING btree ("order");
  CREATE INDEX "customers_segments_parent_idx" ON "customers_segments" USING btree ("parent_id");
  CREATE INDEX "customers_sessions_order_idx" ON "customers_sessions" USING btree ("_order");
  CREATE INDEX "customers_sessions_parent_id_idx" ON "customers_sessions" USING btree ("_parent_id");
  CREATE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_sub_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("sub_categories_id");
  CREATE INDEX "payload_locked_documents_rels_shapes_id_idx" ON "payload_locked_documents_rels" USING btree ("shapes_id");
  CREATE INDEX "payload_locked_documents_rels_occasions_id_idx" ON "payload_locked_documents_rels" USING btree ("occasions_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_diamond_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("diamond_categories_id");
  CREATE INDEX "payload_locked_documents_rels_color_stones_id_idx" ON "payload_locked_documents_rels" USING btree ("color_stones_id");
  CREATE INDEX "payload_locked_documents_rels_rate_gold_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_gold_id");
  CREATE INDEX "payload_locked_documents_rels_rate_diamond_id_idx" ON "payload_locked_documents_rels" USING btree ("rate_diamond_id");
  CREATE INDEX "payload_locked_documents_rels_making_rules_id_idx" ON "payload_locked_documents_rels" USING btree ("making_rules_id");
  CREATE INDEX "payload_locked_documents_rels_fx_rates_id_idx" ON "payload_locked_documents_rels" USING btree ("fx_rates_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_customers_id_idx" ON "payload_preferences_rels" USING btree ("customers_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "sub_categories" CASCADE;
  DROP TABLE "shapes" CASCADE;
  DROP TABLE "occasions" CASCADE;
  DROP TABLE "products_gallery" CASCADE;
  DROP TABLE "products_metals" CASCADE;
  DROP TABLE "products_diamonds" CASCADE;
  DROP TABLE "products_color_stones" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "diamond_categories" CASCADE;
  DROP TABLE "color_stones" CASCADE;
  DROP TABLE "rate_gold" CASCADE;
  DROP TABLE "rate_diamond" CASCADE;
  DROP TABLE "making_rules" CASCADE;
  DROP TABLE "fx_rates" CASCADE;
  DROP TABLE "customers_segments" CASCADE;
  DROP TABLE "customers_sessions" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "feature_flags" CASCADE;
  DROP TYPE "public"."enum_products_gallery_gold_color";
  DROP TYPE "public"."enum_products_metals_purity";
  DROP TYPE "public"."enum_products_diamonds_role";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum_products_fulfillment_type";
  DROP TYPE "public"."enum_products_default_gold_color";
  DROP TYPE "public"."enum_color_stones_grade";
  DROP TYPE "public"."enum_rate_gold_purity";
  DROP TYPE "public"."enum_rate_gold_source";
  DROP TYPE "public"."enum_making_rules_metal_type";
  DROP TYPE "public"."enum_making_rules_type";
  DROP TYPE "public"."enum_fx_rates_currency";
  DROP TYPE "public"."enum_fx_rates_source";
  DROP TYPE "public"."enum_customers_segments";`)
}
