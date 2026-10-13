import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres';
import { sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "services" ADD COLUMN "editorial_note" jsonb;
  ALTER TABLE "_services_v" ADD COLUMN "version_editorial_note" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "services" DROP COLUMN "editorial_note";
  ALTER TABLE "_services_v" DROP COLUMN "version_editorial_note";`)
}
