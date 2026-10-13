import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_hero_image_id" integer;
  ALTER TABLE "home_content" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_content" ADD CONSTRAINT "home_content_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_hero_image_idx" ON "pages" USING btree ("hero_image_id");
  CREATE INDEX "_pages_v_version_version_hero_image_idx" ON "_pages_v" USING btree ("version_hero_image_id");
  CREATE INDEX "home_content_hero_image_idx" ON "home_content" USING btree ("hero_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages" DROP CONSTRAINT "pages_hero_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_hero_image_id_media_id_fk";
  
  ALTER TABLE "home_content" DROP CONSTRAINT "home_content_hero_image_id_media_id_fk";
  
  DROP INDEX "pages_hero_image_idx";
  DROP INDEX "_pages_v_version_version_hero_image_idx";
  DROP INDEX "home_content_hero_image_idx";
  ALTER TABLE "pages" DROP COLUMN "hero_image_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_hero_image_id";
  ALTER TABLE "home_content" DROP COLUMN "hero_image_id";`)
}
