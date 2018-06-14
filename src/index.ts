import escapeStringRegexp from 'escape-string-regexp';
import yargs from 'yargs';

import createDirectoriesOnNodes from './createMountPoints';
import getMountPoints from './getMountPoints';

yargs
  .usage('Usage: $0 [options]')
  .example('$0 -d /docker -c docker-compose-yml --host http://192.168.4.84 --port 2375')
  // .alias('d', 'dir')
  .describe('dir', 'mount directory (absolute path)')
  // .alias('c', 'compose-file')
  .describe('compose-file', 'compose file path')
  // .alias('u', 'username')
  .describe('username', 'SSH username')
  // .alias('p', 'password')
  .describe('password', 'SSH password')
  .describe('test', 'Test only - don\'t actually create directories')
  .describe('host', 'Docker host')
  .describe('port', 'Docker port')
  .demandOption(['dir', 'compose-file', 'username', 'password', 'host', 'port'])
  .help('h')
  .alias('h', 'help');

const args = yargs.argv;
const mountPattern = new RegExp(`${escapeStringRegexp(args.dir)}`);
const mountPoints = getMountPoints(args.composeFile, mountPattern);

createDirectoriesOnNodes(mountPoints, {
  username: args.username,
  password: args.password,
}, {
  host: args.host,
  port: args.port,
}, args.test);
