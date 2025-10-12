# 🚀 Production Deployment Checklist

## Pre-Deployment Verification

### 1. Database Schema Review
- [ ] All 15 tables are defined correctly
- [ ] All 10 custom ENUM types are created
- [ ] All foreign key relationships are correct
- [ ] All CHECK constraints are valid
- [ ] All indexes are created (40+ indexes)
- [ ] All RLS policies are enabled (30+ policies)
- [ ] All triggers are set up correctly
- [ ] All functions are created and tested

### 2. Security Audit
- [ ] RLS is enabled on all tables
- [ ] All policies prevent unauthorized access
- [ ] Encryption fields are properly marked
- [ ] No sensitive data in plain text
- [ ] Audit logging is comprehensive
- [ ] Session management is secure
- [ ] 2FA implementation is ready

### 3. Performance Check
- [ ] All indexes are optimized
- [ ] Query performance is acceptable
- [ ] Connection pooling is configured
- [ ] Backup strategy is in place
- [ ] Monitoring is set up

---

## Deployment Steps

### Step 1: Backup (if applicable)
```bash
# If migrating from existing database
pg_dump -h your-host -U your-user -d your-db -F c -b -v -f backup_$(date +%Y%m%d_%H%M%S).dump
```
- [ ] Backup completed successfully
- [ ] Backup file verified and stored securely

### Step 2: Deploy Schema to Supabase

1. **Open Supabase SQL Editor**
   - [ ] Navigate to your project
   - [ ] Open SQL Editor

2. **Execute Migration**
   - [ ] Copy entire contents of `migrations/20250106000000_password_manager_schema.sql`
   - [ ] Paste into SQL Editor
   - [ ] Execute query
   - [ ] Verify no errors in output

3. **Verify Execution**
   ```sql
   -- Check table count
   SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN (
     'users', 'private_key_recovery', 'vaults', 'vault_items',
     'inheritance_plans', 'heirs', 'heir_vault_access',
     'user_activity', 'inheritance_triggers', 'shared_vaults',
     'audit_logs', 'security_alerts', 'password_breach_checks',
     'two_factor_auth', 'user_sessions'
   );
   -- Should return 15
   ```
   - [ ] 15 tables created

### Step 3: Verify ENUM Types
```sql
SELECT typname, enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN (
  'vault_item_type', 'inheritance_plan_type', 'activation_method_type',
  'access_level_type', 'activity_type', 'trigger_reason_type',
  'trigger_status_type', 'alert_type', 'severity_type', 'two_fa_method_type'
)
ORDER BY typname, enumsortorder;
```
- [ ] All 10 ENUM types created
- [ ] All enum values are correct

### Step 4: Verify Indexes
```sql
SELECT tablename, COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```
- [ ] All tables have appropriate indexes
- [ ] Total index count is 40+

### Step 5: Verify RLS Policies
```sql
SELECT schemaname, tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
```
- [ ] All 15 tables have RLS enabled
- [ ] Total policy count is 30+
- [ ] Test policy enforcement

### Step 6: Verify Functions
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'check_user_inactivity',
  'log_user_activity',
  'create_audit_log',
  'update_updated_at_column'
);
```
- [ ] All 4 functions created
- [ ] Functions execute without errors

### Step 7: Verify Triggers
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```
- [ ] Updated_at triggers on 4 tables
- [ ] All triggers functioning correctly

---

## Post-Deployment Testing

### Functional Tests

#### 1. User Management
- [ ] Create test user with public key
- [ ] Verify user can read own profile
- [ ] Verify user cannot read other profiles
- [ ] Test user update
- [ ] Test RLS enforcement

#### 2. Vault Operations
- [ ] Create vault with encrypted name
- [ ] List user's vaults
- [ ] Update vault
- [ ] Delete vault
- [ ] Verify RLS prevents unauthorized access

#### 3. Vault Items
- [ ] Create password item with encryption
- [ ] Create note item
- [ ] Create card item
- [ ] List items in vault
- [ ] Update item
- [ ] Delete item
- [ ] Test all 6 item types

#### 4. Inheritance Plans
- [ ] Create inheritance plan
- [ ] Add heirs to plan
- [ ] Grant vault access to heirs
- [ ] Test inactivity detection
- [ ] Verify trigger creation

