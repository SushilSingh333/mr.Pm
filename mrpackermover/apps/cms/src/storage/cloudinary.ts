import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

/**
 * Custom Cloudinary adapter for @payloadcms/plugin-cloud-storage.
 *
 * Uploads are SIGNED server-side with the API secret (never exposed to the browser),
 * so there is no open upload preset to abuse. The original image is stored on
 * Cloudinary; all resizing/format conversion is done on delivery via URL transforms
 * (see @mpm/shared `cldUrl`), so we upload exactly one asset per image and ship no
 * Cloudinary SDK to the static site.
 *
 * The stored `url` on each Media doc is a plain delivery URL:
 *   https://res.cloudinary.com/<cloud>/image/upload/<folder>/<file>
 */
interface CloudinaryAdapterArgs {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  /** Base folder every asset is stored under. */
  folder?: string;
}

/** Drop the extension — Cloudinary public_ids are extensionless; `f_auto` picks the format. */
const stripExt = (filename: string): string => filename.replace(/\.[^./\\]+$/, '');

export const cloudinaryStorageAdapter =
  ({ cloudName, apiKey, apiSecret, folder = 'mrpackermover' }: CloudinaryAdapterArgs): Adapter =>
  ({ prefix }): GeneratedAdapter => {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // public_id = <folder>/[<collection prefix>/]<filename without extension>
    const publicIdFor = (filename: string): string =>
      [folder, prefix, stripExt(filename)].filter(Boolean).join('/');
    const urlFor = (publicId: string): string =>
      `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

    return {
      name: 'cloudinary',

      // A hidden field records the Cloudinary public_id so delete/URL never have to
      // re-derive it from the filename.
      fields: [
        {
          name: 'cloudinaryPublicId',
          type: 'text',
          admin: { hidden: true, readOnly: true },
        },
      ],

      handleUpload: async ({ data, file }) => {
        const result = await new Promise<UploadApiResponse>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                public_id: publicIdFor(file.filename),
                resource_type: 'image',
                overwrite: true,
                invalidate: true,
              },
              (error, res) =>
                error || !res
                  ? reject(error ?? new Error('Cloudinary upload failed'))
                  : resolve(res),
            )
            .end(file.buffer);
        });
        data.cloudinaryPublicId = result.public_id;
        data.url = urlFor(result.public_id);
        return data;
      },

      handleDelete: async ({ doc, filename }) => {
        const publicId =
          (doc as { cloudinaryPublicId?: string }).cloudinaryPublicId ?? publicIdFor(filename);
        await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: 'image' });
      },

      generateURL: ({ data, filename }) => {
        const publicId =
          (data as { cloudinaryPublicId?: string } | undefined)?.cloudinaryPublicId ??
          publicIdFor(filename);
        return urlFor(publicId);
      },

      // Media is public, so Payload access control is disabled (URLs point straight at
      // Cloudinary's CDN). This handler is only a safety net → redirect to the CDN.
      staticHandler: (_req, { params }) =>
        Response.redirect(urlFor(publicIdFor(params.filename)), 302),
    };
  };
