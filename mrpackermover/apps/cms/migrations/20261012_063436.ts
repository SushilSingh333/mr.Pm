import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "locations_body_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "locations_blocks_svc_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_svc_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "locations_blocks_svc_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_svc_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "locations_blocks_svc_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "locations_blocks_svc_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"c1" varchar,
  	"c2" varchar,
  	"c3" varchar,
  	"c4" varchar
  );
  
  CREATE TABLE "locations_blocks_svc_table" (
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
  
  CREATE TABLE "locations_body_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar
  );
  
  CREATE TABLE "locations_body_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "locations_body_routes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "_locations_v_version_body_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"item" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_locations_v_blocks_svc_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_locations_v_blocks_svc_steps_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_locations_v_blocks_svc_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_locations_v_blocks_svc_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_locations_v_blocks_svc_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_locations_v_blocks_svc_table_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"c1" varchar,
  	"c2" varchar,
  	"c3" varchar,
  	"c4" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_locations_v_blocks_svc_table" (
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
  
  CREATE TABLE "_locations_v_version_body_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_locations_v_version_body_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_locations_v_version_body_routes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "locations" ADD COLUMN "body_subhead" varchar;
  ALTER TABLE "locations" ADD COLUMN "body_faq_heading" varchar;
  ALTER TABLE "locations" ADD COLUMN "body_services_heading" varchar;
  ALTER TABLE "locations" ADD COLUMN "body_nearby_heading" varchar;
  ALTER TABLE "locations" ADD COLUMN "body_nearby_intro" varchar;
  ALTER TABLE "locations" ADD COLUMN "body_cta_heading" varchar;
  ALTER TABLE "locations" ADD COLUMN "body_cta_text" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_body_subhead" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_body_faq_heading" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_body_services_heading" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_body_nearby_heading" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_body_nearby_intro" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_body_cta_heading" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_body_cta_text" varchar;
  ALTER TABLE "services_blocks_svc_table_rows" ADD COLUMN "c4" varchar;
  ALTER TABLE "services_blocks_svc_table" ADD COLUMN "h4" varchar;
  ALTER TABLE "_services_v_blocks_svc_table_rows" ADD COLUMN "c4" varchar;
  ALTER TABLE "_services_v_blocks_svc_table" ADD COLUMN "h4" varchar;
  ALTER TABLE "locations_body_trust" ADD CONSTRAINT "locations_body_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_svc_text" ADD CONSTRAINT "locations_blocks_svc_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_svc_steps_items" ADD CONSTRAINT "locations_blocks_svc_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations_blocks_svc_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_svc_steps" ADD CONSTRAINT "locations_blocks_svc_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_svc_list_items" ADD CONSTRAINT "locations_blocks_svc_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations_blocks_svc_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_svc_list" ADD CONSTRAINT "locations_blocks_svc_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_svc_table_rows" ADD CONSTRAINT "locations_blocks_svc_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations_blocks_svc_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_blocks_svc_table" ADD CONSTRAINT "locations_blocks_svc_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_body_sections" ADD CONSTRAINT "locations_body_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_body_faqs" ADD CONSTRAINT "locations_body_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "locations_body_routes" ADD CONSTRAINT "locations_body_routes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_version_body_trust" ADD CONSTRAINT "_locations_v_version_body_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_blocks_svc_text" ADD CONSTRAINT "_locations_v_blocks_svc_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_blocks_svc_steps_items" ADD CONSTRAINT "_locations_v_blocks_svc_steps_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v_blocks_svc_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_blocks_svc_steps" ADD CONSTRAINT "_locations_v_blocks_svc_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_blocks_svc_list_items" ADD CONSTRAINT "_locations_v_blocks_svc_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v_blocks_svc_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_blocks_svc_list" ADD CONSTRAINT "_locations_v_blocks_svc_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_blocks_svc_table_rows" ADD CONSTRAINT "_locations_v_blocks_svc_table_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v_blocks_svc_table"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_blocks_svc_table" ADD CONSTRAINT "_locations_v_blocks_svc_table_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_version_body_sections" ADD CONSTRAINT "_locations_v_version_body_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_version_body_faqs" ADD CONSTRAINT "_locations_v_version_body_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_version_body_routes" ADD CONSTRAINT "_locations_v_version_body_routes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_body_trust_order_idx" ON "locations_body_trust" USING btree ("_order");
  CREATE INDEX "locations_body_trust_parent_id_idx" ON "locations_body_trust" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_svc_text_order_idx" ON "locations_blocks_svc_text" USING btree ("_order");
  CREATE INDEX "locations_blocks_svc_text_parent_id_idx" ON "locations_blocks_svc_text" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_svc_text_path_idx" ON "locations_blocks_svc_text" USING btree ("_path");
  CREATE INDEX "locations_blocks_svc_steps_items_order_idx" ON "locations_blocks_svc_steps_items" USING btree ("_order");
  CREATE INDEX "locations_blocks_svc_steps_items_parent_id_idx" ON "locations_blocks_svc_steps_items" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_svc_steps_order_idx" ON "locations_blocks_svc_steps" USING btree ("_order");
  CREATE INDEX "locations_blocks_svc_steps_parent_id_idx" ON "locations_blocks_svc_steps" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_svc_steps_path_idx" ON "locations_blocks_svc_steps" USING btree ("_path");
  CREATE INDEX "locations_blocks_svc_list_items_order_idx" ON "locations_blocks_svc_list_items" USING btree ("_order");
  CREATE INDEX "locations_blocks_svc_list_items_parent_id_idx" ON "locations_blocks_svc_list_items" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_svc_list_order_idx" ON "locations_blocks_svc_list" USING btree ("_order");
  CREATE INDEX "locations_blocks_svc_list_parent_id_idx" ON "locations_blocks_svc_list" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_svc_list_path_idx" ON "locations_blocks_svc_list" USING btree ("_path");
  CREATE INDEX "locations_blocks_svc_table_rows_order_idx" ON "locations_blocks_svc_table_rows" USING btree ("_order");
  CREATE INDEX "locations_blocks_svc_table_rows_parent_id_idx" ON "locations_blocks_svc_table_rows" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_svc_table_order_idx" ON "locations_blocks_svc_table" USING btree ("_order");
  CREATE INDEX "locations_blocks_svc_table_parent_id_idx" ON "locations_blocks_svc_table" USING btree ("_parent_id");
  CREATE INDEX "locations_blocks_svc_table_path_idx" ON "locations_blocks_svc_table" USING btree ("_path");
  CREATE INDEX "locations_body_sections_order_idx" ON "locations_body_sections" USING btree ("_order");
  CREATE INDEX "locations_body_sections_parent_id_idx" ON "locations_body_sections" USING btree ("_parent_id");
  CREATE INDEX "locations_body_faqs_order_idx" ON "locations_body_faqs" USING btree ("_order");
  CREATE INDEX "locations_body_faqs_parent_id_idx" ON "locations_body_faqs" USING btree ("_parent_id");
  CREATE INDEX "locations_body_routes_order_idx" ON "locations_body_routes" USING btree ("_order");
  CREATE INDEX "locations_body_routes_parent_id_idx" ON "locations_body_routes" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_version_body_trust_order_idx" ON "_locations_v_version_body_trust" USING btree ("_order");
  CREATE INDEX "_locations_v_version_body_trust_parent_id_idx" ON "_locations_v_version_body_trust" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_blocks_svc_text_order_idx" ON "_locations_v_blocks_svc_text" USING btree ("_order");
  CREATE INDEX "_locations_v_blocks_svc_text_parent_id_idx" ON "_locations_v_blocks_svc_text" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_blocks_svc_text_path_idx" ON "_locations_v_blocks_svc_text" USING btree ("_path");
  CREATE INDEX "_locations_v_blocks_svc_steps_items_order_idx" ON "_locations_v_blocks_svc_steps_items" USING btree ("_order");
  CREATE INDEX "_locations_v_blocks_svc_steps_items_parent_id_idx" ON "_locations_v_blocks_svc_steps_items" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_blocks_svc_steps_order_idx" ON "_locations_v_blocks_svc_steps" USING btree ("_order");
  CREATE INDEX "_locations_v_blocks_svc_steps_parent_id_idx" ON "_locations_v_blocks_svc_steps" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_blocks_svc_steps_path_idx" ON "_locations_v_blocks_svc_steps" USING btree ("_path");
  CREATE INDEX "_locations_v_blocks_svc_list_items_order_idx" ON "_locations_v_blocks_svc_list_items" USING btree ("_order");
  CREATE INDEX "_locations_v_blocks_svc_list_items_parent_id_idx" ON "_locations_v_blocks_svc_list_items" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_blocks_svc_list_order_idx" ON "_locations_v_blocks_svc_list" USING btree ("_order");
  CREATE INDEX "_locations_v_blocks_svc_list_parent_id_idx" ON "_locations_v_blocks_svc_list" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_blocks_svc_list_path_idx" ON "_locations_v_blocks_svc_list" USING btree ("_path");
  CREATE INDEX "_locations_v_blocks_svc_table_rows_order_idx" ON "_locations_v_blocks_svc_table_rows" USING btree ("_order");
  CREATE INDEX "_locations_v_blocks_svc_table_rows_parent_id_idx" ON "_locations_v_blocks_svc_table_rows" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_blocks_svc_table_order_idx" ON "_locations_v_blocks_svc_table" USING btree ("_order");
  CREATE INDEX "_locations_v_blocks_svc_table_parent_id_idx" ON "_locations_v_blocks_svc_table" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_blocks_svc_table_path_idx" ON "_locations_v_blocks_svc_table" USING btree ("_path");
  CREATE INDEX "_locations_v_version_body_sections_order_idx" ON "_locations_v_version_body_sections" USING btree ("_order");
  CREATE INDEX "_locations_v_version_body_sections_parent_id_idx" ON "_locations_v_version_body_sections" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_version_body_faqs_order_idx" ON "_locations_v_version_body_faqs" USING btree ("_order");
  CREATE INDEX "_locations_v_version_body_faqs_parent_id_idx" ON "_locations_v_version_body_faqs" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_version_body_routes_order_idx" ON "_locations_v_version_body_routes" USING btree ("_order");
  CREATE INDEX "_locations_v_version_body_routes_parent_id_idx" ON "_locations_v_version_body_routes" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "locations_body_trust" CASCADE;
  DROP TABLE "locations_blocks_svc_text" CASCADE;
  DROP TABLE "locations_blocks_svc_steps_items" CASCADE;
  DROP TABLE "locations_blocks_svc_steps" CASCADE;
  DROP TABLE "locations_blocks_svc_list_items" CASCADE;
  DROP TABLE "locations_blocks_svc_list" CASCADE;
  DROP TABLE "locations_blocks_svc_table_rows" CASCADE;
  DROP TABLE "locations_blocks_svc_table" CASCADE;
  DROP TABLE "locations_body_sections" CASCADE;
  DROP TABLE "locations_body_faqs" CASCADE;
  DROP TABLE "locations_body_routes" CASCADE;
  DROP TABLE "_locations_v_version_body_trust" CASCADE;
  DROP TABLE "_locations_v_blocks_svc_text" CASCADE;
  DROP TABLE "_locations_v_blocks_svc_steps_items" CASCADE;
  DROP TABLE "_locations_v_blocks_svc_steps" CASCADE;
  DROP TABLE "_locations_v_blocks_svc_list_items" CASCADE;
  DROP TABLE "_locations_v_blocks_svc_list" CASCADE;
  DROP TABLE "_locations_v_blocks_svc_table_rows" CASCADE;
  DROP TABLE "_locations_v_blocks_svc_table" CASCADE;
  DROP TABLE "_locations_v_version_body_sections" CASCADE;
  DROP TABLE "_locations_v_version_body_faqs" CASCADE;
  DROP TABLE "_locations_v_version_body_routes" CASCADE;
  ALTER TABLE "locations" DROP COLUMN "body_subhead";
  ALTER TABLE "locations" DROP COLUMN "body_faq_heading";
  ALTER TABLE "locations" DROP COLUMN "body_services_heading";
  ALTER TABLE "locations" DROP COLUMN "body_nearby_heading";
  ALTER TABLE "locations" DROP COLUMN "body_nearby_intro";
  ALTER TABLE "locations" DROP COLUMN "body_cta_heading";
  ALTER TABLE "locations" DROP COLUMN "body_cta_text";
  ALTER TABLE "_locations_v" DROP COLUMN "version_body_subhead";
  ALTER TABLE "_locations_v" DROP COLUMN "version_body_faq_heading";
  ALTER TABLE "_locations_v" DROP COLUMN "version_body_services_heading";
  ALTER TABLE "_locations_v" DROP COLUMN "version_body_nearby_heading";
  ALTER TABLE "_locations_v" DROP COLUMN "version_body_nearby_intro";
  ALTER TABLE "_locations_v" DROP COLUMN "version_body_cta_heading";
  ALTER TABLE "_locations_v" DROP COLUMN "version_body_cta_text";
  ALTER TABLE "services_blocks_svc_table_rows" DROP COLUMN "c4";
  ALTER TABLE "services_blocks_svc_table" DROP COLUMN "h4";
  ALTER TABLE "_services_v_blocks_svc_table_rows" DROP COLUMN "c4";
  ALTER TABLE "_services_v_blocks_svc_table" DROP COLUMN "h4";`)
}