#### 5. Heirs Management
- [ ] Create heir with encrypted details
- [ ] Update heir information
- [ ] Grant specific vault access
- [ ] Grant specific item access
- [ ] Test heir acceptance workflow

#### 6. Vault Sharing
- [ ] Share vault with another user
- [ ] Verify recipient can view shared vault
- [ ] Test permission levels
- [ ] Revoke share
- [ ] Test expiration

#### 7. Activity Logging
- [ ] Log user activity
- [ ] Verify activity is recorded
- [ ] Test activity queries
- [ ] Verify RLS on activity logs

#### 8. Security Features
- [ ] Create security alert
- [ ] Test breach check
- [ ] Set up 2FA
- [ ] Create user session
- [ ] Test session expiration

#### 9. Audit Trail
- [ ] Create audit log entry
- [ ] Verify audit log is recorded
- [ ] Test audit log queries
- [ ] Verify immutability

### Performance Tests

```sql
-- Test query performance
EXPLAIN ANALYZE
SELECT v.*, COUNT(vi.id) as item_count
FROM vaults v
LEFT JOIN vault_items vi ON vi.vault_id = v.id
WHERE v.user_id = 'test-user-id'
GROUP BY v.id;
```
- [ ] Vault queries < 100ms
- [ ] Item queries < 200ms
- [ ] Activity queries < 300ms
- [ ] Audit log queries < 500ms

### Security Tests

#### RLS Policy Tests
```sql
-- Test as different user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub TO 'different-user-id';

-- Try to access another user's vault (should return 0 rows)
SELECT * FROM vaults WHERE user_id = 'original-user-id';
```
- [ ] Users cannot access other users' vaults
- [ ] Users cannot access other users' items
- [ ] Users cannot access other users' plans
- [ ] Heirs can only access granted data
- [ ] Shared vault permissions work correctly

#### Encryption Validation
- [ ] All sensitive fields are encrypted
- [ ] No plain text passwords in database
- [ ] Public keys are stored correctly
- [ ] Private keys are never stored unencrypted

---

## Configuration Setup

### 1. Environment Variables
```env
# Add to your .env file
DATABASE_URL=your_supabase_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Security
ENCRYPTION_KEY_SIZE=4096
PASSWORD_MIN_STRENGTH=50

# Inheritance
INACTIVITY_CHECK_INTERVAL=24h
DEFAULT_INACTIVITY_DAYS=90

# Notifications
NOTIFICATION_EMAIL_FROM=noreply@yourdomain.com
NOTIFICATION_DELAY_HOURS=168

# Breach Checking
HIBP_API_KEY=your_api_key
BREACH_CHECK_INTERVAL=7d
```
- [ ] All environment variables set
- [ ] Keys are secure and not committed to git

### 2. Scheduled Jobs

#### Daily Job: Check Inactivity
```typescript
// Supabase Edge Function or Cron Job
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

await supabase.rpc('check_user_inactivity')
```
- [ ] Scheduled to run daily at 00:00 UTC
- [ ] Monitoring/alerting configured
- [ ] Error handling implemented

#### Daily Job: Clean Expired Sessions
```sql
DELETE FROM user_sessions WHERE expires_at < NOW();
```
- [ ] Scheduled to run daily at 01:00 UTC
- [ ] Logging configured

#### Daily Job: Clean Expired Recovery Keys
```sql
DELETE FROM private_key_recovery 
WHERE expires_at IS NOT NULL AND expires_at < NOW();
```
- [ ] Scheduled to run daily at 02:00 UTC
- [ ] Logging configured

#### Weekly Job: Password Breach Check
- [ ] Scheduled to run weekly
- [ ] HIBP API integration configured
- [ ] Alert system configured

### 3. Monitoring Setup
- [ ] Database performance monitoring
- [ ] Error logging configured
- [ ] Alert thresholds set
- [ ] Dashboard created

---

## Application Integration

### 1. Install TypeScript Types
```bash
# Copy database.types.ts to your project
cp types/database.types.ts src/types/
```
- [ ] Types file copied
- [ ] Types imported in application

### 2. Supabase Client Setup
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database.types'

