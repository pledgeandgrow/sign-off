# 🚀 Quick Start Guide - Sign-Off Password Manager

## 1️⃣ Set Up Supabase (5 minutes)

### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database to provision

### Run Database Migration
1. Go to SQL Editor in Supabase Dashboard
2. Open `migrations/schema.sql` from this project
3. Copy entire contents
4. Paste into SQL Editor
5. Click **RUN**
6. ✅ You should see "Success. No rows returned"

### Create Storage Bucket
1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Name: `vault-items`
4. **Public bucket**: OFF (keep private)
5. Click **Create bucket**

### Get API Credentials
1. Go to **Settings** → **API**
2. Copy **Project URL**
3. Copy **anon/public key**

---

## 2️⃣ Configure App (2 minutes)

### Add Supabase Credentials
Create `.env.local` in project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Install Dependencies (if not already)
```bash
npm install
```

---

## 3️⃣ Test the App (3 minutes)

### Start Development Server
```bash
npx expo start
```

### Test Authentication
1. Open app in Expo Go or simulator
2. Go to **Sign Up**
3. Enter email, password, full name
4. Click **Create Account**
5. ✅ You should be redirected to home screen

### Verify Database
1. Go to Supabase Dashboard → **Table Editor**
2. Open `users` table
3. ✅ You should see your new user record

---

## 4️⃣ Create Your First Vault (2 minutes)

### In the App
1. Go to **Vaults** tab
2. Click **+** button
3. Enter vault name (e.g., "Personal Passwords")
4. Select category (e.g., "share_after_death")
5. Click **Create**
6. ✅ Vault created!

### Verify in Database
1. Supabase Dashboard → `vaults` table
2. ✅ You should see your vault with JSONB settings

---

## 5️⃣ Add an Heir (2 minutes)

### In the App
1. Go to **Heirs** tab
2. Click **Add Heir**
3. Enter heir details:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Relationship: "Spouse"
   - Access Level: "Full"
4. Click **Save**
5. ✅ Heir added!

### Verify Encryption
1. Supabase Dashboard → `heirs` table
2. ✅ You should see encrypted values in `full_name_encrypted`, `email_encrypted`

---

## ✅ You're All Set!

### What's Working Now:
- ✅ User registration & authentication
- ✅ Vault creation with JSONB settings
- ✅ Heir management with encryption
- ✅ Database operations
- ✅ Audit logging

### What to Do Next:
1. **Test item creation** (will use Supabase Storage)
2. **Set up storage RLS policies** (see below)
3. **Upgrade encryption** to AES-256-GCM (production requirement)

---

## 🔒 Storage RLS Policies (Important!)

Run this in Supabase SQL Editor to secure storage:

```sql
-- Allow users to upload their own files
CREATE POLICY "Users can upload own vault items"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vault-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read own vault items"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'vault-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own vault items"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vault-items' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 🐛 Troubleshooting

### "Supabase is not configured"
- Check `.env.local` exists in project root
- Verify credentials are correct
- Restart Expo server: `Ctrl+C` then `npx expo start`

### "Failed to create user profile"
- Check database migration ran successfully
- Verify RLS policies are enabled
- Check Supabase logs in Dashboard

### "Encryption error"
- Check that keys are being generated
- Verify Expo Secure Store is working
- Check device permissions

### Items not uploading
- Verify storage bucket `vault-items` exists
- Check storage RLS policies are set up
- Verify bucket is private (not public)

---

## 📱 Test on Real Device

### iOS
```bash
npx expo start --ios
```

### Android
```bash
npx expo start --android
```

### Web (limited functionality)
```bash
npx expo start --web
```

---

## 🎯 Next Steps

1. **Read IMPLEMENTATION_COMPLETE.md** for full details
2. **Install production encryption**: `npm install react-native-aes-crypto`
3. **Set up scheduled jobs** for inactivity checking
4. **Implement inheritance workflow**
5. **Add 2FA support**
6. **Deploy to production**

---

## 📚 Key Files

- `migrations/schema.sql` - Database schema
- `lib/services/supabaseService.ts` - All database operations
- `contexts/AuthContext.tsx` - Authentication
- `lib/encryption.ts` - Encryption utilities
- `types/database.types.ts` - TypeScript types

---

## 💡 Tips

- **Always test in development first**
- **Check Supabase logs** for errors
- **Use Supabase Table Editor** to inspect data
- **Enable Realtime** for live updates (optional)
- **Set up email templates** in Supabase Auth settings

---

**Happy coding! 🎉**

Need help? Check the documentation files or Supabase docs.
