# Quick AWS Deployment - Step by Step
## Deploy to AWS in 30-45 minutes with Test Credentials

---

## ⏱️ Total Time: ~45 minutes

```
✅ AWS Setup:           10 min
✅ Build & Push Images: 15 min
✅ Create Database:     10 min
✅ Deploy Services:     10 min
```

---

## STEP 1: AWS Account & Setup (10 min)

### 1.1 Create AWS Account
- Go to https://aws.amazon.com
- Click "Create an AWS Account"
- Complete signup
- Verify email

### 1.2 Create IAM User for Deployment

1. Log into AWS Console
2. Go to **IAM → Users → Create User**
3. Username: `distro-deployer`
4. Click **Next**
5. **Attach policies directly:**
   - ✅ `AmazonEC2FullAccess`
   - ✅ `AmazonRDSFullAccess`
   - ✅ `AmazonECS_FullAccess`
   - ✅ `AmazonEC2ContainerRegistryFullAccess`
   - ✅ `SecretsManagerReadWrite`
6. Click **Create User**

### 1.3 Create Access Keys

1. Click the new user name
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Choose **Command Line Interface (CLI)**
5. Accept warning
6. **Copy and save:**
   - Access Key ID
   - Secret Access Key

### 1.4 Configure AWS CLI

```powershell
# Install AWS CLI
choco install awscli

# Configure
aws configure

# When prompted, enter:
# AWS Access Key ID: [paste your key]
# AWS Secret Access Key: [paste your secret]
# Default region name: us-east-1
# Default output format: json

# Verify setup
aws sts get-caller-identity
```

---

## STEP 2: Create ECR Repositories (5 min)

```powershell
# Get your AWS Account ID
$ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
Write-Host "Your Account ID: $ACCOUNT_ID"

# Create repositories
aws ecr create-repository --repository-name distro-api --region us-east-1
aws ecr create-repository --repository-name distro-web --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

---

## STEP 3: Build & Push Docker Images (15 min)

```powershell
# Navigate to project
cd D:\distro-platform\distro-platform

# Save your Account ID
$ACCOUNT_ID = "YOUR_ACCOUNT_ID_HERE"  # Replace with your ID from Step 2

# Build API image
Write-Host "🔨 Building API image..."
docker build -t distro-api:latest --target production -f apps/api/Dockerfile .

# Build Web image
Write-Host "🔨 Building Web image..."
docker build -t distro-web:latest --target production -f apps/web/Dockerfile .

# Tag for ECR
Write-Host "🏷️  Tagging images..."
docker tag distro-api:latest $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/distro-api:latest
docker tag distro-web:latest $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/distro-web:latest

# Push to ECR
Write-Host "📤 Pushing API image..."
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/distro-api:latest

Write-Host "📤 Pushing Web image..."
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/distro-web:latest

Write-Host "✅ Images pushed successfully!"
```

**Note:** If builds fail, make sure:
- Docker is running
- You're in the correct directory
- Node.js dependencies are installed (`npm install`)

---

## STEP 4: Create RDS PostgreSQL Database (10 min)

### In AWS Console:

1. Go to **RDS → Databases → Create Database**

2. **Engine Selection:**
   - Engine: **PostgreSQL**
   - Version: **16.x** (latest)
   - Template: **Free tier** ⭐

3. **DB Cluster:**
   - Cluster identifier: `distro-db-cluster`

4. **Master credentials:**
   - Master username: `distro_admin`
   - Password: Create strong password (save it!) 🔑

5. **Instance:**
   - Instance class: `db.t4g.micro` (free tier)
   - Storage: `20 GB`

6. **Connectivity:**
   - VPC: Default VPC
   - Public accessibility: **Yes**
   - New security group: `distro-rds-sg`

7. **Initial database name:** `distro_platform`

8. Click **Create Database**

### Wait 5-10 minutes for creation...

### Once Created:
1. Click database name
2. Copy **Writer Endpoint** (looks like: `distro-db-cluster.xxx.us-east-1.rds.amazonaws.com`)
3. Save this! You'll need it next.

---

## STEP 5: Create ECS Cluster (5 min)

### In AWS Console:

1. Go to **ECS → Clusters → Create Cluster**

2. **Cluster name:** `distro-production`

3. **Infrastructure:**
   - Choose **AWS Fargate**
   - Container Insights: Disable (save money)

4. Click **Create**

---

## STEP 6: Create CloudWatch Log Groups (2 min)

```powershell
# Create log groups
aws logs create-log-group --log-group-name /ecs/distro-api --region us-east-1
aws logs create-log-group --log-group-name /ecs/distro-web --region us-east-1

