### 🚨 Key Issues & Hardcoded Values Found in infra

1. Hardcoded Credentials & Secrets (auth-system-stack.ts:125-146)
   • DB_PASSWORD, ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, RESET_PASSWORD_SECRET,
   EMAIL_APP_PASSWORD, GOOGLE_CLIENT_SECRET are all embedded in plaintext in UserData
   script.
   • Risk: UserData in EC2 is stored in plain text and accessible via the AWS Console,
   AWS API (describe-instance-attribute), and the EC2 IMDS endpoint inside the instance.
2. Hardcoded Infrastructure Parameters (auth-system-stack.ts:13-165)
   • Domain / URLs: DOMAIN=http://localhost and FRONTEND_URL=http://localhost are
   hardcoded in .env.docker.
   • Database User/DB: DB_USER=rishaw, DB_NAME=auth_system_db are hardcoded in multiple
   places (UserData env block and docker-compose POSTGRES_USER).
   • AWS Region: Default fallback "ap-south-1" hardcoded in infra.ts:13.
   • Third-Party Version: Docker Compose download URL pinned in script
   auth-system-stack.ts:114.
3. Production Architecture Gaps
   • Single Point of Failure (SPOF): Single EC2 instance running Postgres database in a
   Docker container with local EBS storage. If the instance fails or undergoes
   maintenance, data could be compromised and downtime will occur.
   • Direct API Exposure: Security group exposes port 3000 directly to 0.0.0.0/0
   auth-system-stack.ts:79-82.
   • HTTP Only (No TLS): App exposes plaintext http:// on port 80 without SSL/TLS
   certificates or HTTPS termination.

──────

### 📋 Recommended TODO List for Production

#### 1. Secret Management (AWS Secrets Manager / SSM Parameter Store)

[ ] Store Secrets in AWS Secrets Manager: Replace hardcoded secret strings with aws-ssm
or aws-secretsmanager constructs in CDK.
[ ] Inject at Runtime: Fetch secrets dynamically at instance boot or directly inside the
Node.js application container using SDK/IAM credentials rather than writing plaintext .
env files in UserData.

#### 2. Architecture & High Availability (HA)

[ ] Managed Database (Amazon RDS PostgreSQL):
• Move database off the EC2 instance to a Multi-AZ AWS RDS for PostgreSQL cluster.
• Ensures automated backups, continuous replication, automatic failover, and point-
in-time recovery.
[ ] Container Orchestration (ECS Fargate or EKS):
• Replace EC2 + Docker Compose setup with AWS ECS (Fargate) or AWS EKS.
• Provides auto-scaling, zero-downtime rolling deployments, self-healing container
management, and no host OS patching.
[ ] Load Balancing & SSL/TLS (ALB + AWS Certificate Manager):
• Place an Application Load Balancer (ALB) in front of the application.
• Use AWS Certificate Manager (ACM) to issue free, auto-renewing SSL certificates for
HTTPS termination (https://yourdomain.com).
• Remove direct external exposure to port 3000 (keep API internal behind reverse
proxy or ALB).

#### 3. Networking & Security Hardening

[ ] Multi-AZ Private Subnets:
• Move backend services and RDS database into Private Subnets with NAT Gateways or
VPC Endpoints for external API access.
• Restrict Security Groups so database port 5432 and API port 3000 only accept
traffic from the ALB / ECS tasks, never 0.0.0.0/0.
[ ] WAF & DDoS Protection: Add AWS WAF to the Application Load Balancer to protect auth
routes against rate abuse, credential stuffing, and common web exploits.

#### 4. Environment Configuration & CI/CD

[ ] CDK Context / Environment Variables:
• Use this.node.tryGetContext('env') or process.env.\* passed via CI/CD (GitHub
Actions / AWS CodePipeline) to parameterize domain names, DB names, instance sizes,
and feature flags per environment (dev, staging, prod).
[ ] Database Migrations in CI/CD:
• Run migrations (migrate.js) as an ECS Ephemeral Task or pre-deployment job in the
CI/CD pipeline rather than running inside UserData / Docker Compose on instance
startup.
