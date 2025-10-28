# 🔥 Check Triggers Edge Function

This Supabase Edge Function runs periodically to check if any inheritance triggers should fire.

## 🚀 Deployment

### **Step 1: Deploy the Function**

```bash
# Make sure you're in the project root
cd c:\Users\ADMIN\CascadeProjects\start-up\sign-off

# Deploy the function
npx supabase functions deploy check-triggers
```

### **Step 2: Set Up Cron Job**

#### **Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Enable the `pg_cron` extension if not already enabled
4. Go to **SQL Editor**
5. Run this SQL:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to run every hour
SELECT cron.schedule(
  'check-inheritance-triggers',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-triggers',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb
    ) as request_id;
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

**Replace:**
- `YOUR_PROJECT_REF` with your actual project reference (from dashboard URL)
- `YOUR_ANON_KEY` with your anon/public key (from Settings → API)

#### **Option B: Using pg_cron SQL**

```sql
-- Schedule to run every 6 hours
SELECT cron.schedule(
  'check-inheritance-triggers',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://okohwzkblihuwfvvgtvh.supabase.co/functions/v1/check-triggers',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    );
  $$
);
```

#### **Option C: External Cron (GitHub Actions)**

Create `.github/workflows/check-triggers.yml`:

```yaml
name: Check Inheritance Triggers
on:
  schedule:
    - cron: '0 * * * *' # Every hour
  workflow_dispatch: # Allow manual trigger

jobs:
  check-triggers:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          curl -X POST \
            'https://okohwzkblihuwfvvgtvh.supabase.co/functions/v1/check-triggers' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}' \
            -H 'Content-Type: application/json'
```

---

## 🧪 Testing

### **Manual Test:**

```bash
# Test the function manually
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-triggers' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

### **Expected Response:**

```json
{
  "success": true,
  "message": "Checked 5 users, triggered 1 user(s)",
  "timestamp": "2025-10-22T19:00:00.000Z",
  "triggeredCount": 1,
  "totalUsers": 5
}
```

---

## 📊 Monitoring

### **View Logs:**

```bash
# View function logs
npx supabase functions logs check-triggers --follow
```

### **Check Cron Job Status:**

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View recent job runs
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

---

## 🔧 Configuration

### **Adjust Frequency:**

```sql
-- Run every 30 minutes
SELECT cron.schedule(
  'check-inheritance-triggers',
  '*/30 * * * *',
  $$ ... $$
);

-- Run every 12 hours
SELECT cron.schedule(
  'check-inheritance-triggers',
  '0 */12 * * *',
  $$ ... $$
);

-- Run daily at 2 AM
SELECT cron.schedule(
  'check-inheritance-triggers',
  '0 2 * * *',
  $$ ... $$
);
```

### **Update Existing Job:**

```sql
-- First, unschedule the old job
SELECT cron.unschedule('check-inheritance-triggers');

-- Then create new schedule
SELECT cron.schedule(...);
```

---

## 🐛 Troubleshooting

### **Function not deploying:**

```bash
# Make sure Supabase CLI is installed
npm install -g supabase

# Login
npx supabase login

# Link project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy again
npx supabase functions deploy check-triggers
```

### **Cron job not running:**

1. Check if pg_cron extension is enabled
2. Verify the URL and API key are correct
3. Check function logs for errors
4. View cron job run history

### **No triggers firing:**

1. Check if users have `last_activity` set
2. Verify `global_trigger_method` is not null
3. Check if threshold is met
4. Look at function logs

---

## 📝 What This Function Does

1. **Fetches all users** with global trigger methods
2. **Checks inactivity**: Compares `last_activity` with threshold
3. **Checks scheduled dates**: Compares current date with `global_scheduled_date`
4. **Creates trigger records** in `inheritance_triggers` table
5. **Marks plans as triggered** in `inheritance_plans` table
6. **Updates heir status** to `pending_verification`
7. **Logs everything** for monitoring

---

## 🎯 Next Steps

After deploying:

1. ✅ Deploy function: `npx supabase functions deploy check-triggers`
2. ✅ Set up cron job in Supabase Dashboard
3. ✅ Test manually with curl
4. ✅ Monitor logs
5. ⏳ Add email notifications (next priority)

---

**Your project ref:** `okohwzkblihuwfvvgtvh`

**Deploy command:**
```bash
npx supabase functions deploy check-triggers
```

**Test command:**
```bash
curl -X POST 'https://okohwzkblihuwfvvgtvh.supabase.co/functions/v1/check-triggers' \
  -H 'Authorization: Bearer YOUR_ANON_KEY'
```
