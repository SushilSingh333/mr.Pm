import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_city_service_pages_body_reviews_rating" AS ENUM('5', '4', '3', '2', '1');
  CREATE TYPE "public"."enum_city_service_pages_body_reviews_source" AS ENUM('Google', 'Justdial', 'Facebook', 'Direct');
  CREATE TYPE "public"."enum_city_service_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__city_service_pages_v_version_body_reviews_rating" AS ENUM('5', '4', '3', '2', '1');
  CREATE TYPE "public"."enum__city_service_pages_v_version_body_reviews_source" AS ENUM('Google', 'Justdial', 'Facebook', 'Direct');
  CREATE TYPE "public"."enum__city_service_pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "locations_body_societies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "_locations_v_version_body_societies" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "city_service_pages_body_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "city_service_pages_blocks_svc_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "city_service_pages_blocks_svc_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "city_service_pages_blocks_svc_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "city_service_pages_blocks_svc_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "city_service_pages_blocks_svc_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "city_service_pages_blocks_svc_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"c1" varchar,
  	"c2" varchar,
  	"c3" varchar,
  	"c4" varchar
  );
  
  CREATE TABLE "city_service_pages_blocks_svc_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"h1" varchar,
  	"h2" varchar,
  	"h3" varchar,
  	"h4" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "city_service_pages_blocks_svc_scope" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "city_service_pages_body_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar
  );
  
  CREATE TABLE "city_service_pages_body_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "city_service_pages_body_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"move" varchar,
  	"text" varchar,
  	"rating" "enum_city_service_pages_body_reviews_rating",
  	"date" varchar,
  	"source" "enum_city_service_pages_body_reviews_source"
  );
  
  CREATE TABLE "city_service_pages_body_routes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "city_service_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"city_id" integer,
  	"service_id" integer,
  	"h1" varchar,
  	"body_subhead" varchar,
  	"body_faq_heading" varchar,
  	"body_reviews_heading" varchar,
  	"body_services_heading" varchar,
  	"body_nearby_heading" varchar,
  	"body_nearby_intro" varchar,
  	"body_cta_heading" varchar,
  	"body_cta_text" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_city_service_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_city_service_pages_v_version_body_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_blocks_svc_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_blocks_svc_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_blocks_svc_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_blocks_svc_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_blocks_svc_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_blocks_svc_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"c1" varchar,
  	"c2" varchar,
  	"c3" varchar,
  	"c4" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_blocks_svc_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"h1" varchar,
  	"h2" varchar,
  	"h3" varchar,
  	"h4" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_blocks_svc_scope" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_version_body_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_version_body_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_version_body_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"move" varchar,
  	"text" varchar,
  	"rating" "enum__city_service_pages_v_version_body_reviews_rating",
  	"date" varchar,
  	"source" "enum__city_service_pages_v_version_body_reviews_source",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_city_service_pages_v_version_body_routes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_city_service_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_city_id" integer,
  	"version_service_id" integer,
  	"version_h1" varchar,
  	"version_body_subhead" varchar,
  	"version_body_faq_heading" varchar,
  	"version_body_reviews_heading" varchar,
  	"version_body_services_heading" varchar,
  	"version_body_nearby_heading" varchar,
  	"version_body_nearby_intro" varchar,
  	"version_body_cta_heading" varchar,
  	"version_body_cta_text" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__city_service_pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "org_profile" ALTER COLUMN "cin" DROP NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "city_service_pages_id" integer;
  ALTER TABLE "org_profile" ADD COLUMN "trade_name" varchar;
  ALTER TABLE "locations_body_societies" ADD CONSTRAINT "locations_body_societies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_version_body_societies" ADD CONSTRAINT "_locations_v_version_body_societies_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_body_trust" ADD CONSTRAINT "city_service_pages_body_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_blocks_svc_text" ADD CONSTRAINT "city_service_pages_blocks_svc_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_blocks_svc_steps_items" ADD CONSTRAINT "city_service_pages_blocks_svc_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages_blocks_svc_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_blocks_svc_steps" ADD CONSTRAINT "city_service_pages_blocks_svc_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_blocks_svc_list_items" ADD CONSTRAINT "city_service_pages_blocks_svc_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages_blocks_svc_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_blocks_svc_list" ADD CONSTRAINT "city_service_pages_blocks_svc_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_blocks_svc_table_rows" ADD CONSTRAINT "city_service_pages_blocks_svc_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages_blocks_svc_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_blocks_svc_table" ADD CONSTRAINT "city_service_pages_blocks_svc_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_blocks_svc_scope" ADD CONSTRAINT "city_service_pages_blocks_svc_scope_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_body_sections" ADD CONSTRAINT "city_service_pages_body_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_body_faqs" ADD CONSTRAINT "city_service_pages_body_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_body_reviews" ADD CONSTRAINT "city_service_pages_body_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages_body_routes" ADD CONSTRAINT "city_service_pages_body_routes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "city_service_pages" ADD CONSTRAINT "city_service_pages_city_id_locations_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "city_service_pages" ADD CONSTRAINT "city_service_pages_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_version_body_trust" ADD CONSTRAINT "_city_service_pages_v_version_body_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_blocks_svc_text" ADD CONSTRAINT "_city_service_pages_v_blocks_svc_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_blocks_svc_steps_items" ADD CONSTRAINT "_city_service_pages_v_blocks_svc_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v_blocks_svc_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_blocks_svc_steps" ADD CONSTRAINT "_city_service_pages_v_blocks_svc_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_blocks_svc_list_items" ADD CONSTRAINT "_city_service_pages_v_blocks_svc_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v_blocks_svc_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_blocks_svc_list" ADD CONSTRAINT "_city_service_pages_v_blocks_svc_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_blocks_svc_table_rows" ADD CONSTRAINT "_city_service_pages_v_blocks_svc_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v_blocks_svc_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_blocks_svc_table" ADD CONSTRAINT "_city_service_pages_v_blocks_svc_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_blocks_svc_scope" ADD CONSTRAINT "_city_service_pages_v_blocks_svc_scope_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_version_body_sections" ADD CONSTRAINT "_city_service_pages_v_version_body_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_version_body_faqs" ADD CONSTRAINT "_city_service_pages_v_version_body_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_version_body_reviews" ADD CONSTRAINT "_city_service_pages_v_version_body_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v_version_body_routes" ADD CONSTRAINT "_city_service_pages_v_version_body_routes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_city_service_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v" ADD CONSTRAINT "_city_service_pages_v_parent_id_city_service_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."city_service_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v" ADD CONSTRAINT "_city_service_pages_v_version_city_id_locations_id_fk" FOREIGN KEY ("version_city_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_city_service_pages_v" ADD CONSTRAINT "_city_service_pages_v_version_service_id_services_id_fk" FOREIGN KEY ("version_service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "locations_body_societies_order_idx" ON "locations_body_societies" USING btree ("_order");
  CREATE INDEX "locations_body_societies_parent_id_idx" ON "locations_body_societies" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_version_body_societies_order_idx" ON "_locations_v_version_body_societies" USING btree ("_order");
  CREATE INDEX "_locations_v_version_body_societies_parent_id_idx" ON "_locations_v_version_body_societies" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_body_trust_order_idx" ON "city_service_pages_body_trust" USING btree ("_order");
  CREATE INDEX "city_service_pages_body_trust_parent_id_idx" ON "city_service_pages_body_trust" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_blocks_svc_text_order_idx" ON "city_service_pages_blocks_svc_text" USING btree ("_order");
  CREATE INDEX "city_service_pages_blocks_svc_text_parent_id_idx" ON "city_service_pages_blocks_svc_text" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_blocks_svc_text_path_idx" ON "city_service_pages_blocks_svc_text" USING btree ("_path");
  CREATE INDEX "city_service_pages_blocks_svc_steps_items_order_idx" ON "city_service_pages_blocks_svc_steps_items" USING btree ("_order");
  CREATE INDEX "city_service_pages_blocks_svc_steps_items_parent_id_idx" ON "city_service_pages_blocks_svc_steps_items" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_blocks_svc_steps_order_idx" ON "city_service_pages_blocks_svc_steps" USING btree ("_order");
  CREATE INDEX "city_service_pages_blocks_svc_steps_parent_id_idx" ON "city_service_pages_blocks_svc_steps" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_blocks_svc_steps_path_idx" ON "city_service_pages_blocks_svc_steps" USING btree ("_path");
  CREATE INDEX "city_service_pages_blocks_svc_list_items_order_idx" ON "city_service_pages_blocks_svc_list_items" USING btree ("_order");
  CREATE INDEX "city_service_pages_blocks_svc_list_items_parent_id_idx" ON "city_service_pages_blocks_svc_list_items" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_blocks_svc_list_order_idx" ON "city_service_pages_blocks_svc_list" USING btree ("_order");
  CREATE INDEX "city_service_pages_blocks_svc_list_parent_id_idx" ON "city_service_pages_blocks_svc_list" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_blocks_svc_list_path_idx" ON "city_service_pages_blocks_svc_list" USING btree ("_path");
  CREATE INDEX "city_service_pages_blocks_svc_table_rows_order_idx" ON "city_service_pages_blocks_svc_table_rows" USING btree ("_order");
  CREATE INDEX "city_service_pages_blocks_svc_table_rows_parent_id_idx" ON "city_service_pages_blocks_svc_table_rows" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_blocks_svc_table_order_idx" ON "city_service_pages_blocks_svc_table" USING btree ("_order");
  CREATE INDEX "city_service_pages_blocks_svc_table_parent_id_idx" ON "city_service_pages_blocks_svc_table" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_blocks_svc_table_path_idx" ON "city_service_pages_blocks_svc_table" USING btree ("_path");
  CREATE INDEX "city_service_pages_blocks_svc_scope_order_idx" ON "city_service_pages_blocks_svc_scope" USING btree ("_order");
  CREATE INDEX "city_service_pages_blocks_svc_scope_parent_id_idx" ON "city_service_pages_blocks_svc_scope" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_blocks_svc_scope_path_idx" ON "city_service_pages_blocks_svc_scope" USING btree ("_path");
  CREATE INDEX "city_service_pages_body_sections_order_idx" ON "city_service_pages_body_sections" USING btree ("_order");
  CREATE INDEX "city_service_pages_body_sections_parent_id_idx" ON "city_service_pages_body_sections" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_body_faqs_order_idx" ON "city_service_pages_body_faqs" USING btree ("_order");
  CREATE INDEX "city_service_pages_body_faqs_parent_id_idx" ON "city_service_pages_body_faqs" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_body_reviews_order_idx" ON "city_service_pages_body_reviews" USING btree ("_order");
  CREATE INDEX "city_service_pages_body_reviews_parent_id_idx" ON "city_service_pages_body_reviews" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_body_routes_order_idx" ON "city_service_pages_body_routes" USING btree ("_order");
  CREATE INDEX "city_service_pages_body_routes_parent_id_idx" ON "city_service_pages_body_routes" USING btree ("_parent_id");
  CREATE INDEX "city_service_pages_city_idx" ON "city_service_pages" USING btree ("city_id");
  CREATE INDEX "city_service_pages_service_idx" ON "city_service_pages" USING btree ("service_id");
  CREATE INDEX "city_service_pages_updated_at_idx" ON "city_service_pages" USING btree ("updated_at");
  CREATE INDEX "city_service_pages_created_at_idx" ON "city_service_pages" USING btree ("created_at");
  CREATE INDEX "city_service_pages__status_idx" ON "city_service_pages" USING btree ("_status");
  CREATE INDEX "_city_service_pages_v_version_body_trust_order_idx" ON "_city_service_pages_v_version_body_trust" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_version_body_trust_parent_id_idx" ON "_city_service_pages_v_version_body_trust" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_blocks_svc_text_order_idx" ON "_city_service_pages_v_blocks_svc_text" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_blocks_svc_text_parent_id_idx" ON "_city_service_pages_v_blocks_svc_text" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_blocks_svc_text_path_idx" ON "_city_service_pages_v_blocks_svc_text" USING btree ("_path");
  CREATE INDEX "_city_service_pages_v_blocks_svc_steps_items_order_idx" ON "_city_service_pages_v_blocks_svc_steps_items" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_blocks_svc_steps_items_parent_id_idx" ON "_city_service_pages_v_blocks_svc_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_blocks_svc_steps_order_idx" ON "_city_service_pages_v_blocks_svc_steps" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_blocks_svc_steps_parent_id_idx" ON "_city_service_pages_v_blocks_svc_steps" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_blocks_svc_steps_path_idx" ON "_city_service_pages_v_blocks_svc_steps" USING btree ("_path");
  CREATE INDEX "_city_service_pages_v_blocks_svc_list_items_order_idx" ON "_city_service_pages_v_blocks_svc_list_items" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_blocks_svc_list_items_parent_id_idx" ON "_city_service_pages_v_blocks_svc_list_items" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_blocks_svc_list_order_idx" ON "_city_service_pages_v_blocks_svc_list" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_blocks_svc_list_parent_id_idx" ON "_city_service_pages_v_blocks_svc_list" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_blocks_svc_list_path_idx" ON "_city_service_pages_v_blocks_svc_list" USING btree ("_path");
  CREATE INDEX "_city_service_pages_v_blocks_svc_table_rows_order_idx" ON "_city_service_pages_v_blocks_svc_table_rows" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_blocks_svc_table_rows_parent_id_idx" ON "_city_service_pages_v_blocks_svc_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_blocks_svc_table_order_idx" ON "_city_service_pages_v_blocks_svc_table" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_blocks_svc_table_parent_id_idx" ON "_city_service_pages_v_blocks_svc_table" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_blocks_svc_table_path_idx" ON "_city_service_pages_v_blocks_svc_table" USING btree ("_path");
  CREATE INDEX "_city_service_pages_v_blocks_svc_scope_order_idx" ON "_city_service_pages_v_blocks_svc_scope" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_blocks_svc_scope_parent_id_idx" ON "_city_service_pages_v_blocks_svc_scope" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_blocks_svc_scope_path_idx" ON "_city_service_pages_v_blocks_svc_scope" USING btree ("_path");
  CREATE INDEX "_city_service_pages_v_version_body_sections_order_idx" ON "_city_service_pages_v_version_body_sections" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_version_body_sections_parent_id_idx" ON "_city_service_pages_v_version_body_sections" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_version_body_faqs_order_idx" ON "_city_service_pages_v_version_body_faqs" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_version_body_faqs_parent_id_idx" ON "_city_service_pages_v_version_body_faqs" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_version_body_reviews_order_idx" ON "_city_service_pages_v_version_body_reviews" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_version_body_reviews_parent_id_idx" ON "_city_service_pages_v_version_body_reviews" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_version_body_routes_order_idx" ON "_city_service_pages_v_version_body_routes" USING btree ("_order");
  CREATE INDEX "_city_service_pages_v_version_body_routes_parent_id_idx" ON "_city_service_pages_v_version_body_routes" USING btree ("_parent_id");
  CREATE INDEX "_city_service_pages_v_parent_idx" ON "_city_service_pages_v" USING btree ("parent_id");
  CREATE INDEX "_city_service_pages_v_version_version_city_idx" ON "_city_service_pages_v" USING btree ("version_city_id");
  CREATE INDEX "_city_service_pages_v_version_version_service_idx" ON "_city_service_pages_v" USING btree ("version_service_id");
  CREATE INDEX "_city_service_pages_v_version_version_updated_at_idx" ON "_city_service_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_city_service_pages_v_version_version_created_at_idx" ON "_city_service_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_city_service_pages_v_version_version__status_idx" ON "_city_service_pages_v" USING btree ("version__status");
  CREATE INDEX "_city_service_pages_v_created_at_idx" ON "_city_service_pages_v" USING btree ("created_at");
  CREATE INDEX "_city_service_pages_v_updated_at_idx" ON "_city_service_pages_v" USING btree ("updated_at");
  CREATE INDEX "_city_service_pages_v_latest_idx" ON "_city_service_pages_v" USING btree ("latest");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_city_service_pages_fk" FOREIGN KEY ("city_service_pages_id") REFERENCES "public"."city_service_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_city_service_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("city_service_pages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "locations_body_societies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_locations_v_version_body_societies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_body_trust" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_blocks_svc_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_blocks_svc_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_blocks_svc_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_blocks_svc_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_blocks_svc_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_blocks_svc_table_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_blocks_svc_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_blocks_svc_scope" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_body_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_body_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_body_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages_body_routes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "city_service_pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_version_body_trust" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_blocks_svc_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_blocks_svc_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_blocks_svc_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_blocks_svc_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_blocks_svc_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_blocks_svc_table_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_blocks_svc_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_blocks_svc_scope" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_version_body_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_version_body_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_version_body_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v_version_body_routes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_city_service_pages_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "locations_body_societies" CASCADE;
  DROP TABLE "_locations_v_version_body_societies" CASCADE;
  DROP TABLE "city_service_pages_body_trust" CASCADE;
  DROP TABLE "city_service_pages_blocks_svc_text" CASCADE;
  DROP TABLE "city_service_pages_blocks_svc_steps_items" CASCADE;
  DROP TABLE "city_service_pages_blocks_svc_steps" CASCADE;
  DROP TABLE "city_service_pages_blocks_svc_list_items" CASCADE;
  DROP TABLE "city_service_pages_blocks_svc_list" CASCADE;
  DROP TABLE "city_service_pages_blocks_svc_table_rows" CASCADE;
  DROP TABLE "city_service_pages_blocks_svc_table" CASCADE;
  DROP TABLE "city_service_pages_blocks_svc_scope" CASCADE;
  DROP TABLE "city_service_pages_body_sections" CASCADE;
  DROP TABLE "city_service_pages_body_faqs" CASCADE;
  DROP TABLE "city_service_pages_body_reviews" CASCADE;
  DROP TABLE "city_service_pages_body_routes" CASCADE;
  DROP TABLE "city_service_pages" CASCADE;
  DROP TABLE "_city_service_pages_v_version_body_trust" CASCADE;
  DROP TABLE "_city_service_pages_v_blocks_svc_text" CASCADE;
  DROP TABLE "_city_service_pages_v_blocks_svc_steps_items" CASCADE;
  DROP TABLE "_city_service_pages_v_blocks_svc_steps" CASCADE;
  DROP TABLE "_city_service_pages_v_blocks_svc_list_items" CASCADE;
  DROP TABLE "_city_service_pages_v_blocks_svc_list" CASCADE;
  DROP TABLE "_city_service_pages_v_blocks_svc_table_rows" CASCADE;
  DROP TABLE "_city_service_pages_v_blocks_svc_table" CASCADE;
  DROP TABLE "_city_service_pages_v_blocks_svc_scope" CASCADE;
  DROP TABLE "_city_service_pages_v_version_body_sections" CASCADE;
  DROP TABLE "_city_service_pages_v_version_body_faqs" CASCADE;
  DROP TABLE "_city_service_pages_v_version_body_reviews" CASCADE;
  DROP TABLE "_city_service_pages_v_version_body_routes" CASCADE;
  DROP TABLE "_city_service_pages_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_city_service_pages_fk";
  
  DROP INDEX "payload_locked_documents_rels_city_service_pages_id_idx";
  ALTER TABLE "org_profile" ALTER COLUMN "cin" SET NOT NULL;
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "city_service_pages_id";
  ALTER TABLE "org_profile" DROP COLUMN "trade_name";
  DROP TYPE "public"."enum_city_service_pages_body_reviews_rating";
  DROP TYPE "public"."enum_city_service_pages_body_reviews_source";
  DROP TYPE "public"."enum_city_service_pages_status";
  DROP TYPE "public"."enum__city_service_pages_v_version_body_reviews_rating";
  DROP TYPE "public"."enum__city_service_pages_v_version_body_reviews_source";
  DROP TYPE "public"."enum__city_service_pages_v_version_status";`)
}