# Set retention (7 days)
aws logs put-retention-policy --log-group-name /ecs/distro-api --retention-in-days 7 --region us-east-1
aws logs put-retention-policy --log-group-name /ecs/distro-web --retention-in-days 7 --region us-east-1
```

---

## STEP 7: Create IAM Role for ECS Tasks (3 min)

### In AWS Console:

1. Go to **IAM → Roles → Create role**

2. **Trusted entity:** AWS Service → Elastic Container Service → Elastic Container Service Task

3. Click **Next**

4. **Attach policies:**
   - ✅ `AmazonECSTaskExecutionRolePolicy`
   - ✅ `SecretsManagerReadWrite`

5. **Role name:** `ecsTaskExecutionRole`

6. Click **Create Role**

---

## STEP 8: Store Secrets in Secrets Manager (3 min)

```powershell
# These are your test credentials - can change later

$JWT_ACCESS_SECRET = "your-super-secret-key-min-32-chars-12345!@#"
$JWT_REFRESH_SECRET = "your-refresh-secret-min-32-chars-67890!@#"
$DB_ENDPOINT = "distro-db-cluster.xxxxx.us-east-1.rds.amazonaws.com"  # From Step 4
$DB_PASSWORD = "your-db-password-from-step-4"  # The one you created

$DATABASE_URL = "postgresql://distro_admin:$DB_PASSWORD@$DB_ENDPOINT:5432/distro_platform?schema=public"

# Store in AWS Secrets Manager
aws secretsmanager create-secret --name distro/jwt-access-secret --secret-string $JWT_ACCESS_SECRET --region us-east-1
aws secretsmanager create-secret --name distro/jwt-refresh-secret --secret-string $JWT_REFRESH_SECRET --region us-east-1
aws secretsmanager create-secret --name distro/database-url --secret-string $DATABASE_URL --region us-east-1
```

---

## STEP 9: Create Task Definitions

### Edit the files from your repo:

**File: `ecs-task-definition-api.json`**

Replace these values:
- `REPLACE_WITH_ACCOUNT_ID` → Your AWS Account ID
- `REPLACE_WITH_ECR_API_IMAGE` → `ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/distro-api:latest`

**File: `ecs-task-definition-web.json`**

Replace these values:
- `REPLACE_WITH_ACCOUNT_ID` → Your AWS Account ID
- `REPLACE_WITH_ECR_WEB_IMAGE` → `ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/distro-web:latest`
- `REPLACE_WITH_API_ALB_URL` → You'll get this after deploying API (for now use placeholder)

### Register in AWS:

```powershell
$ACCOUNT_ID = "YOUR_ACCOUNT_ID"

# Register API task definition
aws ecs register-task-definition `
  --cli-input-json file://ecs-task-definition-api.json `
  --region us-east-1

# Register Web task definition
aws ecs register-task-definition `
  --cli-input-json file://ecs-task-definition-web.json `
  --region us-east-1
