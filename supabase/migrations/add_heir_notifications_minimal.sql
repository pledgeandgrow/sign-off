-- =====================================================
-- MINIMAL HEIR NOTIFICATION SYSTEM
-- =====================================================
-- No identity verification needed
-- User is responsible for correct heir contacts
-- =====================================================

-- =====================================================
-- 1. ADD NOTIFICATION FIELDS TO HEIRS TABLE
-- =====================================================

ALTER TABLE public.heirs 
ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notification_status TEXT DEFAULT 'pending' 
  CHECK (notification_status IN ('pending', 'sent', 'accessed', 'failed'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_heirs_notified_at ON public.heirs(notified_at);
CREATE INDEX IF NOT EXISTS idx_heirs_notification_status ON public.heirs(notification_status);

COMMENT ON COLUMN heirs.notified_at IS 'When the heir was notified about inheritance trigger';
COMMENT ON COLUMN heirs.notification_status IS 'Status of notification: pending, sent, accessed, failed';

-- =====================================================
-- 2. ADD ACCESS TRACKING TO HEIR_VAULT_ACCESS
-- =====================================================

ALTER TABLE public.heir_vault_access 
ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS access_status TEXT DEFAULT 'granted' 
  CHECK (access_status IN ('granted', 'revoked'));

-- Add index
CREATE INDEX IF NOT EXISTS idx_heir_vault_access_status ON public.heir_vault_access(access_status);

COMMENT ON COLUMN heir_vault_access.access_granted_at IS 'When access was granted to the heir';
COMMENT ON COLUMN heir_vault_access.access_status IS 'Status of access: granted or revoked';

-- =====================================================
-- 3. CREATE EMAIL QUEUE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  heir_id UUID REFERENCES public.heirs(id),
  trigger_id UUID REFERENCES public.inheritance_triggers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON public.email_queue(created_at);

COMMENT ON TABLE email_queue IS 'Queue for outgoing email notifications to heirs';

-- =====================================================
-- 4. AUTO-QUEUE EMAIL WHEN HEIR IS NOTIFIED
-- =====================================================

CREATE OR REPLACE FUNCTION queue_heir_notification_email()
RETURNS TRIGGER AS $$
DECLARE
  plan_record RECORD;
BEGIN
  -- Only queue email if notified_at was just set
  IF NEW.notified_at IS NOT NULL AND (OLD.notified_at IS NULL OR OLD.notified_at != NEW.notified_at) THEN
    
    -- Get plan details
    SELECT ip.plan_name, ip.instructions_encrypted, u.full_name as user_name
    INTO plan_record
    FROM inheritance_plans ip
    JOIN users u ON ip.user_id = u.id
    WHERE ip.id = NEW.inheritance_plan_id;
    
    -- Queue the email
    INSERT INTO email_queue (
      to_email,
      subject,
      html_content,
      heir_id,
      status
    ) VALUES (
      NEW.email_encrypted,
      'Inheritance Plan Activated - ' || COALESCE(plan_record.plan_name, 'Sign-Off'),
      format('
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #8B5CF6;">Inheritance Plan Activated</h1>
          <p>Dear %s,</p>
          <p>An inheritance plan has been activated for you.</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1f2937;">%s</h2>
            <p><strong>Instructions:</strong></p>
            <p>%s</p>
          </div>
          <h3>Next Steps:</h3>
          <ol>
            <li>Log in to the Sign-Off app</li>
            <li>Access your inherited vaults</li>
            <li>Follow the instructions provided</li>
          </ol>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </body>
        </html>
      ',
        COALESCE(NEW.full_name_encrypted, 'Heir'),
        COALESCE(plan_record.plan_name, 'Unnamed Plan'),
        COALESCE(plan_record.instructions_encrypted, 'No instructions provided')
      ),
      NEW.id,
      'pending'
    );
    
    -- Update notification status
    NEW.notification_status := 'sent';
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_heir_notification_email ON public.heirs;
CREATE TRIGGER trigger_heir_notification_email
  BEFORE UPDATE ON public.heirs
  FOR EACH ROW
  EXECUTE FUNCTION queue_heir_notification_email();

-- =====================================================
-- 5. HELPER FUNCTIONS FOR EMAIL PROCESSING
-- =====================================================

CREATE OR REPLACE FUNCTION get_pending_emails(p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  to_email TEXT,
  subject TEXT,
  html_content TEXT,
  heir_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    eq.id,
    eq.to_email,
    eq.subject,
    eq.html_content,
    eq.heir_id,
    eq.created_at
  FROM email_queue eq
  WHERE eq.status = 'pending'
  ORDER BY eq.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_email_sent(p_email_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE email_queue
  SET 
    status = 'sent',
    sent_at = NOW()
  WHERE id = p_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION mark_email_failed(p_email_id UUID, p_error TEXT)
RETURNS void AS $$
BEGIN
  UPDATE email_queue
  SET 
    status = 'failed',
    error_message = p_error
  WHERE id = p_email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. RLS POLICIES
-- =====================================================

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage everything
CREATE POLICY "Service role can manage email queue"
  ON public.email_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view their heir emails
CREATE POLICY "Users can view their heir emails"
  ON public.email_queue
  FOR SELECT
  TO authenticated
  USING (
    heir_id IN (
      SELECT id FROM heirs WHERE heir_user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. VERIFICATION QUERIES
-- =====================================================

-- Check tables were created/updated
SELECT 
  'heirs' as table_name,
  COUNT(*) FILTER (WHERE column_name = 'notified_at') as has_notified_at,
  COUNT(*) FILTER (WHERE column_name = 'notification_status') as has_notification_status
FROM information_schema.columns
WHERE table_name = 'heirs' AND table_schema = 'public';

SELECT 
  'heir_vault_access' as table_name,
  COUNT(*) FILTER (WHERE column_name = 'access_granted_at') as has_access_granted_at,
  COUNT(*) FILTER (WHERE column_name = 'access_status') as has_access_status
FROM information_schema.columns
WHERE table_name = 'heir_vault_access' AND table_schema = 'public';

SELECT 
  'email_queue' as table_name,
  COUNT(*) as exists
FROM information_schema.tables
WHERE table_name = 'email_queue' AND table_schema = 'public';

-- View email queue stats
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;

COMMENT ON TABLE email_queue IS 'Minimal email notification system - no verification needed, user is responsible for correct heir contacts';
