import Docker from 'dockerode';
import nodeSsh from 'node-ssh';

interface IAuthentication {
  username: string;
  password: string;
}

interface IDockerConnection {
  host: string;
  port: number;
}

interface IMountPoints {
  constraints: null | any;
  directories: string[];
}

export default async function createDirectoriesOnNodes(
  mountPoints: IMountPoints[],
  authentication: IAuthentication,
  dockerConnection: IDockerConnection,
  isTestOnly: boolean,
) {
  console.log(
    `creating mount points for ${mountPoints
      .reduce(
        (array, serviceMountPoints) => [
          ...array,
          ...serviceMountPoints.directories,
        ],
        [],
      )
      .join(', ')}`,
  );

  const docker = new Docker({
    ...dockerConnection,
    version: 'v1.25',
  });
  const nodes = await docker.listNodes();
  nodes.sort(
    (a, b) => (a.Description.Hostname < b.Description.Hostname ? -1 : 1),
  );

  // nodes = nodes.filter(node=>node.Description.Hostname === 'cc-docker-2');
  const output = await Promise.all(
    nodes.map((node) =>
      createDirectoriesOnNode(node, mountPoints, authentication, isTestOnly),
    ),
  );
  console.log(output.filter((output) => !!output).join('\n'));
}

async function createDirectoriesOnNode(
  node,
  mountPoints: IMountPoints[],
  authentication: IAuthentication,
  isTestOnly: boolean,
) {
  const ipAddress = node.Status.Addr;
  let output = `${node.Description.Hostname}: ${ipAddress}`;
  try {
    const filteredMountPoints = mountPoints.reduce(
      (array, serviceMountPoints) => {
        if (!checkConstraints(serviceMountPoints.constraints, node)) {
          return array;
        }
        return [...array, ...serviceMountPoints.directories];
      },
      [],
    );
    if (!filteredMountPoints.length) {
      return;
    }

    const ssh = new nodeSsh();
    await ssh.connect({
      host: ipAddress,
      ...authentication,
    });

    const joinedDirectories = filteredMountPoints
      .map(surroundWithQuotes)
      .join(' ');
    const command = `${
      isTestOnly ? 'echo ' : ''
    }sudo mkdir -p ${joinedDirectories}`;
    const result = await ssh.execCommand(command);
    if (result.stdout) {
      output += `\nSTDOUT: ${result.stdout}`;
    }
    if (result.stderr) {
      output += `\nSTDERR: ${result.stderr}`;
    }
    // console.log(output);
    ssh.dispose();
  } catch (err) {
    output += `\nEXCEPTION: ${err.message}`;
  }
  return output;
}

function surroundWithQuotes(value: string) {
  return `"${value}"`;
}

function checkConstraints(constraints, node) {
  return constraints.every((constraint) => checkConstraint(constraint, node));
}

function checkConstraint(constraint, node) {
  if (constraint.indexOf('node.labels.') === 0) {
    const prefix = 'node.labels.';
    const [fullMatch, label, operator, value] = parseConstraint(
      constraint.substring(prefix.length),
    );
    const nodeValue = node.Spec.Labels[label];
    return isConstraintValid(value, nodeValue, operator);
  }

  if (constraint.indexOf('node.hostname') === 0) {
    const [fullMatch, label, operator, value] = parseConstraint(constraint);
    const nodeValue = node.Description.Hostname;
    return isConstraintValid(value, nodeValue, operator);
  }
}

function isConstraintValid(
  value: string,
  nodeValue: string | undefined,
  operator: string,
) {
  return (
    (operator === '==' && nodeValue === value) ||
    (operator === '!=' && nodeValue !== value)
  );
}

function parseConstraint(constraint: string): [string, string, string, string] {
  const constraintPattern = /(.*?)\s?([!=]=)\s?(.*)/;
  return constraint.match(constraintPattern) as [
    string,
    string,
    string,
    string
  ];
}
