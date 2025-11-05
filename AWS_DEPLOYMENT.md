# AWS Deployment Guide

This guide covers multiple ways to deploy your Personal Diary app on AWS.

## Option 1: AWS Amplify (Recommended - Easiest)

AWS Amplify is the easiest option, similar to Vercel/Netlify, with automatic builds and HTTPS.

### Prerequisites
- AWS Account
- AWS CLI installed (optional)
- Git repository (GitHub, GitLab, or Bitbucket)

### Method A: Amplify Console (Web Interface)

1. **Push code to Git** (if not already):
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy via Amplify Console**:
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Click "New app" > "Host web app"
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Authorize AWS Amplify
   - Select your repository and branch
   - Configure build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

3. **Advanced settings** (optional):
   - Add environment variables if needed
   - Configure custom domain
   - Enable performance mode

4. **Save and Deploy**
   - AWS will build and deploy automatically
   - You'll get a URL like: `https://main.d1234567890.amplifyapp.com`

### Method B: Amplify CLI

1. **Install Amplify CLI**:
```bash
npm install -g @aws-amplify/cli
```

2. **Configure Amplify**:
```bash
amplify configure
```
   - Follow prompts to sign in and create IAM user
   - Save access key and secret key

3. **Initialize Amplify in your project**:
```bash
amplify init
```
   - Enter a name for the project
   - Accept defaults or customize
   - Choose your AWS profile

4. **Add hosting**:
```bash
amplify add hosting
```
   - Select "Hosting with Amplify Console"
   - Choose "Manual deployment"

5. **Build and deploy**:
```bash
npm run build
amplify publish
```

### Amplify Benefits
- ✅ Automatic HTTPS with custom domain support
- ✅ Global CDN
- ✅ CI/CD from Git
- ✅ Free tier: 1000 build minutes/month, 15GB storage, 5GB served/month
- ✅ Easy rollbacks
- ✅ Preview deployments for branches
- ✅ Perfect for PWAs

### Amplify Cost
- Free tier is generous for personal use
- Beyond free tier: ~$0.01 per build minute, $0.15/GB served

---

## Option 2: S3 + CloudFront (Traditional Static Hosting)

Best for complete control and potentially lower costs for high traffic.

### Step 1: Create S3 Bucket

