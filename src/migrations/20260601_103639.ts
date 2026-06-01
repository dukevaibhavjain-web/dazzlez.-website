import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_collection_banners_overlay_opacity" AS ENUM('0', '15', '30', '50', '65');
  CREATE TYPE "public"."enum_collection_marketing_tiles_background_color" AS ENUM('cream', 'white', 'blush', 'sage', 'blue', 'navy', 'gold');
  CREATE TYPE "public"."enum_faqs_category" AS ENUM('general', 'diamonds', 'pricing', 'returns', 'shipping');
  CREATE TYPE "public"."enum_try_at_home_leads_status" AS ENUM('new', 'contacted', 'scheduled', 'converted', 'rejected');
  CREATE TYPE "public"."enum_try_at_home_leads_lead_source" AS ENUM('try-at-home', 'design-advisor', 'ai-chat', 'other');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('pending', 'captured', 'failed', 'refunded');
  CREATE TYPE "public"."enum_orders_fulfillment_status" AS ENUM('new', 'confirmed', 'in_production', 'ready', 'dispatched', 'delivered', 'cancelled');
  CREATE TYPE "public"."enum_site_settings_cashfree_environment" AS ENUM('sandbox', 'production');
  CREATE TYPE "public"."enum_site_settings_checkout_currency" AS ENUM('INR');
  CREATE TYPE "public"."enum_home_page_blocks_hero_banner_background_color" AS ENUM('navy', 'cream', 'white');
  CREATE TYPE "public"."enum_home_page_blocks_hero_banner_split_mode" AS ENUM('full', 'split-chat');
  CREATE TYPE "public"."enum_home_page_blocks_shape_grid_background_color" AS ENUM('cream', 'white', 'navy');
  CREATE TYPE "public"."enum_home_page_blocks_promise_strip_background_color" AS ENUM('white', 'cream', 'navy');
  CREATE TYPE "public"."enum_home_page_blocks_featured_products_items_metal" AS ENUM('', '9K', '14K', '18K', '22K', 'Silver925', 'Platinum');
  CREATE TYPE "public"."enum_chatbot_config_blocks_choice_step_options_category_slug" AS ENUM('rings', 'necklaces', 'earrings', 'bracelets', '');
  CREATE TYPE "public"."enum_chatbot_config_blocks_choice_step_options_behavior" AS ENUM('normal', 'prefer-chat');
  CREATE TYPE "public"."enum_chatbot_config_blocks_choice_step_options_wa_style" AS ENUM('standard', 'reference', 'expert', 'describe');
  CREATE TABLE "products_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"products_id" integer
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"product_id" integer NOT NULL,
  	"rating" numeric NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"author_name" varchar NOT NULL,
  	"review_date" timestamp(3) with time zone,
  	"verified" boolean DEFAULT true,
  	"approved" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "collection_banners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"description" varchar,
  	"image_url" varchar NOT NULL,
  	"mobile_image_url" varchar,
  	"overlay_opacity" "enum_collection_banners_overlay_opacity" DEFAULT '0',
  	"cta_text" varchar,
  	"cta_link" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "collection_marketing_tiles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"image_url" varchar,
  	"cta_text" varchar,
  	"cta_link" varchar,
  	"background_color" "enum_collection_marketing_tiles_background_color" DEFAULT 'cream',
  	"insert_after_nth_product" numeric DEFAULT 6,
  	"display_order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL,
  	"category" "enum_faqs_category" DEFAULT 'general',
  	"order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "trust_badges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"tooltip" varchar,
  	"order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "try_at_home_leads_reference_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "try_at_home_leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"address" varchar NOT NULL,
  	"city" varchar,
  	"state" varchar,
  	"pincode" varchar,
  	"product_code" varchar,
  	"product_name" varchar,
  	"status" "enum_try_at_home_leads_status" DEFAULT 'new',
  	"lead_source" "enum_try_at_home_leads_lead_source" DEFAULT 'try-at-home',
  	"admin_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_code" varchar NOT NULL,
  	"display_name" varchar NOT NULL,
  	"qty" numeric DEFAULT 1,
  	"metal" varchar,
  	"gold_color" varchar,
  	"diamond_tier" varchar,
  	"ring_size" varchar,
  	"carat_weight" varchar,
  	"unit_price_inr" numeric,
  	"engraving" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" varchar NOT NULL,
  	"cashfree_order_id" varchar,
  	"cashfree_payment_id" varchar,
  	"payment_status" "enum_orders_payment_status" DEFAULT 'pending' NOT NULL,
  	"fulfillment_status" "enum_orders_fulfillment_status" DEFAULT 'new' NOT NULL,
  	"customer_name" varchar NOT NULL,
  	"customer_phone" varchar NOT NULL,
  	"customer_email" varchar NOT NULL,
  	"shipping_address_line1" varchar NOT NULL,
  	"shipping_address_line2" varchar,
  	"shipping_address_city" varchar NOT NULL,
  	"shipping_address_state" varchar NOT NULL,
  	"shipping_address_pincode" varchar NOT NULL,
  	"subtotal_inr" numeric,
  	"gst_inr" numeric,
  	"total_inr" numeric NOT NULL,
  	"order_notes" varchar,
  	"gst_invoice_requested" boolean,
  	"tracking_info" varchar,
  	"admin_notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "try_at_home_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"title" varchar DEFAULT 'Try at Home',
  	"description" varchar DEFAULT 'Try your selected pieces from the comfort of your home. Our representative visits you — no payment until you decide.',
  	"button_text" varchar DEFAULT 'Request a Home Trial',
  	"image_id" integer,
  	"disclaimer" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_page_blocks_hero_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"image_url" varchar,
  	"mobile_image_url" varchar,
  	"background_color" "enum_home_page_blocks_hero_banner_background_color" DEFAULT 'navy',
  	"primary_cta_text" varchar,
  	"primary_cta_link" varchar,
  	"secondary_cta_text" varchar,
  	"secondary_cta_link" varchar,
  	"split_mode" "enum_home_page_blocks_hero_banner_split_mode" DEFAULT 'full',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_category_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_id" integer NOT NULL,
  	"image_url" varchar,
  	"label_override" varchar
  );
  
  CREATE TABLE "home_page_blocks_category_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Shop By',
  	"title" varchar DEFAULT 'Category' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_image_banner" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_url" varchar NOT NULL,
  	"mobile_image_url" varchar,
  	"alt_text" varchar,
  	"link" varchar,
  	"overlay_text" varchar,
  	"cta_text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_shape_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Shop By',
  	"title" varchar DEFAULT 'Shape',
  	"background_color" "enum_home_page_blocks_shape_grid_background_color" DEFAULT 'cream',
  	"link_to_category" varchar DEFAULT '/collections/rings',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_promise_strip_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" varchar,
  	"icon_url" varchar,
  	"title" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "home_page_blocks_promise_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"title" varchar,
  	"background_color" "enum_home_page_blocks_promise_strip_background_color" DEFAULT 'white',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_featured_products_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category_id" integer,
  	"product_id" integer NOT NULL,
  	"metal" "enum_home_page_blocks_featured_products_items_metal" DEFAULT ''
  );
  
  CREATE TABLE "home_page_blocks_featured_products" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Handpicked For You',
  	"title" varchar DEFAULT 'Featured Pieces' NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page_blocks_customization_chat" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Find Your Perfect Piece',
  	"subheading" varchar DEFAULT 'Tell us what you''re looking for — our AI advisor will help you find it.',
  	"placeholder_text" varchar DEFAULT 'E.g. ''A rose gold ring for my anniversary under ₹1 lakh''',
  	"cta_label" varchar DEFAULT 'Start Designing',
  	"whatsapp_number" varchar DEFAULT '+919829115205',
  	"block_name" varchar
  );
  
  CREATE TABLE "home_page" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "chatbot_config_blocks_choice_step_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"emoji" varchar,
  	"go_to_step_key" varchar,
  	"category_slug" "enum_chatbot_config_blocks_choice_step_options_category_slug",
  	"behavior" "enum_chatbot_config_blocks_choice_step_options_behavior" DEFAULT 'normal',
  	"min_price" numeric DEFAULT 0,
  	"max_price" numeric DEFAULT 0,
  	"wa_style" "enum_chatbot_config_blocks_choice_step_options_wa_style" DEFAULT 'standard',
  	"pixel_event" varchar,
  	"pixel_params" varchar
  );
  
  CREATE TABLE "chatbot_config_blocks_choice_step" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step_key" varchar NOT NULL,
  	"question_text" varchar NOT NULL,
  	"subtitle" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "chatbot_config_blocks_describe_step_hints" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "chatbot_config_blocks_describe_step" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step_key" varchar NOT NULL,
  	"question_text" varchar NOT NULL,
  	"subtitle" varchar,
  	"placeholder" varchar DEFAULT 'E.g. "A dainty rose-gold ring with a small oval diamond for my wife''s birthday — she loves minimalist jewellery and wears it daily."',
  	"go_to_step_key" varchar DEFAULT '__results__',
  	"block_name" varchar
  );
  
  CREATE TABLE "chatbot_config_blocks_upload_step" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step_key" varchar NOT NULL,
  	"question_text" varchar DEFAULT 'Upload your reference' NOT NULL,
  	"subtitle" varchar DEFAULT 'Share up to 3 images — our advisor will reach out based on your style.',
  	"go_to_step_key" varchar DEFAULT '__results__',
  	"block_name" varchar
  );
  
  CREATE TABLE "chatbot_config" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"entry_step_key" varchar DEFAULT 'occasion',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "products" ADD COLUMN "hero_image_yellow_id" integer;
  ALTER TABLE "products" ADD COLUMN "hero_image_white_id" integer;
  ALTER TABLE "products" ADD COLUMN "hero_image_rose_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reviews_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "collection_banners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "collection_marketing_tiles_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trust_badges_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "try_at_home_leads_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "site_settings" ADD COLUMN "meta_pixel_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "ga4_measurement_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "tiktok_pixel_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "whatsapp_number" varchar DEFAULT '+919829115205';
  ALTER TABLE "site_settings" ADD COLUMN "google_tag_manager_id" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "cashfree_environment" "enum_site_settings_cashfree_environment" DEFAULT 'sandbox';
  ALTER TABLE "site_settings" ADD COLUMN "checkout_deposit_pct" numeric DEFAULT 100;
  ALTER TABLE "site_settings" ADD COLUMN "checkout_currency" "enum_site_settings_checkout_currency" DEFAULT 'INR';
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_rels" ADD CONSTRAINT "products_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "collection_banners" ADD CONSTRAINT "collection_banners_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "collection_marketing_tiles" ADD CONSTRAINT "collection_marketing_tiles_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "try_at_home_leads_reference_images" ADD CONSTRAINT "try_at_home_leads_reference_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."try_at_home_leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "try_at_home_settings" ADD CONSTRAINT "try_at_home_settings_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_blocks_hero_banner" ADD CONSTRAINT "home_page_blocks_hero_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_category_grid_items" ADD CONSTRAINT "home_page_blocks_category_grid_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_blocks_category_grid_items" ADD CONSTRAINT "home_page_blocks_category_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_blocks_category_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_category_grid" ADD CONSTRAINT "home_page_blocks_category_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_image_banner" ADD CONSTRAINT "home_page_blocks_image_banner_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_shape_grid" ADD CONSTRAINT "home_page_blocks_shape_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_promise_strip_items" ADD CONSTRAINT "home_page_blocks_promise_strip_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_blocks_promise_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_promise_strip" ADD CONSTRAINT "home_page_blocks_promise_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_featured_products_items" ADD CONSTRAINT "home_page_blocks_featured_products_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_blocks_featured_products_items" ADD CONSTRAINT "home_page_blocks_featured_products_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_page_blocks_featured_products_items" ADD CONSTRAINT "home_page_blocks_featured_products_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page_blocks_featured_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_featured_products" ADD CONSTRAINT "home_page_blocks_featured_products_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_page_blocks_customization_chat" ADD CONSTRAINT "home_page_blocks_customization_chat_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_page"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chatbot_config_blocks_choice_step_options" ADD CONSTRAINT "chatbot_config_blocks_choice_step_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chatbot_config_blocks_choice_step"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chatbot_config_blocks_choice_step" ADD CONSTRAINT "chatbot_config_blocks_choice_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chatbot_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chatbot_config_blocks_describe_step_hints" ADD CONSTRAINT "chatbot_config_blocks_describe_step_hints_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chatbot_config_blocks_describe_step"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chatbot_config_blocks_describe_step" ADD CONSTRAINT "chatbot_config_blocks_describe_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chatbot_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "chatbot_config_blocks_upload_step" ADD CONSTRAINT "chatbot_config_blocks_upload_step_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."chatbot_config"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_rels_order_idx" ON "products_rels" USING btree ("order");
  CREATE INDEX "products_rels_parent_idx" ON "products_rels" USING btree ("parent_id");
  CREATE INDEX "products_rels_path_idx" ON "products_rels" USING btree ("path");
  CREATE INDEX "products_rels_products_id_idx" ON "products_rels" USING btree ("products_id");
  CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "collection_banners_category_idx" ON "collection_banners" USING btree ("category_id");
  CREATE INDEX "collection_banners_updated_at_idx" ON "collection_banners" USING btree ("updated_at");
  CREATE INDEX "collection_banners_created_at_idx" ON "collection_banners" USING btree ("created_at");
  CREATE INDEX "collection_marketing_tiles_category_idx" ON "collection_marketing_tiles" USING btree ("category_id");
  CREATE INDEX "collection_marketing_tiles_updated_at_idx" ON "collection_marketing_tiles" USING btree ("updated_at");
  CREATE INDEX "collection_marketing_tiles_created_at_idx" ON "collection_marketing_tiles" USING btree ("created_at");
  CREATE INDEX "faqs_updated_at_idx" ON "faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "faqs" USING btree ("created_at");
  CREATE INDEX "trust_badges_updated_at_idx" ON "trust_badges" USING btree ("updated_at");
  CREATE INDEX "trust_badges_created_at_idx" ON "trust_badges" USING btree ("created_at");
  CREATE INDEX "try_at_home_leads_reference_images_order_idx" ON "try_at_home_leads_reference_images" USING btree ("_order");
  CREATE INDEX "try_at_home_leads_reference_images_parent_id_idx" ON "try_at_home_leads_reference_images" USING btree ("_parent_id");
  CREATE INDEX "try_at_home_leads_updated_at_idx" ON "try_at_home_leads" USING btree ("updated_at");
  CREATE INDEX "try_at_home_leads_created_at_idx" ON "try_at_home_leads" USING btree ("created_at");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "orders_order_id_idx" ON "orders" USING btree ("order_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "try_at_home_settings_image_idx" ON "try_at_home_settings" USING btree ("image_id");
  CREATE INDEX "home_page_blocks_hero_banner_order_idx" ON "home_page_blocks_hero_banner" USING btree ("_order");
  CREATE INDEX "home_page_blocks_hero_banner_parent_id_idx" ON "home_page_blocks_hero_banner" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_hero_banner_path_idx" ON "home_page_blocks_hero_banner" USING btree ("_path");
  CREATE INDEX "home_page_blocks_category_grid_items_order_idx" ON "home_page_blocks_category_grid_items" USING btree ("_order");
  CREATE INDEX "home_page_blocks_category_grid_items_parent_id_idx" ON "home_page_blocks_category_grid_items" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_category_grid_items_category_idx" ON "home_page_blocks_category_grid_items" USING btree ("category_id");
  CREATE INDEX "home_page_blocks_category_grid_order_idx" ON "home_page_blocks_category_grid" USING btree ("_order");
  CREATE INDEX "home_page_blocks_category_grid_parent_id_idx" ON "home_page_blocks_category_grid" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_category_grid_path_idx" ON "home_page_blocks_category_grid" USING btree ("_path");
  CREATE INDEX "home_page_blocks_image_banner_order_idx" ON "home_page_blocks_image_banner" USING btree ("_order");
  CREATE INDEX "home_page_blocks_image_banner_parent_id_idx" ON "home_page_blocks_image_banner" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_image_banner_path_idx" ON "home_page_blocks_image_banner" USING btree ("_path");
  CREATE INDEX "home_page_blocks_shape_grid_order_idx" ON "home_page_blocks_shape_grid" USING btree ("_order");
  CREATE INDEX "home_page_blocks_shape_grid_parent_id_idx" ON "home_page_blocks_shape_grid" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_shape_grid_path_idx" ON "home_page_blocks_shape_grid" USING btree ("_path");
  CREATE INDEX "home_page_blocks_promise_strip_items_order_idx" ON "home_page_blocks_promise_strip_items" USING btree ("_order");
  CREATE INDEX "home_page_blocks_promise_strip_items_parent_id_idx" ON "home_page_blocks_promise_strip_items" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_promise_strip_order_idx" ON "home_page_blocks_promise_strip" USING btree ("_order");
  CREATE INDEX "home_page_blocks_promise_strip_parent_id_idx" ON "home_page_blocks_promise_strip" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_promise_strip_path_idx" ON "home_page_blocks_promise_strip" USING btree ("_path");
  CREATE INDEX "home_page_blocks_featured_products_items_order_idx" ON "home_page_blocks_featured_products_items" USING btree ("_order");
  CREATE INDEX "home_page_blocks_featured_products_items_parent_id_idx" ON "home_page_blocks_featured_products_items" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_featured_products_items_category_idx" ON "home_page_blocks_featured_products_items" USING btree ("category_id");
  CREATE INDEX "home_page_blocks_featured_products_items_product_idx" ON "home_page_blocks_featured_products_items" USING btree ("product_id");
  CREATE INDEX "home_page_blocks_featured_products_order_idx" ON "home_page_blocks_featured_products" USING btree ("_order");
  CREATE INDEX "home_page_blocks_featured_products_parent_id_idx" ON "home_page_blocks_featured_products" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_featured_products_path_idx" ON "home_page_blocks_featured_products" USING btree ("_path");
  CREATE INDEX "home_page_blocks_customization_chat_order_idx" ON "home_page_blocks_customization_chat" USING btree ("_order");
  CREATE INDEX "home_page_blocks_customization_chat_parent_id_idx" ON "home_page_blocks_customization_chat" USING btree ("_parent_id");
  CREATE INDEX "home_page_blocks_customization_chat_path_idx" ON "home_page_blocks_customization_chat" USING btree ("_path");
  CREATE INDEX "chatbot_config_blocks_choice_step_options_order_idx" ON "chatbot_config_blocks_choice_step_options" USING btree ("_order");
  CREATE INDEX "chatbot_config_blocks_choice_step_options_parent_id_idx" ON "chatbot_config_blocks_choice_step_options" USING btree ("_parent_id");
  CREATE INDEX "chatbot_config_blocks_choice_step_order_idx" ON "chatbot_config_blocks_choice_step" USING btree ("_order");
  CREATE INDEX "chatbot_config_blocks_choice_step_parent_id_idx" ON "chatbot_config_blocks_choice_step" USING btree ("_parent_id");
  CREATE INDEX "chatbot_config_blocks_choice_step_path_idx" ON "chatbot_config_blocks_choice_step" USING btree ("_path");
  CREATE INDEX "chatbot_config_blocks_describe_step_hints_order_idx" ON "chatbot_config_blocks_describe_step_hints" USING btree ("_order");
  CREATE INDEX "chatbot_config_blocks_describe_step_hints_parent_id_idx" ON "chatbot_config_blocks_describe_step_hints" USING btree ("_parent_id");
  CREATE INDEX "chatbot_config_blocks_describe_step_order_idx" ON "chatbot_config_blocks_describe_step" USING btree ("_order");
  CREATE INDEX "chatbot_config_blocks_describe_step_parent_id_idx" ON "chatbot_config_blocks_describe_step" USING btree ("_parent_id");
  CREATE INDEX "chatbot_config_blocks_describe_step_path_idx" ON "chatbot_config_blocks_describe_step" USING btree ("_path");
  CREATE INDEX "chatbot_config_blocks_upload_step_order_idx" ON "chatbot_config_blocks_upload_step" USING btree ("_order");
  CREATE INDEX "chatbot_config_blocks_upload_step_parent_id_idx" ON "chatbot_config_blocks_upload_step" USING btree ("_parent_id");
  CREATE INDEX "chatbot_config_blocks_upload_step_path_idx" ON "chatbot_config_blocks_upload_step" USING btree ("_path");
  ALTER TABLE "products" ADD CONSTRAINT "products_hero_image_yellow_id_media_id_fk" FOREIGN KEY ("hero_image_yellow_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_hero_image_white_id_media_id_fk" FOREIGN KEY ("hero_image_white_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products" ADD CONSTRAINT "products_hero_image_rose_id_media_id_fk" FOREIGN KEY ("hero_image_rose_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_collection_banners_fk" FOREIGN KEY ("collection_banners_id") REFERENCES "public"."collection_banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_collection_marketing_tiles_fk" FOREIGN KEY ("collection_marketing_tiles_id") REFERENCES "public"."collection_marketing_tiles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "public"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trust_badges_fk" FOREIGN KEY ("trust_badges_id") REFERENCES "public"."trust_badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_try_at_home_leads_fk" FOREIGN KEY ("try_at_home_leads_id") REFERENCES "public"."try_at_home_leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_hero_image_yellow_idx" ON "products" USING btree ("hero_image_yellow_id");
  CREATE INDEX "products_hero_image_white_idx" ON "products" USING btree ("hero_image_white_id");
  CREATE INDEX "products_hero_image_rose_idx" ON "products" USING btree ("hero_image_rose_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_collection_banners_id_idx" ON "payload_locked_documents_rels" USING btree ("collection_banners_id");
  CREATE INDEX "payload_locked_documents_rels_collection_marketing_tiles_idx" ON "payload_locked_documents_rels" USING btree ("collection_marketing_tiles_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_trust_badges_id_idx" ON "payload_locked_documents_rels" USING btree ("trust_badges_id");
  CREATE INDEX "payload_locked_documents_rels_try_at_home_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("try_at_home_leads_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "collection_banners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "collection_marketing_tiles" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trust_badges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "try_at_home_leads_reference_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "try_at_home_leads" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "try_at_home_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_hero_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_category_grid_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_category_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_image_banner" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_shape_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_promise_strip_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_promise_strip" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_featured_products_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_featured_products" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page_blocks_customization_chat" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "home_page" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chatbot_config_blocks_choice_step_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chatbot_config_blocks_choice_step" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chatbot_config_blocks_describe_step_hints" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chatbot_config_blocks_describe_step" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chatbot_config_blocks_upload_step" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "chatbot_config" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_rels" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "collection_banners" CASCADE;
  DROP TABLE "collection_marketing_tiles" CASCADE;
  DROP TABLE "faqs" CASCADE;
  DROP TABLE "trust_badges" CASCADE;
  DROP TABLE "try_at_home_leads_reference_images" CASCADE;
  DROP TABLE "try_at_home_leads" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "try_at_home_settings" CASCADE;
  DROP TABLE "home_page_blocks_hero_banner" CASCADE;
  DROP TABLE "home_page_blocks_category_grid_items" CASCADE;
  DROP TABLE "home_page_blocks_category_grid" CASCADE;
  DROP TABLE "home_page_blocks_image_banner" CASCADE;
  DROP TABLE "home_page_blocks_shape_grid" CASCADE;
  DROP TABLE "home_page_blocks_promise_strip_items" CASCADE;
  DROP TABLE "home_page_blocks_promise_strip" CASCADE;
  DROP TABLE "home_page_blocks_featured_products_items" CASCADE;
  DROP TABLE "home_page_blocks_featured_products" CASCADE;
  DROP TABLE "home_page_blocks_customization_chat" CASCADE;
  DROP TABLE "home_page" CASCADE;
  DROP TABLE "chatbot_config_blocks_choice_step_options" CASCADE;
  DROP TABLE "chatbot_config_blocks_choice_step" CASCADE;
  DROP TABLE "chatbot_config_blocks_describe_step_hints" CASCADE;
  DROP TABLE "chatbot_config_blocks_describe_step" CASCADE;
  DROP TABLE "chatbot_config_blocks_upload_step" CASCADE;
  DROP TABLE "chatbot_config" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_hero_image_yellow_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_hero_image_white_id_media_id_fk";
  
  ALTER TABLE "products" DROP CONSTRAINT "products_hero_image_rose_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reviews_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_collection_banners_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_collection_marketing_tiles_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faqs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trust_badges_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_try_at_home_leads_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  DROP INDEX "products_hero_image_yellow_idx";
  DROP INDEX "products_hero_image_white_idx";
  DROP INDEX "products_hero_image_rose_idx";
  DROP INDEX "payload_locked_documents_rels_reviews_id_idx";
  DROP INDEX "payload_locked_documents_rels_collection_banners_id_idx";
  DROP INDEX "payload_locked_documents_rels_collection_marketing_tiles_idx";
  DROP INDEX "payload_locked_documents_rels_faqs_id_idx";
  DROP INDEX "payload_locked_documents_rels_trust_badges_id_idx";
  DROP INDEX "payload_locked_documents_rels_try_at_home_leads_id_idx";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  ALTER TABLE "products" DROP COLUMN "hero_image_yellow_id";
  ALTER TABLE "products" DROP COLUMN "hero_image_white_id";
  ALTER TABLE "products" DROP COLUMN "hero_image_rose_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reviews_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "collection_banners_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "collection_marketing_tiles_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faqs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trust_badges_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "try_at_home_leads_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "site_settings" DROP COLUMN "meta_pixel_id";
  ALTER TABLE "site_settings" DROP COLUMN "ga4_measurement_id";
  ALTER TABLE "site_settings" DROP COLUMN "tiktok_pixel_id";
  ALTER TABLE "site_settings" DROP COLUMN "whatsapp_number";
  ALTER TABLE "site_settings" DROP COLUMN "google_tag_manager_id";
  ALTER TABLE "site_settings" DROP COLUMN "cashfree_environment";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_deposit_pct";
  ALTER TABLE "site_settings" DROP COLUMN "checkout_currency";
  DROP TYPE "public"."enum_collection_banners_overlay_opacity";
  DROP TYPE "public"."enum_collection_marketing_tiles_background_color";
  DROP TYPE "public"."enum_faqs_category";
  DROP TYPE "public"."enum_try_at_home_leads_status";
  DROP TYPE "public"."enum_try_at_home_leads_lead_source";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_orders_fulfillment_status";
  DROP TYPE "public"."enum_site_settings_cashfree_environment";
  DROP TYPE "public"."enum_site_settings_checkout_currency";
  DROP TYPE "public"."enum_home_page_blocks_hero_banner_background_color";
  DROP TYPE "public"."enum_home_page_blocks_hero_banner_split_mode";
  DROP TYPE "public"."enum_home_page_blocks_shape_grid_background_color";
  DROP TYPE "public"."enum_home_page_blocks_promise_strip_background_color";
  DROP TYPE "public"."enum_home_page_blocks_featured_products_items_metal";
  DROP TYPE "public"."enum_chatbot_config_blocks_choice_step_options_category_slug";
  DROP TYPE "public"."enum_chatbot_config_blocks_choice_step_options_behavior";
  DROP TYPE "public"."enum_chatbot_config_blocks_choice_step_options_wa_style";`)
}
