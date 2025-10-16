# Frontend Deployment Guide - CloudFront

This document describes how the Trial Compass Pro frontend is deployed to AWS CloudFront for global content delivery.

---

## 🌐 Live Deployment

**Public URL:** https://d25df0kqd06e10.cloudfront.net

The frontend is currently live and accessible at the above URL. This deployment is managed through Amazon CloudFront CDN for optimal performance worldwide.

---

## 📋 Deployment Overview

The Trial Compass Pro frontend is a React + TypeScript + Vite application deployed using AWS CloudFront with an S3 origin. This architecture provides:

- **Global CDN**: Fast content delivery worldwide via CloudFront edge locations
- **HTTPS**: Secure connections with SSL/TLS
- **SPA Support**: Single Page Application routing support
- **Caching**: Optimized cache policies for static assets
- **Cost-Effective**: S3 storage with CloudFront distribution

---

## 🏗️ Architecture

```
React Application (Vite Build)
         ↓
    npm run build
         ↓
      dist/ folder
         ↓
    AWS S3 Bucket (origin)
         ↓
Amazon CloudFront Distribution
         ↓
    Edge Locations (Global)
         ↓
  End Users (Worldwide)
```

---

## 🚀 Deployment Steps

### Prerequisites

- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- npm or bun package manager
- Access to AWS S3 and CloudFront

### Step 1: Build the Application

```bash
# Navigate to project directory
cd trial-compass-pro

# Install dependencies (if not already installed)
npm install

# Build the production bundle
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Step 2: Deploy to S3

```bash
# Set your S3 bucket name
BUCKET_NAME="your-bucket-name"

# Sync the dist folder to S3
aws s3 sync dist/ s3://${BUCKET_NAME}/ --delete

# Set appropriate cache headers for static assets
aws s3 cp s3://${BUCKET_NAME}/assets/ s3://${BUCKET_NAME}/assets/ \
  --recursive \
  --metadata-directive REPLACE \
  --cache-control "max-age=31536000,public"

# Set cache headers for HTML files (no cache)
aws s3 cp s3://${BUCKET_NAME}/index.html s3://${BUCKET_NAME}/index.html \
  --metadata-directive REPLACE \
  --cache-control "no-cache,no-store,must-revalidate"
```

### Step 3: Configure S3 Bucket for Static Website Hosting

```bash
# Enable static website hosting
aws s3 website s3://${BUCKET_NAME}/ \
  --index-document index.html \
  --error-document index.html
```

### Step 4: Invalidate CloudFront Cache

After deploying new changes, invalidate the CloudFront cache to ensure users get the latest version:

```bash
# Set your CloudFront distribution ID
DISTRIBUTION_ID="your-distribution-id"

