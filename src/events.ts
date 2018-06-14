import Docker from 'dockerode';
import DockerEvents from 'docker-events';

const docker = new Docker({
  host: 'http://192.168.4.84',
  port: 32375,
  version: 'v1.25'
});

const emitter = new DockerEvents({ docker });
emitter.on('connect', () => console.log('connected'));
emitter.on('disconnect', () => console.log('disconnected; attempting reconnect'));
emitter.on('_message', (message) => console.log('#:', message));
emitter.start();
