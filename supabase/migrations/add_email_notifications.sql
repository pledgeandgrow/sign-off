-- =====================================================
-- EMAIL NOTIFICATIONS FOR HEIRS
-- =====================================================
-- This migration sets up automatic email notifications
-- when heirs are notified about inheritance triggers
-- =====================================================

-- =====================================================
-- OPTION 1: Using Supabase Webhooks (Recommended)
-- =====================================================

-- Create a table to queue email notifications
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

CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_created_at ON public.email_queue(created_at);

-- =====================================================
-- TRIGGER FUNCTION: Queue Email When Heir is Notified
-- =====================================================

CREATE OR REPLACE FUNCTION queue_heir_notification_email()
RETURNS TRIGGER AS $$
DECLARE
  plan_record RECORD;
  user_record RECORD;
BEGIN
  -- Only send email if notified_at was just set (not null and changed)
  IF NEW.notified_at IS NOT NULL AND (OLD.notified_at IS NULL OR OLD.notified_at != NEW.notified_at) THEN
    
    -- Get plan details
    SELECT ip.*, u.email as user_email, u.full_name as user_name
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
      NEW.email_encrypted, -- Decrypt this in production
      'Inheritance Plan Activated - ' || COALESCE(plan_record.plan_name, 'Unnamed Plan'),
      format('
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #8B5CF6;">Inheritance Plan Activated</h1>
          <p>Dear %s,</p>
          <p>An inheritance plan has been activated:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #1f2937;">%s</h2>
            <p><strong>Instructions:</strong></p>
            <p>%s</p>
          </div>
          <h3>Next Steps:</h3>
          <ol>
            <li>Log in to the Sign-Off app</li>
            <li>Verify your identity</li>
            <li>Access your granted vaults</li>
          </ol>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated notification from Sign-Off. Please do not reply to this email.
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
    
    RAISE NOTICE 'Email queued for heir: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on heirs table
DROP TRIGGER IF EXISTS trigger_heir_notification_email ON public.heirs;
CREATE TRIGGER trigger_heir_notification_email
  AFTER UPDATE ON public.heirs
  FOR EACH ROW
  EXECUTE FUNCTION queue_heir_notification_email();

COMMENT ON FUNCTION queue_heir_notification_email() IS 'Queues an email notification when a heir is notified about an inheritance trigger';

-- =====================================================
-- OPTION 2: Direct Email via Supabase Edge Function
-- =====================================================

-- Create a function that can be called from Edge Functions
CREATE OR REPLACE FUNCTION send_heir_notification(
  p_heir_id UUID,
  p_plan_id UUID
)
RETURNS jsonb AS $$
DECLARE
  heir_record RECORD;
  plan_record RECORD;
  email_body TEXT;
BEGIN
  -- Get heir details
  SELECT * INTO heir_record
  FROM heirs
  WHERE id = p_heir_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Heir not found');
  END IF;
  
  -- Get plan details
  SELECT * INTO plan_record
  FROM inheritance_plans
  WHERE id = p_plan_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Plan not found');
  END IF;
  
  -- Build email body
  email_body := format('
    <h1>Inheritance Plan Activated</h1>
    <p>Dear %s,</p>
    <p>Plan: %s</p>
    <p>Instructions: %s</p>
  ',
    COALESCE(heir_record.full_name_encrypted, 'Heir'),
    COALESCE(plan_record.plan_name, 'Unnamed Plan'),
    COALESCE(plan_record.instructions_encrypted, 'No instructions')
  );
  
  -- Insert into email queue
  INSERT INTO email_queue (
    to_email,
    subject,
    html_content,
    heir_id,
    status
  ) VALUES (
    heir_record.email_encrypted,
    'Inheritance Plan Activated',
    email_body,
    p_heir_id,
    'pending'
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Email queued');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- EMAIL PROCESSING FUNCTION (Call from Edge Function)
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
-- RLS POLICIES FOR EMAIL QUEUE
-- =====================================================

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage email queue"
  ON public.email_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view their own queued emails
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
-- VERIFICATION QUERIES
-- =====================================================

-- Check if email queue table was created
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'email_queue';

-- View pending emails
SELECT * FROM email_queue WHERE status = 'pending';

-- View email queue stats
SELECT 
  status,
  COUNT(*) as count
FROM email_queue
GROUP BY status;

COMMENT ON TABLE email_queue IS 'Queue for outgoing email notifications to heirs';
