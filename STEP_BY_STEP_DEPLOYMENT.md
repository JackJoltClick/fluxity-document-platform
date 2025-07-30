# 📋 Step-by-Step Deployment Instructions

Follow these steps **exactly** in order. Don't skip any steps.

---

## 🔧 **PART 1: GET MAILGUN SIGNING KEY**

### Step 1: Log into Mailgun
1. Go to https://app.mailgun.com/
2. Log in with your account

### Step 2: Find Your Signing Key
1. Click **"Sending"** in the left menu
2. Click **"Webhooks"**
3. Look for **"HTTP webhook signing key"**
4. Copy this key (it looks like: `key-1234567890abcdef...`)

### Step 3: Add Key to Your Project
1. Open your project in VS Code/editor
2. Open the file `.env.local`
3. Find this line: `# MAILGUN_SIGNING_KEY=your-actual-signing-key-here`
4. Replace it with: `MAILGUN_SIGNING_KEY=your-actual-key-here`
   (Replace `your-actual-key-here` with the key you copied)

---

## 🚀 **PART 2: DEPLOY TO VERCEL**

### Step 4: Install Vercel CLI
Open terminal and run:
```bash
npm install -g vercel
```

### Step 5: Login to Vercel
In terminal, run:
```bash
vercel login
```
- Choose your login method (GitHub, email, etc.)
- Complete the login process

### Step 6: Deploy Your Project
1. In terminal, navigate to your project:
   ```bash
   cd "/Users/jackbuchanan-conroy/Desktop/FLUXITY - V2 JULY 2025/fluxity-app"
   ```

2. Run the deploy command:
   ```bash
   vercel --prod
   ```

3. Vercel will ask questions. Answer like this:
   - **"Set up and deploy?"** → Press Enter (Yes)
   - **"Which scope?"** → Choose your account
   - **"Link to existing project?"** → N (No)
   - **"What's your project's name?"** → `fluxity-app` (or whatever you want)
   - **"In which directory?"** → Press Enter (current directory)
   - **"Override settings?"** → N (No)

4. Wait for deployment to complete. You'll get a URL like: `https://fluxity-app-abc123.vercel.app`

---

## 🔑 **PART 3: SET ENVIRONMENT VARIABLES**

### Step 7: Set Variables in Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Click on your `fluxity-app` project
3. Click **"Settings"** tab
4. Click **"Environment Variables"** in left menu
5. Add each variable one by one:

**Add these variables exactly:**

| Name | Value | Environment |
|------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pgrnpspobiiwqyjlixoi.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm5wc3BvYmlpd3F5amxpeG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2Njc1ODMsImV4cCI6MjA2ODI0MzU4M30.ra8bzz1Ra7CmkG_ki_2R-TG15NRw5kYC4sXREWf1AQc` | Production |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncm5wc3BvYmlpd3F5amxpeG9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY2NzU4MywiZXhwIjoyMDY4MjQzNTgzfQ.EakRUGXgI6yd8Ipvh9B5iKWx5QXqJNFJKPVvVIIBn94` | Production |
| `OPENAI_API_KEY` | `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` | Production |
| `MINDEE_API_KEY` | `md_3o6lp5guvhstdhf2hlznu6kvthhc2t8f` | Production |
| `MAILGUN_SIGNING_KEY` | (The key you got from Mailgun) | Production |
| `EXTRACTION_SERVICE` | `openai` | Production |
| `EXTRACTION_CONFIDENCE_THRESHOLD` | `0.8` | Production |
| `SIMPLE_MAPPING_MODE` | `true` | Production |

**How to add each variable:**
1. Click **"Add New"**
2. Enter the **Name** exactly as shown
3. Enter the **Value** 
4. Select **"Production"** for Environment
5. Click **"Save"**
6. Repeat for all variables

### Step 8: Set Up Redis (Optional but Recommended)
**Redis is needed for the document processing queue. You can skip this for now, but you'll see Redis connection errors.**

#### Option A: Use Upstash Redis (Recommended - 5 minutes)
1. Go to https://upstash.com/
2. Sign up/login (can use GitHub)
3. Click **"Create Database"**
4. Choose:
   - **Type**: Redis
   - **Name**: `fluxity-redis`
   - **Region**: Choose closest to your users
5. Click **"Create"**
6. Copy the **"REDIS_URL"** (looks like: `redis://:password@host:port`)
7. Add this to Vercel environment variables:
   - **Name**: `REDIS_URL`
   - **Value**: Your copied Redis URL
   - **Environment**: Production
   - Click **"Save"**

#### Option B: Skip Redis for Now
- ⚠️ The app will work but show Redis connection errors in logs
- Document processing will be slower (no queue system)
- You can add Redis later when needed

### Step 9: Redeploy After Adding Variables
After adding all variables (including Redis if you chose it), redeploy:
```bash
vercel --prod
```

---

## 📧 **PART 4: CONFIGURE MAILGUN WEBHOOK**

### Step 10: Set Up Webhook in Mailgun
1. Go back to https://app.mailgun.com/
2. Click **"Sending"** → **"Webhooks"**
3. Click **"Add webhook"**
4. Fill out:
   - **URL**: `https://your-vercel-url.vercel.app/api/webhooks/mailgun`
     (Replace `your-vercel-url` with your actual Vercel URL)
   - **Events**: Check these boxes:
     - ✅ Delivered
     - ✅ Failed
     - ✅ Opened (optional)
5. Click **"Create webhook"**

---

## ✅ **PART 5: TEST EVERYTHING**

### Step 11: Test Your Deployment
1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try logging in
3. Try uploading a document
4. Check that everything works

### Step 12: Test Mailgun Webhook
1. In terminal, test the webhook:
   ```bash
   curl https://your-vercel-url.vercel.app/api/webhooks/mailgun
   ```
2. You should get a response like: `{"status":"healthy","service":"mailgun-webhook"}`

### Step 13: Test Email Processing (Optional)
1. Send an email with a PDF attachment to your Mailgun email address
2. Check your app to see if the document appears
3. Check Vercel logs if something doesn't work

---

## 🚨 **TROUBLESHOOTING**

### If deployment fails:
1. Run `npm run build` locally first
2. Fix any errors
3. Commit changes: `git add . && git commit -m "fix build errors"`
4. Try deploying again

### If webhook doesn't work:
1. Check the Mailgun signing key is correct
2. Make sure the webhook URL is exactly right
3. Check Vercel function logs in the dashboard

### If app doesn't load:
1. Check all environment variables are set correctly
2. Make sure Supabase is accessible
3. Check Vercel deployment logs

---

## ✅ **YOU'RE DONE!**

Your app should now be:
- ✅ Deployed to Vercel
- ✅ Connected to Mailgun
- ✅ Processing emails with attachments
- ✅ Ready for production use

**Your live app URL:** `https://your-vercel-url.vercel.app`