export const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)
```
- [ ] Client configured with types
- [ ] Type safety verified

### 3. Encryption Library Setup
```typescript
// Implement encryption utilities
export async function generateKeyPair() {
  // Generate RSA-4096 key pair
}

export async function encrypt(data: string, publicKey: string) {
  // Encrypt with public key
}

export async function decrypt(encrypted: string, privateKey: string) {
  // Decrypt with private key
}
```
- [ ] Encryption library implemented
- [ ] Key generation tested
- [ ] Encryption/decryption tested

### 4. API Routes
- [ ] User registration with key generation
- [ ] Vault CRUD endpoints
- [ ] Item CRUD endpoints
- [ ] Inheritance plan endpoints
- [ ] Heir management endpoints
- [ ] Sharing endpoints
- [ ] Activity logging
- [ ] Security alerts

---

## Documentation

- [ ] API documentation created
- [ ] User guide written
- [ ] Admin guide written
- [ ] Security documentation complete
- [ ] Recovery procedures documented
- [ ] Troubleshooting guide created

---

## Final Verification

### Database Health Check
```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```
- [ ] All tables accessible
- [ ] No errors in logs

### Security Audit
- [ ] All RLS policies tested
- [ ] Encryption verified
- [ ] Audit logging working
- [ ] Session management secure
- [ ] No security vulnerabilities found

### Performance Baseline
- [ ] Query performance benchmarked
- [ ] Index usage verified
- [ ] Connection pooling configured
- [ ] Caching strategy implemented

### Backup Verification
- [ ] Automated backups enabled
- [ ] Backup restoration tested
- [ ] Retention policy configured
- [ ] Off-site backup configured

---

## Go-Live Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Performance acceptable
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Documentation complete
- [ ] Team trained

### Launch
- [ ] Deploy to production
- [ ] Verify all services running
- [ ] Monitor for errors
- [ ] Check performance metrics
- [ ] Verify scheduled jobs running

### Post-Launch
- [ ] Monitor for 24 hours
- [ ] Check error logs
- [ ] Verify user registrations working
- [ ] Test critical user flows
- [ ] Collect performance metrics

---

## Rollback Plan

### If Issues Occur

1. **Identify Issue**
   - Check error logs
   - Review monitoring dashboards
   - Identify affected tables/functions

2. **Assess Impact**
   - Determine severity
   - Count affected users
   - Evaluate data integrity

3. **Execute Rollback**
   ```sql
   -- Drop new tables if needed
   DROP TABLE IF EXISTS public.heirs CASCADE;
   -- etc.
   
   -- Restore from backup
   pg_restore -h your-host -U your-user -d your-db backup.dump
   ```

4. **Verify Rollback**
   - Test critical functions
   - Verify data integrity
   - Check user access

5. **Post-Mortem**
   - Document what went wrong
   - Plan fixes
   - Schedule re-deployment

---

## Support Contacts

### Technical Issues
- Database Admin: [contact info]
- Backend Team: [contact info]
- DevOps: [contact info]

### Emergency Contacts
- On-Call Engineer: [contact info]
- Team Lead: [contact info]
- CTO: [contact info]

---

## Sign-Off

### Deployment Team

- [ ] **Database Administrator**: _________________ Date: _______
- [ ] **Backend Lead**: _________________ Date: _______
- [ ] **Security Lead**: _________________ Date: _______
- [ ] **DevOps Lead**: _________________ Date: _______
- [ ] **Product Manager**: _________________ Date: _______

### Approval

- [ ] **CTO/Technical Director**: _________________ Date: _______

---

## Notes

_Add any deployment-specific notes, issues encountered, or deviations from the plan:_

---

**Deployment Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Completed | ⬜ Rolled Back

**Deployment Date**: _________________

**Deployment Time**: _________________

**Deployed By**: _________________

**Production URL**: _________________

---

## Post-Deployment Monitoring (First 7 Days)

### Day 1
- [ ] No critical errors
- [ ] Performance within acceptable range
- [ ] User registrations working
- [ ] Scheduled jobs running

### Day 3
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Verify backup completion
- [ ] User feedback collected

### Day 7
- [ ] Full week of data collected
- [ ] Performance analysis complete
- [ ] Security review complete
- [ ] Optimization opportunities identified

---

**🎉 Deployment Complete! Database is production-ready.**
