import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_key" ADD VALUE 'pricing';
  ALTER TYPE "public"."enum_pages_key" ADD VALUE 'get-quote';
  ALTER TYPE "public"."enum_pages_key" ADD VALUE 'track';
  ALTER TYPE "public"."enum_pages_key" ADD VALUE 'verify';
  ALTER TYPE "public"."enum_pages_key" ADD VALUE 'corporate';
  ALTER TYPE "public"."enum_pages_key" ADD VALUE 'contact';
  ALTER TYPE "public"."enum_pages_key" ADD VALUE 'careers';
  ALTER TYPE "public"."enum_pages_key" ADD VALUE 'services-index';
  ALTER TYPE "public"."enum_pages_key" ADD VALUE 'blog-index';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'pricing';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'get-quote';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'track';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'verify';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'corporate';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'contact';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'careers';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'services-index';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'blog-index';
  CREATE TABLE "locations_service_seo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"service_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar
  );
  
  CREATE TABLE "_locations_v_version_service_seo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"service_id" integer,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "seo_defaults" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"city_hub_title_template" varchar,
  	"city_hub_description_template" varchar,
  	"locality_title_template" varchar,
  	"locality_description_template" varchar,
  	"city_service_title_template" varchar,
  	"city_service_description_template" varchar,
  	"service_hub_title_template" varchar,
  	"service_hub_description_template" varchar,
  	"route_title_template" varchar,
  	"route_description_template" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "proposals" ALTER COLUMN "company_email" SET DEFAULT 'shiftwith@mrpackermover.com';
  ALTER TABLE "locations" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "locations" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "services" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "services" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_services_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "lanes" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "lanes" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "_lanes_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_lanes_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "home_content" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "home_content" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "locations_service_seo" ADD CONSTRAINT "locations_service_seo_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "locations_service_seo" ADD CONSTRAINT "locations_service_seo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_version_service_seo" ADD CONSTRAINT "_locations_v_version_service_seo_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_locations_v_version_service_seo" ADD CONSTRAINT "_locations_v_version_service_seo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_service_seo_order_idx" ON "locations_service_seo" USING btree ("_order");
  CREATE INDEX "locations_service_seo_parent_id_idx" ON "locations_service_seo" USING btree ("_parent_id");
  CREATE INDEX "locations_service_seo_service_idx" ON "locations_service_seo" USING btree ("service_id");
  CREATE INDEX "_locations_v_version_service_seo_order_idx" ON "_locations_v_version_service_seo" USING btree ("_order");
  CREATE INDEX "_locations_v_version_service_seo_parent_id_idx" ON "_locations_v_version_service_seo" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_version_service_seo_service_idx" ON "_locations_v_version_service_seo" USING btree ("service_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "locations_service_seo" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_locations_v_version_service_seo" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "seo_defaults" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "locations_service_seo" CASCADE;
  DROP TABLE "_locations_v_version_service_seo" CASCADE;
  DROP TABLE "seo_defaults" CASCADE;
  ALTER TABLE "pages" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_key";
  CREATE TYPE "public"."enum_pages_key" AS ENUM('about', 'terms', 'privacy', 'licences', 'claims', 'insurance', 'protection', 'fraud-check', 'raise-a-complaint');
  ALTER TABLE "pages" ALTER COLUMN "key" SET DATA TYPE "public"."enum_pages_key" USING "key"::"public"."enum_pages_key";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_key" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_version_key";
  CREATE TYPE "public"."enum__pages_v_version_key" AS ENUM('about', 'terms', 'privacy', 'licences', 'claims', 'insurance', 'protection', 'fraud-check', 'raise-a-complaint');
  ALTER TABLE "_pages_v" ALTER COLUMN "version_key" SET DATA TYPE "public"."enum__pages_v_version_key" USING "version_key"::"public"."enum__pages_v_version_key";
  ALTER TABLE "proposals" ALTER COLUMN "company_email" SET DEFAULT 'mrmoverpacker25@gmail.com';
  ALTER TABLE "locations" DROP COLUMN "meta_title";
  ALTER TABLE "locations" DROP COLUMN "meta_description";
  ALTER TABLE "_locations_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_locations_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "services" DROP COLUMN "meta_title";
  ALTER TABLE "services" DROP COLUMN "meta_description";
  ALTER TABLE "_services_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_services_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "lanes" DROP COLUMN "meta_title";
  ALTER TABLE "lanes" DROP COLUMN "meta_description";
  ALTER TABLE "_lanes_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_lanes_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "pages" DROP COLUMN "meta_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "posts" DROP COLUMN "meta_title";
  ALTER TABLE "posts" DROP COLUMN "meta_description";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "home_content" DROP COLUMN "meta_title";
  ALTER TABLE "home_content" DROP COLUMN "meta_description";`)
}