# Create invalidation
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"
```

**Note:** CloudFront invalidations typically take 1-3 minutes to complete.

---

## ⚙️ CloudFront Configuration

### Distribution Settings

- **Origin Domain:** S3 bucket endpoint
- **Origin Protocol Policy:** HTTP Only (S3 static website)
- **Viewer Protocol Policy:** Redirect HTTP to HTTPS
- **Allowed HTTP Methods:** GET, HEAD, OPTIONS
- **Compress Objects Automatically:** Yes

### Default Cache Behavior

```json
{
  "ViewerProtocolPolicy": "redirect-to-https",
  "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
  "CachedMethods": ["GET", "HEAD", "OPTIONS"],
  "Compress": true,
  "DefaultTTL": 86400,
  "MaxTTL": 31536000,
  "MinTTL": 0
}
```

### Custom Error Response (SPA Support)

To support client-side routing in the Single Page Application:

```json
{
  "ErrorCode": 404,
  "ResponseCode": 200,
  "ResponsePagePath": "/index.html",
  "ErrorCachingMinTTL": 300
}
```

This ensures that all routes are handled by the React Router on the client side.

---

## 🔐 Security Configuration

### S3 Bucket Policy

The S3 bucket has a policy that allows CloudFront Origin Access Identity (OAI) to read objects:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontOAI",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR-OAI-ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### CloudFront Security Headers

Recommended security headers are configured via CloudFront Functions or Lambda@Edge:

- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

---

## 🎯 Cache Strategy

### Static Assets (JS, CSS, Images)

- **Location:** `/assets/*`
- **Cache-Control:** `max-age=31536000,public` (1 year)
- **Reason:** Vite generates unique hashes for each build, allowing aggressive caching

### HTML Files

- **Location:** `/index.html`
- **Cache-Control:** `no-cache,no-store,must-revalidate`
- **Reason:** Always fetch the latest HTML to get updated asset references

### API Calls

- **Not cached by CloudFront**
- Routed directly to API Gateway backend
- Authentication handled via Cognito JWT tokens

---

## 📊 Monitoring & Metrics

### CloudWatch Metrics

Monitor CloudFront distribution performance via CloudWatch:

- **Requests:** Total number of requests
- **BytesDownloaded:** Total data transferred
- **4xxErrorRate:** Client error rate
- **5xxErrorRate:** Server error rate
- **CacheHitRate:** Percentage of requests served from cache

### CloudFront Access Logs

Enable access logs to S3 for detailed request analysis:

```bash
aws cloudfront update-distribution \
  --id ${DISTRIBUTION_ID} \
  --distribution-config file://distribution-config.json
```

---

## 🔄 Continuous Deployment

### Current Setup

The deployment is currently manual using the steps above. For automated deployments, consider:

1. **GitHub Actions Workflow:**

```yaml
name: Deploy to CloudFront

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Deploy to S3
        run: |
          aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }}/ --delete
      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
            --paths "/*"
```

2. **AWS Amplify:**
   - Connect GitHub repository
   - Automatic builds on push to main
   - Built-in CDN and hosting
   - See `amplify.yml` in project root

---

## 🌍 Environment Variables

The frontend requires the following environment variables to be configured during build:

```bash
# Cognito Configuration
VITE_USER_POOL_ID=us-east-1_zLcYERVQI
VITE_USER_POOL_CLIENT_ID=37ef9023q0b9q6lsdvc5rlvpo1
VITE_AWS_REGION=us-east-1

# API Gateway Endpoint
VITE_API_BASE_URL=https://gt7dlyqj78.execute-api.us-east-1.amazonaws.com/prod/
```

These are typically set in `.env.local` for local development or configured in the CI/CD pipeline for production builds.

---

## 🧪 Testing the Deployment

### Verify Deployment

```bash
# Check if the site is accessible
curl -I https://d25df0kqd06e10.cloudfront.net

# Expected response:
# HTTP/2 200
# content-type: text/html
# x-cache: Hit from cloudfront
```

### Test SPA Routing

```bash
# Test a client-side route (should return 200, not 404)
curl -I https://d25df0kqd06e10.cloudfront.net/dashboard

# Expected: 200 OK (redirected to index.html)
```

### Test API Connectivity

1. Open browser to https://d25df0kqd06e10.cloudfront.net
2. Open DevTools Console
3. Check for successful API calls to the backend
4. Verify authentication flow with Cognito

---

## 🛠️ Troubleshooting

### Issue: 404 Errors on Page Refresh

**Solution:** Ensure CloudFront has a custom error response configured to redirect 404 to index.html.

### Issue: Old Content Still Showing

**Solutions:**
1. Clear browser cache
2. Create CloudFront invalidation
3. Check if deployment uploaded correctly to S3

### Issue: API Calls Failing

**Check:**
1. CORS configuration on API Gateway
2. Environment variables are correctly set during build
3. Cognito credentials are valid
4. API Gateway endpoint is accessible

### Issue: Slow Initial Load

**Solutions:**
1. Enable CloudFront compression
2. Optimize bundle size with code splitting
3. Use lazy loading for routes
4. Enable HTTP/2 in CloudFront

---

## 📈 Performance Optimization

### Current Optimizations

1. **Vite Build Optimization:**
   - Code splitting
   - Tree shaking
   - Minification
   - Asset optimization

2. **CloudFront:**
   - Gzip/Brotli compression
   - Edge caching
   - HTTP/2 support
   - Global edge locations

3. **Asset Strategy:**
   - Hashed filenames for cache busting
   - Separate vendor bundles
   - Lazy-loaded routes
   - Optimized images

---

## 💰 Cost Considerations

### Estimated Monthly Costs

- **S3 Storage:** ~$0.023 per GB (minimal for static files)
- **CloudFront:**
  - Data Transfer: $0.085 per GB (first 10TB)
  - Requests: $0.0075 per 10,000 HTTPS requests
- **Total:** Typically $5-20/month for moderate traffic

### Cost Optimization Tips

1. Enable CloudFront compression to reduce data transfer
2. Use appropriate cache TTLs to reduce origin requests
3. Consider CloudFront's free tier (1TB data transfer per month for first 12 months)

---

## 🔗 Related Resources

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [React Production Deployment](https://reactjs.org/docs/optimizing-performance.html)

---

## 📝 Deployment History

| Date | Version | Changes | Deployed By |
|------|---------|---------|-------------|
| 2025-10-16 | 1.0.0 | Initial deployment with Samyama.ai branding | Team Samyama |
| 2025-10-16 | 1.0.1 | Updated favicon and branding integration | Team Samyama |

---

## 📞 Support

For deployment issues or questions:

- **Organization:** Samyama.ai
- **Website:** https://samyama.ai
- **GitHub:** https://github.com/VaidhyaMegha/trial-compass-pro

---

**Deployed URL:** https://d25df0kqd06e10.cloudfront.net

**Last Updated:** October 16, 2025
