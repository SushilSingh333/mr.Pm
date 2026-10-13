import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_locations_body_reviews_rating" AS ENUM('5', '4', '3', '2', '1');
  CREATE TYPE "public"."enum_locations_body_reviews_source" AS ENUM('Google', 'Justdial', 'Facebook', 'Direct');
  CREATE TYPE "public"."enum__locations_v_version_body_reviews_rating" AS ENUM('5', '4', '3', '2', '1');
  CREATE TYPE "public"."enum__locations_v_version_body_reviews_source" AS ENUM('Google', 'Justdial', 'Facebook', 'Direct');
  CREATE TABLE "locations_body_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"move" varchar,
  	"text" varchar,
  	"rating" "enum_locations_body_reviews_rating",
  	"date" varchar,
  	"source" "enum_locations_body_reviews_source"
  );
  
  CREATE TABLE "_locations_v_version_body_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"move" varchar,
  	"text" varchar,
  	"rating" "enum__locations_v_version_body_reviews_rating",
  	"date" varchar,
  	"source" "enum__locations_v_version_body_reviews_source",
  	"_uuid" varchar
  );
  
  ALTER TABLE "locations" ADD COLUMN "body_reviews_heading" varchar;
  ALTER TABLE "_locations_v" ADD COLUMN "version_body_reviews_heading" varchar;
  ALTER TABLE "locations_body_reviews" ADD CONSTRAINT "locations_body_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_locations_v_version_body_reviews" ADD CONSTRAINT "_locations_v_version_body_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_locations_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "locations_body_reviews_order_idx" ON "locations_body_reviews" USING btree ("_order");
  CREATE INDEX "locations_body_reviews_parent_id_idx" ON "locations_body_reviews" USING btree ("_parent_id");
  CREATE INDEX "_locations_v_version_body_reviews_order_idx" ON "_locations_v_version_body_reviews" USING btree ("_order");
  CREATE INDEX "_locations_v_version_body_reviews_parent_id_idx" ON "_locations_v_version_body_reviews" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "locations_body_reviews" CASCADE;
  DROP TABLE "_locations_v_version_body_reviews" CASCADE;
  ALTER TABLE "locations" DROP COLUMN "body_reviews_heading";
  ALTER TABLE "_locations_v" DROP COLUMN "version_body_reviews_heading";
  DROP TYPE "public"."enum_locations_body_reviews_rating";
  DROP TYPE "public"."enum_locations_body_reviews_source";
  DROP TYPE "public"."enum__locations_v_version_body_reviews_rating";
  DROP TYPE "public"."enum__locations_v_version_body_reviews_source";`)
}
