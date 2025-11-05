# Cloud Sync Setup Guide

This guide will help you set up cloud sync for your Personal Diary app using Supabase.

## Prerequisites

- ✅ Supabase account created
- ✅ Supabase project created
- ✅ Database tables created (using `supabase-setup.sql`)

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project (`personal-diary` or whatever you named it)
3. Click on **Settings** (gear icon) in the left sidebar
4. Click on **API** under "Configuration"
5. You'll see two important values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys") - long string starting with `eyJ...`

## Step 2: Configure Local Environment

1. Open the file `.env.local` in your project root
2. Add your credentials:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file

**Important:** Never commit `.env.local` to Git! It's already in `.gitignore`.

## Step 3: Test Locally

1. **Stop your dev server** if it's running (Ctrl+C)
2. **Start it again** to load the new environment variables:
   ```bash
   npm run dev
   ```
3. Open http://localhost:5173
4. You should now see a **"Sign In"** button in the header
5. Click it and create an account or sign in with Google

## Step 4: Test Sync

1. **Sign in** to your account
2. **Create a test entry**
3. Open your browser's DevTools → Console
4. You should see: `"Entry sync completed successfully"` and `"Tag sync completed successfully"`
5. Check Supabase dashboard → Table Editor → `entries` table
   - You should see your entry there!

## Step 5: Test Multi-Device Sync

1. **On Device 1** (where you just created the entry):
   - Your entry should be visible
2. **On Device 2** (different browser/device):
   - Go to your deployed app URL
   - Sign in with the same account
   - You should see the entry from Device 1!
3. **Create an entry on Device 2**
4. **Refresh Device 1**
   - Both entries should now be visible

## Step 6: Configure AWS Amplify for Production

To enable sync in your deployed app on AWS Amplify:

1. Go to https://console.aws.amazon.com/amplify
2. Select your app
3. Click on **Environment variables** in the left sidebar
4. Click **Manage variables**
5. Add two variables:
   - Variable name: `VITE_SUPABASE_URL`
     Value: `https://xxxxx.supabase.co`
   - Variable name: `VITE_SUPABASE_ANON_KEY`
     Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
6. Click **Save**
7. Click **Redeploy this version** to rebuild with the new environment variables

**Note:** Wait ~2-5 minutes for the deployment to complete.

## How Sync Works

### Automatic Sync
- **Every 5 minutes** when online and signed in
- **Immediately** when you come back online
- **After creating/editing/deleting** an entry

### Conflict Resolution
- Uses **"last write wins"** strategy based on timestamps
- If you edit on Device 1 at 2:00 PM and Device 2 at 2:05 PM, Device 2's version wins
- Both local and cloud data are preserved during conflicts

### Offline Mode
- App works fully offline
- All entries are stored locally in IndexedDB
- When you come back online, unsaved changes automatically sync

## Troubleshooting

### "Supabase not configured" in console

**Problem:** Environment variables not loaded.

**Solution:**
1. Make sure `.env.local` exists and has correct values
2. Restart your dev server (`npm run dev`)
3. Check that variable names start with `VITE_` (required for Vite)

### Sync not working on deployed site

**Problem:** Environment variables not set in Amplify.

**Solution:**
1. Go to AWS Amplify Console
2. Environment variables → Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Redeploy the app

### "Row Level Security policy violation" error

**Problem:** Database policies not created.

**Solution:**
1. Go to Supabase → SQL Editor
2. Run the `supabase-setup.sql` file again
3. Verify policies exist: Table Editor → Select table → Click "RLS" tab

### Sign in button doesn't appear

**Problem:** Supabase credentials not configured.

**Solution:**
- The app only shows sign-in when Supabase is properly configured
- Check your `.env.local` file has both variables
- Restart dev server

### Can't sign in with Google

**Problem:** Google OAuth not configured in Supabase.

**Solution:**
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Follow instructions to set up Google OAuth credentials
4. Add your site URL to authorized redirect URIs

## Optional: Email Confirmation

By default, Supabase requires email confirmation for new signups.

**To disable** (for testing):
1. Go to Supabase Dashboard → Authentication → Settings
2. Scroll to "Email Auth"
3. Toggle off "Enable email confirmations"
4. Click Save

**To enable** (for production - recommended):
- Keep email confirmations enabled
- Users will receive a confirmation email after signup
- They must click the link before they can sign in

## Security Notes

- ✅ **anon key is safe to expose** - It only allows operations permitted by Row Level Security policies
- ✅ **RLS policies** ensure users can only see their own data
- ✅ **Never commit** `.env.local` to Git
- ✅ **All data is encrypted** in transit (HTTPS)
- ✅ **Supabase encrypts data** at rest

## Need Help?

Check these resources:
- Supabase docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- This project's README.md

## Next Steps

After setting up sync:
1. ✅ Test on all your devices
2. ✅ Install the PWA on each device
3. ✅ Verify entries sync between devices
4. ✅ Test offline mode (airplane mode)
5. ✅ Check sync works when coming back online

Enjoy your synchronized diary app!
