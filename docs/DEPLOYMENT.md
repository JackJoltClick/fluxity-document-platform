# 🚀 Fluxity App Deployment Guide

## Prerequisites

- [Vercel CLI](https://vercel.com/cli) installed: `npm i -g vercel`
- Vercel account
- All environment variables configured

## 📋 **Step 1: Configure Mailgun**

1. **Get Mailgun Signing Key:**
   - Go to [Mailgun Dashboard](https://app.mailgun.com/)
   - Navigate to **Sending → Webhooks**
   - Copy your **HTTP webhook signing key**

2. **Set up Mailgun Webhook:**
   - In Mailgun dashboard, go to **Sending → Webhooks**
   - Add new webhook with URL: `https://your-domain.vercel.app/api/webhooks/mailgun`
   - Select events: `delivered`, `failed`, `opened` (or as needed)

## 🌐 **Step 2: Deploy to Vercel**

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy from root directory:**
   ```bash
   cd /path/to/fluxity-app
   vercel --prod
   ```

3. **Set Environment Variables in Vercel:**
   Either use the Vercel dashboard or CLI:

   ```bash
   # Set each environment variable
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_KEY
   vercel env add OPENAI_API_KEY
   vercel env add MINDEE_API_KEY
   vercel env add MAILGUN_SIGNING_KEY
   vercel env add EXTRACTION_SERVICE
   vercel env add EXTRACTION_CONFIDENCE_THRESHOLD
   vercel env add SIMPLE_MAPPING_MODE
   ```

## 🔧 **Step 3: Environment Variables**

Set these in your Vercel project dashboard:

### **Required Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key
- `MAILGUN_SIGNING_KEY` - Mailgun webhook signing key

### **Optional Variables:**
- `MINDEE_API_KEY` - Mindee API key (if using Mindee)
- `EXTRACTION_SERVICE` - Set to "openai" (default)
- `EXTRACTION_CONFIDENCE_THRESHOLD` - Set to "0.8" (default)
- `SIMPLE_MAPPING_MODE` - Set to "true" (default)

## 🔒 **Step 4: Security Checklist**

- [ ] All API keys are set as environment variables
- [ ] Mailgun signing key is properly configured
- [ ] Supabase RLS policies are enabled
- [ ] CORS headers are properly set
- [ ] Rate limiting is enabled for webhooks

## 📧 **Step 5: Test Mailgun Integration**

1. **Test webhook endpoint:**
   ```bash
   curl https://your-domain.vercel.app/api/webhooks/mailgun
   ```

2. **Send test email** to your configured Mailgun domain
3. **Check Vercel logs** for webhook processing

## 🏗️ **Step 6: Database Setup**

Make sure all database migrations are run:

```sql
-- Run any pending migrations in Supabase SQL editor
-- Check that all tables exist: documents, vendors, vendor_extraction_rules, etc.
```

## 📱 **Step 7: Domain Configuration**

1. **Add custom domain** in Vercel dashboard
2. **Update Mailgun domain** to match your custom domain
3. **Update Supabase site URL** in authentication settings

## 🔄 **Step 8: Monitoring**

- **Vercel Analytics**: Enable in dashboard
- **Vercel Logs**: Monitor function executions
- **Supabase Logs**: Monitor database queries
- **Mailgun Logs**: Monitor email deliveries

## 🚨 **Troubleshooting**

### Mailgun Webhook Issues:
- Check signing key is correct
- Verify webhook URL is accessible
- Check Vercel function logs

### Database Connection Issues:
- Verify Supabase keys are correct
- Check RLS policies
- Ensure service key has proper permissions

### Build Issues:
- Run `npm run build` locally first
- Check for TypeScript errors
- Verify all dependencies are in package.json

## 📞 **Support**

- Check Vercel deployment logs
- Review Supabase logs for database issues
- Test API endpoints individually
- Verify all environment variables are set correctly