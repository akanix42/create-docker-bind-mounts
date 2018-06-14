import * as fs from 'fs';
import yaml from 'js-yaml';

interface IDockerCompose {
  version: string;
  services: IDockerService[];
}

interface IDockerService {

}

export default function getMountPoints(composeFilePath: string, mountPointPattern: RegExp) {
  try {
    const doc = yaml.safeLoad(fs.readFileSync(composeFilePath, { encoding: 'utf-8' })) as IDockerCompose;
    const services = getServicesArray(doc.services);
    return getMountPointsFromServices(services);
  } catch (err) {
    console.log('Error loading YAML:', err);
  }


  function getServicesArray(servicesObject) {
    return Object.keys(servicesObject).map(key => servicesObject[key]);
  }

  function getMountPointsFromServices(services) {
    return services.reduce((mountPoints, service) => {
      if (!service.volumes) {
        return mountPoints;
      }

      const constraints = service.deploy && service.deploy.placement && service.deploy.placement
                          ? service.deploy.placement.constraints
                          : null;
      const serviceMountPoints = service.volumes.map(getLocalMountPoint)
        .filter(mountPoint => !!mountPoint);

      return [...mountPoints,
        {
          constraints,
          directories: [...serviceMountPoints],
        },
      ];
    }, []);
  }

  function getLocalMountPoint(volumeMapping) {
    const source = getMountPointSource(volumeMapping);
    return mountPointPattern.test(source) ? source : undefined;
  }

  function getMountPointSource(volumeMapping) {
    if (typeof volumeMapping === 'string') {
      return volumeMapping.split(':')[0];
    }
    return volumeMapping.source;
  }

}