1. **Go to S3 Console**:
   - Navigate to [S3 Console](https://s3.console.aws.amazon.com/)
   - Click "Create bucket"

2. **Configure bucket**:
   - Bucket name: `my-diary-app` (must be globally unique)
   - Region: Choose closest to your users
   - **Uncheck** "Block all public access" (we'll use CloudFront)
   - Create bucket

3. **Enable static website hosting**:
   - Select your bucket
   - Properties tab > Static website hosting > Enable
   - Index document: `index.html`
   - Error document: `index.html` (for SPA routing)
   - Save changes

### Step 2: Upload Your Built App

1. **Build your app**:
```bash
npm run build
```

2. **Upload to S3** (via Console):
   - Open your bucket
   - Click "Upload"
   - Drag the contents of `dist` folder (not the folder itself)
   - Upload

**Or use AWS CLI**:
```bash
# Install AWS CLI first: https://aws.amazon.com/cli/
aws configure  # Enter your credentials
aws s3 sync dist/ s3://my-diary-app --delete
```

### Step 3: Create CloudFront Distribution

CloudFront provides HTTPS (required for PWA) and global CDN.

1. **Go to CloudFront Console**:
   - Navigate to [CloudFront Console](https://console.aws.amazon.com/cloudfront/)
   - Click "Create distribution"

2. **Configure distribution**:
   - **Origin domain**: Select your S3 bucket
   - **Origin access**: "Origin access control settings (recommended)"
     - Create new OAC
   - **Viewer protocol policy**: "Redirect HTTP to HTTPS"
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS
   - **Cache policy**: CachingOptimized
   - **Price class**: Choose based on budget
   - **Alternate domain name (CNAME)**: Your custom domain (optional)
   - **SSL Certificate**: Request or import certificate for custom domain
   - **Default root object**: `index.html`

3. **Custom error responses** (for SPA routing):
   - After creating, go to "Error pages" tab
   - Create custom error response:
     - HTTP error code: 403
     - Customize error response: Yes
     - Response page path: `/index.html`
     - HTTP response code: 200
   - Repeat for 404 error code

4. **Update S3 bucket policy**:
   - CloudFront will show a policy to add
   - Go to S3 bucket > Permissions > Bucket policy
   - Paste the policy CloudFront generated

5. **Wait for deployment** (10-15 minutes)

6. **Get your CloudFront URL**:
   - Format: `https://d1234567890.cloudfront.net`

### Step 4: Deploy Script

Create a deploy script to make updates easier.

**Create `scripts/deploy-aws.sh`**:
```bash
#!/bin/bash

# Build the app
echo "Building app..."
npm run build

# Sync to S3
echo "Uploading to S3..."
aws s3 sync dist/ s3://my-diary-app --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

Make it executable:
```bash
chmod +x scripts/deploy-aws.sh
```

Add to `package.json`:
```json
{
  "scripts": {
    "deploy:aws": "bash scripts/deploy-aws.sh"
  }
}
```

Deploy with:
```bash
npm run deploy:aws
```

### S3 + CloudFront Benefits
- ✅ Very cost-effective for high traffic
- ✅ Full control
- ✅ Global CDN
- ✅ Highly scalable

### S3 + CloudFront Cost
- S3: $0.023/GB storage, $0.09/GB transfer
- CloudFront: ~$0.085/GB (varies by region)
- Free tier: 5GB CloudFront transfer/month (12 months)
- Typical personal use: < $1/month

---

## Option 3: AWS App Runner (Container-based)

If you prefer containerization or want automatic deployments from source.

### Prerequisites
- Dockerfile (provided below)

### Step 1: Create Dockerfile

**Create `Dockerfile`** (if not exists):
```dockerfile
FROM node:20-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Create `nginx.conf`**:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
}
```

### Step 2: Deploy to App Runner

1. **Via Console**:
   - Go to [App Runner Console](https://console.aws.amazon.com/apprunner/)
   - Click "Create service"
   - **Source**:
     - Repository (connect GitHub) OR
     - Container registry (push to ECR first)
   - **Build settings**:
     - Runtime: Nodejs 20
     - Build command: `npm install && npm run build`
     - Start command: Let App Runner handle it
   - **Service settings**:
     - CPU/Memory: 0.25 vCPU, 0.5 GB (sufficient)
     - Port: 80
   - Create service

### App Runner Benefits
- ✅ Automatic deployments from Git
- ✅ Auto-scaling
- ✅ Automatic HTTPS
- ✅ Load balancing included

### App Runner Cost
- ~$0.007/hour for 0.25 vCPU, 0.5 GB
- ~$5/month if running 24/7
- Good for development, overkill for static site

---

## Option 4: Elastic Beanstalk

For more traditional application hosting.

### Quick Deploy

1. **Install EB CLI**:
```bash
pip install awsebcli
```

2. **Initialize**:
```bash
eb init
```
   - Choose region
   - Create new application
   - Platform: Docker

3. **Create environment and deploy**:
```bash
eb create diary-app-env
```

4. **Update**:
```bash
npm run build
eb deploy
```

### Beanstalk Cost
- ~$20-30/month (includes EC2, Load Balancer)
- Overkill for a static PWA

---

## Comparison & Recommendations

| Option | Difficulty | Cost/Month | Best For |
|--------|-----------|------------|----------|
| **Amplify** | ⭐ Easy | $0-2 | **Recommended - easiest** |
| **S3 + CloudFront** | ⭐⭐ Medium | $0-1 | Cost-conscious, high control |
| **App Runner** | ⭐⭐⭐ Medium | $5+ | Container fans |
| **Elastic Beanstalk** | ⭐⭐⭐⭐ Hard | $20+ | Not recommended |

### My Recommendation: **AWS Amplify**

For your use case, I strongly recommend **AWS Amplify** because:
1. Easiest to set up and maintain
2. Perfect for PWAs
3. Automatic HTTPS
4. CI/CD built-in
5. Very affordable (likely free tier)
6. No server management

---

## Custom Domain Setup

### For Amplify

1. **In Amplify Console**:
   - Domain management > Add domain
   - Enter your domain
   - Amplify will guide you through DNS setup

2. **Update DNS** (Route 53 or external):
   - Add CNAME records as instructed

### For CloudFront

1. **Request SSL Certificate** (Certificate Manager):
   - Go to Certificate Manager (us-east-1 region for CloudFront)
   - Request certificate
   - Validate via DNS or email

2. **Add to CloudFront**:
   - Edit distribution
   - Add alternate domain name
   - Select SSL certificate
   - Save

3. **Update DNS**:
   - Add CNAME record pointing to CloudFront URL

---

## CI/CD Pipeline with GitHub Actions

Automate deployments on push to main.

### For S3 + CloudFront

**Create `.github/workflows/deploy.yml`**:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to S3
        run: aws s3 sync dist/ s3://my-diary-app --delete

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

**Add secrets to GitHub**:
- Go to repository Settings > Secrets and variables > Actions
- Add:
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `CLOUDFRONT_DISTRIBUTION_ID`

---

## Security Best Practices

1. **IAM User for Deployments**:
   - Create dedicated IAM user
   - Attach minimal permissions
   - For S3+CloudFront:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::my-diary-app",
        "arn:aws:s3:::my-diary-app/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

2. **Enable S3 Versioning** (backup):
```bash
aws s3api put-bucket-versioning \
  --bucket my-diary-app \
  --versioning-configuration Status=Enabled
```

3. **CloudFront Security Headers**:
   - Add Lambda@Edge or CloudFront Functions for headers
   - Or configure in nginx.conf if using containers

---

## Monitoring & Logging

### CloudWatch (all options)
- Automatic logging
- Set up alarms for errors
- Monitor costs

### Access Logs
- Enable CloudFront access logs
- Enable S3 access logs

---

## Troubleshooting

### PWA not working
- Ensure CloudFront is using HTTPS
- Check service worker registration
- Verify manifest.json is served correctly

### 403/404 errors
- Check CloudFront custom error responses
- Verify S3 bucket policy
- Ensure index.html is in root

### Build fails in Amplify
- Check build logs
- Verify node version in build settings
- Check for missing dependencies

---

## Cost Optimization

1. **Use S3 Intelligent-Tiering** for storage
2. **Enable CloudFront compression**
3. **Set appropriate cache headers**
4. **Use Route 53 only if needed** (or use external DNS)
5. **Monitor usage** with AWS Cost Explorer
6. **Set billing alerts**

---

## Next Steps

1. Choose deployment method (recommend: **Amplify**)
2. Deploy using instructions above
3. Test PWA functionality
4. Configure custom domain (optional)
5. Set up CI/CD (optional)
6. Monitor costs and usage

Need help with any step? Let me know!
