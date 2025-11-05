# AWS Quick Start Guide

The fastest way to get your Personal Diary app deployed on AWS.

## Method 1: AWS Amplify (Recommended - 10 minutes)

This is the easiest option and works exactly like Vercel or Netlify.

### Step 1: Push to GitHub (if not already)

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy with Amplify Console

1. Go to https://console.aws.amazon.com/amplify
2. Click **"New app"** → **"Host web app"**
3. Choose **GitHub** and authorize AWS Amplify
4. Select your repository and branch (**main**)
5. Amplify will auto-detect settings (or use the `amplify.yml` file)
6. Click **"Save and deploy"**

**Done!** Your app will be live in ~5 minutes at a URL like:
```
https://main.d1234567890.amplifyapp.com
```

### Cost
- **Free tier**: 1000 build minutes/month, 5GB served/month
- **Typically**: $0/month for personal use
- **HTTPS**: Included automatically

---

## Method 2: S3 + CloudFront (Most Popular - 30 minutes)

Best for learning AWS and cost control.

### Prerequisites
- AWS CLI installed: https://aws.amazon.com/cli/
- AWS account credentials

### Step 1: Install AWS CLI (if needed)

**Windows:**
Download from: https://awscli.amazonaws.com/AWSCLIV2.msi

**macOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Step 2: Configure AWS CLI

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Output format: `json`

**Don't have access keys?**
1. Go to https://console.aws.amazon.com/iam/
2. Users → Your username → Security credentials
3. Create access key → CLI access

### Step 3: Create S3 Bucket

```bash
# Replace with your unique bucket name
export BUCKET_NAME="my-diary-app-12345"

# Create bucket
aws s3 mb s3://$BUCKET_NAME

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Make bucket publicly readable (we'll use CloudFront)
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadGetObject",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
  }]
}'
```

### Step 4: Create CloudFront Distribution

This provides HTTPS (required for PWA) and global CDN.

**Via Console** (easier):
1. Go to https://console.aws.amazon.com/cloudfront/
2. Click **"Create distribution"**
3. **Origin domain**: Select your S3 bucket
4. **Viewer protocol policy**: Redirect HTTP to HTTPS
5. **Default root object**: `index.html`
6. Click **"Create distribution"**
7. Wait 10-15 minutes for deployment
8. Note your CloudFront URL: `https://d1234567890.cloudfront.net`

**Important**: Add custom error responses:
- Go to distribution → Error pages
- Add: 403 → `/index.html` → 200
- Add: 404 → `/index.html` → 200

### Step 5: Deploy Your App

**Windows (PowerShell):**
```powershell
# Edit the script to add your bucket name and distribution ID
.\deploy-aws.ps1 -BucketName "my-diary-app-12345" -DistributionId "E1234567890ABC"
```

**Mac/Linux/Git Bash:**
```bash
# Make script executable
chmod +x deploy-aws.sh

# Deploy
./deploy-aws.sh my-diary-app-12345 E1234567890ABC
```

**Or manually:**
```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://$BUCKET_NAME --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

### Cost
- **S3**: ~$0.50/month for 5GB storage
- **CloudFront**: ~$0.10/month for 5GB transfer
- **Total**: ~$0.60/month (often covered by free tier for first year)

---

## Method 3: Docker + App Runner (Container Fans - 20 minutes)

If you prefer containers or want automatic Git deployments.

### Step 1: Test Locally

```bash
# Build Docker image
docker build -t diary-app .

# Run locally
docker run -p 80:80 diary-app

# Test at http://localhost
```

### Step 2: Deploy to App Runner

**Via Console**:
1. Go to https://console.aws.amazon.com/apprunner/
2. Click **"Create service"**
3. **Source**: Repository (connect GitHub) or Container registry
4. **Build settings**:
   - Build command: `npm install && npm run build`
   - Start command: Leave default
5. **Service settings**:
   - Port: `80`
   - CPU: 0.25 vCPU
   - Memory: 0.5 GB
6. Click **"Create & deploy"**

### Cost
- ~$5/month for always-on
- Includes auto-scaling and HTTPS

---

## Comparison

| Method | Time | Cost/Month | Difficulty | Best For |
|--------|------|------------|------------|----------|
| **Amplify** | 10 min | $0 | ⭐ Easy | **Most users** |
| **S3+CloudFront** | 30 min | $0.60 | ⭐⭐ Medium | Learning AWS |
| **App Runner** | 20 min | $5 | ⭐⭐ Medium | Container fans |

## After Deployment

### 1. Test PWA Functionality
- Open your deployed URL
- Check for HTTPS (required for PWA)
- Install as PWA (look for install button in browser)
- Test offline mode (DevTools → Network → Offline)

### 2. Optional: Custom Domain

**Amplify:**
- Domain management → Add domain → Follow DNS instructions

**CloudFront:**
- Request SSL certificate in Certificate Manager (us-east-1)
- Add alternate domain name to CloudFront
- Update DNS CNAME to point to CloudFront

### 3. Set Up Automatic Deployments

**Amplify:** Already automatic on git push!

**S3+CloudFront:** See GitHub Actions workflow in `AWS_DEPLOYMENT.md`

## Troubleshooting

### AWS CLI not configured
```bash
aws configure
```

### PWA not installing
- Check HTTPS is enabled ✓
- Check manifest.json loads ✓
- Check service worker registers ✓

### Build fails
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### S3 bucket name taken
Bucket names must be globally unique. Try:
- `diary-app-yourname`
- `my-diary-app-12345`
- `personal-diary-random123`

## Need Help?

1. **Full details**: See `AWS_DEPLOYMENT.md`
2. **General docs**: See `README.md`
3. **Issues**: Check browser console for errors

## Next Steps

After deploying:
1. ✅ Test on all your devices
2. ✅ Install as PWA
3. ✅ Verify offline functionality
4. ✅ Consider setting up cloud sync (see `src/sync.ts`)
5. ✅ Set up billing alerts in AWS

---

**My Recommendation:** Start with **AWS Amplify**. It's by far the easiest and likely free for personal use. You can always migrate to S3+CloudFront later if needed.

Ready to deploy? Start with Method 1 above! 🚀
