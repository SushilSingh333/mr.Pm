import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_key" ADD VALUE 'team' BEFORE 'services-index';
  ALTER TYPE "public"."enum__pages_v_version_key" ADD VALUE 'team' BEFORE 'services-index';
  ALTER TABLE "people" ADD COLUMN "linkedin" varchar;
  ALTER TABLE "people" ADD COLUMN "show_on_team" boolean DEFAULT false;
  ALTER TABLE "people" ADD COLUMN "team_order" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ALTER COLUMN "key" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_key";
  CREATE TYPE "public"."enum_pages_key" AS ENUM('about', 'terms', 'privacy', 'licences', 'claims', 'insurance', 'protection', 'fraud-check', 'raise-a-complaint', 'pricing', 'get-quote', 'track', 'verify', 'corporate', 'contact', 'careers', 'services-index', 'blog-index');
  ALTER TABLE "pages" ALTER COLUMN "key" SET DATA TYPE "public"."enum_pages_key" USING "key"::"public"."enum_pages_key";
  ALTER TABLE "_pages_v" ALTER COLUMN "version_key" SET DATA TYPE text;
  DROP TYPE "public"."enum__pages_v_version_key";
  CREATE TYPE "public"."enum__pages_v_version_key" AS ENUM('about', 'terms', 'privacy', 'licences', 'claims', 'insurance', 'protection', 'fraud-check', 'raise-a-complaint', 'pricing', 'get-quote', 'track', 'verify', 'corporate', 'contact', 'careers', 'services-index', 'blog-index');
  ALTER TABLE "_pages_v" ALTER COLUMN "version_key" SET DATA TYPE "public"."enum__pages_v_version_key" USING "version_key"::"public"."enum__pages_v_version_key";
  ALTER TABLE "people" DROP COLUMN "linkedin";
  ALTER TABLE "people" DROP COLUMN "show_on_team";
  ALTER TABLE "people" DROP COLUMN "team_order";`)
}
