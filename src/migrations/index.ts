import * as migration_20260522_071600 from './20260522_071600';
import * as migration_20260601_103639 from './20260601_103639';
import * as migration_20260609_080448 from './20260609_080448';

export const migrations = [
  {
    up: migration_20260522_071600.up,
    down: migration_20260522_071600.down,
    name: '20260522_071600',
  },
  {
    up: migration_20260601_103639.up,
    down: migration_20260601_103639.down,
    name: '20260601_103639',
  },
  {
    up: migration_20260609_080448.up,
    down: migration_20260609_080448.down,
    name: '20260609_080448'
  },
];