```

---

## STEP 10: Create Application Load Balancer (ALB) (5 min)

### In AWS Console:

1. Go to **EC2 → Load Balancers → Create Load Balancer**

2. Choose **Application Load Balancer**

3. **Basic info:**
   - Name: `distro-alb`
   - Scheme: Internet-facing
   - IP: IPv4

4. **Network mapping:**
   - VPC: Default
   - Subnets: Select at least 2

5. **Security group:**
   - Create new: `distro-alb-sg`
   - Allow HTTP (80) from 0.0.0.0/0
   - Allow HTTPS (443) from 0.0.0.0/0 (for future)

6. Click **Next**

7. **Listeners:**
   - HTTP:80 → Create target group
   
8. **Create target group:**
   - Name: `distro-api-targets`
   - Protocol: HTTP
   - Port: 4000
   - VPC: Default
   - Click **Create**

9. Back to ALB → **Create ALB**

### Get ALB URL:
- After creation, copy the **DNS name** (e.g., `distro-alb-xxx.us-east-1.elb.amazonaws.com`)
- **Save this!** This is your production URL

---

## STEP 11: Get VPC & Subnet IDs (1 min)

```powershell
# Get default VPC
$VPC_ID = aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text --region us-east-1
Write-Host "VPC ID: $VPC_ID"

# Get subnets
$SUBNET_IDS = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[0:2].SubnetId" --output text --region us-east-1
Write-Host "Subnets: $SUBNET_IDS"

# Get default security group
$SG_ID = aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=default" --query "SecurityGroups[0].GroupId" --output text --region us-east-1
Write-Host "Security Group: $SG_ID"
```

---

## STEP 12: Create ECS Services

### Deploy API Service:

```powershell
$ACCOUNT_ID = "YOUR_ACCOUNT_ID"
$VPC_ID = "vpc-xxxxx"          # From Step 11
$SUBNET_IDS = "subnet-xxxxx subnet-xxxxx"  # From Step 11
$SG_ID = "sg-xxxxx"            # From Step 11
$ALB_TG_ARN = "arn:aws:elasticloadbalancing:us-east-1:$ACCOUNT_ID:targetgroup/distro-api-targets/xxxxx"

# Create API service
aws ecs create-service `
  --cluster distro-production `
  --service-name distro-api-service `
  --task-definition distro-api:1 `
  --desired-count 1 `
  --launch-type FARGATE `
  --load-balancers targetGroupArn=$ALB_TG_ARN,containerName=distro-api,containerPort=4000 `
  --network-configuration "awsvpcConfiguration={subnets=[$($SUBNET_IDS -replace ' ',',')],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" `
  --region us-east-1
```

### Deploy Web Service:

```powershell
# Create web target group first
aws elbv2 create-target-group `
  --name distro-web-targets `
  --protocol HTTP `
  --port 3000 `
  --vpc-id $VPC_ID `
  --region us-east-1

# Get new target group ARN and use in create-service command
# Similar to API service above but for port 3000
```

---

## 🎉 YOU'RE LIVE!

Once services are running (check ECS dashboard):

### Get Your URLs:

**Web App:**
```
https://distro-alb-xxx.us-east-1.elb.amazonaws.com
```

**API:**
```
https://distro-alb-xxx.us-east-1.elb.amazonaws.com:4000/api/v1
```

**Swagger Docs:**
```
https://distro-alb-xxx.us-east-1.elb.amazonaws.com:4000/api/docs
```

### Share with Client:

```
🌐 Live Demo URL: https://distro-alb-xxx.us-east-1.elb.amazonaws.com

📧 Test Credentials:
   Owner:    owner@distro.com / Password@123
   Staff:    staff@distro.com / Password@123
   Customer: customer@distro.com / Password@123
```

---

## ✅ Verification Checklist

After deployment:

- [ ] Can access web app
- [ ] Can login with test credentials
- [ ] Can view products/catalog
- [ ] Can create orders
- [ ] API docs work
- [ ] No console errors
- [ ] Database connected

If any issues, check:
```powershell
# View service logs
aws logs tail /ecs/distro-api --follow --region us-east-1
aws logs tail /ecs/distro-web --follow --region us-east-1
```

---

## 💰 Cost Check

First 12 months (Free Tier):
- ✅ RDS PostgreSQL: Free
- ✅ ECS Fargate: Free
- ✅ ALB: Free
- ✅ **Total: $0**

After free tier:
- ~$20-30/month

---

## 🚀 You're Done!

Now you can:
1. ✅ Share URL with client
2. ✅ Get their feedback
3. ✅ Make updates based on feedback
4. ✅ Deploy changes (just push to GitHub)

**Everything is ready for client demo!** 🎉

