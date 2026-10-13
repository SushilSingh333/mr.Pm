import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "services_body_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "services_blocks_svc_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_svc_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "services_blocks_svc_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_svc_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "services_blocks_svc_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_svc_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"c1" varchar,
  	"c2" varchar,
  	"c3" varchar
  );
  
  CREATE TABLE "services_blocks_svc_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"h1" varchar,
  	"h2" varchar,
  	"h3" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_blocks_svc_scope" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "services_body_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar
  );
  
  CREATE TABLE "services_body_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "services_body_related" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "_services_v_version_body_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_svc_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_svc_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_svc_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_svc_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_svc_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_svc_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"c1" varchar,
  	"c2" varchar,
  	"c3" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_blocks_svc_table" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"h1" varchar,
  	"h2" varchar,
  	"h3" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_blocks_svc_scope" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"note" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_services_v_version_body_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_version_body_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_services_v_version_body_related" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "services" ADD COLUMN "body_photo_id" integer;
  ALTER TABLE "services" ADD COLUMN "body_chip" varchar;
  ALTER TABLE "services" ADD COLUMN "body_subhead" varchar;
  ALTER TABLE "services" ADD COLUMN "body_card_title" varchar;
  ALTER TABLE "services" ADD COLUMN "body_quote_note" varchar;
  ALTER TABLE "services" ADD COLUMN "body_faq_heading" varchar;
  ALTER TABLE "services" ADD COLUMN "body_cities_heading" varchar;
  ALTER TABLE "services" ADD COLUMN "body_cities_intro" varchar;
  ALTER TABLE "services" ADD COLUMN "body_cta_heading" varchar;
  ALTER TABLE "services" ADD COLUMN "body_cta_text" varchar;
  ALTER TABLE "services" ADD COLUMN "body_cta_check" varchar;
  ALTER TABLE "services" ADD COLUMN "body_cta_call" varchar;
  ALTER TABLE "services" ADD COLUMN "body_cta_whatsapp" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_photo_id" integer;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_chip" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_subhead" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_card_title" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_quote_note" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_faq_heading" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_cities_heading" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_cities_intro" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_cta_heading" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_cta_text" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_cta_check" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_cta_call" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_body_cta_whatsapp" varchar;
  ALTER TABLE "services_body_trust" ADD CONSTRAINT "services_body_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_svc_text" ADD CONSTRAINT "services_blocks_svc_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_svc_steps_items" ADD CONSTRAINT "services_blocks_svc_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_svc_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_svc_steps" ADD CONSTRAINT "services_blocks_svc_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_svc_list_items" ADD CONSTRAINT "services_blocks_svc_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_svc_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_svc_list" ADD CONSTRAINT "services_blocks_svc_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_svc_table_rows" ADD CONSTRAINT "services_blocks_svc_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services_blocks_svc_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_svc_table" ADD CONSTRAINT "services_blocks_svc_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_blocks_svc_scope" ADD CONSTRAINT "services_blocks_svc_scope_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_body_sections" ADD CONSTRAINT "services_body_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_body_faqs" ADD CONSTRAINT "services_body_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_body_related" ADD CONSTRAINT "services_body_related_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_body_trust" ADD CONSTRAINT "_services_v_version_body_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_svc_text" ADD CONSTRAINT "_services_v_blocks_svc_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_svc_steps_items" ADD CONSTRAINT "_services_v_blocks_svc_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_svc_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_svc_steps" ADD CONSTRAINT "_services_v_blocks_svc_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_svc_list_items" ADD CONSTRAINT "_services_v_blocks_svc_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_svc_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_svc_list" ADD CONSTRAINT "_services_v_blocks_svc_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_svc_table_rows" ADD CONSTRAINT "_services_v_blocks_svc_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v_blocks_svc_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_svc_table" ADD CONSTRAINT "_services_v_blocks_svc_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_blocks_svc_scope" ADD CONSTRAINT "_services_v_blocks_svc_scope_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_body_sections" ADD CONSTRAINT "_services_v_version_body_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_body_faqs" ADD CONSTRAINT "_services_v_version_body_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_services_v_version_body_related" ADD CONSTRAINT "_services_v_version_body_related_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_services_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "services_body_trust_order_idx" ON "services_body_trust" USING btree ("_order");
  CREATE INDEX "services_body_trust_parent_id_idx" ON "services_body_trust" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_svc_text_order_idx" ON "services_blocks_svc_text" USING btree ("_order");
  CREATE INDEX "services_blocks_svc_text_parent_id_idx" ON "services_blocks_svc_text" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_svc_text_path_idx" ON "services_blocks_svc_text" USING btree ("_path");
  CREATE INDEX "services_blocks_svc_steps_items_order_idx" ON "services_blocks_svc_steps_items" USING btree ("_order");
  CREATE INDEX "services_blocks_svc_steps_items_parent_id_idx" ON "services_blocks_svc_steps_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_svc_steps_order_idx" ON "services_blocks_svc_steps" USING btree ("_order");
  CREATE INDEX "services_blocks_svc_steps_parent_id_idx" ON "services_blocks_svc_steps" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_svc_steps_path_idx" ON "services_blocks_svc_steps" USING btree ("_path");
  CREATE INDEX "services_blocks_svc_list_items_order_idx" ON "services_blocks_svc_list_items" USING btree ("_order");
  CREATE INDEX "services_blocks_svc_list_items_parent_id_idx" ON "services_blocks_svc_list_items" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_svc_list_order_idx" ON "services_blocks_svc_list" USING btree ("_order");
  CREATE INDEX "services_blocks_svc_list_parent_id_idx" ON "services_blocks_svc_list" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_svc_list_path_idx" ON "services_blocks_svc_list" USING btree ("_path");
  CREATE INDEX "services_blocks_svc_table_rows_order_idx" ON "services_blocks_svc_table_rows" USING btree ("_order");
  CREATE INDEX "services_blocks_svc_table_rows_parent_id_idx" ON "services_blocks_svc_table_rows" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_svc_table_order_idx" ON "services_blocks_svc_table" USING btree ("_order");
  CREATE INDEX "services_blocks_svc_table_parent_id_idx" ON "services_blocks_svc_table" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_svc_table_path_idx" ON "services_blocks_svc_table" USING btree ("_path");
  CREATE INDEX "services_blocks_svc_scope_order_idx" ON "services_blocks_svc_scope" USING btree ("_order");
  CREATE INDEX "services_blocks_svc_scope_parent_id_idx" ON "services_blocks_svc_scope" USING btree ("_parent_id");
  CREATE INDEX "services_blocks_svc_scope_path_idx" ON "services_blocks_svc_scope" USING btree ("_path");
  CREATE INDEX "services_body_sections_order_idx" ON "services_body_sections" USING btree ("_order");
  CREATE INDEX "services_body_sections_parent_id_idx" ON "services_body_sections" USING btree ("_parent_id");
  CREATE INDEX "services_body_faqs_order_idx" ON "services_body_faqs" USING btree ("_order");
  CREATE INDEX "services_body_faqs_parent_id_idx" ON "services_body_faqs" USING btree ("_parent_id");
  CREATE INDEX "services_body_related_order_idx" ON "services_body_related" USING btree ("_order");
  CREATE INDEX "services_body_related_parent_id_idx" ON "services_body_related" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_body_trust_order_idx" ON "_services_v_version_body_trust" USING btree ("_order");
  CREATE INDEX "_services_v_version_body_trust_parent_id_idx" ON "_services_v_version_body_trust" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_svc_text_order_idx" ON "_services_v_blocks_svc_text" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_svc_text_parent_id_idx" ON "_services_v_blocks_svc_text" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_svc_text_path_idx" ON "_services_v_blocks_svc_text" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_svc_steps_items_order_idx" ON "_services_v_blocks_svc_steps_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_svc_steps_items_parent_id_idx" ON "_services_v_blocks_svc_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_svc_steps_order_idx" ON "_services_v_blocks_svc_steps" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_svc_steps_parent_id_idx" ON "_services_v_blocks_svc_steps" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_svc_steps_path_idx" ON "_services_v_blocks_svc_steps" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_svc_list_items_order_idx" ON "_services_v_blocks_svc_list_items" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_svc_list_items_parent_id_idx" ON "_services_v_blocks_svc_list_items" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_svc_list_order_idx" ON "_services_v_blocks_svc_list" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_svc_list_parent_id_idx" ON "_services_v_blocks_svc_list" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_svc_list_path_idx" ON "_services_v_blocks_svc_list" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_svc_table_rows_order_idx" ON "_services_v_blocks_svc_table_rows" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_svc_table_rows_parent_id_idx" ON "_services_v_blocks_svc_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_svc_table_order_idx" ON "_services_v_blocks_svc_table" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_svc_table_parent_id_idx" ON "_services_v_blocks_svc_table" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_svc_table_path_idx" ON "_services_v_blocks_svc_table" USING btree ("_path");
  CREATE INDEX "_services_v_blocks_svc_scope_order_idx" ON "_services_v_blocks_svc_scope" USING btree ("_order");
  CREATE INDEX "_services_v_blocks_svc_scope_parent_id_idx" ON "_services_v_blocks_svc_scope" USING btree ("_parent_id");
  CREATE INDEX "_services_v_blocks_svc_scope_path_idx" ON "_services_v_blocks_svc_scope" USING btree ("_path");
  CREATE INDEX "_services_v_version_body_sections_order_idx" ON "_services_v_version_body_sections" USING btree ("_order");
  CREATE INDEX "_services_v_version_body_sections_parent_id_idx" ON "_services_v_version_body_sections" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_body_faqs_order_idx" ON "_services_v_version_body_faqs" USING btree ("_order");
  CREATE INDEX "_services_v_version_body_faqs_parent_id_idx" ON "_services_v_version_body_faqs" USING btree ("_parent_id");
  CREATE INDEX "_services_v_version_body_related_order_idx" ON "_services_v_version_body_related" USING btree ("_order");
  CREATE INDEX "_services_v_version_body_related_parent_id_idx" ON "_services_v_version_body_related" USING btree ("_parent_id");
  ALTER TABLE "services" ADD CONSTRAINT "services_body_photo_id_media_id_fk" FOREIGN KEY ("body_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_services_v" ADD CONSTRAINT "_services_v_version_body_photo_id_media_id_fk" FOREIGN KEY ("version_body_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "services_body_body_photo_idx" ON "services" USING btree ("body_photo_id");
  CREATE INDEX "_services_v_version_body_version_body_photo_idx" ON "_services_v" USING btree ("version_body_photo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "services_body_trust" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_svc_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_svc_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_svc_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_svc_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_svc_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_svc_table_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_svc_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_blocks_svc_scope" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_body_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_body_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_body_related" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_body_trust" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_svc_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_svc_steps_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_svc_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_svc_list_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_svc_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_svc_table_rows" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_svc_table" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_blocks_svc_scope" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_body_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_body_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_services_v_version_body_related" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "services_body_trust" CASCADE;
  DROP TABLE "services_blocks_svc_text" CASCADE;
  DROP TABLE "services_blocks_svc_steps_items" CASCADE;
  DROP TABLE "services_blocks_svc_steps" CASCADE;
  DROP TABLE "services_blocks_svc_list_items" CASCADE;
  DROP TABLE "services_blocks_svc_list" CASCADE;
  DROP TABLE "services_blocks_svc_table_rows" CASCADE;
  DROP TABLE "services_blocks_svc_table" CASCADE;
  DROP TABLE "services_blocks_svc_scope" CASCADE;
  DROP TABLE "services_body_sections" CASCADE;
  DROP TABLE "services_body_faqs" CASCADE;
  DROP TABLE "services_body_related" CASCADE;
  DROP TABLE "_services_v_version_body_trust" CASCADE;
  DROP TABLE "_services_v_blocks_svc_text" CASCADE;
  DROP TABLE "_services_v_blocks_svc_steps_items" CASCADE;
  DROP TABLE "_services_v_blocks_svc_steps" CASCADE;
  DROP TABLE "_services_v_blocks_svc_list_items" CASCADE;
  DROP TABLE "_services_v_blocks_svc_list" CASCADE;
  DROP TABLE "_services_v_blocks_svc_table_rows" CASCADE;
  DROP TABLE "_services_v_blocks_svc_table" CASCADE;
  DROP TABLE "_services_v_blocks_svc_scope" CASCADE;
  DROP TABLE "_services_v_version_body_sections" CASCADE;
  DROP TABLE "_services_v_version_body_faqs" CASCADE;
  DROP TABLE "_services_v_version_body_related" CASCADE;
  ALTER TABLE "services" DROP CONSTRAINT "services_body_photo_id_media_id_fk";
  
  ALTER TABLE "_services_v" DROP CONSTRAINT "_services_v_version_body_photo_id_media_id_fk";
  
  DROP INDEX "services_body_body_photo_idx";
  DROP INDEX "_services_v_version_body_version_body_photo_idx";
  ALTER TABLE "services" DROP COLUMN "body_photo_id";
  ALTER TABLE "services" DROP COLUMN "body_chip";
  ALTER TABLE "services" DROP COLUMN "body_subhead";
  ALTER TABLE "services" DROP COLUMN "body_card_title";
  ALTER TABLE "services" DROP COLUMN "body_quote_note";
  ALTER TABLE "services" DROP COLUMN "body_faq_heading";
  ALTER TABLE "services" DROP COLUMN "body_cities_heading";
  ALTER TABLE "services" DROP COLUMN "body_cities_intro";
  ALTER TABLE "services" DROP COLUMN "body_cta_heading";
  ALTER TABLE "services" DROP COLUMN "body_cta_text";
  ALTER TABLE "services" DROP COLUMN "body_cta_check";
  ALTER TABLE "services" DROP COLUMN "body_cta_call";
  ALTER TABLE "services" DROP COLUMN "body_cta_whatsapp";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_photo_id";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_chip";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_subhead";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_card_title";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_quote_note";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_faq_heading";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_cities_heading";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_cities_intro";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_cta_heading";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_cta_text";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_cta_check";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_cta_call";
  ALTER TABLE "_services_v" DROP COLUMN "version_body_cta_whatsapp";`)
}
