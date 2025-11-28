/*
  # Phase 3: Notifications and Settings Schema

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `type` (text: 'due_alert', 'payment_confirmed', 'loan_approved', 'general')
      - `title` (text)
      - `message` (text)
      - `read` (boolean, default false)
      - `sent_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `notification_templates`
      - `id` (uuid, primary key)
      - `type` (text, unique)
      - `subject` (text)
      - `email_body` (text)
      - `push_body` (text)
      - `in_app_body` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `push_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `endpoint` (text)
      - `p256dh_key` (text)
      - `auth_key` (text)
      - `created_at` (timestamptz)
    
    - `app_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `value` (jsonb)
      - `description` (text)
      - `updated_by` (uuid, foreign key to users)
      - `updated_at` (timestamptz)
    
    - `email_queue`
      - `id` (uuid, primary key)
      - `to_email` (text)
      - `subject` (text)
      - `body` (text)
      - `status` (text: 'pending', 'sent', 'failed')
      - `attempts` (integer, default 0)
      - `last_error` (text)
      - `created_at` (timestamptz)
      - `sent_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Users can read their own notifications
    - Only admins can manage templates and settings
    - Users can manage their own push subscriptions
*/

-- notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('due_alert', 'payment_confirmed', 'loan_approved', 'loan_rejected', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- notification_templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text UNIQUE NOT NULL,
  subject text NOT NULL,
  email_body text NOT NULL,
  push_body text NOT NULL,
  in_app_body text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage templates"
  ON notification_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default templates
INSERT INTO notification_templates (type, subject, email_body, push_body, in_app_body, variables) VALUES
  ('due_alert', 'Payment Due Reminder', 
   'Hello {{user_name}},\n\nYour loan payment of ${{amount}} is due on {{due_date}}.\n\nPlease ensure payment is made on time to avoid penalties.\n\nThank you,\nLendTrack Team',
   'Payment of ${{amount}} due on {{due_date}}',
   'Your loan payment of ${{amount}} is due on {{due_date}}. Please ensure timely payment.',
   '["user_name", "amount", "due_date"]'),
  
  ('payment_confirmed', 'Payment Received', 
   'Hello {{user_name}},\n\nWe have received your payment of ${{amount}}.\n\nTransaction ID: {{transaction_id}}\nRemaining Balance: ${{remaining_balance}}\n\nThank you for your payment!\n\nLendTrack Team',
   'Payment of ${{amount}} received successfully',
   'Your payment of ${{amount}} has been received. Transaction ID: {{transaction_id}}',
   '["user_name", "amount", "transaction_id", "remaining_balance"]'),
  
  ('loan_approved', 'Loan Approved', 
   'Hello {{user_name}},\n\nCongratulations! Your loan of ${{amount}} has been approved.\n\nInterest Rate: {{interest_rate}}%\nDue Date: {{due_date}}\n\nPlease review your loan details in your dashboard.\n\nLendTrack Team',
   'Your loan of ${{amount}} has been approved',
   'Congratulations! Your loan of ${{amount}} has been approved with {{interest_rate}}% interest.',
   '["user_name", "amount", "interest_rate", "due_date"]'),
  
  ('loan_rejected', 'Loan Application Update', 
   'Hello {{user_name}},\n\nWe regret to inform you that your loan application for ${{amount}} could not be approved at this time.\n\nReason: {{reason}}\n\nPlease contact us if you have any questions.\n\nLendTrack Team',
   'Loan application status updated',
   'Your loan application for ${{amount}} could not be approved. Reason: {{reason}}',
   '["user_name", "amount", "reason"]'),
  
  ('general', 'Important Notice', 
   'Hello {{user_name}},\n\n{{message}}\n\nLendTrack Team',
   '{{message}}',
   '{{message}}',
   '["user_name", "message"]')
ON CONFLICT (type) DO NOTHING;

-- push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  endpoint text NOT NULL,
  p256dh_key text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text NOT NULL,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings"
  ON app_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage settings"
  ON app_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO app_settings (key, value, description) VALUES
  ('lending_cap_per_user', '50000', 'Maximum loan amount per user'),
  ('default_interest_rate', '5.5', 'Default annual interest rate percentage'),
  ('penalty_rate', '2.0', 'Late payment penalty rate percentage'),
  ('reminder_days_before_due', '7', 'Days before due date to send reminder'),
  ('consolidated_dashboard_visible', 'true', 'Show consolidated dashboard to admins'),
  ('max_active_loans_per_user', '3', 'Maximum number of active loans per user')
ON CONFLICT (key) DO NOTHING;

-- email_queue table
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer DEFAULT 0,
  last_error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz
);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view email queue"
  ON email_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
