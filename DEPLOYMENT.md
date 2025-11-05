# Deployment Guide

This guide explains how to deploy your Personal Diary app to various platforms.

## Prerequisites

Before deploying, ensure:
- The app builds successfully: `npm run build`
- All tests pass (if you add tests)
- Environment variables are configured

## Deployment Options

### 1. Vercel (Recommended)

Vercel offers the easiest deployment for Vite apps with automatic HTTPS (required for PWA).

**Steps:**

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link your project

4. For production:
```bash
vercel --prod
```

**Or use GitHub integration:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Vercel will auto-detect Vite and deploy

### 2. Netlify

Another excellent option with great PWA support.

**Steps:**

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build the project:
```bash
npm run build
```

3. Deploy:
```bash
netlify deploy
```

4. For production:
```bash
netlify deploy --prod
```

**Or use drag-and-drop:**
1. Build: `npm run build`
2. Go to [netlify.com](https://netlify.com)
3. Drag the `dist` folder to the deploy area

**Configuration file** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 3. GitHub Pages

Free hosting for static sites.

**Steps:**

1. Install gh-pages:
```bash
npm install -D gh-pages
```

2. Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

3. Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/diary/', // Replace with your repo name
  // ... rest of config
})
```

4. Deploy:
```bash
npm run deploy
```

5. Enable GitHub Pages:
   - Go to repository Settings
   - Navigate to Pages
   - Select `gh-pages` branch
   - Save

### 4. Firebase Hosting

Good integration if using Firebase for sync.

**Steps:**

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login:
```bash
firebase login
```

3. Initialize:
```bash
firebase init hosting
```

Configuration:
- Public directory: `dist`
- Single-page app: Yes
- Set up automatic builds: No (optional)

4. Build and deploy:
```bash
npm run build
firebase deploy
```

**firebase.json:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 5. Cloudflare Pages

Fast global CDN with excellent performance.

**Steps:**

1. Push code to GitHub
2. Go to [Cloudflare Pages](https://pages.cloudflare.com)
3. Create new project
4. Connect GitHub repository
5. Configure build:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: (if needed)
6. Deploy

### 6. Self-Hosting (Docker)

For complete control and privacy.

**Create `Dockerfile`:**
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

**Create `nginx.conf`:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build and run:**
```bash
docker build -t personal-diary .
docker run -p 80:80 personal-diary
```

## Environment Variables

If you implement sync with a backend, you'll need environment variables.

**Create `.env.local`:**
```env
VITE_BACKEND_URL=https://your-backend.com
VITE_API_KEY=your-api-key
```

**Access in code:**
```typescript
const backendUrl = import.meta.env.VITE_BACKEND_URL
```

**Configure in platforms:**
- **Vercel**: Project Settings > Environment Variables
- **Netlify**: Site Settings > Build & Deploy > Environment
- **Cloudflare**: Pages Settings > Environment Variables

## HTTPS Requirement

PWAs require HTTPS. All recommended platforms provide free HTTPS automatically:
- Vercel: Automatic
- Netlify: Automatic
- Cloudflare Pages: Automatic
- Firebase: Automatic
- GitHub Pages: Automatic for `*.github.io` domains

For self-hosting, use Let's Encrypt with Certbot or a reverse proxy like Caddy.

## Performance Optimization

### 1. Analyze Bundle Size
```bash
npm run build -- --analyze
```

### 2. Enable Compression

Most platforms enable this automatically, but for self-hosting, enable gzip/brotli in nginx:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 3. Image Optimization

For better performance, optimize images before uploading:
- Use WebP format
- Compress images
- Lazy load images

## Monitoring

### Check PWA Installation

1. Deploy your app
2. Open in Chrome
3. DevTools > Application > Manifest
4. Check for errors

### Test Offline

1. Open deployed app
2. DevTools > Network > Offline
3. Refresh - app should still work

### Lighthouse Score

1. Open deployed app
2. DevTools > Lighthouse
3. Run audit
4. Aim for 90+ on all metrics

## Custom Domain

### Vercel
1. Go to project settings
2. Add domain
3. Update DNS records as instructed

### Netlify
1. Domain settings
2. Add custom domain
3. Configure DNS

### Cloudflare Pages
1. Custom domains
2. Add domain (automatic DNS if using Cloudflare)

## Continuous Deployment

All recommended platforms support automatic deployment:

1. Push to `main` branch → Deploy to production
2. Push to `develop` → Deploy to preview
3. Pull requests → Deploy to preview URLs

**GitHub Actions example** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy

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
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Troubleshooting

### Service Worker Not Updating
- Clear cache in browser DevTools
- Use "Update on reload" in Application tab
- Check `vite-plugin-pwa` configuration

### PWA Not Installing
- Verify HTTPS is enabled
- Check manifest.json is served correctly
- Ensure service worker registers successfully

### Routing Issues
- Configure SPA redirects for your platform
- All routes should serve `index.html`

### Build Fails
- Check Node version matches requirements
- Clear node_modules and reinstall
- Check for TypeScript errors

## Security Considerations

1. **Content Security Policy**: Add to index.html:
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; img-src 'self' data: https:;">
```

2. **Environment Variables**: Never commit API keys
3. **Authentication**: Use secure token storage
4. **HTTPS Only**: Never deploy without HTTPS

## Backup Strategy

Since this is a personal diary:

1. **Enable sync** to have cloud backup
2. **Export functionality**: Implement data export
3. **Database backups**: If self-hosting with backend
4. **Version control**: Keep code in Git

## Cost Estimates

- **Vercel**: Free tier sufficient for personal use
- **Netlify**: Free tier sufficient
- **Cloudflare Pages**: Free tier unlimited
- **Firebase**: Free tier (Spark plan) sufficient
- **GitHub Pages**: Free
- **Self-hosted**: $5-10/month for VPS

## Recommendations

**For beginners**: Use Vercel or Netlify (easiest)
**For privacy**: Self-host with Docker
**For performance**: Cloudflare Pages
**For Firebase users**: Firebase Hosting

## Next Steps

After deployment:
1. Test on all devices
2. Install as PWA
3. Verify offline functionality
4. Monitor error logs
5. Set up analytics (optional)
6. Implement backup strategy
