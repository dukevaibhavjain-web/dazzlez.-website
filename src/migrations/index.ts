import * as migration_20260522_071600 from './20260522_071600';

export const migrations = [
  {
    up: migration_20260522_071600.up,
    down: migration_20260522_071600.down,
    name: '20260522_071600'
  },
];
