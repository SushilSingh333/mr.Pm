import * as migration_0000_initial_schema from './0000_initial_schema';
import * as migration_0001_postgis from './0001_postgis';
import * as migration_20260811_054837_cloudinary_media from './20260811_054837_cloudinary_media';
import * as migration_20260811_110743_posts_blog from './20260811_110743_posts_blog';
import * as migration_20260820_105037_proposals from './20260820_105037_proposals';
import * as migration_20260902_090501 from './20260902_090501';
import * as migration_20260906_073111 from './20260906_073111';
import * as migration_20260907_115145 from './20260907_115145';
import * as migration_20260907_134942 from './20260907_134942';
import * as migration_20260908_063612 from './20260908_063612';
import * as migration_20260908_103940 from './20260908_103940';
import * as migration_20260909_122159 from './20260909_122159';
import * as migration_20260909_132901 from './20260909_132901';
import * as migration_20260912_090336 from './20260912_090336';
import * as migration_20260912_135821 from './20260912_135821';
import * as migration_20260914_123127 from './20260914_123127';
import * as migration_20260914_133214 from './20260914_133214';
import * as migration_20260915_093225 from './20260915_093225';
import * as migration_20260915_132224 from './20260915_132224';
import * as migration_20260922_053549 from './20260922_053549';
import * as migration_20260930_052404 from './20260930_052404';
import * as migration_20261003_133325 from './20261003_133325';
import * as migration_20261008_091920 from './20261008_091920';
import * as migration_20261009_102606 from './20261009_102606';
import * as migration_20261012_063436 from './20261012_063436';
import * as migration_20261012_094929 from './20261012_094929';
import * as migration_20261013_093516 from './20261013_093516';

export const migrations = [
  {
    up: migration_0000_initial_schema.up,
    down: migration_0000_initial_schema.down,
    name: '0000_initial_schema',
  },
  {
    up: migration_0001_postgis.up,
    down: migration_0001_postgis.down,
    name: '0001_postgis',
  },
  {
    up: migration_20260811_054837_cloudinary_media.up,
    down: migration_20260811_054837_cloudinary_media.down,
    name: '20260811_054837_cloudinary_media',
  },
  {
    up: migration_20260811_110743_posts_blog.up,
    down: migration_20260811_110743_posts_blog.down,
    name: '20260811_110743_posts_blog',
  },
  {
    up: migration_20260820_105037_proposals.up,
    down: migration_20260820_105037_proposals.down,
    name: '20260820_105037_proposals',
  },
  {
    up: migration_20260902_090501.up,
    down: migration_20260902_090501.down,
    name: '20260902_090501',
  },
  {
    up: migration_20260906_073111.up,
    down: migration_20260906_073111.down,
    name: '20260906_073111',
  },
  {
    up: migration_20260907_115145.up,
    down: migration_20260907_115145.down,
    name: '20260907_115145',
  },
  {
    up: migration_20260907_134942.up,
    down: migration_20260907_134942.down,
    name: '20260907_134942',
  },
  {
    up: migration_20260908_063612.up,
    down: migration_20260908_063612.down,
    name: '20260908_063612',
  },
  {
    up: migration_20260908_103940.up,
    down: migration_20260908_103940.down,
    name: '20260908_103940',
  },
  {
    up: migration_20260909_122159.up,
    down: migration_20260909_122159.down,
    name: '20260909_122159',
  },
  {
    up: migration_20260909_132901.up,
    down: migration_20260909_132901.down,
    name: '20260909_132901',
  },
  {
    up: migration_20260912_090336.up,
    down: migration_20260912_090336.down,
    name: '20260912_090336',
  },
  {
    up: migration_20260912_135821.up,
    down: migration_20260912_135821.down,
    name: '20260912_135821',
  },
  {
    up: migration_20260914_123127.up,
    down: migration_20260914_123127.down,
    name: '20260914_123127',
  },
  {
    up: migration_20260914_133214.up,
    down: migration_20260914_133214.down,
    name: '20260914_133214',
  },
  {
    up: migration_20260915_093225.up,
    down: migration_20260915_093225.down,
    name: '20260915_093225',
  },
  {
    up: migration_20260915_132224.up,
    down: migration_20260915_132224.down,
    name: '20260915_132224',
  },
  {
    up: migration_20260922_053549.up,
    down: migration_20260922_053549.down,
    name: '20260922_053549',
  },
  {
    up: migration_20260930_052404.up,
    down: migration_20260930_052404.down,
    name: '20260930_052404',
  },
  {
    up: migration_20261003_133325.up,
    down: migration_20261003_133325.down,
    name: '20261003_133325',
  },
  {
    up: migration_20261008_091920.up,
    down: migration_20261008_091920.down,
    name: '20261008_091920',
  },
  {
    up: migration_20261009_102606.up,
    down: migration_20261009_102606.down,
    name: '20261009_102606',
  },
  {
    up: migration_20261012_063436.up,
    down: migration_20261012_063436.down,
    name: '20261012_063436',
  },
  {
    up: migration_20261012_094929.up,
    down: migration_20261012_094929.down,
    name: '20261012_094929',
  },
  {
    up: migration_20261013_093516.up,
    down: migration_20261013_093516.down,
    name: '20261013_093516'
  },
];
