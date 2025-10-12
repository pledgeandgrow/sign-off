# 🚀 Database Setup Guide - URGENT

## ⚠️ CRITICAL: Your Database Schema Is Not Applied!

The `public.users` table doesn't exist yet because you haven't run the migration. Here's how to fix it:

---

## 🎯 Quick Fix (Choose One Method)

### **Method 1: Supabase Dashboard (Easiest)** ⭐ RECOMMENDED

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste Schema**
   - Open `migrations/schema.sql` from your project
   - Copy ALL the content (entire file)
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" button (or press Ctrl+Enter)
   - Wait for completion (may take 10-30 seconds)
   - Check for any errors in the output

5. **Verify Tables Created**
   - Click "Table Editor" in sidebar
   - You should see: `users`, `vaults`, `vault_items`, `heirs`, etc.

---

### **Method 2: Supabase CLI** (If you have it installed)

```bash
# Navigate to your project
cd c:\Users\ADMIN\CascadeProjects\start-up\sign-off

# Login to Supabase (if not already)
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push

# Or run the SQL file directly
supabase db execute -f migrations/schema.sql
```

---

## ✅ After Running Migration

### **1. Verify Tables Exist**

Run this query in SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**You should see:**
- audit_logs
- heirs
- heir_vault_access
- inheritance_plans
- inheritance_triggers
- password_breach_checks
- private_key_recovery
- security_alerts
- shared_vaults
- two_factor_auth
- users ← **MOST IMPORTANT**
- user_sessions
- vault_items
- vaults

### **2. Test User Creation**

Now try creating a new account in your app. Check the console logs:
```
📝 Generating encryption keys...
💾 Storing keys securely...
👤 Creating user profile with public key...
✅ User registered successfully
```

### **3. Verify in Database**

Run this query to see your user:
```sql
SELECT id, email, full_name, public_key, created_at
FROM public.users;
```

---

## 🐛 Common Issues & Fixes

### **Issue 1: "relation public.users does not exist"**
**Cause:** Schema not applied
**Fix:** Run the migration using Method 1 or 2 above

### **Issue 2: "permission denied for schema public"**
**Cause:** Wrong database permissions
**Fix:** Make sure you're using the correct Supabase project

### **Issue 3: "duplicate key value violates unique constraint"**
**Cause:** Trying to create migration twice
**Fix:** This is OK - migration already applied

### **Issue 4: "column public_key cannot be null"**
**Cause:** Old code trying to create user without public_key
**Fix:** Already fixed in AuthContext - make sure you're using latest code

---

## 🔍 Quick Verification Checklist

After running migration, verify:

- [ ] `public.users` table exists
- [ ] Table has `public_key` column (TEXT NOT NULL)
- [ ] RLS (Row Level Security) is enabled
- [ ] Can create new user account
- [ ] User appears in `auth.users` table
- [ ] User appears in `public.users` table
- [ ] Public key is stored in database
- [ ] Private key is stored on device (check console logs)

---

## 📊 What Gets Created

### **14 Tables:**
1. **users** - User profiles with public keys
2. **vaults** - Password/data containers
3. **vault_items** - Items in vaults
4. **inheritance_plans** - Death/legacy plans
5. **heirs** - People who inherit
6. **heir_vault_access** - What heirs can access
7. **inheritance_triggers** - When plans activate
8. **shared_vaults** - Live sharing
9. **audit_logs** - Security tracking
10. **security_alerts** - Security notifications
11. **password_breach_checks** - Password security
12. **two_factor_auth** - 2FA settings
13. **user_sessions** - Active sessions
14. **private_key_recovery** - Key backup

### **9 Custom Types:**
- vault_category_type
- vault_item_type
- access_level_type
- trigger_status_type
- inheritance_plan_type
- activation_method_type
- trigger_reason_type
- alert_type
- severity_type
- two_fa_method_type

### **RLS Policies:**
- Users can only see their own data
- Heirs can see their inheritance
- Shared vaults visible to recipients
- Audit logs protected

---

## 🎯 Next Steps After Migration

1. **Test Registration**
   ```
   - Create new account
   - Check console for success messages
   - Verify user in database
   ```

2. **Test Login**
   ```
   - Login with new account
   - Should navigate to app
   - Check all tabs work
   ```

3. **Test Vaults** (after VaultContext is updated)
   ```
   - Create a vault
   - Add items
   - Verify in database
   ```

4. **Test Heirs**
   ```
   - Add an heir
   - Verify encrypted data in database
   ```

---

## 🚨 IMPORTANT NOTES

### **Database Schema is Required**
Without running the migration:
- ❌ No `public.users` table
- ❌ Registration will fail
- ❌ Login will fail
- ❌ App won't work

### **Run Migration ONCE**
- Only needs to be run once per Supabase project
- Safe to run multiple times (uses IF NOT EXISTS)
- Creates all tables, types, and policies

### **After Migration**
- ✅ Registration will work
- ✅ Login will work
- ✅ User profiles created automatically
- ✅ Keys generated and stored
- ✅ Ready for testing!

---

## 📝 Quick Command Reference

### **Check if tables exist:**
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';
```
Should return: **14** (or more)

### **Check users table:**
```sql
SELECT * FROM public.users LIMIT 5;
```

### **Check auth users:**
```sql
SELECT id, email, created_at 
FROM auth.users 
LIMIT 5;
```

### **Delete test user (if needed):**
```sql
-- This will cascade delete from public.users too
DELETE FROM auth.users WHERE email = 'test@example.com';
```

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ Can create account without errors
2. ✅ See success message in console
3. ✅ User appears in `auth.users`
4. ✅ User appears in `public.users` with `public_key`
5. ✅ Can login successfully
6. ✅ Navigate to all tabs
7. ✅ No database errors in console

---

**Status:** 🔴 MIGRATION REQUIRED  
**Action:** Run schema.sql in Supabase Dashboard NOW  
**Time:** 2-5 minutes  
**Difficulty:** Easy - Just copy/paste and click Run!
