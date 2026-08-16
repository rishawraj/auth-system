import * as path from "path";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import { Construct } from "constructs";

export class AuthSystemStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Root of the auth-system monorepo (one level up from infra/)
    const rootDir = path.resolve(__dirname, "../../");

    // ──────────────────────────────────────────────────────────
    // 1. Docker Image Assets → pushed to ECR automatically
    // ──────────────────────────────────────────────────────────
    const serverImage = new ecr_assets.DockerImageAsset(
      this,
      "ServerImageAsset",
      {
        directory: rootDir,
        file: "Dockerfile.server",
        exclude: [
          "infra",
          "cdk.out",
          "**/cdk.out",
          "node_modules",
          "**/node_modules",
        ],
      },
    );

    const clientImage = new ecr_assets.DockerImageAsset(
      this,
      "ClientImageAsset",
      {
        directory: rootDir,
        file: "Dockerfile.client",
        exclude: [
          "infra",
          "cdk.out",
          "**/cdk.out",
          "node_modules",
          "**/node_modules",
        ],
      },
    );

    // ──────────────────────────────────────────────────────────
    // 2. VPC — single public subnet, zero NAT (cost = $0)
    // ──────────────────────────────────────────────────────────
    const vpc = new ec2.Vpc(this, "AuthSystemVpc", {
      maxAzs: 1,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "PublicSubnet",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // ──────────────────────────────────────────────────────────
    // 3. Security Group — HTTP (80) + API (3000), NO SSH
    // ──────────────────────────────────────────────────────────
    const securityGroup = new ec2.SecurityGroup(this, "AuthSystemSG", {
      vpc,
      description: "Allow HTTP and API access for Auth System demo",
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "HTTP - Nginx frontend",
    );
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      "HTTP - Node API server",
    );

    // ──────────────────────────────────────────────────────────
    // 4. IAM Role — SSM Session Manager + ECR Pull
    // ──────────────────────────────────────────────────────────
    const ec2Role = new iam.Role(this, "AuthSystemEc2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore",
        ),
      ],
    });
    serverImage.repository.grantPull(ec2Role);
    clientImage.repository.grantPull(ec2Role);

    // ──────────────────────────────────────────────────────────
    // 5. EC2 UserData — bootstrap Docker + Docker Compose
    // ──────────────────────────────────────────────────────────
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "#!/bin/bash",
      "set -ex",

      // Install Docker
      "dnf update -y",
      "dnf install -y docker aws-cli",
      "systemctl enable --now docker",
      "usermod -aG docker ec2-user",

      // Install Docker Compose plugin
      "mkdir -p /usr/libexec/docker/cli-plugins",
      'curl -SL "https://github.com/docker/compose/releases/download/v2.29.1/docker-compose-linux-$(uname -m)" -o /usr/libexec/docker/cli-plugins/docker-compose',
      "chmod +x /usr/libexec/docker/cli-plugins/docker-compose",

      // App directory
      "mkdir -p /opt/auth-system",
      "cd /opt/auth-system",

      // ECR login
      `aws ecr get-login-password --region ${this.region} | docker login --username AWS --password-stdin ${serverImage.repository.repositoryUri.split("/")[0]}`,

      // Write .env.docker
      `cat << 'ENVEOF' > .env.docker
NODE_ENV=production
DOMAIN=http://localhost
FRONTEND_URL=http://localhost
DB_HOST=db
DB_PORT=5432
DB_NAME=auth_system_db
DB_USER=rishaw
DB_PASSWORD=demo_postgres_password_123
EMAIL_USER=demo@example.com
EMAIL_APP_PASSWORD=demopassword
JWT_EXPIRATION=1d
ACCESS_TOKEN_SECRET=demo_access_token_secret_32chars_long_xyz
ACCESS_TOKEN_EXPIRY=900
REFRESH_TOKEN_SECRET=demo_refresh_token_secret_32chars_long_xyz
REFRESH_TOKEN_EXPIRY=604800
RESET_PASSWORD_SECRET=demo_reset_password_secret_key_123
RESET_PASSWORD_EXPIRY=900
GOOGLE_CLIENT_ID=placeholder_google_client_id
GOOGLE_CLIENT_SECRET=placeholder_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost/api/auth/google/callback
ENVEOF`,

      // Write docker-compose.yml
      `cat << 'COMPEOF' > docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    env_file: .env.docker
    environment:
      POSTGRES_USER: rishaw
      POSTGRES_PASSWORD: demo_postgres_password_123
      POSTGRES_DB: auth_system_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rishaw -d auth_system_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  migrate:
    image: ${serverImage.imageUri}
    command: ["node", "server/dist/scripts/migrate.js"]
    restart: "no"
    env_file: .env.docker
    depends_on:
      db:
        condition: service_healthy

  server:
    image: ${serverImage.imageUri}
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    ports:
      - "3000:3000"
    env_file: .env.docker
    depends_on:
      migrate:
        condition: service_completed_successfully
      db:
        condition: service_healthy

  nginx:
    image: ${clientImage.imageUri}
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    ports:
      - "80:80"
    depends_on:
      - server

volumes:
  pgdata:
COMPEOF`,

      // Launch
      'echo "Starting containers..."',
      "docker compose up -d",
    );

    // ──────────────────────────────────────────────────────────
    // 6. EC2 Instance — t3.small, Amazon Linux 2023
    // ──────────────────────────────────────────────────────────
    const instance = new ec2.Instance(this, "AuthSystemInstance", {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL,
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup,
      role: ec2Role,
      userData,
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: ec2.BlockDeviceVolume.ebs(15, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // ──────────────────────────────────────────────────────────
    // 7. Stack Outputs
    // ──────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, "AppURL", {
      value: `http://${instance.instancePublicIp}`,
      description: "Frontend (Nginx) URL",
    });
    new cdk.CfnOutput(this, "ServerApiURL", {
      value: `http://${instance.instancePublicIp}:3000`,
      description: "Node API server URL",
    });
    new cdk.CfnOutput(this, "SSMConnectCommand", {
      value: `aws ssm start-session --target ${instance.instanceId}`,
      description: "SSH-less shell access via SSM",
    });
  }
}
